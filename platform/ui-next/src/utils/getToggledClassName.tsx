const getToggledClassName = isToggled => {
  return isToggled
    ? '!text-white'
    : '!text-common-bright hover:!bg-primary-dark hover:text-white-light';
};

export { getToggledClassName };
