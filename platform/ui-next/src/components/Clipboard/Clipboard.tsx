import React, { ReactNode } from 'react';
import { Button } from '../Button';
import { Icons } from '../Icons';

interface ClipboardProps {
  children: ReactNode;
}

type CopyState = 'idle' | 'success' | 'error';

/**
 * Copies `children` to the clipboard when it is plain text, reporting the
 * outcome through `setCopyState` and resetting to idle after the feedback.
 *
 * Module scope on purpose: the React Compiler cannot yet lower a `try` with a
 * `finally` clause, and inlining this bails the whole component. Plain
 * functions are never compiled, so the limitation does not apply here.
 */
async function copyChildrenToClipboard(
  children: ReactNode,
  setCopyState: (state: CopyState) => void
): Promise<void> {
  const text = typeof children === 'string' ? children.trim() : '';
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setCopyState('success');
  } catch {
    setCopyState('error');
  } finally {
    setTimeout(() => setCopyState('idle'), 1500); // Reset state after feedback
  }
}

const Clipboard: React.FC<ClipboardProps> = ({ children }) => {
  const [copyState, setCopyState] = React.useState<CopyState>('idle');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={e => {
        e.stopPropagation();
        copyChildrenToClipboard(children, setCopyState);
      }}
      className="text-foreground"
      title="Copy"
    >
      {copyState === 'idle' && <Icons.Copy className="h-6 w-6" />}
      {copyState === 'success' && <Icons.FeedbackComplete className="h-6 w-6 text-foreground" />}
      {copyState === 'error' && <Icons.StatusError className="h-6 w-6 text-foreground" />}
    </Button>
  );
};

export { Clipboard };
