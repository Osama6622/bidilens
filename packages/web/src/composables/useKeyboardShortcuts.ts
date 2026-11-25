import { onBeforeUnmount, onMounted } from 'vue';

export interface KeyboardShortcutHandlers {
  onCompileAndAudit: () => void;
  onAutoFixAll: () => void;
}

/**
 * Pure keydown matcher exported for deterministic unit testing as well as lifecycle binding.
 */
export function handleWorkbenchKeydown(
  event: KeyboardEvent,
  handlers: KeyboardShortcutHandlers,
): boolean {
  const hasPrimaryModifier = event.metaKey || event.ctrlKey;
  if (!hasPrimaryModifier) return false;

  // Ctrl/Cmd + Enter => Compile & Audit
  if (!event.shiftKey && !event.altKey && event.key === 'Enter') {
    event.preventDefault();
    handlers.onCompileAndAudit();
    return true;
  }

  // Ctrl/Cmd + Shift + F => Auto-Fix All to Logical CSS
  if (event.shiftKey && !event.altKey && event.key.toLowerCase() === 'f') {
    event.preventDefault();
    handlers.onAutoFixAll();
    return true;
  }

  return false;
}

/**
 * Binds global workbench keyboard shortcuts (`Ctrl/Cmd + Enter` and `Ctrl/Cmd + Shift + F`).
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
  const listener = (event: KeyboardEvent) => {
    handleWorkbenchKeydown(event, handlers);
  };

  onMounted(() => {
    window.addEventListener('keydown', listener);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', listener);
  });
}
