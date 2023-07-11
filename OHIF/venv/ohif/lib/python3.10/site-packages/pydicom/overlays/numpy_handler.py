# Copyright 2008-2019 pydicom authors. See LICENSE file for details.
"""Use the `numpy <https://numpy.org/>`_ package to convert supported *Overlay
Data* to a :class:`numpy.ndarray`.

**Supported data**

The numpy handler supports the conversion of data in the (60xx,3000)
*Overlay Data* element to a :class:`~numpy.ndarray` provided the
related :dcm:`Overlay Plane<part03/sect_C.9.2.html>` and :dcm:`Multi-frame
Overlay<part03/sect_C.9.3.html>` module elements have values given in the
table below.

+------------------------------------------------+--------------+
| Element                                        | Supported    |
+-------------+---------------------------+------+ values       |
| Tag         | Keyword                   | Type |              |
+=============+===========================+======+==============+
| (60xx,0010) | OverlayRows               | 1    | N > 0        |
+-------------+---------------------------+------+--------------+
| (60xx,0011) | OverlayColumns            | 1    | N > 0        |
+-------------+---------------------------+------+--------------+
| (60xx,0015) | NumberOfFramesInOverlay   | 1    | N > 0        |
+-------------+---------------------------+------+--------------+
| (60xx,0100) | OverlayBitsAllocated      | 1    | 1            |
+-------------+---------------------------+------+--------------+
| (60xx,0102) | OverlayBitPosition        | 1    | 0            |
+-------------+---------------------------+------+--------------+

"""

from typing import TYPE_CHECKING, cast, Dict, Any, Optional
import warnings

try:
    import numpy as np
    HAVE_NP = True
except ImportError:
    HAVE_NP = False

from pydicom.pixel_data_handlers import unpack_bits

if TYPE_CHECKING:  # pragma: no cover
    from pydicom.dataset import Dataset
    from pydicom.dataelem import DataElement


HANDLER_NAME = 'Numpy Overlay'
DEPENDENCIES = {'numpy': ('http://www.numpy.org/', 'NumPy')}


def is_available() -> bool:
    """Return ``True`` if the handler has its dependencies met.

    .. versionadded:: 1.4
    """
    return HAVE_NP


def get_expected_length(elem: Dict[str, Any], unit: str = 'bytes') -> int:
    """Return the expected length (in terms of bytes or pixels) of the *Overlay
    Data*.

    .. versionadded:: 1.4

    +------------------------------------------------+-------------+
    | Element                                        | Required or |
    +-------------+---------------------------+------+ optional    |
    | Tag         | Keyword                   | Type |             |
    +=============+===========================+======+=============+
    | (60xx,0010) | OverlayRows               | 1    | Required    |
    +-------------+---------------------------+------+-------------+
    | (60xx,0011) | OverlayColumns            | 1    | Required    |
    +-------------+---------------------------+------+-------------+
    | (60xx,0015) | NumberOfFramesInOverlay   | 1    | Required    |
    +-------------+---------------------------+------+-------------+

    Parameters
    ----------
    elem : dict
        A :class:`dict` with the keys as the element keywords and values the
        corresponding element values (such as ``{'OverlayRows': 512, ...}``)
        for the elements listed in the table above.
    unit : str, optional
        If ``'bytes'`` then returns the expected length of the *Overlay Data*
        in whole bytes and NOT including an odd length trailing NULL padding
        byte. If ``'pixels'`` then returns the expected length of the *Overlay
        Data* in terms of the total number of pixels (default ``'bytes'``).

    Returns
    -------
    int
        The expected length of the *Overlay Data* in either whole bytes or
        pixels, excluding the NULL trailing padding byte for odd length data.
    """
    length: int = elem['OverlayRows'] * elem['OverlayColumns']
    length *= elem['NumberOfFramesInOverlay']

    if unit == 'pixels':
        return length

    # Determine the nearest whole number of bytes needed to contain
    #   1-bit pixel data. e.g. 10 x 10 1-bit pixels is 100 bits, which
    #   are packed into 12.5 -> 13 bytes
    return length // 8 + (length % 8 > 0)


