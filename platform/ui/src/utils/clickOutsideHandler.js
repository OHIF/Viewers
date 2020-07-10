export default (element, onClickOutside) => {
  const clickOutsideHandler = event => {
    if (element.current && !element.current.contains(event.target)) {
      onClickOutside();
      document.removeEventListener('mousedown', clickOutsideHandler);
    }
  };

  document.addEventListener('mousedown', clickOutsideHandler);
};
