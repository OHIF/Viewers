import React, { useCallback } from 'react';
import { cn } from '../../lib/utils';
import styles from './ImageScrollbar.module.css';

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
      className={cn(styles.scrollbarContainer, className)}
      onContextMenu={onContextMenu}
    >
      <div className={styles.scrollbarInner}>
        <input
          className={cn(styles.scrollbarInput, 'mousetrap imageSlider')}
          style={style}
          type="range"
          min="0"
          max={max}
          step="1"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="Image navigation scrollbar"
          data-testid="image-scrollbar-input"
        />
      </div>
    </div>
  );
};
