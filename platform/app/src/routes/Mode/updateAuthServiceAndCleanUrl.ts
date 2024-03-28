/**
 * Updates the user authentication service with the provided token and cleans the token from the URL.
 * @param token - The token to set in the user authentication service.
 * @param location - The location object from the router.
 * @param userAuthenticationService - The user authentication service instance.
 */
export function updateAuthServiceAndCleanUrl(
  token: string,
  location: any,
  userAuthenticationService: any
): void {
  if (!token) {
    return;
  }

  // if a token is passed in, set the userAuthenticationService to use it
  // for the Authorization header for all requests
  userAuthenticationService.setServiceImplementation({
    getAuthorizationHeader: () => ({
      Authorization: 'Bearer ' + token,
    }),
  });

  // Create a URL object with the current location
  const urlObj = new URL(window.location.origin + window.location.pathname + location.search);

  // Remove the token from the URL object
  urlObj.searchParams.delete('token');
  const cleanUrl = urlObj.toString();

  // Update the browser's history without the token
  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, '', cleanUrl);
  }
}
