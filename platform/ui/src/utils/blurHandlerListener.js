export default element => {
  const handleClickOutside = event => {
    if (element.current && !element.current.contains(event.target)) {
      element.current.blur();
      document.removeEventListener('mousedown', handleClickOutside);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
};
