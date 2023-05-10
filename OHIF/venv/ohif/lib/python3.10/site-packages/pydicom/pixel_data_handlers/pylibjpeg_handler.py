# Copyright 2020 pydicom authors. See LICENSE file for details.
"""Use the :gh:`pylibjpeg <pylibjpeg/>` package
to convert supported pixel data to a :class:`numpy.ndarray`.

.. versionadded:: 2.1

**Supported data**

The pylibjpeg handler supports the conversion of data in the (7FE0,0010)
*Pixel Data* elements to a :class:`~numpy.ndarray` provided the
related :dcm:`Image Pixel<part03/sect_C.7.6.3.html>` module elements have
values given in the table below.

+------------------------------------------------+---------------+----------+
| Element                                        | Supported     |          |
+-------------+---------------------------+------+ values        |          |
| Tag         | Keyword                   | Type |               |          |
+=============+===========================+======+===============+==========+
| (0028,0002) | SamplesPerPixel           | 1    | 1, 3          | Required |
+-------------+---------------------------+------+---------------+----------+
| (0028,0004) | PhotometricInterpretation | 1    | MONOCHROME1,  | Required |
|             |                           |      | MONOCHROME2,  |          |
|             |                           |      | RGB,          |          |
|             |                           |      | YBR_FULL,     |          |
|             |                           |      | YBR_FULL_422, |          |
|             |                           |      | YBR_ICT,      |          |
|             |                           |      | YBR_RCT       |          |
+-------------+---------------------------+------+---------------+----------+
| (0028,0006) | PlanarConfiguration       | 1C   | 0, 1          | Optional |
+-------------+---------------------------+------+---------------+----------+
| (0028,0008) | NumberOfFrames            | 1C   | N             | Optional |
+-------------+---------------------------+------+---------------+----------+
| (0028,0010) | Rows                      | 1    | N             | Required |
+-------------+---------------------------+------+---------------+----------+
| (0028,0011) | Columns                   | 1    | N             | Required |
+-------------+---------------------------+------+---------------+----------+
| (0028,0100) | BitsAllocated             | 1    | 8, 16         | Required |
+-------------+---------------------------+------+---------------+----------+
| (0028,0101) | BitsStored                | 1    | Up to 16      | Required |
+-------------+---------------------------+------+---------------+----------+
| (0028,0103) | PixelRepresentation       | 1    | 0, 1          | Required |
+-------------+---------------------------+------+---------------+----------+

.. versionchanged:: 2.2

    Added support for *RLE Lossless* via the `pylibjpeg-rle` plugin.

"""

import logging
from typing import TYPE_CHECKING, Iterable, cast

if TYPE_CHECKING:  # pragma: no cover
    from pydicom.dataset import Dataset, FileMetaDataset

try:
    import numpy as np
    HAVE_NP = True
except ImportError:
    HAVE_NP = False

try:
    import pylibjpeg
    HAVE_PYLIBJPEG = True
except ImportError:
    HAVE_PYLIBJPEG = False

if HAVE_PYLIBJPEG:
    try:
        from pylibjpeg.utils import get_pixel_data_decoders
    except ImportError:
        # Old import, deprecated in 1.2, removal in 2.0
        from pylibjpeg.pydicom.utils import get_pixel_data_decoders

try:
    import openjpeg
    HAVE_OPENJPEG = True
except ImportError:
    HAVE_OPENJPEG = False

try:
    import libjpeg
    HAVE_LIBJPEG = True
except ImportError:
    HAVE_LIBJPEG = False

try:
    import rle
    HAVE_RLE = True
except ImportError:
    HAVE_RLE = False

from pydicom import config
from pydicom.encaps import generate_pixel_data_frame
from pydicom.pixel_data_handlers.util import (
    pixel_dtype, get_expected_length, reshape_pixel_array, get_j2k_parameters
)
from pydicom.uid import (
    JPEGBaseline8Bit,
    JPEGExtended12Bit,
    JPEGLosslessP14,
    JPEGLosslessSV1,
    JPEGLSLossless,
    JPEGLSNearLossless,
    JPEG2000Lossless,
    JPEG2000,
    RLELossless,
    UID
)


