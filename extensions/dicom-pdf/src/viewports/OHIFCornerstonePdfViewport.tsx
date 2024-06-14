import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './OHIFCornerstonePdfViewport.css';

function OHIFCornerstonePdfViewport({ displaySets }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    document.body.addEventListener('drag', makePdfDropTarget);
    return function cleanup() {
      document.body.removeEventListener('drag', makePdfDropTarget);
    };
  }, []);

  const [style, setStyle] = useState('pdf-yes-click');

  const makePdfScrollable = () => {
    setStyle('pdf-yes-click');
  };

  const makePdfDropTarget = () => {
    setStyle('pdf-no-click');
  };

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
    <div
      className="bg-primary-black h-full w-full text-white"
      onClick={makePdfScrollable}
    >
      <object
        data={url}
        type="application/pdf"
        className={style}
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
