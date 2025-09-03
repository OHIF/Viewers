import { HeadersInterface } from '@ohif/core/src/types/RequestHeaders';
import { utils } from '@ohif/core';

export interface HeaderOptions {
  acceptHeader?: string[],
  requestTransferSyntaxUID?: string,
  omitQuotationForMultipartRequest?: boolean
}

export function generateAuthorizationHeader(userAuthenticationService): HeadersInterface {
  const xhrRequestHeaders: HeadersInterface = {};
  const authHeaders = userAuthenticationService.getAuthorizationHeader();
  if (authHeaders && authHeaders.Authorization) {
    xhrRequestHeaders.Authorization = authHeaders.Authorization;
  }
  return xhrRequestHeaders;
}

export function generateWadoHeader(
  userAuthenticationService,
  options: HeaderOptions,
  includeTransferSyntax: boolean = false
): HeadersInterface {
  const authorizationHeader = generateAuthorizationHeader(userAuthenticationService);
  if (!includeTransferSyntax) {
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