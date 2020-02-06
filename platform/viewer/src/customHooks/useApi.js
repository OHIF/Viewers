import React, { useState, useReducer, useEffect } from 'react';
import { API } from '../api';

const ACTIONS = {
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.LOADING:
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case ACTIONS.SUCCESS:
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case ACTIONS.ERROR:
      return {
        ...state,
        isLoading: false,
        isError: true,
        errorMessage: action.payload,
      };
    default:
      throw new Error();
  }
};

const useApi = initialUrl => {
  const [url, setUrl] = useState(initialUrl);
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    errorMessage: '',
    data: {},
  });

  useEffect(() => {
    if (!url) {
      return;
    }

    const fetchData = async () => {
      dispatch({ type: ACTIONS.LOADING });

      try {
        const result = await API.get(url);
        dispatch({ type: ACTIONS.SUCCESS, payload: result.data });
      } catch (error) {
        dispatch({ type: ACTIONS.ERROR, payload: error });
      }
    };
    fetchData();
  }, [url]);

  return [state, setUrl];
};

export const withApi = Component => {
  return function WrappedComponent(props) {
    const useApiHook = useApi();
    return <Component {...props} useApiHook={useApiHook} />;
  };
};

export default useApi;
