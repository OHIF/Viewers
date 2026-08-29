import React, { ReactNode } from 'react';
import { Button } from '../Button';
import { Icons } from '../Icons';
import { copyTextToClipboard } from '../../utils/copyTextToClipboard';

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
    const wasCopied = await copyTextToClipboard(copyText);
    setCopyState(wasCopied ? 'success' : 'error');
    setTimeout(() => setCopyState('idle'), 1500); // Reset state after feedback
  }, [copyText]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={e => {
        e.stopPropagation();
        handleCopy();
      }}
      className="text-foreground"
      title="Copy"
    >
      {copyState === 'idle' && <Icons.Copy className="h-6 w-6" />}
      {copyState === 'success' && <Icons.FeedbackComplete className="text-foreground h-6 w-6" />}
      {copyState === 'error' && <Icons.StatusError className="text-foreground h-6 w-6" />}
    </Button>
  );
};

export { Clipboard };
