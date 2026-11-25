import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { BidiLensCodeActionProvider, refreshDocumentDiagnostics } from '../extension.js';

function createMockDocument(content: string, languageId: string, fileName: string) {
  return {
    uri: { fsPath: fileName, toString: () => `file://${fileName}` },
    languageId,
    fileName,
    getText: () => content,
  } as unknown as vscode.TextDocument;
}

describe('bidilens-vscode extension', () => {
  it('publishes real-time vscode.Diagnostic warnings with exact 0-based line/character spans for .vue and .scss', () => {
    const stored = new Map<unknown, vscode.Diagnostic[]>();
    const collection = {
      set: (uri: unknown, diags: vscode.Diagnostic[]) => stored.set(uri, diags),
      delete: (uri: unknown) => stored.delete(uri),
    } as unknown as vscode.DiagnosticCollection;

    const vueDoc = createMockDocument(
      [
        '<template><div class="box" /></template>',
        '<style scoped lang="scss">',
        '.box {',
        '  margin-left: 12px;',
        '  text-align: right;',
        '}',
        '</style>',
      ].join('\n'),
      'vue',
      '/app/Box.vue',
    );

    refreshDocumentDiagnostics(vueDoc, collection);
    const published = stored.get(vueDoc.uri)!;
    expect(published).toHaveLength(2);
    expect(published[0].range.start.line).toBe(3);
    expect(published[0].range.start.character).toBe(2);
    expect(published[0].source).toBe('BidiLens');
    expect(published[0].message).toContain('margin-inline-start: 12px;');
  });

  it('provides Quick Fix CodeActions for single declaration and all physical CSS in file', () => {
    const provider = new BidiLensCodeActionProvider();
    const scssDoc = createMockDocument(
      `.card {\n  padding-left: 20px;\n  right: 8px;\n}`,
      'scss',
      '/app/card.scss',
    );

    const cursorRange = new vscode.Range(1, 4, 1, 4);
    const actions = provider.provideCodeActions(scssDoc, cursorRange, {
      diagnostics: [],
      only: undefined,
      triggerKind: 1,
    } as unknown as vscode.CodeActionContext);

    expect(actions).toHaveLength(2);
    expect(actions[0].title).toContain('Convert to logical CSS property');
    expect(actions[0].isPreferred).toBe(true);

    const singleEdits = (actions[0].edit as unknown as { edits: Array<{ newText: string }> }).edits;
    expect(singleEdits).toHaveLength(1);
    expect(singleEdits[0].newText).toBe('padding-inline-start: 20px;');

    expect(actions[1].title).toBe('Fix all physical CSS in file (2 issues)');
    const allEdits = (actions[1].edit as unknown as { edits: Array<{ newText: string }> }).edits;
    expect(allEdits).toHaveLength(2);
  });
});
