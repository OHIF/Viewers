import { NavigateFunction } from 'react-router';

interface History {
  getNavigate(): NavigateFunction;
  setNavigate(navigate: NavigateFunction);
}

let navigate;

export const history: History = {
  getNavigate: () => navigate,
  setNavigate: (nav: NavigateFunction) => (navigate ??= nav),
};
