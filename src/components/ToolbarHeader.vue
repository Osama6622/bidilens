<script setup lang="ts">
import type { AuditSummary, SampleFixture } from '@/core/auditor';
import type { UiDirection } from '@/composables/useBidiAuditor';

defineProps<{
  fixtures: SampleFixture[];
  activeFixtureId: string;
  summary: AuditSummary;
  compilerOk: boolean;
  uiDirection: UiDirection;
}>();

const emit = defineEmits<{
  selectFixture: [fixtureId: string];
  compileAndAudit: [];
  autoFixAll: [];
  copyFixed: [];
  exportReport: [];
  toggleUiDirection: [];
}>();
</script>

<template>
  <header class="toolbar-shell">
    <div class="toolbar-top">
      <div class="brand-cluster">
        <div class="logo-mark" aria-hidden="true">⇄</div>
        <div class="brand-copy">
          <div class="brand-title-row">
            <h1 class="brand-name">BidiLens</h1>
            <span class="brand-tag">LTR · RTL Logical CSS Workbench</span>
          </div>
          <p class="brand-subtitle">
            Compile SCSS/Sass in-browser, audit hardcoded physical properties, and verify bidirectional parity live.
          </p>
        </div>
      </div>

      <div class="status-and-actions">
        <div
          class="score-pill"
          :class="{
            'is-error': !compilerOk,
            'is-clean': compilerOk && summary.totalIssues === 0,
            'is-warn': compilerOk && summary.totalIssues > 0,
          }"
          data-testid="bidi-score-pill"
        >
          <span class="score-dot"></span>
          <template v-if="!compilerOk">Sass Syntax Error</template>
          <template v-else-if="summary.totalIssues === 0">
            100% Logical Ready · 0 issues
          </template>
          <template v-else>
            Bidi Score {{ summary.bidiScore }}% · {{ summary.totalIssues }}
            {{ summary.totalIssues === 1 ? 'issue' : 'issues' }}
          </template>
        </div>

        <button
          type="button"
          class="btn btn-secondary"
          title="Compile Sass & run logical CSS audit (Cmd/Ctrl + Enter)"
          @click="emit('compileAndAudit')"
        >
          <span>Compile &amp; Audit</span>
          <kbd>⌘↵</kbd>
        </button>

        <button
          type="button"
          class="btn btn-primary"
          :disabled="summary.fixableIssues === 0"
          title="Rewrite all physical CSS rules to logical equivalents (Cmd/Ctrl + Shift + F)"
          data-testid="auto-fix-all-btn"
          @click="emit('autoFixAll')"
        >
          <span>Auto-Fix All</span>
          <kbd>⌘⇧F</kbd>
        </button>

        <button
          type="button"
          class="btn btn-ghost"
          title="Copy logical-fixed stylesheet to clipboard"
          @click="emit('copyFixed')"
        >
          Copy Fixed Output
        </button>

        <button
          type="button"
          class="btn btn-ghost"
          title="Download & copy Markdown audit report"
          @click="emit('exportReport')"
        >
          Export Report (.md)
        </button>

        <button
          type="button"
          class="btn btn-dir-toggle"
          data-testid="workbench-dir-toggle"
          title="Flip BidiLens's own UI between LTR and RTL (dogfooding CSS Logical Properties)"
          @click="emit('toggleUiDirection')"
        >
          UI: <strong>{{ uiDirection.toUpperCase() }}</strong> ⇄
        </button>
      </div>
    </div>

    <div class="fixture-bar" role="navigation" aria-label="Sample Fixtures">
      <span class="fixture-label">Sample Fixtures:</span>
      <div class="fixture-pills">
        <button
          v-for="fixture in fixtures"
          :key="fixture.id"
          type="button"
          class="fixture-chip"
          :class="{
            'is-active': fixture.id === activeFixtureId,
            'is-clean-fixture': fixture.id === 'clean-logical',
          }"
          :data-testid="`fixture-${fixture.id}`"
          :title="fixture.description"
          @click="emit('selectFixture', fixture.id)"
        >
          <span class="fixture-name">{{ fixture.name }}</span>
          <span class="fixture-badge">{{ fixture.badge }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.toolbar-shell {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-block: 12px;
  padding-inline: 18px;
  background: var(--bg-panel);
  border-block-end: 1px solid var(--border-subtle);
}

.toolbar-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.brand-cluster {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-mark {
  display: grid;
  place-items: center;
  inline-size: 36px;
  block-size: 36px;
  border-radius: 9px;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: #ffffff;
  font-weight: 800;
  font-size: 18px;
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.25);
}

.brand-copy {
  text-align: start;
}

.brand-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-name {
  margin-block: 0;
  margin-inline: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.brand-tag {
  padding-block: 2px;
  padding-inline: 8px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.28);
  color: var(--accent-primary);
  font-size: 11px;
  font-weight: 600;
}

.brand-subtitle {
  margin-block: 2px 0;
  margin-inline: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.status-and-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.score-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding-block: 6px;
  padding-inline: 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;

  .score-dot {
    inline-size: 7px;
    block-size: 7px;
    border-radius: 999px;
    background: currentColor;
  }

  &.is-warn {
    background: var(--status-warn-bg);
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.35);
  }

  &.is-clean {
    background: var(--status-ok-bg);
    color: #34d399;
    border-color: rgba(16, 185, 129, 0.35);
  }

  &.is-error {
    background: var(--status-err-bg);
    color: #fb7185;
    border-color: rgba(244, 63, 94, 0.4);
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-block: 6px;
  padding-inline: 11px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: linear-gradient(135deg, #0284c7, #4f46e5);
  color: #ffffff;
  border: 1px solid rgba(125, 211, 252, 0.35);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #0369a1, #4338ca);
  }
}

.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-strong);

  &:hover {
    background: var(--bg-hover);
  }
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);

  &:hover {
    color: var(--text-primary);
    background: var(--bg-elevated);
    border-color: var(--border-strong);
  }
}

.btn-dir-toggle {
  background: rgba(99, 102, 241, 0.14);
  color: #c7d2fe;
  border: 1px solid rgba(99, 102, 241, 0.38);

  &:hover {
    background: rgba(99, 102, 241, 0.24);
  }
}

.fixture-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-block-start: 8px;
  border-block-start: 1px solid rgba(51, 65, 85, 0.45);
}

.fixture-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fixture-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fixture-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding-block: 4px;
  padding-inline: 10px;
  border-radius: 7px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--text-primary);
    border-color: var(--border-strong);
  }

  &.is-active {
    background: rgba(56, 189, 248, 0.14);
    border-color: rgba(56, 189, 248, 0.5);
    color: var(--text-primary);
  }

  .fixture-name {
    font-weight: 600;
  }

  .fixture-badge {
    padding-block: 1px;
    padding-inline: 6px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.65);
    font-size: 10.5px;
    color: var(--text-muted);
  }

  &.is-clean-fixture .fixture-badge {
    color: #34d399;
  }
}
</style>
