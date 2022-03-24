import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function OHIFCornerstoneVideoViewport({
  displaySet,
}) {
  const { videoUrl } = displaySet;
  const mimeType = "video/mp4";
  const [url, setUrl] = useState(null);
  useEffect(async () => {
    setUrl(await videoUrl);
  });

  // Need to copies of the source to fix a firefox bug
  return (
    <div className="bg-primary-black w-full h-full">
      <video
        src={url}
        controls
        controlsList="nodownload"
        preload="auto"
        className="w-full h-full"
      >
        <source src={url} type={mimeType} />
        <source src={url} type={mimeType} />
        Video src/type not supported: <a href={url}>{url} of type {mimeType}</a>
      </video>
    </div>
  )
}

OHIFCornerstoneVideoViewport.propTypes = {
  displaySet: PropTypes.object.isRequired,
};

export default OHIFCornerstoneVideoViewport;
