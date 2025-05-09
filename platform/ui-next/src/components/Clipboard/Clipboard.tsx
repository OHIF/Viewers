import React, { ReactNode } from 'react';
import { Button } from '../Button';
import { Icons } from '../Icons';

interface ClipboardProps {
  children: ReactNode;
}

const Clipboard: React.FC<ClipboardProps> = ({ children }) => {
  const [copyState, setCopyState] = React.useState<'idle' | 'success' | 'error'>('idle');
  const copyText = React.useMemo(() => {
    if (typeof children === 'string') {
      return children.trim();
    }
    return '';
  }, [children]);

  const handleCopy = React.useCallback(async () => {
    if (!copyText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyState('success');
    } catch {
      setCopyState('error');
    } finally {
      setTimeout(() => setCopyState('idle'), 1500); // Reset state after feedback
    }
  }, [copyText]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={e => {
        e.stopPropagation();
        handleCopy();
      }}
      className="text-white"
      title="Copy"
    >
      {copyState === 'idle' && <Icons.Copy className="h-6 w-6" />}
      {copyState === 'success' && <Icons.FeedbackComplete className="h-6 w-6 text-white" />}
      {copyState === 'error' && (
        <Icons.ByName
          name="Error"
          className="h-6 w-6 text-white"
        />
      )}
    </Button>
  );
};

export { Clipboard };
