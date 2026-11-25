/**
 * Lightweight bidirectional syntax converter between `.scss` and indented `.sass`
 * so switching syntax modes in the workbench adapts user code cleanly.
 */
export function scssToIndentedSass(scss: string): string {
  const lines = scss.split('\n');
  const output: string[] = [];

  for (const rawLine of lines) {
    const indentMatch = rawLine.match(/^[ \t]*/);
    const indent = indentMatch ? indentMatch[0] : '';
    let content = rawLine.trim();

    if (!content) {
      output.push('');
      continue;
    }

    // Preserve comments
    if (content.startsWith('//') || content.startsWith('/*') || content.startsWith('*')) {
      output.push(`${indent}${content}`);
      continue;
    }

    // Standalone closing brace
    if (content === '}') {
      continue;
    }

    // Remove opening/closing braces at line boundaries and trailing semicolons
    content = content
      .replace(/\s*\{\s*$/, '')
      .replace(/^\}\s*/, '')
      .replace(/;\s*$/, '');

    if (content) {
      output.push(`${indent}${content}`);
    }
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

export function indentedSassToScss(sassCode: string): string {
  const rawLines = sassCode.split('\n');
  const output: string[] = [];
  const blockIndents: number[] = [];

  const getNextNonEmptyIndent = (startIdx: number): number => {
    for (let j = startIdx + 1; j < rawLines.length; j++) {
      const trimmed = rawLines[j].trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
      const m = rawLines[j].match(/^[ \t]*/);
      return m ? m[0].replace(/\t/g, '  ').length : 0;
    }
    return 0;
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      output.push('');
      continue;
    }

    const indentMatch = line.match(/^[ \t]*/);
    const indentStr = indentMatch ? indentMatch[0].replace(/\t/g, '  ') : '';
    const indent = indentStr.length;

    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      output.push(`${' '.repeat(indent)}${trimmed}`);
      continue;
    }

    while (blockIndents.length > 0 && blockIndents[blockIndents.length - 1] >= indent) {
      const closedIndent = blockIndents.pop()!;
      output.push(`${' '.repeat(closedIndent)}}`);
    }

    const nextIndent = getNextNonEmptyIndent(i);
    const isParentBlock = nextIndent > indent && !trimmed.startsWith('$');

    if (isParentBlock) {
      output.push(`${' '.repeat(indent)}${trimmed} {`);
      blockIndents.push(indent);
    } else {
      const withSemi = trimmed.endsWith(';') ? trimmed : `${trimmed};`;
      output.push(`${' '.repeat(indent)}${withSemi}`);
    }
  }

  while (blockIndents.length > 0) {
    const closedIndent = blockIndents.pop()!;
    output.push(`${' '.repeat(closedIndent)}}`);
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
