# Copyright 2008-2021 pydicom authors. See LICENSE file for details.
"""Use the `numpy <https://numpy.org/>`_ package to convert RLE lossless *Pixel
Data* to a :class:`numpy.ndarray`.

**Supported transfer syntaxes**

* 1.2.840.10008.1.2.5 : RLE Lossless

**Supported data**

The RLE handler supports the conversion of data in the (7FE0,0010)
*Pixel Data* element to a numpy ndarray provided the related
:dcm:`Image Pixel<part03/sect_C.7.6.3.html>` module elements have values given
in the table below.

+------------------------------------------------+--------------+----------+
| Element                                        | Supported    |          |
+-------------+---------------------------+------+ values       |          |
| Tag         | Keyword                   | Type |              |          |
+=============+===========================+======+==============+==========+
| (0028,0002) | SamplesPerPixel           | 1    | N            | Required |
+-------------+---------------------------+------+--------------+----------+
| (0028,0006) | PlanarConfiguration       | 1C   | 1            | Optional |
+-------------+---------------------------+------+--------------+----------+
| (0028,0008) | NumberOfFrames            | 1C   | N            | Optional |
+-------------+---------------------------+------+--------------+----------+
| (0028,0010) | Rows                      | 1    | N            | Required |
+-------------+---------------------------+------+--------------+----------+
| (0028,0011) | Columns                   | 1    | N            | Required |
+-------------+---------------------------+------+--------------+----------+
| (0028,0100) | BitsAllocated             | 1    | 8, 16, 32    | Required |
+-------------+---------------------------+------+--------------+----------+
| (0028,0103) | PixelRepresentation       | 1    | 0, 1         | Required |
+-------------+---------------------------+------+--------------+----------+

"""

from struct import unpack
import sys
from typing import List, TYPE_CHECKING, cast
import warnings

try:
    import numpy as np
    HAVE_RLE = True
except ImportError:
    HAVE_RLE = False

from pydicom.encaps import decode_data_sequence, defragment_data
from pydicom.pixel_data_handlers.util import pixel_dtype
from pydicom.encoders.native import _encode_frame
import pydicom.uid

if TYPE_CHECKING:  # pragma: no cover
    import numpy
    from pydicom.dataset import Dataset, FileMetaDataset


HANDLER_NAME = 'RLE Lossless'
DEPENDENCIES = {'numpy': ('http://www.numpy.org/', 'NumPy')}
SUPPORTED_TRANSFER_SYNTAXES = [pydicom.uid.RLELossless]


def is_available() -> bool:
    """Return ``True`` if the handler has its dependencies met."""
    return HAVE_RLE


def supports_transfer_syntax(transfer_syntax: str) -> bool:
    """Return ``True`` if the handler supports the `transfer_syntax`.

    Parameters
    ----------
    transfer_syntax : uid.UID
        The Transfer Syntax UID of the *Pixel Data* that is to be used with
        the handler.
    """
    return transfer_syntax in SUPPORTED_TRANSFER_SYNTAXES


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


def get_pixeldata(ds: "Dataset", rle_segment_order: str = '>') -> "np.ndarray":
    """Return an :class:`numpy.ndarray` of the *Pixel Data*.

    Parameters
    ----------
    ds : dataset.Dataset
        The :class:`Dataset` containing an Image Pixel module and the RLE
        encoded *Pixel Data* to be converted.
    rle_segment_order : str
        The order of segments used by the RLE decoder when dealing with *Bits
        Allocated* > 8. Each RLE segment contains 8-bits of the pixel data,
        and segments are supposed to be ordered from MSB to LSB. A value of
        ``'>'`` means interpret the segments as being in big endian order
        (default) while a value of ``'<'`` means interpret the segments as
        being in little endian order which may be possible if the encoded data
        is non-conformant.

    Returns
    -------
    numpy.ndarray
        The decoded contents of (7FE0,0010) *Pixel Data* as a 1D array.

    Raises
    ------
    AttributeError
        If `ds` is missing a required element.
    NotImplementedError
        If `ds` contains pixel data in an unsupported format.
    ValueError
        If the actual length of the pixel data doesn't match the expected
        length.
    """
    transfer_syntax = ds.file_meta.TransferSyntaxUID
    # The check of transfer syntax must be first
    if transfer_syntax not in SUPPORTED_TRANSFER_SYNTAXES:
        raise NotImplementedError(
            "Unable to convert the pixel data as the transfer syntax "
            "is not supported by the RLE pixel data handler."
        )

    # Check required elements
    required_elements = ['PixelData', 'BitsAllocated', 'Rows', 'Columns',
                         'PixelRepresentation', 'SamplesPerPixel']
    missing = [elem for elem in required_elements if elem not in ds]
    if missing:
        raise AttributeError(
            "Unable to convert the pixel data as the following required "
            "elements are missing from the dataset: " + ", ".join(missing)
        )

    nr_bits = cast(int, ds.BitsAllocated)
    nr_samples = cast(int, ds.SamplesPerPixel)
    nr_frames = cast(int, getattr(ds, 'NumberOfFrames', 1) or 1)
    rows = cast(int, ds.Rows)
    cols = cast(int, ds.Columns)

    # Decompress each frame of the pixel data
    pixel_data = bytearray()
    if nr_frames > 1:
        for rle_frame in decode_data_sequence(ds.PixelData):
            frame = _rle_decode_frame(
                rle_frame, rows, cols, nr_samples, nr_bits, rle_segment_order
            )
            pixel_data.extend(frame)
    else:
        frame = _rle_decode_frame(
            defragment_data(ds.PixelData),
            rows,
            cols,
            nr_samples,
            nr_bits,
            rle_segment_order
        )
        pixel_data.extend(frame)

    arr = np.frombuffer(pixel_data, pixel_dtype(ds))

    if should_change_PhotometricInterpretation_to_RGB(ds):
        ds.PhotometricInterpretation = "RGB"

    return cast("np.ndarray", arr)


