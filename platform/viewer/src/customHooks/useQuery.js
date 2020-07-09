import { useLocation } from 'react-router-dom';

/**
 * hook that builds on useLocation to parse
 * the query string for you.
 *
 * @name useQuery
 */
export default function() {
  return new URLSearchParams(useLocation().search);
}
