/**
 * Ensures each DICOMweb client has the correct URLs for all services.
 *
 * The dicomweb-client library sets qidoURL, wadoURL, and stowURL all to the
 * base `url` when no prefixes are provided. This function cross-assigns the
 * correct service URLs so requests are routed to the right endpoint when
 * qidoRoot and wadoRoot differ (e.g. /qidors/ vs /wadors/).
 */
export function applyServiceUrls(
  qidoClient: { wadoURL: string; stowURL: string },
  wadoClient: { qidoURL: string; stowURL: string },
  config: { qidoRoot?: string; wadoRoot?: string; stowRoot?: string }
): void {
  if (config.wadoRoot !== undefined) {
    const effectiveStowRoot = config.stowRoot ?? config.wadoRoot;
    qidoClient.wadoURL = config.wadoRoot;
    qidoClient.stowURL = effectiveStowRoot;
  }

  if (config.qidoRoot !== undefined) {
    const effectiveStowRoot = config.stowRoot ?? config.wadoRoot ?? config.qidoRoot;
    wadoClient.qidoURL = config.qidoRoot;
    wadoClient.stowURL = effectiveStowRoot;
  }
}
