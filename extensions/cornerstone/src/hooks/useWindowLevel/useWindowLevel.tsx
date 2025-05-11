import { useContext } from 'react';
import WindowLevelContext from './WindowLevelContext';

export function useWindowLevel() {
  const context = useContext(WindowLevelContext);

  if (context === undefined) {
    throw new Error('useWindowLevel must be used within a WindowLevelProvider');
  }

  return context;
}

export default useWindowLevel;
