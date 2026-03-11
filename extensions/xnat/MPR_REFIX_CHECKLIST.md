# MPR (Enhanced MR Multi-Frame) Re-fix Checklist

Use this after stashing the MPR changes so the stack works again. Re-apply these to get MPR working for Enhanced MR.

---

## 1. XNATDataSource (`extensions/xnat/src/XNATDataSource/index.ts`)

### 1.1 Multi-frame metadata (synthetic or from DICOM header)

- **DICOM header fetch (optional):** For instances with `NumberOfFrames > 1` and no `PerFrameFunctionalGroupsSequence`, try fetching the DICOM file with `Range: bytes=0-2097152`, parse with `dcmjs.data.DicomMessage.readFile(buf, { untilTag: '7FE00010' })`, naturalize, and if present set:
  - `naturalized.PerFrameFunctionalGroupsSequence`
  - `naturalized.SharedFunctionalGroupsSequence`
  - `naturalized.SpacingBetweenSlices`
  - Then `delete naturalized.ImagePositionPatient` so per-frame positions are used.

- **Synthetic fallback:** If still no per-frame data after the fetch (e.g. CORS fails):
  - Compute `origin` from `ImagePositionPatient`, `orientation` from `ImageOrientationPatient`, `pixelSpacing`, cross product `normal` from orientation.
  - **Spacing:** Use `SpacingBetweenSlices` if set; else if `SliceThickness >= inPlaneSpacing` use it; else use `inPlaneSpacing * 2.5` so sagittal/coronal proportions look reasonable.
  - Build `PerFrameFunctionalGroupsSequence`: for each frame `f`, `PlanePositionSequence[0].ImagePositionPatient = origin + normal * spacing * f` (use `round6` for coordinates: `v => Math.round(v * 1e6) / 1e6`).
  - Build `SharedFunctionalGroupsSequence` with `PixelMeasuresSequence` (PixelSpacing, SliceThickness, SpacingBetweenSlices) and `PlaneOrientationSequence` (ImageOrientationPatient).
  - `delete naturalized.ImagePositionPatient` so combineFrameInstance uses per-frame positions.

### 1.2 Storable / denaturalize (avoid truncation and stack break)

- **Do not** build `storable` with `...naturalized` or drop the explicit property list — that breaks the stack viewport.
- Before calling `denaturalizeDataset`, **remove** from the object you pass: `PerFrameFunctionalGroupsSequence` and `SharedFunctionalGroupsSequence` (avoids DS-length truncation).
- Keep `storable` as the **explicit** property list: `...denaturalizeDataset(cleanedObject)`, then `StudyInstanceUID`, `SeriesInstanceUID`, `SOPInstanceUID`, `Modality`, `modality`, `url`, `imageId`, `Rows`, `Columns`, `PixelSpacing`, `SliceThickness`, `ImagePositionPatient`, `ImageOrientationPatient`, etc., and **explicitly** add when present: `PerFrameFunctionalGroupsSequence: naturalized.PerFrameFunctionalGroupsSequence`, `SharedFunctionalGroupsSequence: naturalized.SharedFunctionalGroupsSequence`. For multi-frame, set `ImagePositionPatient` to the first frame’s position (e.g. from `naturalized.PerFrameFunctionalGroupsSequence[0].PlanePositionSequence[0].ImagePositionPatient`) when `naturalized.ImagePositionPatient` is undefined so the stack still has a valid position.

### 1.3 MetadataProvider registration per frame

- For each frame index `i` (1..NumberOfFrames):
  - `frameImageId = implementation.getImageIdsForInstance({ instance: naturalized, frame: frameNumber })` (frameNumber = i + 1).
  - `metadataProvider.addImageIdToUIDs(frameImageId, { ...uids, frameNumber })`.
  - If `frameImageId` contains `&frame=`, also register the **base** imageId (URL without `&frame=`) with the same UIDs so lookups that strip the query still resolve.
- Register the **bare** instance imageId (no `?_=0` or `&frame=`) for frame 1 so `getClosestImageId` / base imageId lookups work: `metadataProvider.addImageIdToUIDs(bareBaseId, { ...uids, frameNumber: 1 })`.
- Add `generalSeriesModule` custom metadata for each `frameImageId`.

### 1.4 getImageIdsForDisplaySet

