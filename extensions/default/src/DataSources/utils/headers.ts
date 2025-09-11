import { HeadersInterface } from '@ohif/core/src/types/RequestHeaders';
import { utils } from '@ohif/core';

/**
 * Options from the configuration file that apply to those functions below that expect them.
 *
 * For example, see generateWadoHeader.
 */
export interface HeaderOptions {
  acceptHeader?: string[],
  requestTransferSyntaxUID?: string,
  omitQuotationForMultipartRequest?: boolean
}

/**
 * Generates the basic authentication header needed when making requests to the Dicom endpoint.
 * @param userAuthenticationService
 */
export function generateAuthorizationHeader(userAuthenticationService): HeadersInterface {
  const xhrRequestHeaders: HeadersInterface = {};
  const authHeaders = userAuthenticationService.getAuthorizationHeader();
  if (authHeaders && authHeaders.Authorization) {
    xhrRequestHeaders.Authorization = authHeaders.Authorization;
  }
  return xhrRequestHeaders;
}

/**
 * Generates a header for a WADO request. You can choose to skip the inclusion of Accept header options
 * present in the dicomweb config section of your configuration file. You can do so by toggling
 * the includeTransferSyntax parameter.
 *
 * @param userAuthenticationService
 * @param options
 * @param includeTransferSyntax
 */
export function generateWadoHeader(
  userAuthenticationService,
  options: HeaderOptions,
  includeTransferSyntax: boolean = false
): HeadersInterface {
  const authorizationHeader = generateAuthorizationHeader(userAuthenticationService);
  if (includeTransferSyntax) {
    //Generate accept header depending on config params
    const formattedAcceptHeader = utils.generateAcceptHeader(
      options.acceptHeader,
      options.requestTransferSyntaxUID,
      options.omitQuotationForMultipartRequest
    );
    return {
      ...authorizationHeader,
      Accept: formattedAcceptHeader,
    };
  } else {
    return {
      ...authorizationHeader
    };
  }
}