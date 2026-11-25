<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Compartment, EditorState } from '@codemirror/state';
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { html } from '@codemirror/lang-html';
import { sass } from '@codemirror/lang-sass';
import { tags } from '@lezer/highlight';
import type { SassCompileResult, SyntaxMode } from '@/core/auditor';

const props = defineProps<{
  htmlCode: string;
  styleCode: string;
  syntaxMode: SyntaxMode;
  compileResult: SassCompileResult;
  highlightedLine: number | null;
}>();

const emit = defineEmits<{
  'update:htmlCode': [value: string];
  'update:styleCode': [value: string];
  changeSyntaxMode: [mode: SyntaxMode];
}>();

const htmlEditorHost = ref<HTMLElement | null>(null);
const styleEditorHost = ref<HTMLElement | null>(null);

let htmlView: EditorView | null = null;
let styleView: EditorView | null = null;
const sassLangCompartment = new Compartment();

const bidiHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#c084fc', fontWeight: '600' },
  { tag: [tags.tagName, tags.typeName], color: '#38bdf8' },
  { tag: [tags.className, tags.labelName], color: '#fcd34d' },
  { tag: [tags.propertyName, tags.attributeName], color: '#7dd3fc' },
  { tag: [tags.variableName], color: '#f472b6' },
  { tag: [tags.string, tags.attributeValue], color: '#86efac' },
  { tag: [tags.number, tags.unit, tags.color], color: '#fdba74' },
  { tag: tags.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: tags.punctuation, color: '#94a3b8' },
]);

const bidiEditorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      fontSize: '12.5px',
      backgroundColor: '#0b111e',
      color: '#e2e8f0',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono)',
      lineHeight: '1.55',
      overflow: 'auto',
    },
    '.cm-content': {
      paddingBlock: '10px',
      caretColor: '#38bdf8',
    },
    '.cm-gutters': {
      backgroundColor: '#090e19',
      color: '#475569',
      borderInlineEnd: '1px solid #1e293b',
      borderRight: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#131d31',
      color: '#94a3b8',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(56, 189, 248, 0.07)',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(56, 189, 248, 0.22) !important',
    },
  },
  { dark: true },
);

onMounted(() => {
  if (htmlEditorHost.value) {
    htmlView = new EditorView({
      state: EditorState.create({
        doc: props.htmlCode,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          history(),
          keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
          html(),
          syntaxHighlighting(bidiHighlightStyle),
          bidiEditorTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              emit('update:htmlCode', update.state.doc.toString());
            }
          }),
        ],
      }),
      parent: htmlEditorHost.value,
    });
  }

  if (styleEditorHost.value) {
    styleView = new EditorView({
      state: EditorState.create({
        doc: props.styleCode,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          history(),
          keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
          sassLangCompartment.of(sass({ indented: props.syntaxMode === 'sass' })),
          syntaxHighlighting(bidiHighlightStyle),
          bidiEditorTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              emit('update:styleCode', update.state.doc.toString());
            }
          }),
        ],
      }),
      parent: styleEditorHost.value,
    });
  }
});

watch(
  () => props.htmlCode,
  (nextHtml) => {
    if (!htmlView) return;
    const current = htmlView.state.doc.toString();
    if (nextHtml !== current) {
      htmlView.dispatch({
        changes: { from: 0, to: current.length, insert: nextHtml },
      });
    }
  },
);

watch(
  () => props.styleCode,
  (nextStyle) => {
    if (!styleView) return;
    const current = styleView.state.doc.toString();
    if (nextStyle !== current) {
      styleView.dispatch({
        changes: { from: 0, to: current.length, insert: nextStyle },
      });
    }
  },
);

watch(
  () => props.syntaxMode,
  (mode) => {
    if (!styleView) return;
    styleView.dispatch({
      effects: sassLangCompartment.reconfigure(sass({ indented: mode === 'sass' })),
    });
  },
);

watch(
  () => props.highlightedLine,
  (lineNumber) => {
    if (!styleView || !lineNumber) return;
    const clampedLine = Math.min(Math.max(1, lineNumber), styleView.state.doc.lines);
    const lineInfo = styleView.state.doc.line(clampedLine);
    styleView.dispatch({
      selection: { anchor: lineInfo.from, head: lineInfo.to },
      effects: EditorView.scrollIntoView(lineInfo.from, { y: 'center' }),
    });
    styleView.focus();
  },
);

