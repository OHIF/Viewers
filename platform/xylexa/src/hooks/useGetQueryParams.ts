/**
 * This hook is used to get the query params from the url
 * @param search - the url search params
 * @param keys - the keys to get from the url search params
 * @returns the values of the keys
 */
export const useGetQueryParams = (search: string, keys: string[]) => {
  const params = new URLSearchParams(search);
  return keys.map(key => params.get(key));
};

export default useGetQueryParams;
