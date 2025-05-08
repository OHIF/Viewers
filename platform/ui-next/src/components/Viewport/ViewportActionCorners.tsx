import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from 'react';
import classNames from 'classnames';

export enum ViewportActionCornersLocations {
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}

const commonClasses = 'pointer-events-auto flex items-center';
const locationClasses = {
  [ViewportActionCornersLocations.topLeft]: classNames(
    commonClasses,
    'absolute top-[4px] left-[0px] pl-[4px]'
  ),
  [ViewportActionCornersLocations.topRight]: classNames(
    commonClasses,
    'absolute top-[4px] right-[16px] right-viewport-scrollbar'
  ),
  [ViewportActionCornersLocations.bottomLeft]: classNames(
    commonClasses,
    'absolute bottom-[4px] left-[0px] pl-[4px]'
  ),
  [ViewportActionCornersLocations.bottomRight]: classNames(
    commonClasses,
    'absolute bottom-[4px] right-[0px] right-viewport-scrollbar'
  ),
};

const ViewportActionCornersContext = createContext<{
  registerCorner: (location: ViewportActionCornersLocations, children: ReactNode) => void;
} | null>(null);

function Container({ children }: { children: ReactNode }) {
  const [corners, setCorners] = useState({
    [ViewportActionCornersLocations.topLeft]: null,
    [ViewportActionCornersLocations.topRight]: null,
    [ViewportActionCornersLocations.bottomLeft]: null,
    [ViewportActionCornersLocations.bottomRight]: null,
  });

  const registerCorner = useCallback(
    (location: ViewportActionCornersLocations, children: ReactNode) => {
      setCorners(prev => {
        // Only update if the children are different to avoid unnecessary renders
        if (prev[location] === children) {
          return prev;
        }
        return {
          ...prev,
          [location]: children,
        };
      });
    },
    []
  );

  return (
    <ViewportActionCornersContext.Provider value={{ registerCorner }}>
      {children}
      <div
        className="pointer-events-none absolute h-full w-full select-none"
        onDoubleClick={event => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {Object.entries(corners).map(([location, children]) => {
          if (!children) {
            return null;
          }
          return (
            <div
              key={location}
              className={locationClasses[location]}
            >
              {children}
            </div>
          );
        })}
      </div>
    </ViewportActionCornersContext.Provider>
  );
}

function Corner({
  location,
  children,
}: {
  location: ViewportActionCornersLocations;
  children: ReactNode;
}) {
  const context = useContext(ViewportActionCornersContext);

  if (!context) {
    throw new Error('Corner component must be used within a ViewportActionCorners.Container');
  }

  useEffect(() => {
    context.registerCorner(location, children);
  }, [context, location, children]);

  return null;
}

function TopLeft({ children }: { children: ReactNode }) {
  return <Corner location={ViewportActionCornersLocations.topLeft}>{children}</Corner>;
}

function TopRight({ children }: { children: ReactNode }) {
  return <Corner location={ViewportActionCornersLocations.topRight}>{children}</Corner>;
}

function BottomLeft({ children }: { children: ReactNode }) {
  return <Corner location={ViewportActionCornersLocations.bottomLeft}>{children}</Corner>;
}

function BottomRight({ children }: { children: ReactNode }) {
  return <Corner location={ViewportActionCornersLocations.bottomRight}>{children}</Corner>;
}

export const ViewportActionCorners = {
  Container,
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
};