def _parse_rle_header(header: bytes) -> List[int]:
    """Return a list of byte offsets for the segments in RLE data.

    **RLE Header Format**

    The RLE Header contains the number of segments for the image and the
    starting offset of each segment. Each of these numbers is represented as
    an unsigned long stored in little-endian. The RLE Header is 16 long words
    in length (i.e. 64 bytes) which allows it to describe a compressed image
    with up to 15 segments. All unused segment offsets shall be set to zero.

    As an example, the table below describes an RLE Header with 3 segments as
    would typically be used with 8-bit RGB or YCbCr data (with 1 segment per
    channel).

    +--------------+---------------------------------+------------+
    | Byte  offset | Description                     | Value      |
    +==============+=================================+============+
    | 0            | Number of segments              | 3          |
    +--------------+---------------------------------+------------+
    | 4            | Offset of segment 1, N bytes    | 64         |
    +--------------+---------------------------------+------------+
    | 8            | Offset of segment 2, M bytes    | 64 + N     |
    +--------------+---------------------------------+------------+
    | 12           | Offset of segment 3             | 64 + N + M |
    +--------------+---------------------------------+------------+
    | 16           | Offset of segment 4 (not used)  | 0          |
    +--------------+---------------------------------+------------+
    | ...          | ...                             | 0          |
    +--------------+---------------------------------+------------+
    | 60           | Offset of segment 15 (not used) | 0          |
    +--------------+---------------------------------+------------+

    Parameters
    ----------
    header : bytes
        The RLE header data (i.e. the first 64 bytes of an RLE frame).

    Returns
    -------
    list of int
        The byte offsets for each segment in the RLE data.

    Raises
    ------
    ValueError
        If there are more than 15 segments or if the header is not 64 bytes
        long.

    References
    ----------
    DICOM Standard, Part 5, :dcm:`Annex G<part05/chapter_G.html>`
    """
    if len(header) != 64:
        raise ValueError('The RLE header can only be 64 bytes long')

    nr_segments = unpack('<L', header[:4])[0]
    if nr_segments > 15:
        raise ValueError(
            "The RLE header specifies an invalid number of segments ({})"
            .format(nr_segments)
        )

    offsets = unpack('<{}L'.format(nr_segments),
                     header[4:4 * (nr_segments + 1)])

    return list(offsets)


