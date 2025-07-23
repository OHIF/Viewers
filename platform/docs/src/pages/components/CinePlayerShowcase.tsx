import React, { useState } from 'react';
import CinePlayer from '../../../../ui-next/src/components/CinePlayer/CinePlayer';
import ShowcaseRow from './ShowcaseRow';

/**
 * CinePlayerShowcase displays a playable/pausable cine player with FPS control.
 */
export default function CinePlayerShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(24);

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
