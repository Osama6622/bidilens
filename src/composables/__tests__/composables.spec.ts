import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { useLocalStorage } from '../useLocalStorage';
import { handleWorkbenchKeydown } from '../useKeyboardShortcuts';
import { useBidiAuditor } from '../useBidiAuditor';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initializes with default value and persists mutations to localStorage', async () => {
    const pref = useLocalStorage('test:pref', { mode: 'scss', count: 1 });
    expect(pref.value).toEqual({ mode: 'scss', count: 1 });

    pref.value.mode = 'sass';
    pref.value.count = 4;
    await nextTick();

    const raw = window.localStorage.getItem('test:pref');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual({ mode: 'sass', count: 4 });
  });

  it('recovers gracefully when stored JSON is malformed', () => {
    window.localStorage.setItem('test:corrupt', '{not-valid-json');
    const state = useLocalStorage('test:corrupt', 'fallback');
    expect(state.value).toBe('fallback');
  });
});

describe('handleWorkbenchKeydown', () => {
  it('triggers compileAndAudit on Cmd/Ctrl + Enter and autoFixAll on Cmd/Ctrl + Shift + F', () => {
    const onCompileAndAudit = vi.fn();
    const onAutoFixAll = vi.fn();

    const compileEvt = new KeyboardEvent('keydown', {
      key: 'Enter',
      metaKey: true,
      cancelable: true,
    });
    expect(handleWorkbenchKeydown(compileEvt, { onCompileAndAudit, onAutoFixAll })).toBe(true);
    expect(onCompileAndAudit).toHaveBeenCalledTimes(1);

    const fixEvt = new KeyboardEvent('keydown', {
      key: 'F',
      ctrlKey: true,
      shiftKey: true,
      cancelable: true,
    });
    expect(handleWorkbenchKeydown(fixEvt, { onCompileAndAudit, onAutoFixAll })).toBe(true);
    expect(onAutoFixAll).toHaveBeenCalledTimes(1);

    const regularEvt = new KeyboardEvent('keydown', { key: 'f' });
    expect(handleWorkbenchKeydown(regularEvt, { onCompileAndAudit, onAutoFixAll })).toBe(false);
  });
});

describe('useBidiAuditor', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loads default fixture, switches syntax modes, fixes single and all issues, and exports Markdown', async () => {
    const workbench = useBidiAuditor();
    expect(workbench.auditResult.value.compileResult.ok).toBe(true);
    const initialIssues = workbench.auditResult.value.summary.totalIssues;
    expect(initialIssues).toBeGreaterThan(0);

    // Fix single issue
    const firstId = workbench.auditResult.value.diagnostics[0].id;
    workbench.fixSingleIssue(firstId);
    await nextTick();
    expect(workbench.auditResult.value.summary.totalIssues).toBe(initialIssues - 1);

    // Switch syntax mode from .scss to .sass
    workbench.setSyntaxMode('sass');
    await nextTick();
    expect(workbench.syntaxMode.value).toBe('sass');
    expect(workbench.auditResult.value.compileResult.ok).toBe(true);

    // Auto-fix remaining issues in .sass mode
    workbench.autoFixAll();
    await nextTick();
    expect(workbench.auditResult.value.summary.totalIssues).toBe(0);
    expect(workbench.auditResult.value.summary.bidiScore).toBe(100);

    // Export Markdown report
    const md = await workbench.exportMarkdownReport(false);
    expect(md).toContain('# BidiLens Logical CSS Audit Report');
    expect(md).toContain('**Bidi Readiness Score:** **100%**');
  });
});
