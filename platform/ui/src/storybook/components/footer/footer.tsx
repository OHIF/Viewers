import React from 'react';

export const Footer = ({ componentRelativePath }) => {
  return (
    <div>
      <p className="my-2 text-gray-800 font-inter">
        We always welcome feedback and suggestions. If you are interested to add
        additional usecases, please send us a pull request. Edit this page on{' '}
        <a
          className="text-blue-400"
          href={`https://github.com/OHIF/Viewers/edit/v3-stable/platform/ui/src/components/${componentRelativePath}`}
        >
          Github
        </a>
        .
      </p>
    </div>
  );
};
