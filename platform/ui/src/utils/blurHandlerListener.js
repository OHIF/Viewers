export default element => {
  const onBlurHandler = event => {
    if (element.current && !element.current.contains(event.target)) {
      element.current.blur();
      document.removeEventListener('mousedown', onBlurHandler);
    }
  };

  document.addEventListener('mousedown', onBlurHandler);
};
