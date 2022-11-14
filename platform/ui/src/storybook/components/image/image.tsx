import React from 'react';

// centers the image in the container in the page
export const WithImage = ({ children, image, alt, className }) => (
  <div className={className}>
    <img
      src={image}
      alt={alt}
      style={{
        display: 'block',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    />
    {children}
  </div>
);
