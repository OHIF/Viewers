---
sidebar_position: 12
---

# Microsoft Azure

This guide explains how to configure a DICOM datasource in OHIF using Azure Healthcare APIs. It focuses on the configuration details and parameters necessary for integration.

---

## Configuring Azure Healthcare APIs as a DICOMweb Data Source

Follow these steps to set up Azure as a DICOM datasource for the OHIF Viewer.

### 1. Configure OIDC Authentication

Azure uses OpenID Connect (OIDC) for authentication. Update the OIDC section in your configuration file with the following parameters:

```json
oidc: [
  {
    "redirect_uri": "/callback",
    "response_type": "id_token token",
    "scope": "openid https://dicom.healthcareapis.azure.com/Dicom.ReadWrite",
    "post_logout_redirect_uri": "/logout-redirect.html",
    "automaticSilentRenew": false,
    "revokeAccessTokenOnSignout": true,
    "loadUserInfo": false,
    "authority": "https://login.microsoftonline.com/{tenant-id}/v2.0/",
    "client_id": "{client-id}"
  }
]
```

Ensure that you have granted the correct permissions to your app by selecting Dicom.ReadWrite in the Permission Management section in Azure:

![alt text](<../assets/img/azure1.png>)

Your app's client ID and tenant ID are available on the app's Overview page:

![alt text](<../assets/img/azure2.png>)

#### Parameters:
- **redirect_uri**: The URL where users are redirected after successful authentication.
- **response_type**: Specifies the authentication response type (`id_token` and `token`).
- **scope**: Defines the level of access. Use `Dicom.ReadWrite` to allow read and write access to DICOM data.
- **post_logout_redirect_uri**: The URL users are redirected to after logout.
- **automaticSilentRenew**: Automatically renews tokens without user interaction. Set to `false` for manual renewal.
- **revokeAccessTokenOnSignout**: Revokes access tokens upon logout for added security.
- **loadUserInfo**: Disables loading additional user information; set to `false` for azure as its not supported.
- **authority**: The Azure AD tenant URL for OIDC authorization.
- **client_id**: The application’s client ID from Azure AD.

---

### 2. Add the Data Source Configuration

Update the data source configuration file with your Azure Healthcare APIs details:

```json
{
  "namespace": "@ohif/extension-default.dataSourcesModule.dicomweb",
  "sourceName": "ohif_azure",
  "friendlyName": "ohif_azure",
  "configuration": {
    "singlepart": "bulkdata,pdf,video",
    "imageRendering": "wadors",
    "thumbnailRendering": "wadors",
    "supportsWildcard": true,
    "enableStudyLazyLoad": true,
    "supportsFuzzyMatching": false,
    "supportsStow": true,
    "qidoRoot": "https://{your-dicom-instance}.dicom.azurehealthcareapis.com/v2",
    "wadoUriRoot": "https://{your-dicom-instance}.dicom.azurehealthcareapis.com/v2",
    "wadoRoot": "https://{your-dicom-instance}.dicom.azurehealthcareapis.com/v2"
  }
}
```

The DICOM service endpoint can be located in the DICOM Service dashboard within the Azure portal:

![alt text](<../assets/img/azure3.png>)

#### Parameters:
- **qidoRoot**: Base URL for QIDO-RS queries.
- **wadoUriRoot**: Base URL for WADO-URI requests.
- **wadoRoot**: Base URL for WADO-RS requests.

---

### 3. Running the Viewer with Azure Configuration

1. Save the above configurations in your OHIF Viewer configuration file.
2. Run the viewer:

```bash
cd OHIFViewer
yarn install
APP_CONFIG=config/azure.js yarn run dev
```

Replace `config/azure.js` with the path to your configuration file.

---

### Additional Notes
- Ensure that the Azure Healthcare API is enabled for your subscription and that the necessary permissions (e.g., `Dicom.ReadWrite`) are assigned to the OIDC client.
- The `qidoRoot`, `wadoUriRoot`, and `wadoRoot` should point to your Azure DICOM service URL. Replace `{your-dicom-instance}` with your actual instance name.

This setup allows OHIF to interact seamlessly with Azure's Healthcare APIs, enabling robust DICOM management and visualization.
