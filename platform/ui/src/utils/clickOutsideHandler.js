export default (element, callback = () => {}) => {
  const handleClickOutside = event => {
    if (element.current && !element.current.contains(event.target)) {
      element.current.blur();
      callback();
      document.removeEventListener('mousedown', handleClickOutside);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
};
