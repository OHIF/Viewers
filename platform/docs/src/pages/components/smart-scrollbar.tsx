import React, { useState, useRef, useCallback, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// ---------------------------------------------------------------------------
// Loading simulation — hardcoded to from-indicator pattern, normal speed
// ---------------------------------------------------------------------------

const LOAD_INTERVAL_MS = 50;
const TOTAL_SLICES = 100;
const START_INDEX = Math.round((TOTAL_SLICES - 1) * 0.2);

type SimState = 'idle' | 'loading' | 'complete';

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

function useLoadingSimulation(currentIndex: number, useByteArray: any) {
  const [simState, setSimState] = useState<SimState>('idle');
  const loaded = useByteArray(TOTAL_SLICES);

  const queueRef = useRef<number[]>([]);
  const queueIndexRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const simStateRef = useRef<SimState>('idle');
  const currentIndexRef = useRef(currentIndex);
  const loadedRef = useRef(loaded);

  simStateRef.current = simState;
  currentIndexRef.current = currentIndex;
  loadedRef.current = loaded;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    queueRef.current = buildFromIndicatorQueue(currentIndexRef.current, TOTAL_SLICES);
    queueIndexRef.current = 0;
    loadedRef.current.resetWith(() => {});
    setSimState('loading');
    simStateRef.current = 'loading';

    clearTimer();
    intervalRef.current = window.setInterval(() => {
      if (queueIndexRef.current >= TOTAL_SLICES) return;
      loadedRef.current.setByte(queueRef.current[queueIndexRef.current]);
      queueIndexRef.current++;
      if (queueIndexRef.current >= TOTAL_SLICES) {
        clearTimer();
        setSimState('complete');
        simStateRef.current = 'complete';
      }
    }, LOAD_INTERVAL_MS);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return { loaded, simState, play };
}

function useViewedTracking(currentIndex: number, loadedBytes: Uint8Array, useByteArray: any) {
  const viewed = useByteArray(TOTAL_SLICES);

  useEffect(() => {
    if (loadedBytes[currentIndex] && !viewed.bytes[currentIndex]) {
      viewed.setByte(currentIndex);
    }
  }, [currentIndex, loadedBytes, viewed]);

  return viewed;
}

// ---------------------------------------------------------------------------
// Demo viewport with play/replay button
// ---------------------------------------------------------------------------

const VP_SIZE = 400;
const VP_PAD = 8;

function DemoViewport({
  children,
  simState,
  onPlay,
  onWheel,
}: {
  children: React.ReactNode;
  simState: SimState;
  onPlay: () => void;
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
    <div ref={ref} className="relative" style={{ width: VP_SIZE, height: VP_SIZE }}>
      <div className="absolute inset-0 border border-input" />
      <div className="absolute border border-highlight" style={{ inset: 1, borderRadius: 8 }} />
      <div className="absolute bg-background" style={{ inset: 2, borderRadius: 7 }} />

      {/* Center prompt */}
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm select-none pointer-events-none">
        Scroll here
      </div>

      {/* Play / Replay button — top-left corner */}
      {simState !== 'loading' && (
        <button
          onClick={onPlay}
          className="absolute z-10 flex items-center gap-1.5 rounded-md bg-card/90 px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-card"
          style={{ top: 12, left: 12 }}
        >
          {simState === 'complete' ? (
            <>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 7a5 5 0 1 1 1.5 3.5" strokeLinecap="round" />
                <path d="M2 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Replay
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 1.5v11l9-5.5L3 1.5z" />
              </svg>
              Play
            </>
          )}
        </button>
      )}

      {/* Scrollbar area */}
      <div className="absolute" style={{ right: VP_PAD, top: VP_PAD, bottom: VP_PAD }}>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SmartScrollbarDemo — minimal: viewport + play button, that's it
// ---------------------------------------------------------------------------

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
  const [currentIndex, setCurrentIndex] = useState(START_INDEX);
  const [resetKey, setResetKey] = useState(0);

  const { loaded, simState, play } = useLoadingSimulation(currentIndex, useByteArray);
  const viewed = useViewedTracking(currentIndex, loaded.bytes, useByteArray);

  const handleWheel = useCallback((deltaY: number) => {
    setCurrentIndex(prev => Math.max(0, Math.min(TOTAL_SLICES - 1, prev + (deltaY > 0 ? 1 : -1))));
  }, []);

  const handlePlay = useCallback(() => {
    setResetKey(k => k + 1);
    viewed.resetWith(() => {});
    play();
  }, [play, viewed]);

  return (
    <DemoViewport simState={simState} onPlay={handlePlay} onWheel={handleWheel}>
      <SmartScrollbar
        key={resetKey}
        value={currentIndex}
        total={TOTAL_SLICES}
        onValueChange={setCurrentIndex}
        isLoading={simState === 'loading'}
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
              A pill-shaped SVG (12x7px) showing the current scroll position. Required
              child — the component throws if omitted. Positioning adapts automatically
              for dense (many items, few pixels) and sparse (few items, many pixels) content.
            </p>
          </div>
          <div>
            <h3 className="text-foreground text-lg font-medium" style={{ margin: '0 0 4px 0' }}>
              SmartScrollbarEndpoints
            </h3>
            <p>
              SVG caps (4x3px) marking the top and bottom boundaries of the loaded range.
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
            <h3 className="text-foreground text-lg font-medium" style={{ margin: '0 0 12px 0' }}>
              SmartScrollbar
            </h3>
            <PropsTable props={scrollbarProps} />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-medium" style={{ margin: '0 0 12px 0' }}>
              SmartScrollbarFill
            </h3>
            <PropsTable props={fillProps} />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-medium" style={{ margin: '0 0 12px 0' }}>
              SmartScrollbarEndpoints
            </h3>
            <PropsTable props={endpointsProps} />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-medium" style={{ margin: '0 0 12px 0' }}>
              useByteArray(length) → ByteArrayHandle
            </h3>
            <PropsTable props={byteArrayFields} />
          </div>
        </div>
      </Section>
    </ComponentLayout>
  );
}

export default function SmartScrollbarSimplePage() {
  return <BrowserOnly fallback={<></>}>{() => <SmartScrollbarPageContent />}</BrowserOnly>;
}
