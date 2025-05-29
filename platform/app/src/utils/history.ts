import { NavigateFunction } from 'react-router';

interface History {
  navigate: NavigateFunction;
}

let navigate;

export const history: History = {
  set navigate(nav: NavigateFunction) {
    navigate ??= nav;
  },
  get navigate() {
    return navigate;
  },
};
