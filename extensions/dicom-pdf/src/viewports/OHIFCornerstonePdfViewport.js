import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function OHIFCornerstonePdfViewport({
  displaySet,
}) {
  const [url, setUrl] = useState(null);
  const { pdfUrl } = displaySet;
  useEffect(async () => {
    setUrl(await pdfUrl);
  });

  return (
    <div className="bg-primary-black w-full h-full">
      <object data={url} type="application/pdf" className="w-full h-full">
        <div>No online PDF viewer installed</div>
      </object>
    </div>
  )
}

OHIFCornerstonePdfViewport.propTypes = {
  displaySet: PropTypes.object.isRequired,
};

export default OHIFCornerstonePdfViewport;