LOGGER = logging.getLogger("pydicom")


HANDLER_NAME = "pylibjpeg"
if HAVE_PYLIBJPEG:
    _DECODERS = get_pixel_data_decoders()

_LIBJPEG_SYNTAXES = [
    JPEGBaseline8Bit,
    JPEGExtended12Bit,
    JPEGLosslessP14,
    JPEGLosslessSV1,
    JPEGLSLossless,
    JPEGLSNearLossless
]
_OPENJPEG_SYNTAXES = [JPEG2000Lossless, JPEG2000]
_RLE_SYNTAXES = [RLELossless]
SUPPORTED_TRANSFER_SYNTAXES = (
    _LIBJPEG_SYNTAXES + _OPENJPEG_SYNTAXES + _RLE_SYNTAXES
)

DEPENDENCIES = {"numpy": ("http://www.numpy.org/", "NumPy")}


def is_available() -> bool:
    """Return ``True`` if the handler has its dependencies met."""
    return HAVE_NP and HAVE_PYLIBJPEG


def supports_transfer_syntax(tsyntax: UID) -> bool:
    """Return ``True`` if the handler supports the `tsyntax`.

    Parameters
    ----------
    tsyntax : pydicom.uid.UID
        The *Transfer Syntax UID* of the *Pixel Data* that is to be used with
        the handler.
    """
    return tsyntax in SUPPORTED_TRANSFER_SYNTAXES


def needs_to_convert_to_RGB(ds: "Dataset") -> bool:
    """Return ``True`` if the *Pixel Data* should to be converted from YCbCr to
    RGB.

    This affects JPEG transfer syntaxes.
    """
    return False


def should_change_PhotometricInterpretation_to_RGB(ds: "Dataset") -> bool:
    """Return ``True`` if the *Photometric Interpretation* should be changed
    to RGB.

    This affects JPEG transfer syntaxes.
    """
    return False


def as_array(ds: "Dataset") -> "np.ndarray":
    """Return the entire *Pixel Data* as an :class:`~numpy.ndarray`.

    .. versionadded:: 2.1

    Parameters
    ----------
    ds : pydicom.dataset.Dataset
        The :class:`Dataset` containing an :dcm:`Image Pixel
        <part03/sect_C.7.6.3.html>` module and the *Pixel Data* to be
        converted.

    Returns
    -------
    numpy.ndarray
        The contents of (7FE0,0010) *Pixel Data* as an :class:`~numpy.ndarray`
        with shape (rows, columns), (rows, columns, components), (frames,
        rows, columns), or (frames, rows, columns, components) depending on
        the dataset.
    """
    return reshape_pixel_array(ds, get_pixeldata(ds))


