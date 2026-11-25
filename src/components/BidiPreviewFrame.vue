<script setup lang="ts">
import { computed } from 'vue';
import type { PreviewComparisonMode, ViewportPreset } from '@/composables/useBidiAuditor';

const props = defineProps<{
  htmlCode: string;
  activeCss: string;
  previewMode: PreviewComparisonMode;
  viewportPreset: ViewportPreset;
  showBoundingGrid: boolean;
  issueCount: number;
}>();

const emit = defineEmits<{
  'update:previewMode': [mode: PreviewComparisonMode];
  'update:viewportPreset': [preset: ViewportPreset];
  'update:showBoundingGrid': [enabled: boolean];
}>();

const viewportWidthMap: Record<ViewportPreset, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%',
};

const activeMaxInlineSize = computed(() => viewportWidthMap[props.viewportPreset]);

function buildIframeSrcdoc(dir: 'ltr' | 'rtl'): string {
  const lang = dir === 'rtl' ? 'ar' : 'en';
  const gridOverlayStyles = props.showBoundingGrid
    ? `
      body {
        background-image:
          linear-gradient(to right, rgba(56, 189, 248, 0.14) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(56, 189, 248, 0.14) 1px, transparent 1px) !important;
        background-size: 16px 16px !important;
      }
      body * {
        outline: 1px dashed rgba(244, 63, 94, 0.55) !important;
        outline-offset: -1px !important;
      }
    `
    : '';

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
  <head>
    <meta charset="UTF-8" />
    <style data-bidilens-reset>
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 18px;
        min-height: 100%;
        background: #f8fafc;
        color: #0f172a;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
    </style>
    <style data-bidilens-compiled>
${props.activeCss}
    </style>
    <style data-bidilens-overlay>
${gridOverlayStyles}
    </style>
  </head>
  <body>
${props.htmlCode}
  </body>
</html>`;
}

const ltrSrcdoc = computed(() => buildIframeSrcdoc('ltr'));
const rtlSrcdoc = computed(() => buildIframeSrcdoc('rtl'));
</script>

<template>
  <section class="preview-workspace" aria-label="Synchronized Side-by-Side LTR and RTL Preview">
    <header class="preview-toolbar">
      <div class="compare-switch-wrap">
        <span class="control-label">CSS Stream:</span>
        <div class="segmented-control" role="group" aria-label="Compare Original vs Logical-Fixed">
          <button
            type="button"
            class="seg-btn"
            :class="{ 'is-active': previewMode === 'original' }"
            data-testid="preview-mode-original"
            @click="emit('update:previewMode', 'original')"
          >
            Original CSS
            <span v-if="issueCount > 0" class="mini-warn">{{ issueCount }}</span>
          </button>
          <button
            type="button"
            class="seg-btn is-logical"
            :class="{ 'is-active': previewMode === 'fixed' }"
            data-testid="preview-mode-fixed"
            @click="emit('update:previewMode', 'fixed')"
          >
            Logical-Fixed Preview
          </button>
        </div>
      </div>

      <div class="viewport-and-overlay">
        <div class="segmented-control" role="group" aria-label="Viewport Width Presets">
          <button
            type="button"
            class="seg-btn"
            :class="{ 'is-active': viewportPreset === 'mobile' }"
            data-testid="viewport-mobile"
            @click="emit('update:viewportPreset', 'mobile')"
          >
            Mobile 375px
          </button>
          <button
            type="button"
            class="seg-btn"
            :class="{ 'is-active': viewportPreset === 'tablet' }"
            data-testid="viewport-tablet"
            @click="emit('update:viewportPreset', 'tablet')"
          >
            Tablet 768px
          </button>
          <button
            type="button"
            class="seg-btn"
            :class="{ 'is-active': viewportPreset === 'desktop' }"
            data-testid="viewport-desktop"
            @click="emit('update:viewportPreset', 'desktop')"
          >
            Desktop 100%
          </button>
        </div>

        <button
          type="button"
          class="overlay-toggle-btn"
          :class="{ 'is-on': showBoundingGrid }"
          data-testid="grid-overlay-toggle"
          @click="emit('update:showBoundingGrid', !showBoundingGrid)"
        >
          <span>⊞ Bounding Grid</span>
        </button>
      </div>
    </header>

    <div class="frames-grid">
      <!-- LTR Frame -->
      <div class="frame-column">
        <div class="frame-header">
          <div class="dir-badge is-ltr">
            <strong>LTR</strong>
            <span>dir="ltr" · Inline Start → End</span>
          </div>
          <span class="viewport-readout">{{ activeMaxInlineSize }}</span>
        </div>

        <div class="stage-well">
          <div class="iframe-viewport" :style="{ maxInlineSize: activeMaxInlineSize }">
            <iframe
              title="LTR Live Preview"
              sandbox=""
              :srcdoc="ltrSrcdoc"
              class="sandbox-iframe"
              data-testid="iframe-ltr"
            ></iframe>
          </div>
        </div>
      </div>

      <!-- RTL Frame -->
      <div class="frame-column">
        <div class="frame-header">
          <div class="dir-badge is-rtl">
            <strong>RTL</strong>
            <span>dir="rtl" · Inline End ← Start</span>
          </div>
          <span
            class="rtl-status-tag"
            :class="{
              'is-broken': previewMode === 'original' && issueCount > 0,
              'is-mirrored': previewMode === 'fixed' || issueCount === 0,
            }"
          >
            {{
              previewMode === 'fixed' || issueCount === 0
                ? '✓ Mirrored Logically'
                : `${issueCount} Unmirrored Rules`
            }}
          </span>
        </div>

        <div class="stage-well">
          <div class="iframe-viewport" :style="{ maxInlineSize: activeMaxInlineSize }">
            <iframe
              title="RTL Live Preview"
              sandbox=""
              :srcdoc="rtlSrcdoc"
              class="sandbox-iframe"
              data-testid="iframe-rtl"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.preview-workspace {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  block-size: 100%;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: hidden;
}

.preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-block: 8px;
  padding-inline: 12px;
  background: var(--bg-elevated);
  border-block-end: 1px solid var(--border-subtle);
}

.compare-switch-wrap,
.viewport-and-overlay {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.segmented-control {
  display: inline-flex;
  padding-block: 2px;
  padding-inline: 2px;
  border-radius: 7px;
  background: #090d16;
  border: 1px solid var(--border-strong);
}

.seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding-block: 4px;
  padding-inline: 9px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
  }

  &.is-active {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  &.is-logical.is-active {
    background: rgba(16, 185, 129, 0.22);
    color: #6ee7b7;
  }

  .mini-warn {
    padding-block: 0;
    padding-inline: 5px;
    border-radius: 999px;
    background: rgba(245, 158, 11, 0.22);
    color: #fbbf24;
    font-family: var(--font-mono);
    font-size: 10px;
  }
}

.overlay-toggle-btn {
  padding-block: 5px;
  padding-inline: 10px;
  border-radius: 7px;
  border: 1px solid var(--border-strong);
  background: #090d16;
  color: var(--text-secondary);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
  }

  &.is-on {
    background: rgba(244, 63, 94, 0.16);
    border-color: rgba(244, 63, 94, 0.5);
    color: #fda4af;
  }
}

.frames-grid {
  flex: 1;
  min-block-size: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: var(--border-subtle);
}

.frame-column {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  background: #0b111e;
}

.frame-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-block: 7px;
  padding-inline: 12px;
  background: rgba(15, 22, 36, 0.9);
  border-block-end: 1px solid var(--border-subtle);
}

.dir-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;

  strong {
    padding-block: 1px;
    padding-inline: 6px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 11px;
  }

  span {
    color: var(--text-secondary);
  }

  &.is-ltr strong {
    background: rgba(56, 189, 248, 0.18);
    color: #7dd3fc;
  }

  &.is-rtl strong {
    background: rgba(168, 85, 247, 0.2);
    color: #d8b4fe;
  }
}

.viewport-readout {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.rtl-status-tag {
  padding-block: 2px;
  padding-inline: 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;

  &.is-broken {
    background: var(--status-warn-bg);
    color: #fbbf24;
  }

  &.is-mirrored {
    background: var(--status-ok-bg);
    color: #34d399;
  }
}

.stage-well {
  flex: 1;
  min-block-size: 260px;
  padding-block: 12px;
  padding-inline: 12px;
  overflow: auto;
  display: flex;
  justify-content: center;
  background: radial-gradient(circle at center, #131d31 0%, #090d16 100%);
}

.iframe-viewport {
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 236px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-strong);
  background: #f8fafc;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
  transition: max-inline-size 0.2s ease;
}

.sandbox-iframe {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 236px;
  border: none;
}

@media (max-width: 1100px) {
  .frames-grid {
    grid-template-columns: 1fr;
  }
}
</style>
