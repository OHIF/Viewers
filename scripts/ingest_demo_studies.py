#!/usr/bin/env python3
"""MIMPS-06 — ingest 5 de-identified demo chest X-rays into Orthanc.

Source: NIH ChestX-ray14 (CXR14), public domain / CC0, mirrored on Hugging Face
(alkzar90/NIH-Chest-X-ray-dataset). We need only 5 specific images, so instead of
downloading the ~2 GB `images_001.zip` batch we read its ZIP central directory and
pull *only* the 5 target PNGs via HTTP range requests (a few MB total). The PNGs are
stored uncompressed in the archive, so extraction is a plain byte-range fetch.

Each PNG is converted to a minimal, valid Computed Radiography (CR) DICOM with
**deterministic, de-identified, Portuguese-localized** patient metadata
(PACIENTE-DEMO-01..05). Deterministic SOP/Study/Series UIDs make the whole script
idempotent: re-running re-POSTs the same instances and Orthanc reports "AlreadyStored".

The 5 cases were selected (and their finding labels verified against
Data_Entry_2017_v2020.csv) ahead of time and are pinned below. See docs/demo-cases.md.

Dependencies (stdlib + two packages):
    python3 -m pip install "pydicom>=2.4" "pillow>=10.0"

Usage (run on the VPS by scripts/vps-orthanc-runbook.sh; Orthanc REST is loopback-only):
    export ORTHANC_PASSWORD=...                 # from .env
    python3 scripts/ingest_demo_studies.py \
        --orthanc-url http://127.0.0.1:8042 \
        --user mimps --password "$ORTHANC_PASSWORD"

Options:
    --via-gateway URL   STOW-RS to a DICOMweb root (e.g. http://127.0.0.1:8899/pacs/dicom-web)
                        instead of the Orthanc REST /instances endpoint. Default is REST.
    --keep-dicom DIR    Also write the generated .dcm files to DIR (debugging).
    --no-upload         Generate (and optionally keep) DICOMs but do not upload.
"""
from __future__ import annotations

import argparse
import io
import struct
import sys
import urllib.request
import urllib.error
import zlib
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Pinned demo cases. All are PA-view images present in images_001.zip; labels
# verified against NIH Data_Entry_2017_v2020.csv. Index 01 (Pneumonia) is the
# AI-overlay positive case consumed by MIMPS-10 — keep it first and stable.
# ---------------------------------------------------------------------------
HF_REPO = "alkzar90/NIH-Chest-X-ray-dataset"
ZIP_URL = (
    f"https://huggingface.co/datasets/{HF_REPO}/resolve/main/data/images/images_001.zip"
)

# A demo-scoped OID subtree under the Medical Connections free root
# (1.2.826.0.1.3680043). Purely synthetic — no real-world identity.
UID_ROOT = "1.2.826.0.1.3680043.10.1421"
SOP_CLASS_CR = "1.2.840.10008.5.1.4.1.1.1"  # Computed Radiography Image Storage
TS_EXPLICIT_LE = "1.2.840.10008.1.2.1"
STUDY_DATE = "20260101"


@dataclass(frozen=True)
class DemoCase:
    index: int
    png: str  # filename inside images_001.zip (without the "images/" prefix)
    label: str  # NIH Finding Label (English, as in the CSV)
    label_pt: str  # Portuguese series description shown in the viewer
    sex: str  # "M" / "F" (from the CSV)
    age_years: int