def generate_frames(
    ds: "Dataset", reshape: bool = True
) -> Iterable["np.ndarray"]:
    """Yield a *Pixel Data* frame from `ds` as an :class:`~numpy.ndarray`.

    .. versionadded:: 2.1

    Parameters
    ----------
    ds : pydicom.dataset.Dataset
        The :class:`Dataset` containing an :dcm:`Image Pixel
        <part03/sect_C.7.6.3.html>` module and the *Pixel Data* to be
        converted.
    reshape : bool, optional
        If ``True`` (default), then the returned :class:`~numpy.ndarray` will
        be reshaped to the correct dimensions. If ``False`` then no reshaping
        will be performed.

    Yields
    -------
    numpy.ndarray
        A single frame of (7FE0,0010) *Pixel Data* as an
        :class:`~numpy.ndarray` with an appropriate dtype for the data.

    Raises
    ------
    AttributeError
        If `ds` is missing a required element.
    RuntimeError
        If the plugin required to decode the pixel data is not installed.
    """
    tsyntax = ds.file_meta.TransferSyntaxUID
    # The check of transfer syntax must be first
    if tsyntax not in _DECODERS:
        if tsyntax in _OPENJPEG_SYNTAXES:
            plugin = "pylibjpeg-openjpeg"
        elif tsyntax in _LIBJPEG_SYNTAXES:
            plugin = "pylibjpeg-libjpeg"
        else:
            plugin = "pylibjpeg-rle"

        raise RuntimeError(
            f"Unable to convert the Pixel Data as the '{plugin}' plugin is "
            f"not installed"
        )

    # Check required elements
    required_elements = [
        "BitsAllocated", "Rows", "Columns", "PixelRepresentation",
        "SamplesPerPixel", "PhotometricInterpretation", "PixelData",
    ]
    missing = [elem for elem in required_elements if elem not in ds]
    if missing:
        raise AttributeError(
            "Unable to convert the pixel data as the following required "
            "elements are missing from the dataset: " + ", ".join(missing)
        )

    decoder = _DECODERS[tsyntax]
    LOGGER.debug(f"Decoding {tsyntax.name} encoded Pixel Data using {decoder}")

    nr_frames = getattr(ds, "NumberOfFrames", 1)
    pixel_module = ds.group_dataset(0x0028)
    dtype = pixel_dtype(ds)

    bits_stored = cast(int, ds.BitsStored)
    bits_allocated = cast(int, ds.BitsAllocated)

    for frame in generate_pixel_data_frame(ds.PixelData, nr_frames):
        arr = decoder(frame, pixel_module)

        if (
            tsyntax in [JPEG2000, JPEG2000Lossless]
            and config.APPLY_J2K_CORRECTIONS
        ):
            param = get_j2k_parameters(frame)
            j2k_sign = param.setdefault('is_signed', True)
            j2k_precision = cast(
                int, param.setdefault('precision', bits_stored)
            )
            shift = bits_allocated - j2k_precision
            if shift and not j2k_sign and j2k_sign != ds.PixelRepresentation:
                # Convert unsigned J2K data to 2s complement
                # Can only get here if parsed J2K codestream OK
                pixel_module.PixelRepresentation = 0
                arr = arr.view(pixel_dtype(pixel_module))
                arr = np.left_shift(arr, shift)
                arr = arr.astype(dtype)
                arr = np.right_shift(arr, shift)

        if arr.dtype != dtype:
            # Re-view as pylibjpeg returns a 1D uint8 ndarray
            arr = arr.view(dtype)

        if not reshape:
            yield arr
            continue

        if ds.SamplesPerPixel == 1:
            yield arr.reshape(ds.Rows, ds.Columns)
        else:
            if tsyntax == RLELossless:
                # RLE Lossless is Planar Configuration 1
                arr = arr.reshape(ds.SamplesPerPixel, ds.Rows, ds.Columns)
                yield arr.transpose(1, 2, 0)
            else:
                # JPEG, JPEG-LS and JPEG 2000 are all Planar Configuration 0
                yield arr.reshape(ds.Rows, ds.Columns, ds.SamplesPerPixel)


def get_pixeldata(ds: "Dataset") -> "np.ndarray":
    """Return a :class:`numpy.ndarray` of the pixel data.

    .. versionadded:: 2.1

    Parameters
    ----------
    ds : pydicom.dataset.Dataset
        The :class:`Dataset` containing an :dcm:`Image Pixel
        <part03/sect_C.7.6.3.html>` module and the *Pixel Data* to be
        converted.

    Returns
    -------
    numpy.ndarray
        The contents of (7FE0,0010) *Pixel Data* as a 1D array.
    """
    expected_len = get_expected_length(ds, 'pixels')
    frame_len = expected_len // getattr(ds, "NumberOfFrames", 1)
    # Empty destination array for our decoded pixel data
    arr = np.empty(expected_len, pixel_dtype(ds))

    generate_offsets = range(0, expected_len, frame_len)
    for frame, offset in zip(generate_frames(ds, False), generate_offsets):
        arr[offset:offset + frame_len] = frame

    return arr
