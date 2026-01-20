import React from 'react';
import classNames from 'classnames';

interface SkeletonLoaderProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  width = '100%',
  height = '1rem',
  count = 1,
}) => {
  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={classNames('animate-pulse rounded bg-gray-300', className)}
          style={{
            width,
            height,
            marginBottom: count > 1 && index !== count - 1 ? '0.5rem' : 0,
          }}
        />
      ))}
    </>
  );
};

export { SkeletonLoader };