DEMO_CASES: list[DemoCase] = [
    DemoCase(1, "00000165_001.png", "Pneumonia", "Pneumonia", "M", 76),
    DemoCase(2, "00000002_000.png", "No Finding", "Sem achados radiologicos", "M", 80),
    DemoCase(3, "00000005_000.png", "No Finding", "Sem achados radiologicos", "F", 69),
    DemoCase(4, "00000112_002.png", "Consolidation", "Consolidacao", "M", 49),
    DemoCase(5, "00000011_000.png", "Effusion", "Derrame pleural", "M", 74),
    # --- Pathology spread for the demo worklist (added 2026-06-22). All are
    # single-finding, PA-view cases with a CONFIRMED localized box in
    # BBox_List_2017.csv (NIH CXR14, CC0). Findings 6/7/8 are proxy-txv-v1's
    # strongest detections, so the AI panel lights up cleanly. These are NOT in
    # images_001.zip, so they ingest via --png-dir (local PNGs), not HF range-pull.
    DemoCase(6, "00000661_000.png", "Cardiomegaly", "Cardiomegalia", "M", 57),
    DemoCase(7, "00030634_000.png", "Effusion", "Derrame pleural", "F", 60),
    DemoCase(8, "00019892_003.png", "Pneumothorax", "Pneumotorax", "F", 58),
    DemoCase(9, "00023075_033.png", "Mass", "Massa", "M", 31),
    DemoCase(10, "00013118_008.png", "Atelectasis", "Atelectasia", "M", 69),
    DemoCase(11, "00016487_002.png", "Nodule", "Nodulo", "M", 63),
    DemoCase(12, "00014251_029.png", "Infiltration", "Infiltrado", "M", 70),
]


def case_uids(c: DemoCase) -> tuple[str, str, str]:
    """Deterministic (study, series, instance) UIDs for a case."""
    return (
        f"{UID_ROOT}.1.{c.index}",
        f"{UID_ROOT}.2.{c.index}",
        f"{UID_ROOT}.3.{c.index}",
    )


# ---------------------------------------------------------------------------
# Range-based ZIP extraction (no full download).
# ---------------------------------------------------------------------------
def _http_get(url: str, start: int | None = None, end: int | None = None) -> bytes:
    headers = {}
    if start is not None:
        headers["Range"] = f"bytes={start}-{'' if end is None else end}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()


def _resolve(url: str) -> tuple[str, int]:
    """Follow redirects (HF LFS -> CDN) and return (final_url, content_length)."""
    req = urllib.request.Request(url, method="HEAD")
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.url, int(r.headers["Content-Length"])


def _central_directory(url: str, size: int) -> dict[str, tuple[int, int, int]]:
    """Return {name: (local_header_offset, compressed_size, method)}.

    Reads the End-Of-Central-Directory record plus the central directory only.
    """
    tail = _http_get(url, max(0, size - 3_000_000), size - 1)
    p = tail.rfind(b"PK\x05\x06")
    if p < 0:
        raise RuntimeError("ZIP EOCD not found (ZIP64 archives unsupported)")
    (_sig, _d0, _d1, _n0, _ntot, cd_size, cd_off, _clen) = struct.unpack(
        "<IHHHHIIH", tail[p : p + 22]
    )
    cd = _http_get(url, cd_off, cd_off + cd_size - 1)
    entries: dict[str, tuple[int, int, int]] = {}
    i = 0
    while i + 4 <= len(cd) and cd[i : i + 4] == b"PK\x01\x02":
        (
            _sig, _vm, _vn, _flag, method, _mt, _md, _crc, csz, _usz,
            nlen, elen, clen, _ds, _ia, _ea, lho,
        ) = struct.unpack("<IHHHHHHIIIHHHHHII", cd[i : i + 46])
        name = cd[i + 46 : i + 46 + nlen].decode("utf-8", "replace")
        entries[name] = (lho, csz, method)
        i += 46 + nlen + elen + clen
    return entries


def _extract(url: str, lho: int, csz: int, method: int) -> bytes:
    """Fetch and decompress a single member given its local-header offset."""
    # Local file header is 30 bytes + name + extra; lengths live at offsets 26/28.
    head = _http_get(url, lho, lho + 29)
    nlen, elen = struct.unpack("<HH", head[26:30])
    data_off = lho + 30 + nlen + elen
    raw = _http_get(url, data_off, data_off + csz - 1)
    if method == 0:  # stored
        return raw
    if method == 8:  # deflate
        return zlib.decompress(raw, -15)
    raise RuntimeError(f"Unsupported ZIP compression method {method}")


