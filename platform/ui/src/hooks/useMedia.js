import { useState, useEffect, useRef } from 'react';
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

/**
 * Auxiliary object to store MediaQuery state.
 * This object will be consumed by useDisplayMediaSize and it will be used as single source of truth for its state.
 *
 * Whenever its state changes, it triggers setters previous bind to it. So consumer state will updated promptly.
 *
 */
const MediaQuery = {
  state: {},
  setState(value) {
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
    this.state = { ...value, displaySize, mediaQueryMap };
    this.runSetters();
  },

  setDisplaySize(displaySize) {
    if (!displaySize) {
      return;
    }
    // immutable state
    this.state = { ...this.state, displaySize };
    this.runSetters();
  },
  getMediaTypeAlias(mediaQuery) {
    const { media } = mediaQuery;
    const { mediaQueriesStringList, mediaTypesAliases } = this.state;
    const index = mediaQueriesStringList.findIndex(
      toCompare => toCompare === media
    );

    return mediaTypesAliases[index];
  },
  onMediaQueryChange(mediaQuery) {
    const nextMediaType = this.getMediaTypeAlias(mediaQuery);
    this.setDisplaySize(nextMediaType);
  },
  runSetters() {
    for (let setter of this.setters) {
      setter(this.state);
    }
  },
  setters: [],
};

// Force to bind MediaQuery to onMediaQueryChange context.
MediaQuery.onMediaQueryChange = MediaQuery.onMediaQueryChange.bind(MediaQuery);

const removeMediaQueryListeners = (mediaQueryMap = []) => {
  mediaQueryMap.forEach(mql => {
    mql.removeListener(MediaQuery.onMediaQueryChange);
  });
};

const addMediaQueryListeners = (mediaQueryMap = []) => {
  mediaQueryMap.forEach(mql => {
    mql.removeListener(MediaQuery.onMediaQueryChange);
    mql.addListener(MediaQuery.onMediaQueryChange);
  });
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
 *    const displaySize = useDisplayMediaSize(
 *    ['(min-width: 1500px)', '(min-width: 1000px)', '(min-width: 600px)'],
 *    // Value to return for matched media query
 *    ['large', 'medium', 'small'],
 *      // Default value
 *    'medium');
 *
 *  const currentDisplaySize = useDisplayMediaSize();
 *
 */
const useDisplayMediaSize = (
  mediaQueriesStringList,
  mediaTypesAliases,
  defaultMediaType
) => {
  // MediaQuery.state is the source of truth. This hook will be dependent on it.
  const [state, setState] = useState(MediaQuery.state);
  let mount = useRef(false);

  // bind current hook set state to MediaQuery setState
  if (!MediaQuery.setters.includes(setState)) {
    MediaQuery.setters.push(nextState => {
      // last chance to avoid setState of unmount component
      if (mount.current) {
        setState(nextState);
      }
    });
  }

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
      MediaQuery.setState({
        mediaQueriesStringList,
        mediaTypesAliases,
        defaultMediaType,
      });
    }
  }, [mediaQueriesStringList, mediaTypesAliases]);

  // re-assign window resizing listeners
  useEffect(() => {
    const { mediaQueryMap } = state;
    addMediaQueryListeners(mediaQueryMap);
  }, [state.mediaQueryMap]);

  useEffect(() => {
    mount.current = true;

    return () => {
      const { mediaQueryMap } = state;
      removeMediaQueryListeners(mediaQueryMap);
      MediaQuery.setters = [];
      mount.current = false;
    };
  }, []);

  return state.displaySize;
};
/**
 * Hook to get a content based on current displayMedia size.
 *
 * It uses useDisplayMediaSize. Hook immutable on content changing.
 *
 * Current hook only offers content, it wont expose method to change its state.
 *
 * @param {Object} contentArrayMap - Mapping object for mediaTypesAliases to content (of any type).
 * @param {Any} defaultContent - Default content to be used in case current displayMedia size not present on contentArrayMap
 * @returns {Any} current content based on displayMedia size.
 *
 * @example <caption>Example to getContent based on displayMedia size</caption>
 *
 *    const currentComponent = useDisplayMediaContent({"small": ComponentA, "medium": ComponentB}, ComponentA);
 *    const currentObject = useDisplayMediaContent({"small": ObjectA, "medium": ObjectB}, ObjectB);
 */
const useDisplayMediaContent = (contentArrayMap, defaultContent) => {
  const displaySize = useDisplayMediaSize();

  const getContent = () => {
    const content =
      displaySize in contentArrayMap
        ? contentArrayMap[displaySize]
        : defaultContent;
    return content;
  };

  return getContent();
};

export { useDisplayMediaSize, useDisplayMediaContent };
