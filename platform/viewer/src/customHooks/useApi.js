import React, { useCallback, useReducer } from 'react';
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

const useApi = (method = 'GET', data = {}, options = {}) => {
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    errorMessage: '',
    data: {},
  });

  const fetchData = async (method = 'GET', url, data = {}, options = {}) => {
    dispatch({ type: ACTIONS.LOADING });

    try {
      const result = await API[method]({
        url,
        data,
        options,
      });

      dispatch({ type: ACTIONS.SUCCESS, payload: result });
    } catch (error) {
      dispatch({ type: ACTIONS.ERROR, payload: error });
    }
  };

  const api = useCallback(
    {
      GET: url => {
        fetchData('GET', url);
      },
      POST: (url, data = {}, options = {}) => {
        fetchData('POST', url, data, options);
      },
      PUT: (url, data = {}, options = {}) => {
        fetchData('PUT', url, data, options);
      },
      DELETE: (url, data = {}, options = {}) => {
        fetchData('DELETE', url, data, options);
      },
    },
    []
  );

  return { state, api };
};

export const withApi = Component => {
  return function WrappedComponent(props) {
    const useApiHook = useApi();
    return <Component {...props} useApiHook={useApiHook} />;
  };
};

export default useApi;