def read_local_pngs(png_dir: str) -> dict[str, bytes]:
    """Read each case's PNG from a local directory (recursively), bypassing the
    HF range-pull. Used for cases outside images_001.zip (the pathology spread)
    or fully-offline runs. The directory is searched recursively for each
    case's basename so the nested NIH dataset layout works as-is."""
    import os

    index: dict[str, str] = {}
    for dp, _dirs, fns in os.walk(png_dir):
        for fn in fns:
            if fn.endswith(".png") and fn not in index:
                index[fn] = os.path.join(dp, fn)
    out: dict[str, bytes] = {}
    for c in DEMO_CASES:
        path = index.get(c.png)
        if not path:
            raise RuntimeError(f"{c.png} not found under {png_dir}")
        with open(path, "rb") as f:
            png = f.read()
        if png[:8] != b"\x89PNG\r\n\x1a\n":
            raise RuntimeError(f"{path} is not a valid PNG")
        out[c.png] = png
        print(f"[ingest] read local {c.png} ({len(png)} bytes)", file=sys.stderr)
    return out


def fetch_pngs() -> dict[str, bytes]:
    print(f"[ingest] resolving {ZIP_URL}", file=sys.stderr)
    url, size = _resolve(ZIP_URL)
    print(f"[ingest] archive is {size} bytes; reading central directory", file=sys.stderr)
    cd = _central_directory(url, size)
    out: dict[str, bytes] = {}
    for c in DEMO_CASES:
        key = f"images/{c.png}"
        if key not in cd:
            raise RuntimeError(f"{key} not present in images_001.zip")
        lho, csz, method = cd[key]
        png = _extract(url, lho, csz, method)
        if png[:8] != b"\x89PNG\r\n\x1a\n":
            raise RuntimeError(f"{key} did not extract to a valid PNG")
        out[c.png] = png
        print(f"[ingest] extracted {c.png} ({len(png)} bytes)", file=sys.stderr)
    return out


# ---------------------------------------------------------------------------
# PNG -> de-identified DICOM.
# ---------------------------------------------------------------------------
def png_to_dicom(c: DemoCase, png_bytes: bytes) -> bytes:
    try:
        from PIL import Image
        import pydicom
        from pydicom.dataset import Dataset, FileDataset, FileMetaDataset
        from pydicom.uid import generate_uid  # noqa: F401  (kept for reference)
    except ModuleNotFoundError as e:  # pragma: no cover
        raise SystemExit(
            f"Missing dependency: {e.name}. Install with:\n"
            '    python3 -m pip install "pydicom>=2.4" "pillow>=10.0"'
        )

    img = Image.open(io.BytesIO(png_bytes)).convert("L")  # 8-bit grayscale
    width, height = img.size
    pixels = img.tobytes()

    study_uid, series_uid, instance_uid = case_uids(c)

    fm = FileMetaDataset()
    fm.MediaStorageSOPClassUID = SOP_CLASS_CR
    fm.MediaStorageSOPInstanceUID = instance_uid
    fm.TransferSyntaxUID = TS_EXPLICIT_LE
    fm.ImplementationClassUID = f"{UID_ROOT}.0.1"

    ds = FileDataset(None, {}, file_meta=fm, preamble=b"\x00" * 128)
    ds.is_little_endian = True
    ds.is_implicit_VR = False

    # --- De-identified, Portuguese-localized identity (fully synthetic) ---
    ds.PatientName = f"PACIENTE-DEMO-{c.index:02d}"
    ds.PatientID = f"DEMO-{c.index:02d}"
    ds.PatientBirthDate = ""
    ds.PatientSex = c.sex
    ds.PatientAge = f"{c.age_years:03d}Y"
    ds.PatientIdentityRemoved = "YES"
    ds.DeidentificationMethod = "NIH CXR14 (CC0) source; BlackVoxel synthetic demo identifiers"
    ds.InstitutionName = "BlackVoxel Demo"

    # --- Study / Series / Instance ---
    ds.StudyInstanceUID = study_uid
    ds.SeriesInstanceUID = series_uid
    ds.SOPInstanceUID = instance_uid
    ds.SOPClassUID = SOP_CLASS_CR
    ds.StudyDate = STUDY_DATE
    ds.SeriesDate = STUDY_DATE
    ds.StudyTime = "120000"
    ds.AccessionNumber = f"DEMO{c.index:04d}"
    ds.Modality = "CR"
    ds.StudyDescription = "Radiografia de torax (PA)"
    ds.SeriesDescription = c.label_pt
    ds.SeriesNumber = 1
    ds.InstanceNumber = 1
    ds.BodyPartExamined = "CHEST"
    ds.ViewPosition = "PA"
    ds.ImageLaterality = ""

    # --- Image pixel module (MONOCHROME2, 8-bit) ---
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    ds.Rows = height
    ds.Columns = width
    ds.BitsAllocated = 8
    ds.BitsStored = 8
    ds.HighBit = 7
    ds.PixelRepresentation = 0
    ds.PixelData = pixels

    buf = io.BytesIO()
    ds.save_as(buf, write_like_original=False)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Upload.
