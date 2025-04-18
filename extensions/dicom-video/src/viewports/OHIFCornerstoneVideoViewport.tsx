import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function OHIFCornerstoneVideoViewport({ displaySets, servicesManager }) {
  if (displaySets && displaySets.length > 1) {
    throw new Error(
      'OHIFCornerstoneVideoViewport: only one display set is supported for dicom video right now'
    );
  }

  const { videoUrl, requiresAuthorization } = displaySets[0];
  const mimeType = 'video/mp4';
  const [url, setUrl] = useState(null);
  const { userAuthenticationService } = servicesManager?.services || {};

  useEffect(() => {
    const load = async () => {
      let resolvedUrl = await videoUrl;
      
      if (requiresAuthorization && userAuthenticationService) {
        const authHeaders = userAuthenticationService.getAuthorizationHeader();
        
        if (authHeaders && authHeaders.Authorization) {
          try {
            const response = await fetch(resolvedUrl, {
              headers: {
                Authorization: authHeaders.Authorization,
              },
            });
            
            const blob = await response.blob();
            resolvedUrl = URL.createObjectURL(blob);
          } catch (error) {
            console.error('Error fetching authenticated video:', error);
          }
        }
      }
      
      setUrl(resolvedUrl);
    };

    load();
  }, [videoUrl, requiresAuthorization, userAuthenticationService]);

  return (
    <div className="bg-primary-black h-full w-full">
      <video
        src={url}
        controls
        controlsList="nodownload"
        preload="auto"
        className="h-full w-full"
        crossOrigin="anonymous"
      >
        <source
          src={url}
          type={mimeType}
        />
        <source
          src={url}
          type={mimeType}
        />
        Video src/type not supported:{' '}
        <a href={url}>
          {url} of type {mimeType}
        </a>
      </video>
    </div>
  );
}

OHIFCornerstoneVideoViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object).isRequired,
  servicesManager: PropTypes.object.isRequired,
};

export default OHIFCornerstoneVideoViewport;
