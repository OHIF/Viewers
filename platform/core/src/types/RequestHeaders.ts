/**
 * Interface to clearly present the expected fields to linters when building a request header.
 */
export interface HeadersInterface {
  /**
   * Request Accept options. For example,
   * `['multipart/related; type=application/octet-stream; transfer-syntax=1.2.840.10008.1.2.1.99',]`.
   *
   * Defines to the server the formats it can use to deliver data to us.
   */
  Accept?: string[];
  /**
   * Request Authorization field. It can be overridden with the `requestOptions.auth` config item.
   * Contains the authorization credentials or tokens necessary to authorize the request with the
   * server.
   */
  Authorization?: string;
}

/**
 * Interface to clearly present the expected fields to linters when passing the configuration's
 * requestOptions struct.
 */
export interface RequestOptions {
  requestOptions?: {
    /**
     * Authentication options to include. Can be a function.
     */
    auth?: Function | string;
    /**
     * Authentication token. Satisfies the test requirement?
     */
    token?: string;
  }
}
