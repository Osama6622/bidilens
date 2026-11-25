<script setup lang="ts">
import type { AuditCategory, AuditDiagnostic, AuditSummary } from '@bidilens/core';

defineProps<{
  diagnostics: AuditDiagnostic[];
  summary: AuditSummary;
  selectedCategory: AuditCategory | 'all';
}>();

const emit = defineEmits<{
  'update:selectedCategory': [category: AuditCategory | 'all'];
  fixSingle: [diagnosticId: string];
  autoFixAll: [];
  selectLine: [line: number];
}>();

const categories: Array<{ id: AuditCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'box-model', label: 'Box Model' },
  { id: 'positioning', label: 'Positioning' },
  { id: 'alignment-float', label: 'Alignment' },
  { id: 'corner-radius', label: 'Radii' },
  { id: 'shorthand', label: 'Shorthand' },
];
</script>

<template>
  <section class="diagnostics-card" aria-label="Logical CSS Diagnostics">
    <header class="diag-header">
      <div class="diag-title-group">
        <h2 class="diag-title">Physical CSS Diagnostics</h2>
        <span class="count-chip" data-testid="diagnostics-count">
          {{ summary.totalIssues }}
        </span>
      </div>

      <button
        v-if="summary.fixableIssues > 0"
        type="button"
        class="fix-all-inline-btn"
        @click="emit('autoFixAll')"
      >
        Auto-Fix All ({{ summary.fixableIssues }})
      </button>
    </header>

    <div class="category-strip" role="tablist" aria-label="Filter diagnostics by category">
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        class="cat-pill"
        :class="{ 'is-selected': selectedCategory === cat.id }"
        @click="emit('update:selectedCategory', cat.id)"
      >
        <span>{{ cat.label }}</span>
        <span class="cat-num">
          {{ cat.id === 'all' ? summary.totalIssues : summary.byCategory[cat.id] }}
        </span>
      </button>
    </div>

    <div class="diag-list" data-testid="diagnostics-list">
      <div v-if="diagnostics.length === 0" class="empty-state">
        <div class="check-badge">✓</div>
        <h3 class="empty-heading">Zero Physical Directional Rules</h3>
        <p class="empty-copy">
          {{
            summary.totalIssues === 0
              ? 'Every box offset, alignment, and corner radius uses CSS Logical Properties.'
              : 'No issues in this category filter.'
          }}
        </p>
      </div>

      <article
        v-for="item in diagnostics"
        :key="item.id"
        class="diag-item"
        data-testid="diagnostic-item"
        @click="emit('selectLine', item.line)"
      >
        <div class="diag-item-top">
          <div class="diag-meta">
            <span class="line-badge">L{{ item.line }}:{{ item.column }}</span>
            <code class="selector-chip">{{ item.selector }}</code>
            <span class="category-tag">{{ item.category }}</span>
          </div>

          <button
            v-if="item.origin === 'source'"
            type="button"
            class="fix-one-btn"
            data-testid="fix-single-btn"
            @click.stop="emit('fixSingle', item.id)"
          >
            Fix Issue
          </button>
        </div>

        <div class="diff-box" dir="ltr">
          <div class="diff-line is-removed">
            <span class="diff-sign">−</span>
            <code>{{ item.originalDeclaration }}</code>
          </div>
          <div class="diff-line is-added">
            <span class="diff-sign">+</span>
            <code>{{ item.suggestedDeclaration }}</code>
          </div>
        </div>

        <p class="why-copy">{{ item.whyItMatters }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.diagnostics-card {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  block-size: 100%;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: hidden;
}

.diag-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-block: 8px;
  padding-inline: 12px;
  background: var(--bg-elevated);
  border-block-end: 1px solid var(--border-subtle);
}

.diag-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diag-title {
  margin-block: 0;
  margin-inline: 0;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary);
}

.count-chip {
  padding-block: 1px;
  padding-inline: 7px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
}

.fix-all-inline-btn {
  padding-block: 4px;
  padding-inline: 9px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.14);
  color: #7dd3fc;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(56, 189, 248, 0.25);
  }
}

.category-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding-block: 7px;
  padding-inline: 10px;
  border-block-end: 1px solid var(--border-subtle);
  background: rgba(15, 22, 36, 0.7);
}

.cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding-block: 3px;
  padding-inline: 8px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
    border-color: var(--border-strong);
  }

  &.is-selected {
    background: var(--bg-active);
    border-color: rgba(56, 189, 248, 0.5);
    color: var(--text-primary);
  }

  .cat-num {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
  }
}

.diag-list {
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
  padding-block: 8px;
  padding-inline: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  margin-block: auto;
  padding-block: 24px;
  padding-inline: 16px;
  text-align: center;

  .check-badge {
    display: inline-grid;
    place-items: center;
    inline-size: 36px;
    block-size: 36px;
    margin-block-end: 8px;
    border-radius: 999px;
    background: var(--status-ok-bg);
    color: #34d399;
    font-size: 18px;
    font-weight: 800;
  }

  .empty-heading {
    margin-block: 0 4px;
    margin-inline: 0;
    font-size: 13.5px;
    color: var(--text-primary);
  }

  .empty-copy {
    margin-block: 0;
    margin-inline: auto;
    max-inline-size: 290px;
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.diag-item {
  padding-block: 9px;
  padding-inline: 10px;
  border-radius: 8px;
  background: #0b111e;
  border: 1px solid var(--border-subtle);
  border-inline-start: 3px solid var(--status-warn);
  cursor: pointer;
  text-align: start;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    background: #10192c;
    border-color: var(--border-strong);
    border-inline-start-color: #38bdf8;
  }
}

.diag-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-block-end: 7px;
}

.diag-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-inline-size: 0;
}

.line-badge {
  padding-block: 1px;
  padding-inline: 6px;
  border-radius: 4px;
  background: rgba(245, 158, 11, 0.15);
  color: #fcd34d;
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
}

.selector-chip {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #93c5fd;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-inline-size: 190px;
}

.category-tag {
  padding-block: 1px;
  padding-inline: 6px;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.12);
  color: var(--text-secondary);
  font-size: 10px;
}

.fix-one-btn {
  flex-shrink: 0;
  padding-block: 3px;
  padding-inline: 9px;
  border-radius: 5px;
  border: 1px solid rgba(16, 185, 129, 0.45);
  background: rgba(16, 185, 129, 0.14);
  color: #6ee7b7;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(16, 185, 129, 0.28);
  }
}

.diff-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-block: 6px;
  padding-inline: 8px;
  border-radius: 6px;
  background: #070b14;
  border: 1px solid rgba(30, 41, 59, 0.85);
  font-family: var(--font-mono);
  font-size: 11px;
}

.diff-line {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  white-space: pre-wrap;
  word-break: break-word;

  &.is-removed {
    color: #fda4af;
  }

  &.is-added {
    color: #6ee7b7;
  }

  .diff-sign {
    user-select: none;
    font-weight: 700;
  }
}

.why-copy {
  margin-block: 6px 0;
  margin-inline: 0;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--text-secondary);
}
</style>
