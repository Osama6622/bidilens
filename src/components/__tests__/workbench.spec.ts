import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import App from '@/App.vue';

describe('BidiLens Workbench Integration (App.vue)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders dual LTR/RTL sandboxed iframes, switches fixtures, previews Logical-Fixed CSS, and auto-fixes', async () => {
    const wrapper = mount(App, { attachTo: document.body });

    // Default fixture ("Broken Navbar") has 9 physical issues
    expect(wrapper.get('[data-testid="bidi-score-pill"]').text()).toContain('9 issues');

    const ltrFrame = wrapper.get('[data-testid="iframe-ltr"]');
    const rtlFrame = wrapper.get('[data-testid="iframe-rtl"]');
    expect(ltrFrame.attributes('sandbox')).toBe('');
    expect(rtlFrame.attributes('sandbox')).toBe('');
    expect(ltrFrame.attributes('srcdoc')).toContain('dir="ltr"');
    expect(rtlFrame.attributes('srcdoc')).toContain('dir="rtl"');
    expect(rtlFrame.attributes('srcdoc')).toContain('margin-left: auto;');

    // Switch preview stream to Logical-Fixed without mutating source
    await wrapper.get('[data-testid="preview-mode-fixed"]').trigger('click');
    await nextTick();
    expect(rtlFrame.attributes('srcdoc')).toContain('margin-inline-start: auto;');

    // Toggle Bounding Grid overlay & Viewport presets
    await wrapper.get('[data-testid="grid-overlay-toggle"]').trigger('click');
    await wrapper.get('[data-testid="viewport-mobile"]').trigger('click');
    await nextTick();
    expect(rtlFrame.attributes('srcdoc')).toContain('outline: 1px dashed');
    expect(wrapper.html()).toContain('375px');

    // Fix a single issue via diagnostic card button
    const firstFixBtn = wrapper.findAll('[data-testid="fix-single-btn"]')[0];
    await firstFixBtn.trigger('click');
    await nextTick();
    expect(wrapper.get('[data-testid="bidi-score-pill"]').text()).toContain('8 issues');

    // Toggle syntax mode to indented .sass and confirm clean compilation
    await wrapper.get('[data-testid="syntax-sass-btn"]').trigger('click');
    await nextTick();
    expect(wrapper.find('[data-testid="sass-error-banner"]').exists()).toBe(false);
    expect(wrapper.html()).toContain('styles.sass');

    // Trigger Cmd+Shift+F keyboard shortcut to Auto-Fix All remaining issues in .sass mode
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'F',
        metaKey: true,
        shiftKey: true,
        cancelable: true,
      }),
    );
    await nextTick();
    expect(wrapper.get('[data-testid="bidi-score-pill"]').text()).toContain(
      '100% Logical Ready · 0 issues',
    );

    // Load "Form with Icon Inputs" & "Clean Logical Component" fixtures
    await wrapper.get('[data-testid="fixture-icon-input-form"]').trigger('click');
    await nextTick();
    expect(wrapper.findAll('[data-testid="diagnostic-item"]').length).toBe(12);

    await wrapper.get('[data-testid="fixture-clean-logical"]').trigger('click');
    await nextTick();
    expect(wrapper.get('[data-testid="bidi-score-pill"]').text()).toContain(
      '100% Logical Ready · 0 issues',
    );

    // Flip workbench's own UI direction between LTR and RTL
    expect(wrapper.get('[data-testid="workbench-root"]').attributes('dir')).toBe('ltr');
    await wrapper.get('[data-testid="workbench-dir-toggle"]').trigger('click');
    await nextTick();
    expect(wrapper.get('[data-testid="workbench-root"]').attributes('dir')).toBe('rtl');

    wrapper.unmount();
  });
});
