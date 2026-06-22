# MIMPS demo cases (MIMPS-06)

Five de-identified chest X-ray studies ingested into the demo Orthanc by
`scripts/ingest_demo_studies.py`. Source: **NIH ChestX-ray14 (CXR14)**, public
domain / CC0. The script pulls only these 5 PNGs from `images_001.zip` (via HTTP
range requests on the Hugging Face mirror `alkzar90/NIH-Chest-X-ray-dataset`),
converts each to a minimal Computed Radiography DICOM, and assigns deterministic,
fully synthetic, Portuguese-localized identities.

All identifiers below are synthetic. No real patient data is present
(`PatientIdentityRemoved = YES`; the NIH source is already de-identified, and we
overwrite all identity tags with demo values).

| # | PatientName       | NIH Image    | Finding (label)  | Série (PT)                 | View | Sex | Age |
|---|-------------------|--------------|------------------|----------------------------|------|-----|-----|
| 1 | PACIENTE-DEMO-01  | 00000165_001 | Pneumonia        | Pneumonia                  | PA   | M   | 76  |
| 2 | PACIENTE-DEMO-02  | 00000002_000 | No Finding       | Sem achados radiologicos   | PA   | M   | 80  |
| 3 | PACIENTE-DEMO-03  | 00000005_000 | No Finding       | Sem achados radiologicos   | PA   | F   | 69  |
| 4 | PACIENTE-DEMO-04  | 00000112_002 | Consolidation    | Consolidacao               | PA   | M   | 49  |
| 5 | PACIENTE-DEMO-05  | 00000011_000 | Effusion         | Derrame pleural            | PA   | M   | 74  |
| 6 | PACIENTE-DEMO-06  | 00000661_000 | Cardiomegaly     | Cardiomegalia              | PA   | M   | 57  |
| 7 | PACIENTE-DEMO-07  | 00030634_000 | Effusion         | Derrame pleural            | PA   | F   | 60  |
| 8 | PACIENTE-DEMO-08  | 00019892_003 | Pneumothorax     | Pneumotorax                | PA   | F   | 58  |
| 9 | PACIENTE-DEMO-09  | 00023075_033 | Mass             | Massa                      | PA   | M   | 31  |
| 10| PACIENTE-DEMO-10  | 00013118_008 | Atelectasis      | Atelectasia                | PA   | M   | 69  |
| 11| PACIENTE-DEMO-11  | 00016487_002 | Nodule           | Nodulo                     | PA   | M   | 63  |
| 12| PACIENTE-DEMO-12  | 00014251_029 | Infiltration     | Infiltrado                 | PA   | M   | 70  |

> **Cases 6–12 (added 2026-06-22)** are the **pathology spread** for a richer demo
> worklist — each a single-finding, PA-view case with a **confirmed localized box**
> in `BBox_List_2017.csv`. They are **not** in `images_001.zip`, so they ingest from
> local PNGs via `--png-dir` (not the HF range-pull). Cardiomegaly / Effusion /
> Pneumothorax are `proxy-txv-v1`'s strongest detections, so the AI findings panel
> lights up cleanly on those. Same deterministic UID scheme (`…1421.1.{6..12}`),
> idempotent re-ingest.

## AI-overlay positive case (MIMPS-10)

The hardcoded AI overlay targets **case #1 — PACIENTE-DEMO-01** (NIH `00000165_001`,
Pneumonia, PA). Its deterministic UIDs (stable across re-runs):

| UID type        | Value                              |
|-----------------|------------------------------------|
| StudyInstanceUID  | `1.2.826.0.1.3680043.10.1421.1.1` |
| SeriesInstanceUID | `1.2.826.0.1.3680043.10.1421.2.1` |
| SOPInstanceUID    | `1.2.826.0.1.3680043.10.1421.3.1` |

UID scheme: `1.2.826.0.1.3680043.10.1421.{1=study,2=series,3=instance}.{case#}`.
Because UIDs are deterministic, MIMPS-10 can hardcode the study UID above, and
re-running the ingest is idempotent (Orthanc reports `AlreadyStored`).

## Why these cases

- **Pneumonia (PA)** — the demo's AI positive; a recognizable infiltrate pattern
  for a clinically plausible bounding-box overlay.
- **2× No Finding (PA)** — clean negatives for contrast in the worklist.
- **Consolidation (PA)** — visually adjacent to pneumonia; good differential talking point.
- **Effusion (PA)** — a finding Brazilian radiologists recognize instantly.

## Licensing

NIH ChestX-ray14 is released into the public domain (CC0). Cite: Wang et al.,
"ChestX-ray8: Hospital-scale Chest X-ray Database...", CVPR 2017. We redistribute
no source images in git — the ingest script fetches them at run time.
