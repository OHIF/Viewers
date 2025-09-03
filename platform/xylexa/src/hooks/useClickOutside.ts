import { useRef, useEffect } from 'react';

export type ActionOnClickOutside = () => void;
export const useClickOutside = (actionOnClickOutside: ActionOnClickOutside) => {
  const modalRef = useRef();

  const handleClickOutside = (event: Event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      actionOnClickOutside();
      document.removeEventListener('mousedown', handleClickOutside);
    }
  };

  useEffect(() => {
    // detecting mouse click
    document.addEventListener('mousedown', handleClickOutside);

    // eventlistner cleanup function
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return { modalRef };
};

export default useClickOutside;
