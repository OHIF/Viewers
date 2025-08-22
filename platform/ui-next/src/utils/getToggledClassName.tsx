const getToggledClassName = isToggled => {
  return isToggled ? '!text-primary' : '!text-common-bright hover:!bg-muted hover:text-highlight';
};

export { getToggledClassName };
