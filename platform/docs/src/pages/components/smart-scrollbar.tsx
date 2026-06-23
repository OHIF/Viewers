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
  Button,
}: {
  children: React.ReactNode;
  simState: SimState;
  onPlay: () => void;
  onWheel: (deltaY: number) => void;
  Button: any;
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
      <div className="absolute z-10" style={{ top: 12, left: 12 }}>
        <Button
          onClick={onPlay}
          disabled={simState === 'loading'}
          className="gap-[5px]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5v11l9-5.5L3 1.5z" />
          </svg>
          {simState === 'complete' ? 'Replay' : simState === 'loading' ? 'Loading…' : 'Play'}
        </Button>
      </div>

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
  Button,
}: {
  SmartScrollbar: any;
  SmartScrollbarTrack: any;
  SmartScrollbarFill: any;
  SmartScrollbarIndicator: any;
  SmartScrollbarEndpoints: any;
  useByteArray: any;
  Button: any;
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
    <DemoViewport simState={simState} onPlay={handlePlay} onWheel={handleWheel} Button={Button}>
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
    Button,
  } = require('../../../../ui-next/src/components');
  const {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
  } = require('../../../../ui-next/src/components/Table');

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
            Button={Button}
          />
        </div>
      </Section>

      <Section title="Customization">
        <div className="mb-4 text-lg text-secondary-foreground leading-relaxed">
          <p>
            Scrollbar behavior is configured via the{' '}
            <strong className="text-foreground">Customization Service</strong>.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-foreground font-medium">Key</TableHead>
              <TableHead className="text-foreground font-medium">Default</TableHead>
              <TableHead className="text-foreground font-medium">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ['variant', "'progress'", 'Progress scrollbar or legacy range input'],
              ['showLoadedFill', 'true', 'Show the neutral loaded/cached fill'],
              ['showViewedFill', 'true', 'Show the primary viewed-slice fill'],
              ['showLoadedEndpoints', 'true', 'Show endpoint caps at loaded range boundaries'],
              ['showLoadingPattern', 'true', 'Show dot-grid pattern while loading'],
              ['viewedDwellMs', '0', 'Delay before marking a slice as viewed (ms)'],
              ['loadedBatchIntervalMs', '200', 'Coalesce loaded-state updates for performance (ms)'],
              ['indicator', '{}', 'Custom indicator SVG (totalWidth, totalHeight, renderIndicator)'],
            ].map(([key, defaultVal, desc]) => (
              <TableRow key={key}>
                <TableCell className="font-mono text-base text-foreground">{key}</TableCell>
                <TableCell className="font-mono text-base">{defaultVal}</TableCell>
                <TableCell>{desc}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 text-lg text-secondary-foreground leading-relaxed">
          <p>
            All keys are prefixed with{' '}
            <code className="text-highlight text-sm">viewportScrollbar.</code> in the
            customization service. For full configuration examples, screenshots, and the
            advanced indicator API, see the{' '}
            <a
              href="/platform/services/customization-service/ViewportScrollbar"
              className="text-primary hover:underline"
            >
              Viewport Scrollbar Customization
            </a>{' '}
            reference.
          </p>
        </div>
      </Section>

      <Section title="Usage">
        <div className="mb-4 text-lg text-secondary-foreground leading-relaxed">
          <p>
            SmartScrollbar uses a compound component pattern — the root provides layout
            context and children render into specific layers of the scrollbar.
          </p>
        </div>
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
            <h3 className="text-highlight mb-3 text-base font-semibold">
              SmartScrollbar
            </h3>
            <PropsTable props={scrollbarProps} />
          </div>
          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">
              SmartScrollbarFill
            </h3>
            <PropsTable props={fillProps} />
          </div>
          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">
              SmartScrollbarEndpoints
            </h3>
            <PropsTable props={endpointsProps} />
          </div>
          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">
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