onBeforeUnmount(() => {
  htmlView?.destroy();
  styleView?.destroy();
});
</script>

<template>
  <section class="editors-pane" aria-label="Code Workbench">
    <!-- HTML Editor -->
    <div class="editor-card html-card">
      <header class="editor-header">
        <div class="editor-tab-title">
          <span class="lang-dot is-html"></span>
          <span>Markup</span>
          <code class="file-chip">template.html</code>
        </div>
        <span class="editor-hint">Rendered in both LTR &amp; RTL sandboxes</span>
      </header>
      <div ref="htmlEditorHost" class="cm-mount" dir="ltr" data-testid="html-editor"></div>
    </div>

    <!-- SCSS / Sass Editor -->
    <div class="editor-card style-card">
      <header class="editor-header">
        <div class="editor-tab-title">
          <span class="lang-dot is-sass"></span>
          <span>Stylesheet</span>
          <code class="file-chip">styles.{{ syntaxMode }}</code>
        </div>

        <div class="editor-controls">
          <span class="compile-meta" :class="{ 'has-err': !compileResult.ok }">
            <template v-if="compileResult.ok">
              Dart Sass · {{ compileResult.durationMs }}ms
            </template>
            <template v-else>
              Error<template v-if="compileResult.error?.line">
                L{{ compileResult.error.line }}:{{ compileResult.error.column ?? 1 }}
              </template>
            </template>
          </span>

          <div class="syntax-toggle" role="group" aria-label="Sass Syntax Mode">
            <button
              type="button"
              class="syntax-btn"
              :class="{ 'is-active': syntaxMode === 'scss' }"
              data-testid="syntax-scss-btn"
              @click="emit('changeSyntaxMode', 'scss')"
            >
              .scss
            </button>
            <button
              type="button"
              class="syntax-btn"
              :class="{ 'is-active': syntaxMode === 'sass' }"
              data-testid="syntax-sass-btn"
              @click="emit('changeSyntaxMode', 'sass')"
            >
              .sass
            </button>
          </div>
        </div>
      </header>

      <div
        v-if="!compileResult.ok && compileResult.error"
        class="compiler-error-banner"
        role="alert"
        data-testid="sass-error-banner"
      >
        <div class="err-heading">
          <strong>Dart Sass Compiler Error</strong>
          <span v-if="compileResult.error.line" class="err-coords">
            Line {{ compileResult.error.line }}, Col {{ compileResult.error.column ?? 1 }}
          </span>
        </div>
        <p class="err-msg">{{ compileResult.error.message }}</p>
      </div>

      <div ref="styleEditorHost" class="cm-mount" dir="ltr" data-testid="style-editor"></div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.editors-pane {
  display: grid;
  grid-template-rows: minmax(170px, 38%) minmax(230px, 62%);
  gap: 10px;
  min-block-size: 0;
  block-size: 100%;
}

.editor-card {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-block: 7px;
  padding-inline: 12px;
  background: var(--bg-elevated);
  border-block-end: 1px solid var(--border-subtle);
}

.editor-tab-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.lang-dot {
  inline-size: 8px;
  block-size: 8px;
  border-radius: 999px;

  &.is-html {
    background: #fb923c;
  }

  &.is-sass {
    background: #f472b6;
  }
}

.file-chip {
  padding-block: 1px;
  padding-inline: 6px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.7);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 11px;
}

.editor-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.editor-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.compile-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #34d399;

  &.has-err {
    color: #fb7185;
    font-weight: 600;
  }
}

.syntax-toggle {
  display: inline-flex;
  padding-block: 2px;
  padding-inline: 2px;
  border-radius: 6px;
  background: #090d16;
  border: 1px solid var(--border-strong);
}

.syntax-btn {
  padding-block: 3px;
  padding-inline: 9px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;

  &.is-active {
    background: #38bdf8;
    color: #082f49;
  }
}

.compiler-error-banner {
  padding-block: 8px;
  padding-inline: 12px;
  background: rgba(159, 18, 57, 0.28);
  border-block-end: 1px solid rgba(244, 63, 94, 0.45);
  color: #fecdd3;
  text-align: start;

  .err-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11.5px;
  }

  .err-coords {
    font-family: var(--font-mono);
    color: #fda4af;
  }

  .err-msg {
    margin-block: 4px 0;
    margin-inline: 0;
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: #ffe4e6;
  }
}

.cm-mount {
  flex: 1;
  min-block-size: 0;
  overflow: hidden;
  text-align: start;
}
</style>