def reshape_overlay_array(
    elem: Dict[str, Any], arr: "np.ndarray"
) -> "np.ndarray":
    """Return a reshaped :class:`numpy.ndarray` `arr`.

    .. versionadded:: 1.4

    +------------------------------------------------+--------------+
    | Element                                        | Supported    |
    +-------------+---------------------------+------+ values       |
    | Tag         | Keyword                   | Type |              |
    +=============+===========================+======+==============+
    | (60xx,0010) | OverlayRows               | 1    | N > 0        |
    +-------------+---------------------------+------+--------------+
    | (60xx,0011) | OverlayColumns            | 1    | N > 0        |
    +-------------+---------------------------+------+--------------+
    | (60xx,0015) | NumberOfFramesInOverlay   | 1    | N > 0        |
    +-------------+---------------------------+------+--------------+

    Parameters
    ----------
    elem : dict
        A :class:`dict` with the keys as the element keywords and values the
        corresponding element values (such as ``{'OverlayRows': 512, ...}``)
        for the elements listed in the table above.
    arr : numpy.ndarray
        A 1D array containing the overlay data.

    Returns
    -------
    numpy.ndarray
        A reshaped array containing the overlay data. The shape of the array
        depends on the contents of the dataset:

        * For single frame data (rows, columns)
        * For multi-frame data (frames, rows, columns)

    References
    ----------

    * DICOM Standard, Part 3, Sections :dcm:`C.9.2<part03/sect_C.9.2.html>`
      and :dcm:`C.9.3<part03/sect_C.9.3.html>`
    * DICOM Standard, Part 5, :dcm:`Section 8.2<part05/sect_8.2.html>`
    """
    if not HAVE_NP:
        raise ImportError("Numpy is required to reshape the overlay array.")

    nr_frames = elem['NumberOfFramesInOverlay']
    nr_rows = elem['OverlayRows']
    nr_columns = elem['OverlayColumns']

    if nr_frames < 1:
        raise ValueError(
            f"Unable to reshape the overlay array as a value of {nr_frames} "
            "for (60xx,0015) 'Number of Frames in Overlay' is invalid."
        )

    if nr_frames > 1:
        return arr.reshape(nr_frames, nr_rows, nr_columns)

    return arr.reshape(nr_rows, nr_columns)


def get_overlay_array(ds: "Dataset", group: int) -> "np.ndarray":
    """Return a :class:`numpy.ndarray` of the *Overlay Data*.

    .. versionadded:: 1.4

    Parameters
    ----------
    ds : Dataset
        The :class:`Dataset` containing an Overlay Plane module and the
        *Overlay Data* to be converted.
    group : int
        The group part of the *Overlay Data* element tag, e.g. ``0x6000``,
        ``0x6010``, etc. Must be between 0x6000 and 0x60FF.

    Returns
    -------
    np.ndarray
        The contents of (`group`,3000) *Overlay Data* as an array.

    Raises
    ------
    AttributeError
        If `ds` is missing a required element.
    ValueError
        If the actual length of the overlay data doesn't match the expected
        length.
    """
    if not HAVE_NP:
        raise ImportError("The overlay data handler requires numpy")

    # Check required elements
    elem = {
        'OverlayData': ds.get((group, 0x3000), None),
        'OverlayBitsAllocated': ds.get((group, 0x0100), None),
        'OverlayRows': ds.get((group, 0x0010), None),
        'OverlayColumns': ds.get((group, 0x0011), None),
    }

    missing = [kk for kk, vv in elem.items() if vv is None]
    if missing:
        raise AttributeError(
            "Unable to convert the overlay data as the following required "
            f"elements are missing from the dataset: {', '.join(missing)}"
        )

    # Grab the element values
    elem_values = {kk: vv.value for kk, vv in elem.items()}

    # Add in if not present
    nr_frames: Optional["DataElement"] = ds.get((group, 0x0015), None)
    if nr_frames is None:
        elem_values['NumberOfFramesInOverlay'] = 1
    else:
        elem_values['NumberOfFramesInOverlay'] = nr_frames.value

    # Calculate the expected length of the pixel data (in bytes)
    #   Note: this does NOT include the trailing null byte for odd length data
    expected_len = get_expected_length(elem_values)

    # Check that the actual length of the pixel data is as expected
    actual_length = len(cast(bytes, elem_values['OverlayData']))

    # Correct for the trailing NULL byte padding for odd length data
    padded_expected_len = expected_len + expected_len % 2
    if actual_length < padded_expected_len:
        if actual_length == expected_len:
            warnings.warn(
                "The overlay data length is odd and misses a padding byte."
            )
        else:
            raise ValueError(
                "The length of the overlay data in the dataset "
                f"({actual_length} bytes) doesn't match the expected length "
                f"({padded_expected_len} bytes). The dataset may be corrupted "
                "or there may be an issue with the overlay data handler."
            )
    elif actual_length > padded_expected_len:
        # PS 3.5, Section 8.1.1
        warnings.warn(
            f"The length of the overlay data in the dataset ({actual_length} "
            "bytes) indicates it contains excess padding. "
            f"{actual_length - expected_len} bytes will be removed "
            "from the end of the data"
        )

    # Unpack the pixel data into a 1D ndarray, skipping any trailing padding
    nr_pixels = get_expected_length(elem_values, unit='pixels')
    arr = cast(
        "np.ndarray", unpack_bits(elem_values['OverlayData'])[:nr_pixels]
    )

    return reshape_overlay_array(elem_values, arr)
