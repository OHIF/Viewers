import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Children,
  isValidElement,
} from 'react';
import { getIndicatorLayout } from './utils';
import { SmartScrollbarIndicator } from './SmartScrollbarIndicator';

// ── Child validation ────────────────────────────────────────────
function validateChildren(children: React.ReactNode): void {
  let hasIndicator = false;

  Children.forEach(children, child => {
    if (!isValidElement(child)) return;
    if (child.type === SmartScrollbarIndicator) hasIndicator = true;
  });

  if (!hasIndicator) {
    throw new Error(
      'SmartScrollbar: <SmartScrollbarIndicator> is a required child. ' +
        'Users will not see their current scroll position without it.'
    );
  }
}

// ── Layout and timing constants ─────────────────────────────────
const TRACK_WIDTH = 8;
const RESTING_WIDTH = 4;
const FILL_PADDING = 3;
const INDICATOR_SIZE = 8;
const INDICATOR_BORDER_WIDTH = 1;
const SETTLE_DELAY = 600;

// ── Contexts ───────────────────────────────────────────────────
export interface SmartScrollbarLayoutContextValue {
  total: number;
  trackHeight: number;
  isLoading: boolean;
  effectiveWidth: number;
  trackWidth: number;
  fillPadding: number;
  stableLayerEl: HTMLDivElement | null;
}

const SmartScrollbarLayoutContext = createContext<SmartScrollbarLayoutContextValue | null>(null);
const SmartScrollbarScrollContext = createContext<number | null>(null);

export function useSmartScrollbarLayoutContext(): SmartScrollbarLayoutContextValue {
  const ctx = useContext(SmartScrollbarLayoutContext);
  if (!ctx)
    throw new Error('SmartScrollbar compound components must be used inside <SmartScrollbar>');
  return ctx;
}

export function useSmartScrollbarScrollContext(): number {
  const value = useContext(SmartScrollbarScrollContext);
  if (value === null)
    throw new Error('SmartScrollbar compound components must be used inside <SmartScrollbar>');
  return value;
}

// ── Props ──────────────────────────────────────────────────────
interface SmartScrollbarProps {
  value: number;
  total: number;
  onValueChange: (index: number) => void;
  isLoading?: boolean;
  enableKeyboardNavigation?: boolean;
  'aria-label'?: string;
  className?: string;
  children: React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────
export function SmartScrollbar({
  value,
  total,
  onValueChange,
  isLoading = false,
  enableKeyboardNavigation = false,
  'aria-label': ariaLabel = 'Scroll position',
  className,
  children,
}: SmartScrollbarProps) {
  validateChildren(children);

  // ── ResizeObserver for trackHeight ───────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackHeight, setTrackHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setTrackHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Contraction state ────────────────────────────────────────
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const trackTopRef = useRef(0);

  // Settle delay — only contract after a real loading→done transition
  const [hasSettled, setHasSettled] = useState(false);
  const wasEverLoading = useRef(false);

  useEffect(() => {
    if (isLoading) {
      wasEverLoading.current = true;
      setHasSettled(false);
    } else if (wasEverLoading.current) {
      const timer = setTimeout(() => setHasSettled(true), SETTLE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const isExpanded = !hasSettled || isHovered || isDragging;
  const effectiveWidth = isExpanded ? TRACK_WIDTH : RESTING_WIDTH;

  // ── Hit zone extension ───────────────────────────────────────
  const { leftPos } = getIndicatorLayout(TRACK_WIDTH, INDICATOR_SIZE, INDICATOR_BORDER_WIDTH);
  const hitZoneLeftExtension = Math.max(0, -leftPos);

  // ── Stable layer (for elements that shouldn't move during contraction) ──
  // Uses useState + callback ref so React triggers a re-render when the
  // DOM node mounts — ensuring endpoints render on the first valid pass.
  const [stableLayerEl, setStableLayerEl] = useState<HTMLDivElement | null>(null);

  // ── Pointer helpers ──────────────────────────────────────────
  const clamp = useCallback(
    (val: number) => Math.max(0, Math.min(total - 1, val)),
    [total]
  );

  const indexFromPointerY = useCallback(
    (clientY: number) => {
      const ratio = Math.max(0, Math.min(1, (clientY - trackTopRef.current) / trackHeight));
      return Math.round(ratio * (total - 1));
    },
    [trackHeight, total]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      trackTopRef.current = e.currentTarget.getBoundingClientRect().top;

      isDraggingRef.current = true;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);

      onValueChange(clamp(indexFromPointerY(e.clientY)));
    },
    [clamp, indexFromPointerY, onValueChange]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      onValueChange(clamp(indexFromPointerY(e.clientY)));
    },
    [clamp, indexFromPointerY, onValueChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  // ── Keyboard interaction (WAI-ARIA slider spec) ────────────
  const PAGE_STEP = 10;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next: number | null = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          next = value - 1;
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          next = value + 1;
          break;
        case 'PageUp':
          next = value - PAGE_STEP;
          break;
        case 'PageDown':
          next = value + PAGE_STEP;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = total - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      onValueChange(clamp(next));
    },
    [value, total, clamp, onValueChange]
  );

  // ── Context values ───────────────────────────────────────────
  const layoutCtx = useMemo<SmartScrollbarLayoutContextValue>(() => ({
    total,
    trackHeight,
    isLoading,
    effectiveWidth,
    trackWidth: TRACK_WIDTH,
    fillPadding: FILL_PADDING,
    stableLayerEl,
  }), [total, trackHeight, isLoading, effectiveWidth, stableLayerEl]);
  return (
    <SmartScrollbarLayoutContext.Provider value={layoutCtx}>
      <SmartScrollbarScrollContext.Provider value={value}>
        <div
          ref={containerRef}
          role="slider"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={total - 1}
          aria-orientation="vertical"
          aria-label={ariaLabel}
          tabIndex={0}
          className={className}
          style={{
            width: TRACK_WIDTH + hitZoneLeftExtension,
            height: '100%',
            position: 'relative',
            marginLeft: -hitZoneLeftExtension,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={enableKeyboardNavigation ? handleKeyDown : undefined}
        >
          {trackHeight > 0 && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: TRACK_WIDTH,
                height: trackHeight,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                className="relative"
                style={{
                  width: effectiveWidth,
                  height: trackHeight,
                  transition: 'width 300ms ease',
                }}
              >
                {children}
              </div>
              {/* Stable layer — always TRACK_WIDTH, never contracts. For elements like
                endpoints that must not jitter during width transitions. Children
                render here via createPortal using stableLayerRef from context. */}
              <div
                ref={setStableLayerEl}
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              />
            </div>
          )}
        </div>
      </SmartScrollbarScrollContext.Provider>
    </SmartScrollbarLayoutContext.Provider>
  );
}
