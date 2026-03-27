import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  Children,
  isValidElement,
} from 'react';
import { getIndicatorLayout } from './utils';
import { SmartScrollbarIndicator } from './SmartScrollbarIndicator';

// ── Child validation ────────────────────────────────────────────
let _warnedNoIndicator = false;

function validateChildren(children: React.ReactNode): void {
  if (process.env.NODE_ENV === 'production') return;

  let hasIndicator = false;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === SmartScrollbarIndicator) hasIndicator = true;
  });

  if (!hasIndicator && !_warnedNoIndicator) {
    _warnedNoIndicator = true;
    console.warn(
      'SmartScrollbar: no <SmartScrollbarIndicator> found. ' +
      'The user will not see their current scroll position.'
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

// ── Context ────────────────────────────────────────────────────
export interface SmartScrollbarContextValue {
  value: number;
  totalSlices: number;
  trackHeight: number;
  isLoading: boolean;
  effectiveWidth: number;
  trackWidth: number;
  fillPadding: number;
  stableLayerEl: HTMLDivElement | null;
}

const SmartScrollbarContext = createContext<SmartScrollbarContextValue | null>(null);

export function useSmartScrollbarContext(): SmartScrollbarContextValue {
  const ctx = useContext(SmartScrollbarContext);
  if (!ctx) throw new Error('SmartScrollbar compound components must be used inside <SmartScrollbar>');
  return ctx;
}

// ── Props ──────────────────────────────────────────────────────
interface SmartScrollbarProps {
  value: number;
  totalSlices: number;
  onValueChange: (index: number) => void;
  isLoading?: boolean;
  'aria-label'?: string;
  className?: string;
  children: React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────
export function SmartScrollbar({
  value,
  totalSlices,
  onValueChange,
  isLoading = false,
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
    (val: number) => Math.max(0, Math.min(totalSlices - 1, val)),
    [totalSlices]
  );

  const indexFromPointerY = useCallback(
    (clientY: number) => {
      const ratio = Math.max(0, Math.min(1, (clientY - trackTopRef.current) / trackHeight));
      return Math.round(ratio * (totalSlices - 1));
    },
    [trackHeight, totalSlices]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const trackEl =
        (e.currentTarget as HTMLElement).querySelector('[data-scrollbar-track]') as HTMLElement
        ?? e.currentTarget as HTMLElement;
      trackTopRef.current = trackEl.getBoundingClientRect().top;

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

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      isDraggingRef.current = false;
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    []
  );

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
          next = totalSlices - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      onValueChange(clamp(next));
    },
    [value, totalSlices, clamp, onValueChange]
  );

  // ── Context value ────────────────────────────────────────────
  const ctx: SmartScrollbarContextValue = {
    value,
    totalSlices,
    trackHeight,
    isLoading,
    effectiveWidth,
    trackWidth: TRACK_WIDTH,
    fillPadding: FILL_PADDING,
    stableLayerEl,
  };

  return (
    <SmartScrollbarContext.Provider value={ctx}>
      <div
        ref={containerRef}
        role="slider"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={totalSlices - 1}
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
        onKeyDown={handleKeyDown}
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
              data-scrollbar-track
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
    </SmartScrollbarContext.Provider>
  );
}
