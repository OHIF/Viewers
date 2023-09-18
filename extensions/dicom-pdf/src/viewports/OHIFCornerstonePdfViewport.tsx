import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function OHIFCornerstonePdfViewport({ displaySets }) {
  const [url, setUrl] = useState(null);

  if (displaySets && displaySets.length > 1) {
    throw new Error(
      'OHIFCornerstonePdfViewport: only one display set is supported for dicom pdf right now'
    );
  }

  const { pdfUrl } = displaySets[0];

  useEffect(() => {
    const load = async () => {
      setUrl(await pdfUrl);
    };

    load();
  }, [pdfUrl]);

  return (
    <div className="bg-primary-black h-full w-full text-white">
      <object
        data={url}
        type="application/pdf"
        className="h-full w-full"
      >
        <div>No online PDF viewer installed</div>
      </object>
    </div>
  );
}

OHIFCornerstonePdfViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default OHIFCornerstonePdfViewport;
