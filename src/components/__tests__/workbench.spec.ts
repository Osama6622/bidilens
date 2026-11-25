import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import App from '@/App.vue';

describe('BidiLens Workbench Integration (App.vue)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders dual LTR/RTL sandboxed iframes, switches fixtures, previews Logical-Fixed CSS, and auto-fixes', async () => {
    const wrapper = mount(App);

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

    // Toggle Bounding Grid overlay
    await wrapper.get('[data-testid="grid-overlay-toggle"]').trigger('click');
    await nextTick();
    expect(rtlFrame.attributes('srcdoc')).toContain('outline: 1px dashed');

    // Auto-Fix All rewrites source and brings issues to 0
    await wrapper.get('[data-testid="auto-fix-all-btn"]').trigger('click');
    await nextTick();
    expect(wrapper.get('[data-testid="bidi-score-pill"]').text()).toContain(
      '100% Logical Ready · 0 issues',
    );

    // Load "Form with Icon Inputs" fixture
    await wrapper.get('[data-testid="fixture-icon-input-form"]').trigger('click');
    await nextTick();
    expect(wrapper.findAll('[data-testid="diagnostic-item"]').length).toBeGreaterThan(5);

    // Flip workbench's own UI direction between LTR and RTL
    expect(wrapper.get('[data-testid="workbench-root"]').attributes('dir')).toBe('ltr');
    await wrapper.get('[data-testid="workbench-dir-toggle"]').trigger('click');
    await nextTick();
    expect(wrapper.get('[data-testid="workbench-root"]').attributes('dir')).toBe('rtl');

    wrapper.unmount();
  });
});