# ---------------------------------------------------------------------------
def _basic_auth(user: str, password: str) -> str:
    import base64

    token = base64.b64encode(f"{user}:{password}".encode()).decode()
    return f"Basic {token}"


def upload_rest(orthanc_url: str, user: str, password: str, dicom: bytes) -> str:
    req = urllib.request.Request(
        orthanc_url.rstrip("/") + "/instances",
        data=dicom,
        method="POST",
        headers={
            "Content-Type": "application/dicom",
            "Authorization": _basic_auth(user, password),
        },
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        import json

        return json.loads(r.read()).get("Status", "Unknown")


def upload_stow(dicomweb_root: str, dicom: bytes) -> str:
    boundary = "----MIMPSDemoBoundary"
    body = (
        f"--{boundary}\r\n"
        "Content-Type: application/dicom\r\n\r\n"
    ).encode() + dicom + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(
        dicomweb_root.rstrip("/") + "/studies",
        data=body,
        method="POST",
        headers={
            "Content-Type": f'multipart/related; type="application/dicom"; boundary={boundary}',
            "Accept": "application/dicom+json",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return f"HTTP {r.status}"


def count_studies(orthanc_url: str, user: str, password: str) -> int:
    req = urllib.request.Request(
        orthanc_url.rstrip("/") + "/studies",
        headers={"Authorization": _basic_auth(user, password)},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        import json

        return len(json.loads(r.read()))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--orthanc-url", default="http://127.0.0.1:8042")
    ap.add_argument("--user", default="mimps")
    ap.add_argument("--password", default=None, help="Orthanc password (or ORTHANC_PASSWORD env)")
    ap.add_argument("--via-gateway", default=None,
                    help="STOW-RS DICOMweb root instead of REST /instances")
    ap.add_argument("--keep-dicom", default=None, help="Directory to also write .dcm files")
    ap.add_argument("--png-dir", default=None,
                    help="Read case PNGs from this local directory (recursive) instead of "
                         "the HF range-pull. Required for cases outside images_001.zip.")
    ap.add_argument("--no-upload", action="store_true")
    args = ap.parse_args()

    import os

    password = args.password or os.environ.get("ORTHANC_PASSWORD")
    if not args.no_upload and not args.via_gateway and not password:
        ap.error("Orthanc password required: pass --password or set ORTHANC_PASSWORD")

    pngs = read_local_pngs(args.png_dir) if args.png_dir else fetch_pngs()

    if args.keep_dicom:
        os.makedirs(args.keep_dicom, exist_ok=True)

    for c in DEMO_CASES:
        dicom = png_to_dicom(c, pngs[c.png])
        if args.keep_dicom:
            path = os.path.join(args.keep_dicom, f"demo-{c.index:02d}.dcm")
            with open(path, "wb") as f:
                f.write(dicom)
        if args.no_upload:
            print(f"[ingest] case {c.index:02d} ({c.label}) generated, upload skipped")
            continue
        try:
            if args.via_gateway:
                status = upload_stow(args.via_gateway, dicom)
            else:
                status = upload_rest(args.orthanc_url, args.user, password, dicom)
        except urllib.error.HTTPError as e:
            print(f"[ingest] case {c.index:02d} upload FAILED: HTTP {e.code} {e.reason}",
                  file=sys.stderr)
            return 1
        print(f"[ingest] case {c.index:02d} ({c.label}) -> {status}")

    if not args.no_upload and password:
        try:
            n = count_studies(args.orthanc_url, args.user, password)
            print(f"[ingest] Orthanc now reports {n} studies")
        except Exception as e:  # noqa: BLE001
            print(f"[ingest] could not verify study count: {e}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
