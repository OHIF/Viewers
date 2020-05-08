import { useCallback } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

const isEmpty = str => str === undefined || str === null || str === '';

export default function useQuery() {
  const location = useLocation();
  const history = useHistory();

  const _getQueryStringValues = values => {
    const qs = getQueryString();

    Object.keys(values).forEach(name => {
      const value = values[name];

      if (name === 'studyDate') return null;

      if (!isEmpty(value)) {
        qs.set(name, value);
      } else {
        qs.delete(name);
      }
    });

    return qs;
  };

  const getQueryString = () => {
    return new URLSearchParams(location.search);
  };

  const setQueryString = values => {
    const queryParams = _getQueryStringValues(values);
    _updateUrl(queryParams.toString());
  };

  const _updateUrl = queryValues => {
    const url = `${location.pathname}?${queryValues}`;
    console.log('url', url);
    /**
     * TODO: when history.push is called, there's an infinite loop happening.
     * Figure out why it's happening to fix. Maybe some callback? useCallback?
     */
    // history.push(url);
  };

  return { getQueryString, setQueryString };
}
