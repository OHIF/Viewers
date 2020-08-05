export default (element, onClickOutside) => {
  const clickOutsideHandler = event => {
    if (element.current && !element.current.contains(event.target)) {
      onClickOutside();
      window.removeEventListener('mousedown', clickOutsideHandler);
    }
  };

  const add = () => window.addEventListener('mousedown', clickOutsideHandler);
  const remove = () =>
    window.removeEventListener('mousedown', clickOutsideHandler);

  return {
    add,
    remove,
  };
};
