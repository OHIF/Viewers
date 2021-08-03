import { useState, useEffect, useRef, useCallback } from 'react';
import isEqual from 'lodash.isequal';
/**
 * Get display size value for matched mediaQueryList
 * @param {MediaQueryList[]} mediaQueryMap - Array of mappings, containing MediaQueryLists
 * @param {Array} mediaTypesAliases - Array of strings representing each mediaQueryAlias.
 * @param {string} defaultDisplaySize - default display size value. Fallback value.
 */
const getDisplaySize = (
  mediaQueryMap,
  mediaTypesAliases,
  defaultDisplaySize
) => {
  if ((!mediaTypesAliases && !defaultDisplaySize) || !mediaQueryMap) {
    return;
  }

  // Get index of first media query that matches
  const index = mediaQueryMap.findIndex(mql => mql.matches);

  // Return related value or defaultDisplaySize if none
  return index >= 0 && typeof mediaTypesAliases[index] !== 'undefined'
    ? mediaTypesAliases[index]
    : defaultDisplaySize;
};
/**
 * Map each window MediaQueryLists
 * @param {Array} mediaQueriesStringList - array of string media queries to be parsed
 */
const getMediaQueryMap = mediaQueriesStringList => {
  return (
    mediaQueriesStringList &&
    mediaQueriesStringList.map(q => window.matchMedia(q))
  );
};

const getMediaTypeAlias = (mediaQuery, state) => {
  const { media } = mediaQuery;
  const { mediaQueriesStringList, mediaTypesAliases } = state;

  const index = mediaQueriesStringList.findIndex(originalMediaQuery => {
    const { media: toCompareMedia } = window.matchMedia(originalMediaQuery);
    return toCompareMedia === media;
  });

  return mediaTypesAliases[index];
};

/**
 * Hook to get current displaySize value.
 *
 * Its state changes and also displaySize value changes in case viewport is resized.
 * Its state changes in case mediaQueriesStringList or mediaTypesAliases changes.
 *
 * Current hook only offers displayMedia size, it wont expose method to change its state.
 * @param {Array} mediaQueriesStringList - array of string media queries to be parsed
 * @param {Array} mediaTypesAliases - array of aliases. Each value represents one mediaQueryList from array mediaQueriesStringList
 * @param {String} defaultMediaType - default mediaTypeAlias
 * @returns {String} current displayMedia size based on viewport size.
 *
 * @example <caption>Example to getDisplayMedia Size based on viewport size</caption>
 *
 *    const displaySize = useMedia(
 *    ['(min-width: 1500px)', '(min-width: 1000px)', '(min-width: 600px)'],
 *    // Value to return for matched media query
 *    ['large', 'medium', 'small'],
 *      // Default value
 *    'medium');
 *
 *  const currentDisplaySize = useMedia();
 *
 */
const useMedia = (
  mediaQueriesStringList,
  mediaTypesAliases,
  defaultMediaType
) => {
  // MediaQuery.state is the source of truth. This hook will be dependent on it.
  const [state, setState] = useState(() => {
    const _mediaQueryMap = getMediaQueryMap(mediaQueriesStringList);
    const _displaySize = getDisplaySize(
      _mediaQueryMap,
      mediaTypesAliases,
      defaultMediaType
    );

    return {
      mediaQueryMap: _mediaQueryMap,
      displaySize: _displaySize,
      mediaQueriesStringList,
      mediaTypesAliases,
      defaultMediaType,
    };
  });
  let mount = useRef(false);

  const updateDisplaySize = displaySize => {
    if (mount.current) {
      setState({ ...state, displaySize });
    }
  };

  const updateState = value => {
    const {
      mediaQueriesStringList,
      mediaTypesAliases,
      defaultMediaType,
    } = value;

    const mediaQueryMap = getMediaQueryMap(mediaQueriesStringList);
    const displaySize = getDisplaySize(
      mediaQueryMap,
      mediaTypesAliases,
      defaultMediaType
    );
    // immutable state
    // last chance to avoid setState of unmount component
    if (mount.current) {
      setState({
        ...state,
        mediaQueriesStringList,
        mediaTypesAliases,
        displaySize,
        mediaQueryMap,
      });
    }
  };

  const onMediaQueryChange = useCallback(mediaQuery => {
    if (mediaQuery.matches) {
      const nextDisplaySize = getMediaTypeAlias(mediaQuery, state);
      updateDisplaySize(nextDisplaySize);
    }
  }, []);

  // update state of MediaQuery in case mediaQueriesStringList or mediaTypesAliases has changed
  useEffect(() => {
    const {
      mediaQueriesStringList: _mediaQueriesStringList,
      mediaTypesAliases: _mediaTypesAliases,
    } = state;
    if (
      (mediaQueriesStringList &&
        !isEqual(mediaQueriesStringList, _mediaQueriesStringList)) ||
      (mediaTypesAliases && !isEqual(mediaTypesAliases, _mediaTypesAliases))
    ) {
      updateState({
        mediaQueriesStringList,
        mediaTypesAliases,
      });
    }
  }, [mediaQueriesStringList, mediaTypesAliases]);

  // re-assign window resizing listeners
  useEffect(() => {
    const { mediaQueryMap } = state;
    mediaQueryMap.forEach(mql => {
      mql.removeListener(onMediaQueryChange);
      mql.addListener(onMediaQueryChange);
    });
  }, [state.mediaQueryMap]);

  useEffect(() => {
    mount.current = true;

    return () => {
      mount.current = false;
      const { mediaQueryMap } = state;
      mediaQueryMap.forEach(mql => {
        mql.removeListener(onMediaQueryChange);
      });
    };
  }, []);

  return state.displaySize;
};

export { useMedia };
