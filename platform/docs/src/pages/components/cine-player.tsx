import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function CinePlayerPageContent() {
  // Load from the barrel — CinePlayer.tsx imports { Icons } from '@ohif/ui-next',
  // which re-exports CinePlayer, creating a circular dependency TDZ crash if the barrel
  // isn't already cached.
  const { CinePlayer } = require('../../../../ui-next/src/components');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const [isPlaying1, setIsPlaying1] = useState(false);
  const [fps1, setFps1] = useState(24);

  const [isPlaying2, setIsPlaying2] = useState(false);
  const [fps2, setFps2] = useState(10);

  const [isPlaying3, setIsPlaying3] = useState(false);
  const [fps3, setFps3] = useState(24);
  const [dynamicGroup, setDynamicGroup] = useState(3);

  const props = [
    { name: 'isPlaying', type: 'boolean', default: 'false', description: 'Whether cine playback is active. Controls the play/pause icon.' },
    { name: 'frameRate', type: 'number', default: '24', description: 'Current frames per second value' },
    { name: 'minFrameRate', type: 'number', default: '1', description: 'Minimum FPS allowed' },
    { name: 'maxFrameRate', type: 'number', default: '90', description: 'Maximum FPS allowed' },
    { name: 'stepFrameRate', type: 'number', default: '1', description: 'FPS increment step for the stepper and slider' },
    { name: 'onPlayPauseChange', type: '(playing: boolean) => void', default: '—', description: 'Called when play/pause is toggled' },
    { name: 'onFrameRateChange', type: '(fps: number) => void', default: '—', description: 'Called when FPS changes (debounced 100ms)' },
    { name: 'onClose', type: '() => void', default: '—', description: 'Called when the close button is clicked' },
    { name: 'className', type: 'string', default: '—', description: 'Additional CSS classes on the root container' },
    { name: 'dynamicInfo', type: '{ dimensionGroupNumber, numDimensionGroups, label? }', default: '—', description: 'Dynamic volume info for 4D series. Shows group counter and dimension slider.' },
    { name: 'updateDynamicInfo', type: '(info) => void', default: '—', description: 'Called when the dynamic dimension slider changes' },
  ];

  return (
    <ComponentLayout
      title="CinePlayer"
      description="Video playback controls"
    >
      <PageHeader
        title="CinePlayer"
        description="Floating playback controls for scrubbing through image series and adjusting frame rate."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            CinePlayer provides <strong className="text-foreground">play/pause</strong>,{' '}
            <strong className="text-foreground">FPS control</strong> (stepper + popover slider),
            and a <strong className="text-foreground">close button</strong> in a compact floating bar.
            It composes Button, Numeric, and Popover internally.
          </p>
          <p>
            In the OHIF Viewer, CinePlayer appears as a{' '}
            <strong className="text-foreground">floating overlay</strong> on viewports when cine
            mode is activated. For <strong className="text-foreground">4D dynamic volumes</strong>{' '}
            (e.g. cardiac time series), it additionally shows a dimension group counter and
            a scrub slider below the main controls.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Basic playback controls">
          <div className="relative h-[80px] w-[320px]">
            <CinePlayer
              className="w-[300px]"
              isPlaying={isPlaying1}
              frameRate={fps1}
              onPlayPauseChange={setIsPlaying1}
              onFrameRateChange={setFps1}
              onClose={() => setIsPlaying1(false)}
            />
          </div>
        </ExampleBlock>

        <ExampleBlock title="Custom FPS range (1–30, step 2)">
          <div className="relative h-[80px] w-[320px]">
            <CinePlayer
              className="w-[300px]"
              isPlaying={isPlaying2}
              frameRate={fps2}
              minFrameRate={1}
              maxFrameRate={30}
              stepFrameRate={2}
              onPlayPauseChange={setIsPlaying2}
              onFrameRateChange={setFps2}
              onClose={() => setIsPlaying2(false)}
            />
          </div>
        </ExampleBlock>

        <ExampleBlock title="With dynamic volume info (4D series)" last>
          <div className="relative h-[120px] w-[320px]">
            <CinePlayer
              className="w-[300px]"
              isPlaying={isPlaying3}
              frameRate={fps3}
              onPlayPauseChange={setIsPlaying3}
              onFrameRateChange={setFps3}
              onClose={() => setIsPlaying3(false)}
              dynamicInfo={{
                dimensionGroupNumber: dynamicGroup,
                numDimensionGroups: 12,
                label: 'timepoint',
              }}
              updateDynamicInfo={(info) => setDynamicGroup(info.dimensionGroupNumber)}
            />
          </div>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import CinePlayer from '@ohif/ui-next/CinePlayer';

const [isPlaying, setIsPlaying] = useState(false);
const [fps, setFps] = useState(24);

<CinePlayer
  className="w-[300px]"
  isPlaying={isPlaying}
  frameRate={fps}
  onPlayPauseChange={setIsPlaying}
  onFrameRateChange={setFps}
  onClose={() => setCineEnabled(false)}
/>

// With 4D dynamic volume
<CinePlayer
  className="w-[300px]"
  isPlaying={isPlaying}
  frameRate={fps}
  onPlayPauseChange={setIsPlaying}
  onFrameRateChange={setFps}
  onClose={handleClose}
  dynamicInfo={{
    dimensionGroupNumber: currentGroup,
    numDimensionGroups: totalGroups,
    label: 'timepoint',
  }}
  updateDynamicInfo={handleDynamicChange}
/>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function CinePlayerPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <CinePlayerPageContent />}</BrowserOnly>
  );
}
