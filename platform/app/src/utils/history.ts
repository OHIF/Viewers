import { NavigateFunction } from 'react-router';

type History = {
  navigate: NavigateFunction;
};

export const history: History = {
  navigate: null,
};
