import React, { useCallback } from 'react';
import { cn } from '../../lib/utils';

export interface ImageScrollbarProps {
  value: number;
  max: number;
  height: string;
  onChange: (value: number) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
}

export const ImageScrollbar: React.FC<ImageScrollbarProps> = ({
  value,
  max,
  height,
  onChange,
  onContextMenu = e => e.preventDefault(),
  className = '',
}) => {
  if (max === 0) {
    return null;
  }

  const style = {
    width: height, // This is intentional for the rotation
  };

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const intValue = parseInt(event.target.value, 10);
      onChange(intValue);
    },
    [onChange]
  );

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // We don't allow direct keyboard navigation (arrow keys)
    const keys = {
      DOWN: 40,
      UP: 38,
    };

    if (event.which === keys.DOWN || event.which === keys.UP) {
      event.preventDefault();
    }
  }, []);

  return (
    <div
      className={cn('absolute right-0 top-0 h-full p-[5px]', className)}
      onContextMenu={onContextMenu}
    >
      <div className="relative mb-[5px] h-[calc(100%)] w-[12px]">
        <input
          className="image-scrollbar mousetrap absolute left-[12px] top-0 h-[12px] origin-top-left rotate-90 appearance-none bg-transparent p-0"
          style={style}
          type="range"
          min="0"
          max={max}
          step="1"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="Image navigation scrollbar"
        />
      </div>
    </div>
  );
};
