# dicom-ups

## Description

DICOMweb UPS-RS (Unified Procedure Step - RESTful Services) Task Requester +
Watcher: a UI-free service that creates, searches, cancels and watches UPS
workitems on a UPS-RS Worklist server (PS3.18, PS3.4 Annex CC), so the viewer
can trigger standards-based AI workflows and read their results.

The wire layer (`UpsClient`) and the role logic (`UpsService`) are ported from
the Weasis `weasis-dicom-aiw` module (Task Requester + Watcher). Claiming and
stepping a workitem state belong to the Task Manager, never here.

## Scope

PR A ships the service only: no UI, no mode wiring. The extension is registered
in a mode and given a context-menu "Run AI" entry in a follow-up PR.

## Roles

- **Task Requester + Watcher = OHIF**, through this extension: the viewer
  creates and watches the workitem; claiming and state stepping belong to the
  Task Manager, never here.
- **Task Performer = clinfer** - claims the workitem, runs a filter, stores the
  derived series back to the same origin.
- **Task Manager (origin) = Clarus or dcm4chee-arc** - hosts the worklist and
  stores the images; the two are interchangeable.

## Interoperability

Standard UPS-RS, cross-checked against independent implementations - not a
vendor pairing:

- **Origin (Task Manager):** [Clarus PACS](https://github.com/clicker71/clarus-pacs)
  is the reference DICOMweb UPS-RS server this extension is validated against.
  Its worklist surface is checked against **dcm4chee-arc 5.35.x** as the
  reference implementation: the same Create / Search / Update / Cancel /
  Subscribe transactions, and the result STOW-RS, pass against both origins
  interchangeably. Conformance is documented in the
  [AIW-I / UPS-RS](https://github.com/clicker71/clarus-pacs/blob/main/docs/aiw-i-conformance-statement.md)
  and
  [DICOMweb](https://github.com/clicker71/clarus-pacs/blob/main/docs/dicomweb-conformance-statement.md)
  statements.
- **Task Performer:** `clinfer` (the engine in the demo pack below) claims
  workitems and stores derived series back through the same standard
  transactions; it speaks the standard on the wire, not a Clarus-specific
  contract.
- **Independent evidence:** the Weasis `weasis-dicom-aiw` module
  ([nroduit/Weasis#944](https://github.com/nroduit/Weasis/pull/944), from
  [Discussion #925](https://github.com/nroduit/Weasis/discussions/925)) is a
  second, independent Task Requester that drives the identical end-to-end
  flow against the same origins. A Docker demo of this origin (Clarus +
  clinfer, pre-seeded demo study) is `docker-compose.ohif-demo.yml` in the
  [Clarus repository](https://github.com/clicker71/clarus-pacs).

## Usage (CLI)

A dev/E2E CLI mirrors the Weasis `ups:` verbs against a live origin
(`scripts/ups-cli.ts`). Run from `extensions/cornerstone-dicom-ups`:

    node -r ts-node/register/transpile-only scripts/ups-cli.ts \
      <search|run|watch|outputs|cancel> --url <dicomwebBase> [--ae <ae>] [args]

    search   <studyUid> [patientId] [accessionNumber]
    run      <studyUid> <codeValue> [codeDesignator] [codeMeaning]
    watch    <workitemUid>
    outputs  <workitemUid>
    cancel   <workitemUid> [reason]

`watch` subscribes through the notification channel when `--ae` is given
(PS3.18 11.10 subscribe, then the 8.10.4 WebSocket) and falls back to polling
Retrieve Workitem when the origin has no WebSocket channel (e.g. dcm4chee-arc).

If the runner resolves the script as ESM, force CommonJS first. Node 24+
enables native TypeScript stripping, so this is required on the default
`node -r ts-node/register/transpile-only` form (PowerShell shown):

    $env:TS_NODE_TRANSPILE_ONLY='1'
    $env:TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node"}'

The demo codes `CXR-CLAHE` and `CXR-UPSCALE` are model-free image filters
(CLAHE contrast enhancement, bicubic x2 upscale), not real AI: each holds
the workitem `IN PROGRESS` for ~12 s (`CLINFER_DEMO_PAUSE`, default 12) to
emulate inference latency so the running state is visible; set it to `0` to
skip. Demo images only - no diagnostic claim.

Against the demo stack (Clarus + clinfer), the chest study runs a CLAHE
workitem to completion:

    node -r ts-node/register/transpile-only scripts/ups-cli.ts run \
      --url http://127.0.0.1:8024/dicomweb \
      1.2.826.0.1.3680043.8.498.31790203639536201545828494624411576907 CXR-CLAHE

    # study 1.2.826.0.1.3680043.8.498.31790203639536201545828494624411576907: 1 instance(s)
    # workitem 2.25.321837315

    node -r ts-node/register/transpile-only scripts/ups-cli.ts watch \
      --url http://127.0.0.1:8024/dicomweb 2.25.321837315

    # 2.25.321837315 -> IN PROGRESS
    # 2.25.321837315 -> COMPLETED
    # outputs: 246385098921076655792582906650019845306

The knee study has no lung body part, so the same code is cancelled by the
performer:

    node -r ts-node/register/transpile-only scripts/ups-cli.ts run \
      --url http://127.0.0.1:8024/dicomweb \
      1.2.826.0.1.3680043.2.634.0.34696.201723.125318.153 CXR-CLAHE

    # study 1.2.826.0.1.3680043.2.634.0.34696.201723.125318.153: 1 instance(s)
    # workitem 2.25.224877060

    node -r ts-node/register/transpile-only scripts/ups-cli.ts watch \
      --url http://127.0.0.1:8024/dicomweb 2.25.224877060

    # 2.25.224877060 -> CANCELED
    # reason: study 1.2.826.0.1.3680043.2.634.0.34696.201723.125318.153 has no matching frames
    # outputs: (none)
