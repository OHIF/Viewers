import { ahiSigner, AHICredentials } from './AHISigner';

interface AHIUrlConfig {
  ahi?: {
    defaultRegion?: string;
    refreshBufferSeconds?: number;
    backendUrl?: string;
    orgId?: string;
    studyUid?: string;
    customEndpoint?: string; // e.g., 'https://dicom-medical-imaging.us-east-1.amazonaws.com'
  };
  dataSources?: Array<{
    sourceName: string;
    configuration: {
      qidoRoot?: string;
      wadoRoot?: string;
      wadoUriRoot?: string;
    };
  }>;
}

export async function initializeAHIFromUrlParams(config: AHIUrlConfig): Promise<boolean> {
  const urlParams = new URLSearchParams(window.location.search);

  const region = urlParams.get('region') || config?.ahi?.defaultRegion || 'us-east-1';
  const datastoreId = urlParams.get('datastoreId');
  const customEndpoint = urlParams.get('customEndpoint') || config?.ahi?.customEndpoint;
  // URL decode credentials - handle + signs that may be encoded as spaces
  const accessKeyId = urlParams.get('accessKeyId')?.replace(/ /g, '+');
  const secretAccessKey = urlParams.get('secretAccessKey')?.replace(/ /g, '+');
  const sessionToken = urlParams.get('sessionToken')?.replace(/ /g, '+');
  const expiration = urlParams.get('expiration');

  // Check if backend credential fetch mode
  const backendUrl = urlParams.get('backendUrl') || config?.ahi?.backendUrl;
  const orgId = urlParams.get('orgId') || config?.ahi?.orgId;
  const studyUid = urlParams.get('studyUid') || urlParams.get('StudyInstanceUIDs');

  // Mode 1: Direct credentials in URL
  if (datastoreId && accessKeyId && secretAccessKey && sessionToken) {
    console.log('[AHI] Credentials from URL - accessKeyId starts with:', accessKeyId.substring(0, 8));
    console.log('[AHI] Credentials from URL - sessionToken length:', sessionToken.length);
    return initializeWithDirectCredentials({
      region,
      datastoreId,
      accessKeyId,
      secretAccessKey,
      sessionToken,
      expiration: expiration ? parseInt(expiration, 10) : undefined,
      refreshBufferSeconds: config?.ahi?.refreshBufferSeconds ?? 10,
      config,
      customEndpoint,
    });
  }

  // Mode 2: Fetch credentials from backend
  if (backendUrl && orgId && studyUid) {
    return initializeFromBackend({
      backendUrl,
      orgId,
      studyUid,
      region,
      refreshBufferSeconds: config?.ahi?.refreshBufferSeconds ?? 10,
      config,
    });
  }

  // No AHI initialization required
  console.log('[AHI] No AHI credentials or backend URL found in URL params - skipping initialization');
  return false;
}

interface DirectCredentialsParams {
  region: string;
  datastoreId: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration?: number;
  refreshBufferSeconds: number;
  config: AHIUrlConfig;
  customEndpoint?: string;
}

function initializeWithDirectCredentials(params: DirectCredentialsParams): boolean {
  const {
    region,
    datastoreId,
    accessKeyId,
    secretAccessKey,
    sessionToken,
    expiration,
    refreshBufferSeconds,
    config,
    customEndpoint,
  } = params;

  const credentials: AHICredentials = {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    expiration,
  };

  ahiSigner.initialize({
    region,
    datastoreId,
    credentials,
    refreshBufferSeconds,
    customEndpoint,
  });

  // Update data source URLs in config
  updateDataSourceUrls(config, region, datastoreId, customEndpoint);

  console.log('[AHI] SigV4 signer initialized with direct credentials');
  console.log('[AHI] Datastore:', datastoreId);
  console.log('[AHI] Region:', region);

  return true;
}

interface BackendParams {
  backendUrl: string;
  orgId: string;
  studyUid: string;
  region: string;
  refreshBufferSeconds: number;
  config: AHIUrlConfig;
}

async function initializeFromBackend(params: BackendParams): Promise<boolean> {
  const { backendUrl, orgId, studyUid, region, refreshBufferSeconds, config } = params;

  try {
    console.log('[AHI] Fetching credentials from backend...');

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
    const { datastoreId, accessKeyId, secretAccessKey, sessionToken, expiration } =
      credentialResponse;

    const credentials: AHICredentials = {
      accessKeyId,
      secretAccessKey,
      sessionToken,
      expiration,
    };

    // Create refresh callback
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

    ahiSigner.initialize({
      region,
      datastoreId,
      credentials,
      credentialRefreshCallback,
      refreshBufferSeconds,
    });

    // Update data source URLs in config
    updateDataSourceUrls(config, region, datastoreId);

    console.log('[AHI] SigV4 signer initialized from backend');
    console.log('[AHI] Datastore:', datastoreId);
    console.log('[AHI] Region:', region);

    return true;
  } catch (error) {
    console.error('[AHI] Failed to initialize from backend:', error);
    return false;
  }
}

function updateDataSourceUrls(config: AHIUrlConfig, region: string, datastoreId: string, customEndpoint?: string): void {
  const baseUrl = customEndpoint
    ? `${customEndpoint}/datastore/${datastoreId}`
    : `https://medical-imaging.${region}.amazonaws.com/datastore/${datastoreId}`;

  const ahiDataSource = config?.dataSources?.find(ds => ds.sourceName === 'ahi');

  if (ahiDataSource) {
    ahiDataSource.configuration.qidoRoot = baseUrl;
    ahiDataSource.configuration.wadoRoot = baseUrl;
    ahiDataSource.configuration.wadoUriRoot = baseUrl;
    console.log('[AHI] Updated data source URLs:', baseUrl);
  }
}
