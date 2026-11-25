import { computed, ref, watch } from 'vue';
import {
  applyAllFixes,
  applySingleFix,
  auditStylesheet,
  generateMarkdownReport,
  indentedSassToScss,
  scssToIndentedSass,
  type AuditCategory,
  type AuditResult,
  type SyntaxMode,
} from '@/core/auditor';
import { getFixtureById, SAMPLE_FIXTURES } from '@/core/fixtures';
import { useLocalStorage } from './useLocalStorage';

export type ViewportPreset = 'mobile' | 'tablet' | 'desktop';
export type PreviewComparisonMode = 'original' | 'fixed';
export type UiDirection = 'ltr' | 'rtl';

const STORAGE_PREFIX = 'bidilens:v1:';

export function useBidiAuditor() {
  const defaultFixture = SAMPLE_FIXTURES[0];

  const activeFixtureId = useLocalStorage<string>(
    `${STORAGE_PREFIX}fixtureId`,
    defaultFixture.id,
  );
  const syntaxMode = useLocalStorage<SyntaxMode>(`${STORAGE_PREFIX}syntaxMode`, 'scss');
  const htmlCode = useLocalStorage<string>(`${STORAGE_PREFIX}html`, defaultFixture.html);
  const styleCode = useLocalStorage<string>(`${STORAGE_PREFIX}style`, defaultFixture.scss);
  const previewMode = useLocalStorage<PreviewComparisonMode>(
    `${STORAGE_PREFIX}previewMode`,
    'original',
  );
  const viewportPreset = useLocalStorage<ViewportPreset>(
    `${STORAGE_PREFIX}viewport`,
    'desktop',
  );
  const showBoundingGrid = useLocalStorage<boolean>(`${STORAGE_PREFIX}gridOverlay`, false);
  const uiDirection = useLocalStorage<UiDirection>(`${STORAGE_PREFIX}uiDirection`, 'ltr');

  const selectedCategory = ref<AuditCategory | 'all'>('all');
  const highlightedLine = ref<number | null>(null);
  const toastMessage = ref<string | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  const auditResult = ref<AuditResult>(auditStylesheet(styleCode.value, syntaxMode.value));
  const lastValidOriginalCss = ref<string>(auditResult.value.compiledCss);
  const lastValidFixedCss = ref<string>(auditResult.value.fixedCompiledCss);

  const flashToast = (message: string) => {
    toastMessage.value = message;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage.value = null;
    }, 2600);
  };

  const runAudit = () => {
    const next = auditStylesheet(styleCode.value, syntaxMode.value);
    auditResult.value = next;
    if (next.compileResult.ok) {
      lastValidOriginalCss.value = next.compiledCss;
      lastValidFixedCss.value = next.fixedCompiledCss;
    }
    return next;
  };

  watch([styleCode, syntaxMode], () => {
    runAudit();
  });

  const compileAndAudit = () => {
    const res = runAudit();
    if (!res.compileResult.ok) {
      flashToast('Sass compilation failed — check syntax error banner');
    } else if (res.summary.totalIssues === 0) {
      flashToast('Compiled cleanly · 0 physical CSS issues');
    } else {
      flashToast(`Compiled & audited · ${res.summary.totalIssues} directional issues found`);
    }
    return res;
  };

  const loadFixture = (fixtureId: string) => {
    const fixture = getFixtureById(fixtureId);
    activeFixtureId.value = fixture.id;
    htmlCode.value = fixture.html;
    styleCode.value = syntaxMode.value === 'sass' ? fixture.sass : fixture.scss;
    previewMode.value = 'original';
    selectedCategory.value = 'all';
    highlightedLine.value = null;
    runAudit();
    flashToast(`Loaded fixture: ${fixture.name}`);
  };

  const setSyntaxMode = (nextMode: SyntaxMode) => {
    if (nextMode === syntaxMode.value) return;
    styleCode.value =
      nextMode === 'sass'
        ? scssToIndentedSass(styleCode.value)
        : indentedSassToScss(styleCode.value);
    syntaxMode.value = nextMode;
    flashToast(`Switched syntax to .${nextMode}`);
  };

  const fixSingleIssue = (diagnosticId: string) => {
    const updated = applySingleFix(styleCode.value, diagnosticId, syntaxMode.value);
    if (updated !== styleCode.value) {
      styleCode.value = updated;
      flashToast('Applied logical CSS fix');
    }
  };

  const autoFixAll = () => {
    const count = auditResult.value.summary.fixableIssues;
    if (count === 0) {
      flashToast('Already 100% logical CSS — nothing to fix');
      return;
    }
    styleCode.value = applyAllFixes(styleCode.value, syntaxMode.value);
    previewMode.value = 'original';
    flashToast(`Auto-fixed ${count} physical CSS ${count === 1 ? 'rule' : 'rules'} to logical CSS`);
  };

  const copyFixedOutput = async (): Promise<string> => {
    const output = auditResult.value.fixedSource;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(output);
      } catch {
        // Fallback handled silently
      }
    }
    flashToast(`Copied fixed .${syntaxMode.value} output to clipboard`);
    return output;
  };

  const exportMarkdownReport = async (triggerDownload = true): Promise<string> => {
    const currentFixture = SAMPLE_FIXTURES.find((f) => f.id === activeFixtureId.value);
    const markdown = generateMarkdownReport(auditResult.value, {
      fixtureName: currentFixture?.name,
    });

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(markdown);
      } catch {
        // Ignore clipboard permission failure
      }
    }

    if (triggerDownload && typeof document !== 'undefined' && typeof URL !== 'undefined') {
      try {
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `bidilens-audit-${activeFixtureId.value || 'report'}.md`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      } catch {
        // Ignore non-browser test environment download errors
      }
    }

    flashToast('Exported Markdown audit report');
    return markdown;
  };

  const filteredDiagnostics = computed(() => {
    if (selectedCategory.value === 'all') {
      return auditResult.value.diagnostics;
    }
    return auditResult.value.diagnostics.filter((d) => d.category === selectedCategory.value);
  });

  const activePreviewCss = computed(() => {
    if (auditResult.value.compileResult.ok) {
      return previewMode.value === 'fixed'
        ? auditResult.value.fixedCompiledCss
        : auditResult.value.compiledCss;
    }
    return previewMode.value === 'fixed' ? lastValidFixedCss.value : lastValidOriginalCss.value;
  });

  const toggleUiDirection = () => {
    uiDirection.value = uiDirection.value === 'ltr' ? 'rtl' : 'ltr';
  };

  return {
    fixtures: SAMPLE_FIXTURES,
    activeFixtureId,
    syntaxMode,
    htmlCode,
    styleCode,
    previewMode,
    viewportPreset,
    showBoundingGrid,
    uiDirection,
    selectedCategory,
    highlightedLine,
    toastMessage,
    auditResult,
    filteredDiagnostics,
    activePreviewCss,
    compileAndAudit,
    loadFixture,
    setSyntaxMode,
    fixSingleIssue,
    autoFixAll,
    copyFixedOutput,
    exportMarkdownReport,
    toggleUiDirection,
  };
}
