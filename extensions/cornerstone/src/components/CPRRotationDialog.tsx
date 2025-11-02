import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@ohif/ui';

interface CPRRotationDialogProps {
  hide: () => void;
  onRotate: (angle: number) => void;
  initialAngle?: number;
}

const CPRRotationDialog: React.FC<CPRRotationDialogProps> = ({
  hide,
  onRotate,
  initialAngle = 0,
}) => {
  const [angle, setAngle] = useState(initialAngle);
  const rafRef = useRef<number | null>(null);
  const pendingAngleRef = useRef<number | null>(null);

  useEffect(() => {
    setAngle(initialAngle);
  }, [initialAngle]);

  // Use requestAnimationFrame for smooth rotation
  const scheduleRotation = useCallback((newAngle: number) => {
    pendingAngleRef.current = newAngle;

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        if (pendingAngleRef.current !== null) {
          onRotate(pendingAngleRef.current);
          pendingAngleRef.current = null;
        }
        rafRef.current = null;
      });
    }
  }, [onRotate]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAngle = parseInt(e.target.value);
    setAngle(newAngle);
    scheduleRotation(newAngle);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newAngle = parseInt(value) || 0;
    // Clamp between 0-360
    const clampedAngle = ((newAngle % 360) + 360) % 360;
    setAngle(clampedAngle);
    onRotate(clampedAngle);
  };

  const handleReset = () => {
    setAngle(0);
    onRotate(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-black p-6 rounded-lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <label className="text-white text-base font-medium">
            Rotation Angle: <span className="text-primary-main">{angle}°</span>
          </label>

          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={angle}
            onChange={handleSliderChange}
            className="w-full h-2 bg-primary-dark rounded-lg cursor-pointer"
            style={{
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
          />

          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              max="360"
              value={angle}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 bg-primary-dark border border-primary-main rounded text-white focus:outline-none focus:border-secondary-light"
            />
            <span className="text-white text-sm">degrees</span>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-2">
          <Button
            onClick={handleReset}
            className="px-4 py-2"
          >
            Reset
          </Button>
          <Button
            onClick={hide}
            className="px-4 py-2"
          >
            Close
          </Button>
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #5ACCE6;
          cursor: pointer;
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #5ACCE6;
          cursor: pointer;
          border: none;
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default CPRRotationDialog;
