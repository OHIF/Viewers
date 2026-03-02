import { ahiSigner, AHICredentials, AHIConfig } from './AHISigner';

export interface AHIInitParams {
  region: string;
  datastoreId: string;
  credentials: AHICredentials;
  credentialRefreshCallback?: () => Promise<AHICredentials>;
  refreshBufferSeconds?: number;
}

export function initializeAHI(params: AHIInitParams): void {
  const config: AHIConfig = {
    region: params.region,
    datastoreId: params.datastoreId,
    credentials: params.credentials,
    credentialRefreshCallback: params.credentialRefreshCallback,
    refreshBufferSeconds: params.refreshBufferSeconds ?? 10,
  };

  ahiSigner.initialize(config);
}

export function createAHIDataSourceConfig(region: string, datastoreId: string) {
  const baseUrl = `https://medical-imaging.${region}.amazonaws.com/datastore/${datastoreId}/dicomweb`;

  return {
    namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
    sourceName: 'ahi',
    configuration: {
      friendlyName: 'AWS HealthImaging',
      name: 'ahi',
      qidoRoot: baseUrl,
      wadoRoot: baseUrl,
      wadoUriRoot: baseUrl,
      qidoSupportsIncludeField: false,
      imageRendering: 'wadors',
      thumbnailRendering: 'wadors',
      enableStudyLazyLoad: true,
      supportsFuzzyMatching: false,
      supportsWildcard: false,
      supportsReject: false,
      dicomUploadEnabled: false,
      singlepart: 'bulkdata,video,pdf,image/jphc',
      omitQuotationForMultipartRequest: true,
    },
  };
}

export async function initializeAHIFromBackend(
  backendUrl: string,
  orgId: string,
  studyUid: string,
  region: string
): Promise<{ datastoreId: string; dataSourceConfig: ReturnType<typeof createAHIDataSourceConfig> }> {
  const response = await fetch(`${backendUrl}/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orgId, studyUid }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch AHI credentials: ${response.statusText}`);
  }

  const credentialResponse = await response.json();
  const { datastoreId, accessKeyId, secretAccessKey, sessionToken, expiration } = credentialResponse;

  const credentials: AHICredentials = {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    expiration,
  };

  const credentialRefreshCallback = async (): Promise<AHICredentials> => {
    const refreshResponse = await fetch(`${backendUrl}/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orgId, studyUid }),
    });

    if (!refreshResponse.ok) {
      throw new Error(`Failed to refresh AHI credentials: ${refreshResponse.statusText}`);
    }

    const refreshData = await refreshResponse.json();
    return {
      accessKeyId: refreshData.accessKeyId,
      secretAccessKey: refreshData.secretAccessKey,
      sessionToken: refreshData.sessionToken,
      expiration: refreshData.expiration,
    };
  };

  initializeAHI({
    region,
    datastoreId,
    credentials,
    credentialRefreshCallback,
    refreshBufferSeconds: 10,
  });

  const dataSourceConfig = createAHIDataSourceConfig(region, datastoreId);

  return { datastoreId, dataSourceConfig };
}
