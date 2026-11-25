export class Position {
  constructor(
    public readonly line: number,
    public readonly character: number,
  ) {}
}

export class Range {
  public readonly start: Position;
  public readonly end: Position;
  constructor(startLine: number, startChar: number, endLine: number, endChar: number) {
    this.start = new Position(startLine, startChar);
    this.end = new Position(endLine, endChar);
  }

  intersection(other: Range): Range | undefined {
    const startsAfterEnd =
      this.start.line > other.end.line ||
      (this.start.line === other.end.line && this.start.character > other.end.character);
    const endsBeforeStart =
      this.end.line < other.start.line ||
      (this.end.line === other.start.line && this.end.character < other.start.character);
    return startsAfterEnd || endsBeforeStart ? undefined : this;
  }

  isEqual(other: Range): boolean {
    return (
      this.start.line === other.start.line &&
      this.start.character === other.start.character &&
      this.end.line === other.end.line &&
      this.end.character === other.end.character
    );
  }
}

export class Diagnostic {
  public source?: string;
  public code?: string;
  constructor(
    public readonly range: Range,
    public readonly message: string,
    public readonly severity: number,
  ) {}
}

export class WorkspaceEdit {
  public edits: Array<{ uri: unknown; range: Range; newText: string }> = [];
  replace(uri: unknown, range: Range, newText: string) {
    this.edits.push({ uri, range, newText });
  }
}

export class CodeActionKind {
  static readonly QuickFix = new CodeActionKind('quickfix');
  static readonly SourceFixAll = new CodeActionKind('source.fixAll');
  constructor(public readonly value: string) {}
  contains(other: CodeActionKind): boolean {
    return other.value.startsWith(this.value);
  }
}

export class CodeAction {
  public isPreferred?: boolean;
  public edit?: WorkspaceEdit;
  public diagnostics?: Diagnostic[];
  constructor(
    public readonly title: string,
    public readonly kind?: CodeActionKind,
  ) {}
}

export const DiagnosticSeverity = {
  Error: 0,
  Warning: 1,
  Information: 2,
  Hint: 3,
} as const;

export const workspace = {
  getConfiguration: () => ({
    get: <T>(_key: string, defaultVal: T): T => defaultVal,
  }),
};
