export type NavigateHistory = {
  to: string; // the URL to navigate to
  options?: {
    replace?: boolean; // replace or add/push to history?
  };
};
