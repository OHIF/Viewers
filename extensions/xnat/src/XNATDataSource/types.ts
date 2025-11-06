export type XNATDataSourceConfig = {
    /** Data source name */
    name: string;
    //  wadoUriRoot - Legacy? (potentially unused/replaced)
    /** Base URL to use for QIDO requests */
    qidoRoot?: string;
    wadoRoot?: string; // - Base URL to use for WADO requests
    wadoUri?: string; // - Base URL to use for WADO URI requests
    qidoSupportsIncludeField?: boolean; // - Whether QIDO supports the "Include" option to request additional fields in response
    imageRendering?: string; // - wadors | ? (unsure of where/how this is used)
    thumbnailRendering?: string;
    /**
     wadors - render using the wadors fetch.  The full image is retrieved and rendered in cornerstone to thumbnail size  png and returned as binary data to the src attribute of the  image tag.
             for example,  <img  src=data:image/png;base64,sdlfk;adkfadfk....asldfjkl;asdkf>
     thumbnailDirect -  get the direct url endpoint for the thumbnail as the image src (eg not authentication required).
             for example, <img src=http://server:port/wadors/studies/1.2.3/thumbnail?accept=image/jpeg>
     thumbnail - render using the thumbnail endpoint on wadors using bulkDataURI, passing authentication params  to the url.
      rendered - should use the rendered endpoint instead of the thumbnail endpoint
  */
    /** Whether the server supports reject calls (i.e. DCM4CHEE) */
    supportsReject?: boolean;
    /** Request series meta async instead of blocking */
    lazyLoadStudy?: boolean;
    /** indicates if the retrieves can fetch singlepart. Options are bulkdata, video, image, or  true */
    singlepart?: boolean | string;
    /** Transfer syntax to request from the server */
    requestTransferSyntaxUID?: string;
    acceptHeader?: string[]; // - Accept header to use for requests
    /** Whether to omit quotation marks for multipart requests */
    omitQuotationForMultipartRequest?: boolean;
    /** Whether the server supports fuzzy matching */
    supportsFuzzyMatching?: boolean;
    /** Whether the server supports wildcard matching */
    supportsWildcard?: boolean;
    /** Whether the server supports the native DICOM model */
    supportsNativeDICOMModel?: boolean;
    /** Whether to enable request tag */
    enableRequestTag?: boolean;
    /** Whether to enable study lazy loading */
    enableStudyLazyLoad?: boolean;
    /** Whether to enable bulkDataURI */
    bulkDataURI?: BulkDataURIConfig;
    /** Function that is called after the configuration is initialized */
    onConfiguration: (config: XNATDataSourceConfig, params) => XNATDataSourceConfig;
    /** Whether to use the static WADO client */
    staticWado?: boolean;
    /** User authentication service */
    userAuthenticationService: Record<string, unknown>;
    /** XNAT specific configuration */
    xnat?: {
        projectId?: string;
        subjectId?: string;
        sessionId?: string;
        experimentId?: string;
    };
};

export type BulkDataURIConfig = {
    /** Enable bulkdata uri configuration */
    enabled?: boolean;
    /**
     * Remove the startsWith string.
     * This is used to correct reverse proxied URLs by removing the startsWith path
     */
    startsWith?: string;
    /**
     * Adds this prefix path.  Only used if the startsWith is defined and has
     * been removed.  This allows replacing the base path.
     */
    prefixWith?: string;
    /** Transform the bulkdata path.  Used to replace a portion of the path */
    transform?: (uri: string) => string;
    /**
     * Adds relative resolution to the path handling.
     * series is the default, as the metadata retrieved is series level.
     */
    relativeResolution?: 'studies' | 'series';
};

export interface InstanceMetadataForStore {
    Modality?: string;
    modality?: string;
    SOPInstanceUID?: string;
    StudyInstanceUID?: string;
    SeriesInstanceUID?: string;
    SOPClassUID?: string;
    [key: string]: any; // For other DICOM tags
}
