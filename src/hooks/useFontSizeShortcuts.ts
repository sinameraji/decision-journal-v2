import { useEffect } from 'react';
import { useIncreaseFontSize, useDecreaseFontSize, useSetFontSize, useUpdateFontSize } from '@/store';
import { toast } from 'sonner';

/**
 * Global keyboard shortcuts for font size adjustment
 * Cmd/Ctrl + Plus: Increase font size
 * Cmd/Ctrl + Minus: Decrease font size
 * Cmd/Ctrl + 0: Reset to default
 */
export function useFontSizeShortcuts() {
  const increaseFontSize = useIncreaseFontSize();
  const decreaseFontSize = useDecreaseFontSize();
  const setFontSize = useSetFontSize();
  const updateFontSize = useUpdateFontSize();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for Cmd/Ctrl + Plus (also handle = key which is + without shift)
      if ((e.metaKey || e.ctrlKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        increaseFontSize();
        toast.success('Font size increased');
      }

      // Check for Cmd/Ctrl + Minus
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        decreaseFontSize();
        toast.success('Font size decreased');
      }

      // Check for Cmd/Ctrl + 0 to reset
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        setFontSize('base');
        updateFontSize('base');
        toast.success('Font size reset to default');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [increaseFontSize, decreaseFontSize, setFontSize, updateFontSize]);
}
