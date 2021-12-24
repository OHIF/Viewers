import React from 'react';
import CinePlayer from './CinePlayer';

export default {
  component: CinePlayer,
  title: 'Components/CinePlayer',
  argTypes: { onPlayPauseChange: { action: 'onPlayPauseChange' } },
};

const Template = args => (
  <div className="w-56">
    <CinePlayer {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  minFrameRate: 1,
  maxFrameRate: 90,
  stepFrameRate: 1,
  frameRate: 24,
  isPlaying: false,
};
