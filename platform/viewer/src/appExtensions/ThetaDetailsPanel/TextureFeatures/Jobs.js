import React, { useEffect, useState } from 'react';
import { APIs } from './services';
import cornerstoneTools from 'cornerstone-tools';

const Jobs = ({ title, content }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    (async () => {
      // const data = await APIs.jobs.jobs();

      const data = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;
      console.log({ toolData: data });
    })();
  }, []);

  return (
    <div className="accordion-item">
      <div className="accordion-title" onClick={() => setIsActive(!isActive)}>
        <div>
          <b>{title}</b>
        </div>
        {/* Not the best way to go about this */}
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
        <div>{isActive ? '-' : '+'}</div>
      </div>
      {isActive && <div className="accordion-content">{content}</div>}
    </div>
  );
};

export default Jobs;
