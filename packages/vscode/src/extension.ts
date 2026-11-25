import * as vscode from 'vscode';
import {
  inferDocumentKind,
  scanDocumentForPhysicalCss,
  type AuditDiagnostic,
} from '@bidilens/core';

export const DIAGNOSTIC_SOURCE = 'BidiLens';
export const SUPPORTED_LANGUAGES = ['css', 'scss', 'sass', 'vue'] as const;

export function resolveDocumentTarget(document: vscode.TextDocument): string | null {
  if (SUPPORTED_LANGUAGES.includes(document.languageId as (typeof SUPPORTED_LANGUAGES)[number])) {
    return document.languageId;
  }
  const byFileName = inferDocumentKind(document.fileName);
  return byFileName;
}

export function toVscodeRange(diag: AuditDiagnostic): vscode.Range {
  const startLine = Math.max(0, diag.line - 1);
  const startChar = Math.max(0, diag.column - 1);
  const endLine = Math.max(startLine, diag.endLine - 1);
  const endChar = Math.max(0, diag.endColumn - 1);
  return new vscode.Range(startLine, startChar, endLine, endChar);
}

function getConfiguredSeverity(): vscode.DiagnosticSeverity {
  const config = vscode.workspace.getConfiguration('bidilens');
  const level = config.get<string>('severity', 'Warning');
  if (level === 'Error') return vscode.DiagnosticSeverity.Error;
  if (level === 'Information') return vscode.DiagnosticSeverity.Information;
  return vscode.DiagnosticSeverity.Warning;
}

export function refreshDocumentDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
): AuditDiagnostic[] {
  const config = vscode.workspace.getConfiguration('bidilens');
  if (!config.get<boolean>('enable', true)) {
    collection.delete(document.uri);
    return [];
  }

  const targetKind = resolveDocumentTarget(document);
  if (!targetKind) {
    return [];
  }

  const auditDiagnostics = scanDocumentForPhysicalCss(document.getText(), targetKind);
  const severity = getConfiguredSeverity();

  const vscodeDiagnostics = auditDiagnostics.map((item) => {
    const range = toVscodeRange(item);
    const compactFix = item.suggestedDeclaration.replace(/\n\s*/g, ' ');
    const message = `${item.message} → ${compactFix} (${item.whyItMatters})`;
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.source = DIAGNOSTIC_SOURCE;
    diagnostic.code = item.ruleId;
    return diagnostic;
  });

  collection.set(document.uri, vscodeDiagnostics);
  return auditDiagnostics;
}

export class BidiLensCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.SourceFixAll,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const targetKind = resolveDocumentTarget(document);
    if (!targetKind) return [];

    const allDiagnostics = scanDocumentForPhysicalCss(document.getText(), targetKind).filter(
      (d) => d.origin === 'source' && d.range,
    );
    if (allDiagnostics.length === 0) return [];

    const actions: vscode.CodeAction[] = [];

    // 1. Single-declaration Quick Fix actions intersecting the cursor/selection
    const intersecting = allDiagnostics.filter((diag) =>
      Boolean(toVscodeRange(diag).intersection(range)),
    );

    for (const diag of intersecting) {
      const diagRange = toVscodeRange(diag);
      const compactFix = diag.suggestedDeclaration.replace(/\n\s*/g, ' ');
      const singleAction = new vscode.CodeAction(
        `Convert to logical CSS property (${compactFix})`,
        vscode.CodeActionKind.QuickFix,
      );
      singleAction.isPreferred = true;

      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, diagRange, diag.suggestedDeclaration);
      singleAction.edit = edit;

      const matchingMarker = context.diagnostics.find(
        (d) => d.source === DIAGNOSTIC_SOURCE && d.range.isEqual(diagRange),
      );
      if (matchingMarker) {
        singleAction.diagnostics = [matchingMarker];
      }

      actions.push(singleAction);
    }

    // 2. File-wide Quick Fix ("Fix all physical CSS in file")
    const requestedFixAll = Boolean(
      context.only?.contains(vscode.CodeActionKind.SourceFixAll),
    );
    if (intersecting.length > 0 || requestedFixAll) {
      const fixAllQuickAction = this.buildFixAllAction(
        document,
        allDiagnostics,
        vscode.CodeActionKind.QuickFix,
      );
      actions.push(fixAllQuickAction);

      if (requestedFixAll) {
        actions.push(
          this.buildFixAllAction(
            document,
            allDiagnostics,
            vscode.CodeActionKind.SourceFixAll,
          ),
        );
      }
    }

    return actions;
  }

  private buildFixAllAction(
    document: vscode.TextDocument,
    diagnostics: AuditDiagnostic[],
    kind: vscode.CodeActionKind,
  ): vscode.CodeAction {
    const count = diagnostics.length;
    const action = new vscode.CodeAction(
      `Fix all physical CSS in file (${count} ${count === 1 ? 'issue' : 'issues'})`,
      kind,
    );

    const edit = new vscode.WorkspaceEdit();
    const sortedReverse = diagnostics
      .slice()
      .sort((a, b) => (b.range?.start ?? 0) - (a.range?.start ?? 0));

    for (const diag of sortedReverse) {
      edit.replace(document.uri, toVscodeRange(diag), diag.suggestedDeclaration);
    }
    action.edit = edit;
    return action;
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('bidilens');
  context.subscriptions.push(diagnosticCollection);

  // Audit all open documents immediately on activation
  vscode.workspace.textDocuments.forEach((doc) => {
    refreshDocumentDiagnostics(doc, diagnosticCollection);
  });

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      refreshDocumentDiagnostics(doc, diagnosticCollection);
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      refreshDocumentDiagnostics(event.document, diagnosticCollection);
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnosticCollection.delete(doc.uri);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('bidilens')) {
        vscode.workspace.textDocuments.forEach((doc) => {
          refreshDocumentDiagnostics(doc, diagnosticCollection);
        });
      }
    }),
  );

  const selector: vscode.DocumentSelector = SUPPORTED_LANGUAGES.map((language) => ({ language }));
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(selector, new BidiLensCodeActionProvider(), {
      providedCodeActionKinds: BidiLensCodeActionProvider.providedCodeActionKinds,
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bidilens.fixAllInActiveEditor', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const targetKind = resolveDocumentTarget(editor.document);
      if (!targetKind) return;

      const diagnostics = scanDocumentForPhysicalCss(editor.document.getText(), targetKind).filter(
        (d) => d.origin === 'source' && d.range,
      );
      if (diagnostics.length === 0) {
        void vscode.window.showInformationMessage('BidiLens: File is already 100% logical CSS.');
        return;
      }

      const edit = new vscode.WorkspaceEdit();
      const sortedReverse = diagnostics
        .slice()
        .sort((a, b) => (b.range?.start ?? 0) - (a.range?.start ?? 0));
      for (const diag of sortedReverse) {
        edit.replace(editor.document.uri, toVscodeRange(diag), diag.suggestedDeclaration);
      }

      await vscode.workspace.applyEdit(edit);
      void vscode.window.showInformationMessage(
        `BidiLens: Converted ${diagnostics.length} physical CSS ${diagnostics.length === 1 ? 'rule' : 'rules'} to logical CSS.`,
      );
    }),
  );
}

export function deactivate(): void {
  // Subscriptions are disposed automatically via ExtensionContext
}