def _rle_decode_frame(
    data: bytes,
    rows: int,
    columns: int,
    nr_samples: int,
    nr_bits: int,
    segment_order: str = '>'
) -> bytearray:
    """Decodes a single frame of RLE encoded data.

    Each frame may contain up to 15 segments of encoded data.

    Parameters
    ----------
    data : bytes
        The RLE frame data
    rows : int
        The number of output rows
    columns : int
        The number of output columns
    nr_samples : int
        Number of samples per pixel (e.g. 3 for RGB data).
    nr_bits : int
        Number of bits per sample - must be a multiple of 8
    segment_order : str
        The segment order of the `data`, '>' for big endian (default),
        '<' for little endian (non-conformant).

    Returns
    -------
    bytearray
        The frame's decoded data in little endian and planar configuration 1
        byte ordering (i.e. for RGB data this is all red pixels then all
        green then all blue, with the bytes for each pixel ordered from
        MSB to LSB when reading left to right).
    """
    if nr_bits % 8:
        raise NotImplementedError(
            "Unable to decode RLE encoded pixel data with a (0028,0100) "
            f"'Bits Allocated' value of {nr_bits}"
        )

    # Parse the RLE Header
    offsets = _parse_rle_header(data[:64])
    nr_segments = len(offsets)

    # Check that the actual number of segments is as expected
    bytes_per_sample = nr_bits // 8
    if nr_segments != nr_samples * bytes_per_sample:
        raise ValueError(
            "The number of RLE segments in the pixel data doesn't match the "
            f"expected amount ({nr_segments} vs. "
            f"{nr_samples * bytes_per_sample} segments)"
        )

    # Ensure the last segment gets decoded
    offsets.append(len(data))

    # Preallocate with null bytes
    decoded = bytearray(rows * columns * nr_samples * bytes_per_sample)

    # Example:
    # RLE encoded data is ordered like this (for 16-bit, 3 sample):
    #  Segment: 0     | 1     | 2     | 3     | 4     | 5
    #           R MSB | R LSB | G MSB | G LSB | B MSB | B LSB
    #  A segment contains only the MSB or LSB parts of all the sample pixels

    # To minimise the amount of array manipulation later, and to make things
    # faster we interleave each segment in a manner consistent with a planar
    # configuration of 1 (and use little endian byte ordering):
    #    All red samples             | All green samples           | All blue
    #    Pxl 1   Pxl 2   ... Pxl N   | Pxl 1   Pxl 2   ... Pxl N   | ...
    #    LSB MSB LSB MSB ... LSB MSB | LSB MSB LSB MSB ... LSB MSB | ...

    # `stride` is the total number of bytes of each sample plane
    stride = bytes_per_sample * rows * columns
    for sample_number in range(nr_samples):
        le_gen = range(bytes_per_sample)
        byte_offsets = le_gen if segment_order == '<' else reversed(le_gen)
        for byte_offset in byte_offsets:
            # Decode the segment
            ii = sample_number * bytes_per_sample + byte_offset
            # ii is 1, 0, 3, 2, 5, 4 for the example above
            # This is where the segment order correction occurs
            segment = _rle_decode_segment(data[offsets[ii]:offsets[ii + 1]])

            # Check that the number of decoded bytes is correct
            actual_length = len(segment)
            if actual_length < rows * columns:
                raise ValueError(
                    "The amount of decoded RLE segment data doesn't match the "
                    f"expected amount ({actual_length} vs. "
                    f"{rows * columns} bytes)"
                )
            elif actual_length != rows * columns:
                warnings.warn(
                    "The decoded RLE segment contains non-conformant padding "
                    f"- {actual_length} vs. {rows * columns} bytes expected"
                )

            if segment_order == '>':
                byte_offset = bytes_per_sample - byte_offset - 1

            # For 100 pixel/plane, 32-bit, 3 sample data, `start` will be
            #   0, 1, 2, 3, 400, 401, 402, 403, 800, 801, 802, 803
            start = byte_offset + (sample_number * stride)
            decoded[start:start + stride:bytes_per_sample] = (
                segment[:rows * columns]
            )

    return decoded


def _rle_decode_segment(data: bytes) -> bytearray:
    """Return a single segment of decoded RLE data as bytearray.

    Parameters
    ----------
    data : bytes
        The segment data to be decoded.

    Returns
    -------
    bytearray
        The decoded segment.
    """
    data = bytearray(data)
    result = bytearray()
    pos = 0
    result_extend = result.extend

    try:
        while True:
            # header_byte is N + 1
            header_byte = data[pos] + 1
            pos += 1
            if header_byte > 129:
                # Extend by copying the next byte (-N + 1) times
                # however since using uint8 instead of int8 this will be
                # (256 - N + 1) times
                result_extend(data[pos:pos + 1] * (258 - header_byte))
                pos += 1
            elif header_byte < 129:
                # Extend by literally copying the next (N + 1) bytes
                result_extend(data[pos:pos + header_byte])
                pos += header_byte

    except IndexError:
        pass

    return result


# Old function kept for backwards compatibility
def rle_encode_frame(arr: "numpy.ndarray") -> bytes:
    """Return an :class:`numpy.ndarray` image frame as RLE encoded
    :class:`bytearray`.

    .. versionadded:: 1.3

    .. deprecated:: 2.2

        Use :meth:`~pydicom.dataset.Dataset.compress` instead

    Parameters
    ----------
    arr : numpy.ndarray
        A 2D (if *Samples Per Pixel* = 1) or 3D (if *Samples Per Pixel* = 3)
        ndarray containing a single frame of the image to be RLE encoded.

    Returns
    -------
    bytes
        An RLE encoded frame, including the RLE header, following the format
        specified by the DICOM Standard, Part 5,
        :dcm:`Annex G<part05/chapter_G.html>`.
    """
    shape = arr.shape
    if len(shape) > 3:
        # Note: only raises if multi-sample pixel data with multiple frames
        raise ValueError(
            "Unable to encode multiple frames at once, please encode one "
            "frame at a time"
        )

    # Check the expected number of segments
    nr_segments = arr.dtype.itemsize
    if len(shape) == 3:
        # Number of samples * bytes per sample
        nr_segments *= shape[-1]

    if nr_segments > 15:
        raise ValueError(
            "Unable to encode as the DICOM standard only allows "
            "a maximum of 15 segments in RLE encoded data"
        )

    dtype = arr.dtype
    kwargs = {
        'bits_allocated': arr.dtype.itemsize * 8,
        'rows': shape[0],
        'columns': shape[1],
        'samples_per_pixel': 3 if len(shape) == 3 else 1,
        'byteorder': '<',
    }

    sys_endianness = '<' if sys.byteorder == 'little' else '>'
    byteorder = dtype.byteorder
    byteorder = sys_endianness if byteorder == '=' else byteorder
    if byteorder == '>':
        arr = arr.astype(dtype.newbyteorder('<'))

    return _encode_frame(arr.tobytes(), **kwargs)
