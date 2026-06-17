import React, { useState, useRef, useCallback, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// ---------------------------------------------------------------------------
// Types (from viewers-design types/scrollbar.ts)
// ---------------------------------------------------------------------------

type Speed = 'slow' | 'normal' | 'fast';
const SPEED_INTERVALS: Record<Speed, number> = { slow: 120, normal: 50, fast: 4 };
type LoadPattern = 'sequential' | 'bottom-to-top' | 'out-of-order' | 'from-indicator';
type SimState = 'idle' | 'loading' | 'complete';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fisherYatesShuffle(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildFromIndicatorQueue(startIndex: number, total: number): number[] {
  const queue: number[] = [startIndex];
  let lo = startIndex - 1;
  let hi = startIndex + 1;
  while (lo >= 0 || hi < total) {
    if (hi < total) queue.push(hi++);
    if (lo >= 0) queue.push(lo--);
  }
  return queue;
}

function countBytes(bytes: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i]) n++;
  }
  return n;
}

// ---------------------------------------------------------------------------
// useLoadingSimulation (ported from viewers-design)
// ---------------------------------------------------------------------------

function useLoadingSimulation(
  speed: Speed,
  pattern: LoadPattern,
  currentIndex: number,
  totalSlices: number,
  useByteArray: any
) {
  const [simState, setSimState] = useState<SimState>('idle');
  const loaded = useByteArray(totalSlices);

  const queueRef = useRef<number[]>([]);
  const queueIndexRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const simStateRef = useRef<SimState>('idle');
  const currentIndexRef = useRef(currentIndex);
  const totalSlicesRef = useRef(totalSlices);
  const loadedRef = useRef(loaded);

  simStateRef.current = simState;
  currentIndexRef.current = currentIndex;
  totalSlicesRef.current = totalSlices;
  loadedRef.current = loaded;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (spd: Speed) => {
      clearTimer();
      intervalRef.current = window.setInterval(() => {
        if (queueIndexRef.current >= totalSlicesRef.current) return;
        const idx = queueRef.current[queueIndexRef.current];
        loadedRef.current.setByte(idx);
        queueIndexRef.current++;
        if (queueIndexRef.current >= totalSlicesRef.current) {
          clearTimer();
          setSimState('complete');
          simStateRef.current = 'complete';
        }
      }, SPEED_INTERVALS[spd]);
    },
    [clearTimer]
  );

  const play = useCallback(() => {
    if (simStateRef.current === 'complete') return;
    if (simStateRef.current === 'idle' && queueRef.current.length === 0) {
      const total = totalSlicesRef.current;
      if (pattern === 'sequential') {
        queueRef.current = Array.from({ length: total }, (_, i) => i);
      } else if (pattern === 'bottom-to-top') {
        queueRef.current = Array.from({ length: total }, (_, i) => total - 1 - i);
      } else if (pattern === 'from-indicator') {
        queueRef.current = buildFromIndicatorQueue(currentIndexRef.current, total);
      } else {
        queueRef.current = fisherYatesShuffle(total);
      }
      queueIndexRef.current = 0;
    }
    setSimState('loading');
    simStateRef.current = 'loading';
    startTimer(speed);
  }, [pattern, speed, startTimer]);

  const pause = useCallback(() => {
    if (simStateRef.current !== 'loading') return;
    clearTimer();
    setSimState('idle');
    simStateRef.current = 'idle';
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    loadedRef.current.resetWith(() => {});
    queueRef.current = [];
    queueIndexRef.current = 0;
    setSimState('idle');
    simStateRef.current = 'idle';
  }, [clearTimer]);

  useEffect(() => {
    if (simStateRef.current === 'loading' && intervalRef.current !== null) {
      startTimer(speed);
    }
  }, [speed, startTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const loadedCount = countBytes(loaded.bytes);
  const loadingPercent = Math.round((loadedCount / totalSlices) * 100);

  return { loaded, loadingPercent, simState, play, pause, reset };
}

// ---------------------------------------------------------------------------
// useViewedTracking (ported from viewers-design)
// ---------------------------------------------------------------------------

function useViewedTracking(
  currentIndex: number,
  loadedBytes: Uint8Array,
  totalSlices: number,
  useByteArray: any
) {
  const viewed = useByteArray(totalSlices);

  useEffect(() => {
    if (loadedBytes[currentIndex] && !viewed.bytes[currentIndex]) {
      viewed.setByte(currentIndex);
    }
  }, [currentIndex, loadedBytes, viewed]);

  const resetViewed = useCallback(() => {
    viewed.resetWith(() => {});
  }, [viewed]);

  return { viewed, resetViewed };
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
      <path d="M3 1.5v11l9-5.5L3 1.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
      <rect x="2.5" y="1.5" width="3" height="11" rx="0.5" />
      <rect x="8.5" y="1.5" width="3" height="11" rx="0.5" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 7a5 5 0 1 1 1.5 3.5" strokeLinecap="round" />
      <path d="M2 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// DemoViewport
// ---------------------------------------------------------------------------

const VIEWPORT_HEIGHT = 400;
const VIEWPORT_WIDTH = 400;
const VIEWPORT_PADDING = 8;

function DemoViewport({
  children,
  onWheel,
}: {
  children: React.ReactNode;
  onWheel: (deltaY: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      onWheel(e.deltaY);
    },
    [onWheel]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div
      ref={ref}
      className="relative flex-shrink-0"
      style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
    >
      <div className="absolute inset-0 border border-input" />
      <div
        className="absolute border border-highlight"
        style={{ inset: 1, borderRadius: 8 }}
      />
      <div
        className="absolute bg-background"
        style={{ inset: 2, borderRadius: 7 }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm select-none pointer-events-none">
        Scroll here
      </div>
      <div
        className="absolute"
        style={{
          right: VIEWPORT_PADDING,
          top: VIEWPORT_PADDING,
          bottom: VIEWPORT_PADDING,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ControlsPanel
// ---------------------------------------------------------------------------

const SELECT_CLASS =
  'w-full rounded border border-input bg-muted pl-2 pr-5 py-1 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none bg-no-repeat bg-[length:12px_12px] bg-[position:right_5px_center] bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2012%2012%27%20fill%3D%27none%27%20stroke%3D%27%237bacc2%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%3E%3Cpath%20d%3D%27M3%204.5%20L6%207.5%20L9%204.5%27/%3E%3C/svg%3E")]';

const LABEL_CLASS = 'text-xs text-muted-foreground whitespace-nowrap';

const STATE_DOT: Record<SimState, string> = {
  idle: 'bg-muted-foreground',
  loading: 'bg-primary animate-pulse',
  complete: 'bg-highlight',
};

const STATE_LABEL: Record<SimState, string> = {
  idle: 'Idle',
  loading: 'Loading',
  complete: 'Complete',
};

function ControlsPanel({
  simState,
  speed,
  pattern,
  loadingPercent,
  loadedCount,
  viewedCount,
  currentIndex,
  totalSlices,
  sliceOptions,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  onPatternChange,
  onSliceCountChange,
}: {
  simState: SimState;
  speed: Speed;
  pattern: LoadPattern;
  loadingPercent: number;
  loadedCount: number;
  viewedCount: number;
  currentIndex: number;
  totalSlices: number;
  sliceOptions: readonly number[];
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (s: Speed) => void;
  onPatternChange: (p: LoadPattern) => void;
  onSliceCountChange: (n: number) => void;
}) {
  const isLoading = simState === 'loading';
  const patternDisabled = simState !== 'idle';

  return (
    <div className="w-[200px] flex-shrink-0 rounded-lg bg-card p-3 self-start space-y-3">
      {/* Header + Transport */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground" style={{ margin: 0 }}>Controls</h3>
        <div className="flex gap-1">
          <button
            onClick={isLoading ? onPause : onPlay}
            disabled={simState === 'complete'}
            className={
              'flex items-center justify-center w-6 h-6 rounded transition-colors ' +
              (simState === 'complete'
                ? 'text-muted-foreground opacity-40 cursor-not-allowed'
                : 'text-primary hover:bg-primary/10')
            }
            title={isLoading ? 'Pause' : 'Play'}
          >
            {isLoading ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center w-6 h-6 rounded text-muted-foreground transition-colors hover:text-foreground"
            title="Reset"
          >
            <ResetIcon />
          </button>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
        <span className={LABEL_CLASS}>Speed</span>
        <select
          value={speed}
          onChange={e => onSpeedChange(e.target.value as Speed)}
          className={SELECT_CLASS}
        >
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>

        <span className={LABEL_CLASS + (patternDisabled ? ' opacity-50' : '')}>Pattern</span>
        <select
          value={pattern}
          onChange={e => onPatternChange(e.target.value as LoadPattern)}
          disabled={patternDisabled}
          className={SELECT_CLASS + (patternDisabled ? ' opacity-50 cursor-not-allowed' : '')}
        >
          <option value="from-indicator">From indicator</option>
          <option value="sequential">Top to bottom</option>
          <option value="bottom-to-top">Bottom to top</option>
          <option value="out-of-order">Out-of-order</option>
        </select>

        <span className={LABEL_CLASS + (patternDisabled ? ' opacity-50' : '')}>Slices</span>
        <select
          value={totalSlices}
          onChange={e => onSliceCountChange(Number(e.target.value))}
          disabled={patternDisabled}
          className={SELECT_CLASS + (patternDisabled ? ' opacity-50 cursor-not-allowed' : '')}
        >
          {sliceOptions.map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="rounded bg-muted/50 p-2 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          <div className={'w-1.5 h-1.5 rounded-full flex-shrink-0 ' + STATE_DOT[simState]} />
          <span className="text-foreground font-medium">{STATE_LABEL[simState]}</span>
          {simState === 'loading' && (
            <span className="ml-auto text-muted-foreground tabular-nums">{loadingPercent}%</span>
          )}
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>Loaded</span>
          <span className="text-foreground text-right tabular-nums">
            {loadedCount} / {totalSlices}
          </span>
          <span>Viewed</span>
          <span className="text-foreground text-right tabular-nums">{viewedCount}</span>
          <span>Current</span>
          <span className="text-foreground text-right tabular-nums">
            Slice {currentIndex + 1} / {totalSlices}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SmartScrollbarDemo — wires everything together
// ---------------------------------------------------------------------------

const SLICE_OPTIONS = [15, 100, 1500] as const;
const DEFAULT_SLICES = 100;

function SmartScrollbarDemo({
  SmartScrollbar,
  SmartScrollbarTrack,
  SmartScrollbarFill,
  SmartScrollbarIndicator,
  SmartScrollbarEndpoints,
  useByteArray,
}: {
  SmartScrollbar: any;
  SmartScrollbarTrack: any;
  SmartScrollbarFill: any;
  SmartScrollbarIndicator: any;
  SmartScrollbarEndpoints: any;
  useByteArray: any;
}) {
  const [totalSlices, setTotalSlices] = useState(DEFAULT_SLICES);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [pattern, setPattern] = useState<LoadPattern>('from-indicator');
  const [currentIndex, setCurrentIndex] = useState(Math.round((DEFAULT_SLICES - 1) * 0.2));

  const { loaded, loadingPercent, simState, play, pause, reset: resetLoading } =
    useLoadingSimulation(speed, pattern, currentIndex, totalSlices, useByteArray);

  const { viewed, resetViewed } = useViewedTracking(
    currentIndex,
    loaded.bytes,
    totalSlices,
    useByteArray
  );

  const isLoading = simState === 'loading';

  const handleWheel = useCallback(
    (deltaY: number) => {
      const direction = deltaY > 0 ? 1 : -1;
      setCurrentIndex(prev => Math.max(0, Math.min(totalSlices - 1, prev + direction)));
    },
    [totalSlices]
  );

  const handleReset = useCallback(() => {
    resetLoading();
    resetViewed();
  }, [resetLoading, resetViewed]);

  const handleSliceCountChange = useCallback(
    (count: number) => {
      setTotalSlices(count);
      resetLoading();
      resetViewed();
      setCurrentIndex(Math.round((count - 1) * 0.2));
    },
    [resetLoading, resetViewed]
  );

  const loadedCount = countBytes(loaded.bytes);
  const viewedCount = countBytes(viewed.bytes);

  return (
    <div className="flex gap-6 items-start flex-wrap">
      <DemoViewport onWheel={handleWheel}>
        <SmartScrollbar
          value={currentIndex}
          total={totalSlices}
          onValueChange={setCurrentIndex}
          isLoading={isLoading}
        >
          <SmartScrollbarTrack>
            <SmartScrollbarFill
              marked={loaded.bytes}
              version={loaded.version}
              className="bg-neutral/25"
              loadingClassName="bg-neutral/50"
            />
            <SmartScrollbarFill
              marked={viewed.bytes}
              version={viewed.version}
              className="bg-primary/35"
            />
          </SmartScrollbarTrack>
          <SmartScrollbarIndicator />
          <SmartScrollbarEndpoints marked={loaded.bytes} version={loaded.version} />
        </SmartScrollbar>
      </DemoViewport>

      <ControlsPanel
        simState={simState}
        speed={speed}
        pattern={pattern}
        loadingPercent={loadingPercent}
        loadedCount={loadedCount}
        viewedCount={viewedCount}
        currentIndex={currentIndex}
        totalSlices={totalSlices}
        sliceOptions={SLICE_OPTIONS}
        onPlay={play}
        onPause={pause}
        onReset={handleReset}
        onSpeedChange={setSpeed}
        onPatternChange={setPattern}
        onSliceCountChange={handleSliceCountChange}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Content
// ---------------------------------------------------------------------------

function SmartScrollbarPageContent() {
  const {
    SmartScrollbar,
    SmartScrollbarTrack,
    SmartScrollbarFill,
    SmartScrollbarIndicator,
    SmartScrollbarEndpoints,
    useByteArray,
  } = require('../../../../ui-next/src/components');

  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const scrollbarProps = [
    { name: 'value', type: 'number', default: '—', description: 'Current scroll index (0 to total - 1)' },
    { name: 'total', type: 'number', default: '—', description: 'Total number of items' },
    { name: 'onValueChange', type: '(index: number) => void', default: '—', description: 'Called when scroll position changes via click, drag, or keyboard' },
    { name: 'isLoading', type: 'boolean', default: 'false', description: 'Shows dot-grid loading pattern and expands track width' },
    { name: 'enableKeyboardNavigation', type: 'boolean', default: 'false', description: 'Enables Arrow, Page Up/Down, Home, End key navigation' },
    { name: 'indicator', type: '{ totalWidth, totalHeight, renderIndicator }', default: '—', description: 'Custom indicator configuration to replace the default pill SVG' },
  ];

  const fillProps = [
    { name: 'marked', type: 'Uint8Array', default: '—', description: 'Byte array where 1 = marked position, 0 = unmarked' },
    { name: 'version', type: 'number', default: '—', description: 'Change token — bump when the array mutates in-place' },
    { name: 'className', type: 'string', default: 'bg-neutral/25', description: 'Fill color class for normal state' },
    { name: 'loadingClassName', type: 'string', default: 'bg-neutral/50', description: 'Fill color class while parent isLoading is true' },
  ];

  const endpointsProps = [
    { name: 'marked', type: 'Uint8Array', default: '—', description: 'Byte array marking loaded positions' },
    { name: 'version', type: 'number', default: '—', description: 'Change token — bump when the array mutates in-place' },
  ];

  const byteArrayFields = [
    { name: 'bytes', type: 'Uint8Array', default: '—', description: 'Mutable array — safe for in-place writes' },
    { name: 'version', type: 'number', default: '—', description: 'Invalidation token for React memo dependencies' },
    { name: 'isFull', type: 'boolean', default: '—', description: 'True when all bytes are set to 1' },
    { name: 'setByte(index)', type: 'function', default: '—', description: 'Mark a position as loaded or viewed' },
    { name: 'clearByte(index)', type: 'function', default: '—', description: 'Unmark a position' },
    { name: 'resetWith(fn)', type: 'function', default: '—', description: 'Clear array and optionally bulk-populate via callback' },
  ];

  return (
    <ComponentLayout title="SmartScrollbar" description="Viewport scrollbar with loading progress">
      <PageHeader
        title="SmartScrollbar"
        description="Viewport scrollbar with loading progress and viewed-slice tracking."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            SmartScrollbar is a{' '}
            <strong className="text-foreground">compound component</strong> that composes
            Track, Fill, Indicator, and Endpoints into a scrollbar that shows{' '}
            <strong className="text-foreground">what's loaded</strong>,{' '}
            <strong className="text-foreground">what's been viewed</strong>, and{' '}
            <strong className="text-foreground">where you are</strong> in a series.
          </p>
          <p>
            In the OHIF Viewer, it sits on the{' '}
            <strong className="text-foreground">right edge of each viewport</strong> and
            is driven by Cornerstone image cache events. The{' '}
            <strong className="text-foreground">neutral fill</strong> grows as images load
            from the server; the <strong className="text-foreground">primary fill</strong>{' '}
            tracks which slices the user has scrolled through. A dot-grid pattern animates
            behind the track while loading is in progress.
          </p>
          <p>
            The track expands from <strong className="text-foreground">4px to 8px</strong>{' '}
            on hover, drag, or during loading, then contracts 600ms after loading completes.
          </p>
        </div>
      </div>

      <Section title="Interactive Demo">
        <div className="mb-3 text-lg text-secondary-foreground leading-relaxed">
          <p>
            Press <strong className="text-foreground">Play</strong> to simulate image loading.
            Scroll the viewport with the <strong className="text-foreground">mouse wheel</strong>{' '}
            or click and drag the scrollbar. Slices you scroll to while loaded are marked as{' '}
            <strong className="text-foreground">viewed</strong> (blue fill).
          </p>
        </div>
        <div className="rounded-lg border border-input/50 bg-muted/30 p-6">
          <SmartScrollbarDemo
            SmartScrollbar={SmartScrollbar}
            SmartScrollbarTrack={SmartScrollbarTrack}
            SmartScrollbarFill={SmartScrollbarFill}
            SmartScrollbarIndicator={SmartScrollbarIndicator}
            SmartScrollbarEndpoints={SmartScrollbarEndpoints}
            useByteArray={useByteArray}
          />
        </div>
      </Section>

      <Section title="Composition">
        <div className="mb-4 text-lg text-secondary-foreground leading-relaxed">
          <p>
            SmartScrollbar uses a compound component pattern. The root provides layout
            context; children render into specific layers of the scrollbar.
          </p>
        </div>
        <CodeBlock
          code={`<SmartScrollbar
  value={imageIndex}
  total={numberOfSlices}
  onValueChange={jumpToSlice}
  isLoading={!isFullyLoaded}
>
  <SmartScrollbarTrack>
    {/* Loaded images — neutral color, brighter while loading */}
    <SmartScrollbarFill
      marked={loaded.bytes}
      version={loaded.version}
      className="bg-neutral/25"
      loadingClassName="bg-neutral/50"
    />
    {/* Viewed images — primary color */}
    <SmartScrollbarFill
      marked={viewed.bytes}
      version={viewed.version}
      className="bg-primary/35"
    />
  </SmartScrollbarTrack>
  <SmartScrollbarIndicator />
  <SmartScrollbarEndpoints
    marked={loaded.bytes}
    version={loaded.version}
  />
</SmartScrollbar>`}
        />
      </Section>

      <Section title="Sub-components">
        <div className="space-y-4 text-lg text-secondary-foreground leading-relaxed">
          <div>
            <h3 className="text-foreground text-lg font-medium" style={{ margin: '0 0 4px 0' }}>
              SmartScrollbarTrack
            </h3>
            <p>
              Background container that shows an{' '}
              <strong className="text-foreground">animated dot-grid</strong> pattern (2px dots,
              4px gap) while <code className="text-highlight text-sm">isLoading</code> is true.
              The grid fades out over 500ms when loading completes.
            </p>
          </div>
          <div>
            <h3 className="text-foreground text-lg font-medium" style={{ margin: '0 0 4px 0' }}>
              SmartScrollbarFill
            </h3>
            <p>
              Renders colored bars for marked positions using a{' '}
              <strong className="text-foreground">Uint8Array</strong>. Multiple fills
              stack — typically one for loaded slices (neutral) and one for viewed slices
              (primary). Uses{' '}
              <strong className="text-foreground">conservative downsampling</strong>: a
              pixel fills only when all mapped items are marked.
            </p>
          </div>
          <div>
            <h3 className="text-foreground text-lg font-medium" style={{ margin: '0 0 4px 0' }}>
              SmartScrollbarIndicator
            </h3>
            <p>
              A pill-shaped SVG (12×7px) showing the current scroll position. Required
              child — the component throws if omitted. Positioning adapts automatically
              for dense (many items, few pixels) and sparse (few items, many pixels) content.
            </p>
          </div>
          <div>
            <h3 className="text-foreground text-lg font-medium" style={{ margin: '0 0 4px 0' }}>
              SmartScrollbarEndpoints
            </h3>
            <p>
              SVG caps (4×3px) marking the top and bottom boundaries of the loaded range.
              Rendered via{' '}
              <strong className="text-foreground">portal</strong> into a stable layer so
              they don't shift during width expand/contract animations.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import {
  SmartScrollbar,
  SmartScrollbarTrack,
  SmartScrollbarFill,
  SmartScrollbarIndicator,
  SmartScrollbarEndpoints,
  useByteArray,
} from '@ohif/ui-next';

// Create byte arrays for loaded and viewed tracking
const loaded = useByteArray(numberOfSlices);
const viewed = useByteArray(numberOfSlices);

// Mark slices as loaded (e.g. from image cache events)
loaded.setByte(sliceIndex);

// Mark slices as viewed (e.g. on scroll)
viewed.setByte(currentIndex);

<SmartScrollbar
  value={imageIndex}
  total={numberOfSlices}
  onValueChange={handleJumpToSlice}
  isLoading={!isFullyLoaded}
>
  <SmartScrollbarTrack>
    <SmartScrollbarFill
      marked={loaded.bytes}
      version={loaded.version}
      className="bg-neutral/25"
      loadingClassName="bg-neutral/50"
    />
    <SmartScrollbarFill
      marked={viewed.bytes}
      version={viewed.version}
      className="bg-primary/35"
    />
  </SmartScrollbarTrack>
  <SmartScrollbarIndicator />
  <SmartScrollbarEndpoints
    marked={loaded.bytes}
    version={loaded.version}
  />
</SmartScrollbar>`}
        />
      </Section>

      <Section title="Props">
        <div className="space-y-8">
          <div>
            <h3 className="text-foreground text-lg font-medium mb-3" style={{ margin: '0 0 12px 0' }}>
              SmartScrollbar
            </h3>
            <PropsTable props={scrollbarProps} />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-medium mb-3" style={{ margin: '0 0 12px 0' }}>
              SmartScrollbarFill
            </h3>
            <PropsTable props={fillProps} />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-medium mb-3" style={{ margin: '0 0 12px 0' }}>
              SmartScrollbarEndpoints
            </h3>
            <PropsTable props={endpointsProps} />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-medium mb-3" style={{ margin: '0 0 12px 0' }}>
              useByteArray(length) → ByteArrayHandle
            </h3>
            <PropsTable props={byteArrayFields} />
          </div>
        </div>
      </Section>
    </ComponentLayout>
  );
}

// ---------------------------------------------------------------------------
// Default export with BrowserOnly wrapper
// ---------------------------------------------------------------------------

export default function SmartScrollbarPage() {
  return <BrowserOnly fallback={<></>}>{() => <SmartScrollbarPageContent />}</BrowserOnly>;
}
