import React, { useEffect } from 'react';
import '../AITriggerComponent.css';
import { data } from './Data';
import Jobs from './Jobs';

const TextureFeature = () => {
  return (
    <div className="component">
      <div className="title-header">Texture Features</div>
      <div className="accordion">
        {data.map(({ title, content }) => (
          <Jobs title={title} content={content} /> ))}
      </div>
    </div>
  );
};

export default TextureFeature;
