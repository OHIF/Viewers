import React, { useState } from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import ShowcaseRow from './ShowcaseRow';

/**
 * CinePlayerShowcase displays a playable/pausable cine player with FPS control.
 */
export default function CinePlayerShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(24);
  const isBrowser = useIsBrowser();

  // If not browser, return null to avoid SSR parse errors
  if (!isBrowser) {
    return null;
  }

  const { default: CinePlayer } = require('../../../../ui-next/src/components/CinePlayer/CinePlayer');

  return (
    <ShowcaseRow
      title="Cine Player"
      description="Play, pause, scrub through dynamic image series and adjust FPS."
      code={`
<CinePlayer
  className="w-[300px]"
  isPlaying={isPlaying}
  frameRate={fps}
  onPlayPauseChange={setIsPlaying}
  onFrameRateChange={setFps}
  onClose={() => console.log('close clicked')}
/>
      `}
    >
      <CinePlayer
        className="w-[300px]"
        isPlaying={isPlaying}
        frameRate={fps}
        onPlayPauseChange={setIsPlaying}
        onFrameRateChange={setFps}
        onClose={() => console.log('close clicked')}
      />
    </ShowcaseRow>
  );
}