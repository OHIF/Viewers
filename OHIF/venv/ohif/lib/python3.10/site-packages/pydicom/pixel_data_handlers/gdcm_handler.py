# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Use the `GDCM <http://gdcm.sourceforge.net/>`_ Python package to decode
pixel transfer syntaxes.
"""

import os
from tempfile import NamedTemporaryFile
from typing import TYPE_CHECKING, cast

if TYPE_CHECKING:  # pragma: no cover
    from pydicom.dataset import Dataset, FileMetaDataset, FileDataset


try:
    import numpy
    HAVE_NP = True
except ImportError:
    HAVE_NP = False

try:
    import gdcm
    from gdcm import DataElement
    HAVE_GDCM = True
    HAVE_GDCM_IN_MEMORY_SUPPORT = hasattr(DataElement, 'SetByteStringValue')
except ImportError:
    HAVE_GDCM = False
    HAVE_GDCM_IN_MEMORY_SUPPORT = False

from pydicom import config
from pydicom.encaps import generate_pixel_data
import pydicom.uid
from pydicom.uid import UID, JPEG2000, JPEG2000Lossless
from pydicom.pixel_data_handlers.util import (
    get_expected_length, pixel_dtype, get_j2k_parameters
)


HANDLER_NAME = 'GDCM'

DEPENDENCIES = {
    'numpy': ('http://www.numpy.org/', 'NumPy'),
    'gdcm': ('http://gdcm.sourceforge.net/wiki/index.php/Main_Page', 'GDCM'),
}

SUPPORTED_TRANSFER_SYNTAXES = [
    pydicom.uid.JPEGBaseline8Bit,
    pydicom.uid.JPEGExtended12Bit,
    pydicom.uid.JPEGLosslessP14,
    pydicom.uid.JPEGLosslessSV1,
    pydicom.uid.JPEGLSLossless,
    pydicom.uid.JPEGLSNearLossless,
    pydicom.uid.JPEG2000Lossless,
    pydicom.uid.JPEG2000,
]

should_convert_these_syntaxes_to_RGB = [pydicom.uid.JPEGBaseline8Bit]


def is_available() -> bool:
    """Return ``True`` if the handler has its dependencies met."""
    return HAVE_NP and HAVE_GDCM


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


def supports_transfer_syntax(transfer_syntax: UID) -> bool:
    """Return ``True`` if the handler supports the `transfer_syntax`.

    Parameters
    ----------
    transfer_syntax : uid.UID
        The Transfer Syntax UID of the *Pixel Data* that is to be used with
        the handler.
    """
    return transfer_syntax in SUPPORTED_TRANSFER_SYNTAXES


def create_data_element(ds: "Dataset") -> "DataElement":
    """Return a ``gdcm.DataElement`` for the *Pixel Data*.

    Parameters
    ----------
    ds : dataset.Dataset
        The :class:`~pydicom.dataset.Dataset` containing the *Pixel
        Data*.

    Returns
    -------
    gdcm.DataElement
        The converted *Pixel Data* element.
    """
    tsyntax = ds.file_meta.TransferSyntaxUID
    data_element = gdcm.DataElement(gdcm.Tag(0x7fe0, 0x0010))
    if tsyntax.is_compressed:
        if getattr(ds, 'NumberOfFrames', 1) > 1:
            pixel_data_sequence = (
                pydicom.encaps.decode_data_sequence(ds.PixelData)
            )
        else:
            pixel_data_sequence = [
                pydicom.encaps.defragment_data(ds.PixelData)
            ]

        fragments = gdcm.SequenceOfFragments.New()
        for pixel_data in pixel_data_sequence:
            fragment = gdcm.Fragment()
            fragment.SetByteStringValue(pixel_data)
            fragments.AddFragment(fragment)
        data_element.SetValue(fragments.__ref__())
    else:
        data_element.SetByteStringValue(ds.PixelData)

    return data_element


def create_image(ds: "Dataset", data_element: "DataElement") -> "gdcm.Image":
    """Return a ``gdcm.Image``.

    Parameters
    ----------
    ds : dataset.Dataset
        The :class:`~pydicom.dataset.Dataset` containing the Image
        Pixel module.
    data_element : gdcm.DataElement
        The ``gdcm.DataElement`` *Pixel Data* element.

    Returns
    -------
    gdcm.Image
    """
    image = gdcm.Image()
    number_of_frames = getattr(ds, 'NumberOfFrames', 1)
    image.SetNumberOfDimensions(2 if number_of_frames == 1 else 3)
    image.SetDimensions((ds.Columns, ds.Rows, number_of_frames))
    image.SetDataElement(data_element)

    pi_type = gdcm.PhotometricInterpretation.GetPIType(
        ds.PhotometricInterpretation
    )
    image.SetPhotometricInterpretation(
        gdcm.PhotometricInterpretation(pi_type)
    )

    tsyntax = ds.file_meta.TransferSyntaxUID
    ts_type = gdcm.TransferSyntax.GetTSType(str.__str__(tsyntax))
    image.SetTransferSyntax(gdcm.TransferSyntax(ts_type))
    pixel_format = gdcm.PixelFormat(
        ds.SamplesPerPixel,
        ds.BitsAllocated,
        ds.BitsStored,
        ds.HighBit,
        ds.PixelRepresentation
    )
    image.SetPixelFormat(pixel_format)
    if 'PlanarConfiguration' in ds:
        image.SetPlanarConfiguration(ds.PlanarConfiguration)

    return image


def _get_pixel_str_fileio(ds: "Dataset") -> str:
    """Return the pixel data from `ds` as a str.

    Used for GDCM < 2.8.8.

    Parameters
    ----------
    ds : pydicom.dataset.Dataset
        The dataset to create the str from.

    Returns
    -------
    str
        The UTF-8 encoded pixel data.
    """
    reader = gdcm.ImageReader()
    fname = getattr(ds, 'filename', None)
    if fname and isinstance(fname, str):
        reader.SetFileName(fname)
        if not reader.Read():
            raise TypeError("GDCM could not read DICOM image")

        return cast(str, reader.GetImage().GetBuffer())

    # Copy the relevant elements and write to a temporary file to avoid
    #   having to deal with all the possible objects the dataset may
    #   originate with
    new = ds.group_dataset(0x0028)
    new["PixelData"] = ds["PixelData"]  # avoid ambiguous VR
    new.file_meta = ds.file_meta
    with NamedTemporaryFile('wb', delete=False) as t:
        new.save_as(t)

    reader.SetFileName(t.name)
    if not reader.Read():
        raise TypeError("GDCM could not read DICOM image")

    pixel_str: str = reader.GetImage().GetBuffer()

    # Need to kill the gdcm.ImageReader to free file access
    reader = None
    os.remove(t.name)

    return pixel_str


def get_pixeldata(ds: "Dataset") -> "numpy.ndarray":
    """Use the GDCM package to decode *Pixel Data*.

    Returns
    -------
    numpy.ndarray
        A correctly sized (but not shaped) array of the entire data volume

    Raises
    ------
    ImportError
        If the required packages are not available.
    TypeError
        If the image could not be read by GDCM or if the *Pixel Data* type is
        unsupported.
    AttributeError
        If the decoded amount of data does not match the expected amount.
    """
    if not HAVE_GDCM:
        raise ImportError("The GDCM handler requires both gdcm and numpy")

    if HAVE_GDCM_IN_MEMORY_SUPPORT:
        gdcm_data_element = create_data_element(ds)
        gdcm_image = create_image(ds, gdcm_data_element)
        pixel_str = gdcm_image.GetBuffer()
    else:
        pixel_str = _get_pixel_str_fileio(ds)

    # GDCM returns char* as type str. Python decodes this to
    # unicode strings by default.
    # The SWIG docs mention that they always decode byte streams
    # as utf-8 strings, with the `surrogateescape`
    # error handler configured.
    # Therefore, we can encode them back to a bytearray
    # by using the same parameters.
    pixel_bytearray = pixel_str.encode("utf-8", "surrogateescape")

    # Here we need to be careful because in some cases, GDCM reads a
    # buffer that is too large, so we need to make sure we only include
    # the first n_rows * n_columns * dtype_size bytes.
    expected_length_bytes = get_expected_length(ds)
    if ds.PhotometricInterpretation == 'YBR_FULL_422':
        # GDCM has already resampled the pixel data, see PS3.3 C.7.6.3.1.2
        expected_length_bytes = expected_length_bytes // 2 * 3

    if len(pixel_bytearray) > expected_length_bytes:
        # We make sure that all the bytes after are in fact zeros
        padding = pixel_bytearray[expected_length_bytes:]
        if numpy.any(numpy.frombuffer(padding, numpy.byte)):
            pixel_bytearray = pixel_bytearray[:expected_length_bytes]
        else:
            # We revert to the old behavior which should then result
            #   in a Numpy error later on.
            pass

    numpy_dtype = pixel_dtype(ds)
    arr = numpy.frombuffer(pixel_bytearray, dtype=numpy_dtype)

    expected_length_pixels = get_expected_length(ds, 'pixels')
    if arr.size != expected_length_pixels:
        raise AttributeError(
            f"Amount of pixel data {arr.size} does not match the "
            f"expected data {expected_length_pixels}"
        )

    tsyntax = ds.file_meta.TransferSyntaxUID
    if (
        config.APPLY_J2K_CORRECTIONS
        and tsyntax in [JPEG2000, JPEG2000Lossless]
    ):
        nr_frames = getattr(ds, 'NumberOfFrames', 1)
        codestream = next(generate_pixel_data(ds.PixelData, nr_frames))[0]

        params = get_j2k_parameters(codestream)
        j2k_precision = cast(
            int, params.setdefault("precision", ds.BitsStored)
        )
        j2k_sign = params.setdefault("is_signed", None)

        if not j2k_sign and ds.PixelRepresentation == 1:
            # Convert unsigned J2K data to 2's complement
            shift = cast(int, ds.BitsAllocated) - j2k_precision
            pixel_module = ds.group_dataset(0x0028)
            pixel_module.PixelRepresentation = 0
            dtype = pixel_dtype(pixel_module)
            arr = (arr.astype(dtype) << shift).astype(numpy_dtype) >> shift

    if should_change_PhotometricInterpretation_to_RGB(ds):
        ds.PhotometricInterpretation = "RGB"

    return cast("numpy.ndarray", arr.copy())