- Return `resolved.imageIds` if the display set already has `imageIds.length > 0`.
- If the caller passed only a descriptor (e.g. `displaySetInstanceUID`), resolve the full display set from `displaySetService.getDisplaySetByUID` or `getActiveDisplaySets()` and use that for `instances`/`images`.
- Otherwise build the list: for each instance, if `NumberOfFrames > 1` then for each frame 1..N call `getImageIdsForInstance({ instance, frame })` and collect; else `getImageIdsForInstance({ instance })`. Return that array so the display set gets frame-specific imageIds.

### 1.5 getImageIdsForInstance

- Must accept `{ instance, frame }` and pass `frame` through to `getImageId` (from DicomWebDataSource utils) so imageIds are like `dicomweb:http://.../file.dcm?_=0&frame=N`. Ensure `instance` has `wadoRoot` and `wadoUri` from config when calling `getImageId`.

---

## 2. DisplaySetFactory (`extensions/xnat/src/sopClassHandler/DisplaySetFactory.ts`)

- Call `dataSource.getImageIdsForDisplaySet(imageSet)` to get the full list of frame-level imageIds.
- Set `displaySetImageId` to the middle element of that list (for multi-frame).
- **Fallback:** If that list is empty and the instance(s) are multi-frame, build frame-level imageIds by iterating instances and for each frame calling `dataSource.getImageIdsForInstance({ instance, frame })`.
- Set `numImageFrames` to `imageIds.length`.
- Put the final `imageIds` array (frame-specific) on the display set and in `initialAttributes.imageIds`.

---

## 3. Thumbnails (`extensions/xnat/src/Panels/WrappedXNATStudyBrowserPanel.tsx`)

- For the study browser thumbnail, prefer a **frame-specific** imageId when the display set has multiple frames:
  - `representativeImageId = displaySet.imageIds?.length > 0 ? displaySet.imageIds[Math.floor(displaySet.imageIds.length / 2)] : (instances?.[middle]?.imageId)`.
  So thumbnails load a single frame instead of the whole multi-frame file.

---

## 4. Route init (no double defaultRouteInit)

- **Mode.tsx** (`platform/app/src/routes/Mode/Mode.tsx`): When `route.init` exists, call `await route.init(...)` and **return** its result; do **not** also call `defaultRouteInit` in that branch.
- **XNAT mode** (`modes/xnat/src/index.tsx`): The XNAT route’s `init` should call `defaultRouteInit(...)` and **return** the unsubscriptions it returns (so the platform doesn’t call defaultRouteInit again).

---

## 5. Optional: XNAT DICOM loader (stack + frame in URL)

- To have **stack** viewport requests include `?_=0&frame=N`, the loader that handles the imageId must preserve the query. That required:
  - In **XNATDicomLoader.ts**: configure `wadouri` (and optionally `wadors`) with a `beforeSend` that, for `imageId.startsWith('dicomweb:')` and a full URL, calls `xhr.open('GET', urlPart)` with the full URL (including query).
  - Register `imageLoader.registerImageLoader('dicomweb', loaderFn)` (and optionally `wadouri`) so our configured loader is used for `dicomweb:` imageIds.
  - In **init.ts**: run loader setup in **preRegistration** (`await initXNATDicomLoader(configuration)`) so registration happens before any image load.
- If the app uses plain `http://` URLs for stack (no `dicomweb:` prefix), then either enable `dicomFileLoadSettings.directLoad` so XNAT registers `http`/`https` with the same beforeSend, or ensure the display set and viewport use `dicomweb:` imageIds end-to-end.

---

## Summary

| Area | What makes MPR work |
|------|---------------------|
| **XNATDataSource** | Per-frame metadata (synthetic or from header), storable includes sequences without truncation, MetadataProvider per frame + bare imageId for frame 1, getImageIdsForDisplaySet returns frame-level list, getImageIdsForInstance passes `frame` to getImageId. |
| **DisplaySetFactory** | displaySet.imageIds = frame-level list from dataSource; numImageFrames = length; fallback build if dataSource returns empty. |
| **WrappedXNATStudyBrowserPanel** | representativeImageId from displaySet.imageIds[middle] for multi-frame. |
| **Route** | Single defaultRouteInit (Mode returns route.init result; XNAT init returns defaultRouteInit’s unsubs). |
| **Loader (for stack)** | dicomweb (and optionally http/https) loader registered with beforeSend that keeps full URL including ?_=0&frame=N; init in preRegistration. |
