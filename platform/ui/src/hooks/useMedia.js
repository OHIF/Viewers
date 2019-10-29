import { useState, useEffect } from 'react';

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
  // Array containing a media query list for each query
  const mediaQueryLists = queries.map(q => window.matchMedia(q));

  // Function that gets value based on matching media query
  const getValue = () => {
    // Get index of first media query that matches
    const index = mediaQueryLists.findIndex(mql => mql.matches);

    // Return related value or defaultValue if none
    return typeof values[index] !== 'undefined' ? values[index] : defaultValue;
  };

  // State and setter for matched value
  const [value, setValue] = useState(getValue);

  useEffect(
    () => {
      // Event listener callback
      // Note: By defining getValue outside of useEffect we ensure that it has ...
      // ... current values of hook args (as this hook callback is created once on mount).
      const handler = () => setValue(getValue);

      // Set a listener for each media query with above handler as callback.
      mediaQueryLists.forEach(mql => mql.addListener(handler));

      // Remove listeners on cleanup
      return () => mediaQueryLists.forEach(mql => mql.removeListener(handler));
    },
    [] // Empty array ensures effect is only run on mount and unmount
  );

  return value;
}

export default useMedia;
