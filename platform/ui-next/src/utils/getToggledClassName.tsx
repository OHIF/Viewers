const getToggledClassName = isToggled => {
  return isToggled ? '!text-primary' : '!text-foreground/80 hover:!bg-muted hover:text-highlight';
};

export { getToggledClassName };
