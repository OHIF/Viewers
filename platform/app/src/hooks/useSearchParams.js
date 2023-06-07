import useQuery from './useQuery';

/**
 * It returns a Map of the query parameters in the URL, where the keys are
 * lowercase
 * @returns A function that returns a Map of the query parameters.
 */
export default function useSearchParams() {
  const query = useQuery();
  // make query params case-insensitive
  const searchParams = new Map();
  for (const [key, value] of query) {
    searchParams.set(key.toLowerCase(), value);
  }

  return searchParams;
}
