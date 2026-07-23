import { useLocation } from 'react-router';

/**
 * It returns a URLSearchParams of the query parameters in the URL, where the keys are
 * either lowercase or maintain their case based on the lowerCaseKeys parameter.
 * This will automatically include the hash parameters as preferred parameters
 * @param {lowerCaseKeys:boolean} true to return lower case keys; false (default) to maintain casing;
 * @returns {URLSearchParams}
 */
export default function useSearchParams(options = { lowerCaseKeys: false }) {
  const { lowerCaseKeys } = options;
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hashParams = new URLSearchParams(location.hash?.substring(1) || '');

  for (const [key, value] of hashParams) {
    searchParams.set(key, value);
  }
  if (!lowerCaseKeys) {
    return searchParams;
  }

  const lowerCaseSearchParams = new URLSearchParams();

  for (const [key, value] of searchParams) {
    lowerCaseSearchParams.set(key.toLowerCase(), value);
  }

  return lowerCaseSearchParams;
}
