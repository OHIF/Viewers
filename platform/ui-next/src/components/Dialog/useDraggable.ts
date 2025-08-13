import * as React from 'react';

interface Offset {
  x: number;
  y: number;
}

interface DragState {
  startX: number;
  startY: number;
  initialOffset: Offset;
}

interface UseDraggableProps {
  enabled?: boolean;
}

interface UseDraggableReturn {
  offset: React.RefObject<Offset>;
  internalRef: React.RefObject<HTMLDivElement>;
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  setRefs: (node: HTMLDivElement) => void;
  initialTransform: string | undefined;
}

export function useDraggable(
  props: UseDraggableProps,
  ref?: React.ForwardedRef<HTMLDivElement>
): UseDraggableReturn {
  const { enabled = false } = props;
  const offsetRef = React.useRef<Offset>({ x: 0, y: 0 });
  const internalRef = React.useRef<HTMLDivElement>(null);

  const dragState = React.useRef<DragState | null>(null);

  const handlePointerMove = React.useCallback((e: PointerEvent) => {
    if (!dragState.current) {
      return;
    }

    const deltaX = e.clientX - dragState.current.startX;
    const deltaY = e.clientY - dragState.current.startY;
    const newOffset = {
      x: dragState.current.initialOffset.x + deltaX,
      y: dragState.current.initialOffset.y + deltaY,
    };

    offsetRef.current = newOffset;
    if (internalRef.current) {
      internalRef.current.style.transform = `translate(-50%, -50%) translate(${newOffset.x}px, ${newOffset.y}px)`;
    }
  }, []);

  const handlePointerUp = React.useCallback(() => {
    if (internalRef.current) {
      internalRef.current.style.transition = '';
    }
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    dragState.current = null;
  }, [handlePointerMove]);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.drag-handle')) {
        return;
      }

      if (internalRef.current) {
        internalRef.current.style.transition = 'none';
      }
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialOffset: { ...offsetRef.current },
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp]
  );

  const setRefs = React.useCallback(
    (node: HTMLDivElement) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [ref]
  );

  const initialTransform = enabled
    ? `translate(-50%, -50%) translate(${offsetRef.current.x}px, ${offsetRef.current.y}px)`
    : undefined;

  return {
    offset: offsetRef,
    internalRef,
    handlePointerDown,
    setRefs,
    initialTransform,
  };
}
