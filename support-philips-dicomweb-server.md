# Custom OHIF Viewer Changes

## Overview

This document describes the custom modifications made to the OHIF Viewer to support a Philips DICOMweb server that uses **separate URL paths** for QIDO-RS and WADO-RS operations.

**Problem**: The Philips server uses:
- `/qidors/{orgUuid}` for QIDO-RS (query) operations
- `/wadors/{orgUuid}` for WADO-RS (retrieve) operations

The original OHIF code used the WADO client for `searchForSeries` calls, resulting in incorrect URLs like:
```
https://server/wadors/{orgUuid}/studies/{studyUID}/series?includefield=...
```

Instead of the correct QIDO URL:
```
https://server/qidors/{orgUuid}/studies/{studyUID}/series?includefield=...
```

---

## Files Modified

### 1. `extensions/default/src/DicomWebDataSource/index.ts`

**Changes (lines ~444-454, ~520-531)**:
- Pass `qidoDicomWebClient` to `retrieveStudyMetadata` in both sync and async retrieval methods
- Set authorization headers on `qidoDicomWebClient` before QIDO operations

```typescript
// In _retrieveSeriesMetadataSync and _retrieveSeriesMetadataAsync
qidoDicomWebClient.headers = getAuthorizationHeader();
const data = await retrieveStudyMetadata(
  wadoDicomWebClient,
  StudyInstanceUID,
  enableStudyLazyLoad,
  filters,
  sortCriteria,
  sortFunction,
  dicomWebConfig,
  qidoDicomWebClient  // NEW: Pass qidoClient for QIDO operations
);
```

---

### 2. `extensions/default/src/DicomWebDataSource/retrieveStudyMetadata.js`

**Changes (lines ~21-29, ~51-75)**:
- Added `qidoClient` parameter to function signature
- Pass `qidoClient` to `RetrieveMetadata` and `retrieveMetadataFiltered`

```javascript
export function retrieveStudyMetadata(
  dicomWebClient,
  StudyInstanceUID,
  enableStudyLazyLoad,
  filters,
  sortCriteria,
  sortFunction,
  dicomWebConfig = {},
  qidoClient = null  // NEW PARAMETER
) {
  // ...
  RetrieveMetadata(..., qidoClient);
  retrieveMetadataFiltered(..., qidoClient);
}
```

---

### 3. `extensions/default/src/DicomWebDataSource/wado/retrieveMetadata.js`

**Changes (lines ~18-37)**:
- Added `qidoClient` parameter to function signature
- Pass `qidoClient` to the metadata loader constructor

```javascript
async function RetrieveMetadata(
  dicomWebClient,
  StudyInstanceUID,
  enableStudyLazyLoad,
  filters = {},
  sortCriteria,
  sortFunction,
  qidoClient = null  // NEW PARAMETER
) {
  const retrieveMetadataLoader = new RetrieveMetadataLoader(
    dicomWebClient,
    StudyInstanceUID,
    filters,
    sortCriteria,
    sortFunction,
    qidoClient  // Pass to loader
  );
}
```

---

### 4. `extensions/default/src/DicomWebDataSource/wado/retrieveMetadataLoader.js`

**Changes (lines ~18-31)**:
- Added `qidoClient` parameter to constructor
- Store `qidoClient` on instance, defaulting to `client` (wado) if not provided for backward compatibility

```javascript
constructor(
  client,
  studyInstanceUID,
  filters = {},
  sortCriteria = undefined,
  sortFunction = undefined,
  qidoClient = null  // NEW PARAMETER
) {
  this.client = client;
  this.qidoClient = qidoClient || client;  // Fallback to wado client
  // ...
}
```

---

### 5. `extensions/default/src/DicomWebDataSource/wado/retrieveMetadataLoaderAsync.js`

**Changes (lines ~97, ~109-115)**:
- Use `this.qidoClient` for `searchForSeries` calls instead of the WADO client

```javascript
*getPreLoaders() {
  const { studyInstanceUID, filters: { seriesInstanceUID } = {} } = this;
  // ...
  const qidoClient = this.qidoClient;  // Use QIDO client
  
  if (seriesInstanceUID) {
    preLoaders.push(qidoClient.searchForSeries.bind(qidoClient, options));
  }
  preLoaders.push(qidoClient.searchForSeries.bind(qidoClient, options));
}
```

---

### 6. `extensions/default/src/DicomWebDataSource/utils/retrieveMetadataFiltered.js`

**Changes (lines ~16-24, ~33-41)**:
- Added `qidoClient` parameter to function signature
- Pass `qidoClient` to `RetrieveMetadata` calls

```javascript
function retrieveMetadataFiltered(
  dicomWebClient,
  StudyInstanceUID,
  enableStudyLazyLoad,
  filters,
  sortCriteria,
  sortFunction,
  qidoClient = null  // NEW PARAMETER
) {
  // ...
  RetrieveMetadata(..., qidoClient);
}
```

---

### 7. `platform/app/public/config/default.js`

**Changes**:
- Configured `qidoRoot` and `wadoRoot` with separate paths
- Added `acceptHeader` for Philips server compatibility

```javascript
{
  qidoRoot: `${baseUrl}/qidors/${orgUuid}`,
  wadoRoot: `${baseUrl}/wadors/${orgUuid}`,
  acceptHeader: [
    'multipart/related; type="application/octet-stream"; transfer-syntax=1.2.840.10008.1.2.1',
  ],
  // ...
}
```

---

## Summary

| Operation | Client Used | URL Path |
|-----------|-------------|----------|
| `searchForSeries` (QIDO) | `qidoDicomWebClient` | `/qidors/...` |
| `retrieveInstanceMetadata` (WADO) | `wadoDicomWebClient` | `/wadors/...` |

The fix ensures that **QIDO-RS operations** (like `searchForSeries`) use the `qidoDicomWebClient` with the correct `/qidors/` URL, while **WADO-RS operations** continue using the `wadoDicomWebClient` with `/wadors/`.

---

## Backward Compatibility

The changes maintain backward compatibility:
- If `qidoClient` is not passed, the loader defaults to using the `client` (wado client)
- Servers with unified QIDO/WADO endpoints will continue to work
