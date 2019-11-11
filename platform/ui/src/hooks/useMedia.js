import { useState, useEffect, useMemo } from 'react';

const getValue = (mediaQueryLists, values, defaultValue) => {
  if ((!values && !defaultValue) || !mediaQueryLists) {
    return;
  }
  // Get index of first media query that matches
  const index = mediaQueryLists.findIndex(mql => mql.matches);

  // Return related value or defaultValue if none
  return index >= 0 && typeof values[index] !== 'undefined'
    ? values[index]
    : defaultValue;
};

const getMediaQueryMap = queries => {
  return queries && queries.map(q => window.matchMedia(q));
};
/**
 *
 * @example <caption></caption>
 * const currentViewportSize = useMedia(
 *  // Media queries
 *  ['(min-width: 1500px)', '(min-width: 1000px)', '(min-width: 600px)'],
 *  // Value to return for matched media query
 *  ['large', 'medium', 'small'],
 *  // Default value
 *  'medium'
 * );
 * @param {string[]} queries
 * @param {*} values
 * @param {*} defaultValue
 * @returns
 */
function useMedia(queries, values, defaultValue) {
  const memoizedQueryMap = useMemo(() => getMediaQueryMap(queries), [queries]);
  const memoizedValue = useMemo(
    () => getValue(memoizedQueryMap, values, defaultValue),
    [mediaQueryLists, values]
  );
  // State and setter for matched value
  const [mediaQueryLists, setMediaQueryLists] = useState(memoizedQueryMap);
  const [value, setValue] = useState(memoizedValue);

  const mediaQueryListener = () => {
    const nextValue = getValue(mediaQueryLists, values, defaultValue);
    setValue(nextValue);
  };

  const addMediaQueryListeners = mediaQueryLists => {
    // Set a listener for each media query with above mediaQueryListener as callback.
    mediaQueryLists.forEach(mql => mql.addListener(mediaQueryListener));
  };

  const removeMediaQueryListeners = (mediaQueryLists = []) => {
    mediaQueryLists.forEach(mql => mql.removeListener(mediaQueryListener));
  };

  useEffect(() => {
    addMediaQueryListeners(mediaQueryLists);
  }, [mediaQueryLists]);

  useEffect(() => {
    // Remove listeners on cleanup
    return () => removeMediaQueryListeners(mediaQueryLists);
  }, []);

  return value;
}

export default useMedia;
