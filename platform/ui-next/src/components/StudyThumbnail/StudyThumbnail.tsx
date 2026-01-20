import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icons } from '../Icons';

const StudyThumbnail = ({ imageSrc, modality, description, date, onClick, className }) => {
  return (
    <div
      className={classnames(
        'border-secondary-light hover:border-primary-light group relative flex h-24 w-24 cursor-pointer flex-col overflow-hidden rounded border bg-black',
        className
      )}
      onClick={onClick}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={description}
          className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
        />
      ) : (
        <div className="bg-secondary-dark text-secondary-light flex h-full w-full items-center justify-center">
          <Icons.MissingIcon className="h-8 w-8" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-1 py-0.5 text-[10px] text-white">
        <div className="flex justify-between">
          <span className="text-primary-light font-bold">{modality}</span>
          <span>{date}</span>
        </div>
      </div>
    </div>
  );
};

StudyThumbnail.propTypes = {
  imageSrc: PropTypes.string,
  modality: PropTypes.string,
  description: PropTypes.string,
  date: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export { StudyThumbnail };
