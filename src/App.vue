<script setup lang="ts">
import { watchEffect } from 'vue';
import ToolbarHeader from './components/ToolbarHeader.vue';
import CodeEditorPane from './components/CodeEditorPane.vue';
import AuditDiagnosticsList from './components/AuditDiagnosticsList.vue';
import BidiPreviewFrame from './components/BidiPreviewFrame.vue';
import { useBidiAuditor } from './composables/useBidiAuditor';
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts';

const {
  fixtures,
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
} = useBidiAuditor();

useKeyboardShortcuts({
  onCompileAndAudit: () => {
    compileAndAudit();
  },
  onAutoFixAll: () => {
    autoFixAll();
  },
});

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('dir', uiDirection.value);
  }
});
</script>

<template>
  <div class="bidilens-workbench" :dir="uiDirection" data-testid="workbench-root">
    <ToolbarHeader
      :fixtures="fixtures"
      :active-fixture-id="activeFixtureId"
      :summary="auditResult.summary"
      :compiler-ok="auditResult.compileResult.ok"
      :ui-direction="uiDirection"
      @select-fixture="loadFixture"
      @compile-and-audit="compileAndAudit"
      @auto-fix-all="autoFixAll"
      @copy-fixed="copyFixedOutput"
      @export-report="exportMarkdownReport(true)"
      @toggle-ui-direction="toggleUiDirection"
    />

    <main class="workbench-grid">
      <div class="left-code-col">
        <CodeEditorPane
          v-model:html-code="htmlCode"
          v-model:style-code="styleCode"
          :syntax-mode="syntaxMode"
          :compile-result="auditResult.compileResult"
          :highlighted-line="highlightedLine"
          @change-syntax-mode="setSyntaxMode"
        />
      </div>

      <div class="right-inspect-col">
        <div class="preview-region">
          <BidiPreviewFrame
            v-model:preview-mode="previewMode"
            v-model:viewport-preset="viewportPreset"
            v-model:show-bounding-grid="showBoundingGrid"
            :html-code="htmlCode"
            :active-css="activePreviewCss"
            :issue-count="auditResult.summary.totalIssues"
          />
        </div>

        <div class="diagnostics-region">
          <AuditDiagnosticsList
            v-model:selected-category="selectedCategory"
            :diagnostics="filteredDiagnostics"
            :summary="auditResult.summary"
            @fix-single="fixSingleIssue"
            @auto-fix-all="autoFixAll"
            @select-line="(line) => (highlightedLine = line)"
          />
        </div>
      </div>
    </main>

    <Transition name="toast">
      <div v-if="toastMessage" class="status-toast" role="status" aria-live="polite">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.bidilens-workbench {
  display: flex;
  flex-direction: column;
  min-block-size: 100vh;
  block-size: 100vh;
  background: var(--bg-app);
  color: var(--text-primary);
}

.workbench-grid {
  flex: 1;
  min-block-size: 0;
  display: grid;
  grid-template-columns: minmax(360px, 42%) minmax(460px, 58%);
  gap: 10px;
  padding-block: 10px;
  padding-inline: 12px;
}

.left-code-col {
  min-block-size: 0;
  min-inline-size: 0;
}

.right-inspect-col {
  min-block-size: 0;
  min-inline-size: 0;
  display: grid;
  grid-template-rows: minmax(290px, 56%) minmax(210px, 44%);
  gap: 10px;
}

.preview-region,
.diagnostics-region {
  min-block-size: 0;
  min-inline-size: 0;
}

.status-toast {
  position: fixed;
  inset-block-end: 18px;
  inset-inline-end: 18px;
  z-index: 50;
  padding-block: 9px;
  padding-inline: 14px;
  border-radius: 8px;
  background: #0f172a;
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #e0f2fe;
  font-size: 12.5px;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 1024px) {
  .bidilens-workbench {
    block-size: auto;
  }

  .workbench-grid {
    grid-template-columns: 1fr;
  }

  .right-inspect-col {
    grid-template-rows: auto auto;
  }
}
</style>
