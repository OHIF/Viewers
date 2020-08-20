export default (element, onClickOutside) => {
  const clickOutsideHandler = event => {
    if (element.current && !element.current.contains(event.target)) {
      onClickOutside();
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousedown', clickOutsideHandler);
      }
    }
  };

  const add = () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousedown', clickOutsideHandler);
    }
  };
  const remove = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousedown', clickOutsideHandler);
    }
  };

  return {
    add,
    remove,
  };
};
