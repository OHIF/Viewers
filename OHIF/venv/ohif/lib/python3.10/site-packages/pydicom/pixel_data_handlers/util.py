# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Utility functions used in the pixel data handlers."""

from struct import unpack
from sys import byteorder
from typing import (
    Dict, Optional, Union, List, Tuple, TYPE_CHECKING, cast, Iterable,
    ByteString
)
import warnings

try:
    import numpy as np
    HAVE_NP = True
except ImportError:
    HAVE_NP = False

from pydicom.data import get_palette_files
from pydicom.uid import UID
from pydicom.valuerep import VR

if TYPE_CHECKING:  # pragma: no cover
    from pydicom.dataset import Dataset, FileMetaDataset, FileDataset


# Lookup table for unpacking bit-packed data
_UNPACK_LUT: Dict[int, bytes] = {
    k: bytes(int(s) for s in reversed(f"{k:08b}")) for k in range(256)
}


def apply_color_lut(
    arr: "np.ndarray",
    ds: Optional["Dataset"] = None,
    palette: Optional[Union[str, UID]] = None
) -> "np.ndarray":
    """Apply a color palette lookup table to `arr`.

    .. versionadded:: 1.4

    If (0028,1201-1203) *Palette Color Lookup Table Data* are missing
    then (0028,1221-1223) *Segmented Palette Color Lookup Table Data* must be
    present and vice versa. The presence of (0028,1204) *Alpha Palette Color
    Lookup Table Data* or (0028,1224) *Alpha Segmented Palette Color Lookup
    Table Data* is optional.

    Use of this function with the :dcm:`Enhanced Palette Color Lookup Table
    Module<part03/sect_C.7.6.23.html>` or :dcm:`Supplemental Palette Color LUT
    Module<part03/sect_C.7.6.19.html>` is not currently supported.

    Parameters
    ----------
    arr : numpy.ndarray
        The pixel data to apply the color palette to.
    ds : dataset.Dataset, optional
        Required if `palette` is not supplied. A
        :class:`~pydicom.dataset.Dataset` containing a suitable
        :dcm:`Image Pixel<part03/sect_C.7.6.3.html>` or
        :dcm:`Palette Color Lookup Table<part03/sect_C.7.9.html>` Module.
    palette : str or uid.UID, optional
        Required if `ds` is not supplied. The name of one of the
        :dcm:`well-known<part06/chapter_B.html>` color palettes defined by the
        DICOM Standard. One of: ``'HOT_IRON'``, ``'PET'``,
        ``'HOT_METAL_BLUE'``, ``'PET_20_STEP'``, ``'SPRING'``, ``'SUMMER'``,
        ``'FALL'``, ``'WINTER'`` or the corresponding well-known (0008,0018)
        *SOP Instance UID*.

    Returns
    -------
    numpy.ndarray
        The RGB or RGBA pixel data as an array of ``np.uint8`` or ``np.uint16``
        values, depending on the 3rd value of (0028,1201) *Red Palette Color
        Lookup Table Descriptor*.

    References
    ----------

    * :dcm:`Image Pixel Module<part03/sect_C.7.6.3.html>`
    * :dcm:`Supplemental Palette Color LUT Module<part03/sect_C.7.6.19.html>`
    * :dcm:`Enhanced Palette Color LUT Module<part03/sect_C.7.6.23.html>`
    * :dcm:`Palette Colour LUT Module<part03/sect_C.7.9.html>`
    * :dcm:`Supplemental Palette Color LUTs
      <part03/sect_C.8.16.2.html#sect_C.8.16.2.1.1.1>`
    """
    # Note: input value (IV) is the stored pixel value in `arr`
    # LUTs[IV] -> [R, G, B] values at the IV pixel location in `arr`
    if not ds and not palette:
        raise ValueError("Either 'ds' or 'palette' is required")

    if palette:
        # Well-known palettes are all 8-bits per entry
        datasets = {
            '1.2.840.10008.1.5.1': 'hotiron.dcm',
            '1.2.840.10008.1.5.2': 'pet.dcm',
            '1.2.840.10008.1.5.3': 'hotmetalblue.dcm',
            '1.2.840.10008.1.5.4': 'pet20step.dcm',
            '1.2.840.10008.1.5.5': 'spring.dcm',
            '1.2.840.10008.1.5.6': 'summer.dcm',
            '1.2.840.10008.1.5.7': 'fall.dcm',
            '1.2.840.10008.1.5.8': 'winter.dcm',
        }
        if not UID(palette).is_valid:
            try:
                uids = {
                    'HOT_IRON': '1.2.840.10008.1.5.1',
                    'PET': '1.2.840.10008.1.5.2',
                    'HOT_METAL_BLUE': '1.2.840.10008.1.5.3',
                    'PET_20_STEP': '1.2.840.10008.1.5.4',
                    'SPRING': '1.2.840.10008.1.5.5',
                    'SUMMER': '1.2.840.10008.1.5.6',
                    'FALL': '1.2.840.10008.1.5.8',
                    'WINTER': '1.2.840.10008.1.5.7',
                }
                palette = uids[palette]
            except KeyError:
                raise ValueError("Unknown palette '{}'".format(palette))

        try:
            from pydicom import dcmread
            fname = datasets[palette]
            ds = dcmread(get_palette_files(fname)[0])
        except KeyError:
            raise ValueError("Unknown palette '{}'".format(palette))

    ds = cast("Dataset", ds)

    # C.8.16.2.1.1.1: Supplemental Palette Color LUT
    # TODO: Requires greyscale visualisation pipeline
    if getattr(ds, 'PixelPresentation', None) in ['MIXED', 'COLOR']:
        raise ValueError(
            "Use of this function with the Supplemental Palette Color Lookup "
            "Table Module is not currently supported"
        )

    if 'RedPaletteColorLookupTableDescriptor' not in ds:
        raise ValueError("No suitable Palette Color Lookup Table Module found")

    # All channels are supposed to be identical
    lut_desc = cast(List[int], ds.RedPaletteColorLookupTableDescriptor)
    # A value of 0 = 2^16 entries
    nr_entries = lut_desc[0] or 2**16

    # May be negative if Pixel Representation is 1
    first_map = lut_desc[1]
    # Actual bit depth may be larger (8 bit entries in 16 bits allocated)
    nominal_depth = lut_desc[2]
    dtype = np.dtype('uint{:.0f}'.format(nominal_depth))

    luts = []
    if 'RedPaletteColorLookupTableData' in ds:
        # LUT Data is described by PS3.3, C.7.6.3.1.6
        r_lut = cast(bytes, ds.RedPaletteColorLookupTableData)
        g_lut = cast(bytes, ds.GreenPaletteColorLookupTableData)
        b_lut = cast(bytes, ds.BluePaletteColorLookupTableData)
        a_lut = cast(
            Optional[bytes],
            getattr(ds, 'AlphaPaletteColorLookupTableData', None)
        )

        actual_depth = len(r_lut) / nr_entries * 8
        dtype = np.dtype('uint{:.0f}'.format(actual_depth))

        for lut_bytes in [ii for ii in [r_lut, g_lut, b_lut, a_lut] if ii]:
            luts.append(np.frombuffer(lut_bytes, dtype=dtype))
    elif 'SegmentedRedPaletteColorLookupTableData' in ds:
        # Segmented LUT Data is described by PS3.3, C.7.9.2
        r_lut = cast(bytes, ds.SegmentedRedPaletteColorLookupTableData)
        g_lut = cast(bytes, ds.SegmentedGreenPaletteColorLookupTableData)
        b_lut = cast(bytes, ds.SegmentedBluePaletteColorLookupTableData)
        a_lut = cast(
            Optional[bytes],
            getattr(ds, 'SegmentedAlphaPaletteColorLookupTableData', None)
        )

        endianness = '<' if ds.is_little_endian else '>'
        byte_depth = nominal_depth // 8
        fmt = 'B' if byte_depth == 1 else 'H'
        actual_depth = nominal_depth

        for seg in [ii for ii in [r_lut, g_lut, b_lut, a_lut] if ii]:
            len_seg = len(seg) // byte_depth
            s_fmt = endianness + str(len_seg) + fmt
            lut_ints = _expand_segmented_lut(unpack(s_fmt, seg), s_fmt)
            luts.append(np.asarray(lut_ints, dtype=dtype))
    else:
        raise ValueError("No suitable Palette Color Lookup Table Module found")

    if actual_depth not in [8, 16]:
        raise ValueError(
            f"The bit depth of the LUT data '{actual_depth:.1f}' "
            "is invalid (only 8 or 16 bits per entry allowed)"
        )

    lut_lengths = [len(ii) for ii in luts]
    if not all(ii == lut_lengths[0] for ii in lut_lengths[1:]):
        raise ValueError("LUT data must be the same length")

    # IVs < `first_map` get set to first LUT entry (i.e. index 0)
    clipped_iv = np.zeros(arr.shape, dtype=dtype)
    # IVs >= `first_map` are mapped by the Palette Color LUTs
    # `first_map` may be negative, positive or 0
    mapped_pixels = arr >= first_map
    clipped_iv[mapped_pixels] = arr[mapped_pixels] - first_map
    # IVs > number of entries get set to last entry
    np.clip(clipped_iv, 0, nr_entries - 1, out=clipped_iv)

    # Output array may be RGB or RGBA
    out = np.empty(list(arr.shape) + [len(luts)], dtype=dtype)
    for ii, lut in enumerate(luts):
        out[..., ii] = lut[clipped_iv]

    return out


def apply_modality_lut(arr: "np.ndarray", ds: "Dataset") -> "np.ndarray":
    """Apply a modality lookup table or rescale operation to `arr`.

    .. versionadded:: 1.4

    Parameters
    ----------
    arr : numpy.ndarray
        The :class:`~numpy.ndarray` to apply the modality LUT or rescale
        operation to.
    ds : dataset.Dataset
        A dataset containing a :dcm:`Modality LUT Module
        <part03/sect_C.11.html#sect_C.11.1>`.

    Returns
    -------
    numpy.ndarray
        An array with applied modality LUT or rescale operation. If
        (0028,3000) *Modality LUT Sequence* is present then returns an array
        of ``np.uint8`` or ``np.uint16``, depending on the 3rd value of
        (0028,3002) *LUT Descriptor*. If (0028,1052) *Rescale Intercept* and
        (0028,1053) *Rescale Slope* are present then returns an array of
        ``np.float64``. If neither are present then `arr` will be returned
        unchanged.

    Notes
    -----
    When *Rescale Slope* and *Rescale Intercept* are used, the output range
    is from (min. pixel value * Rescale Slope + Rescale Intercept) to
    (max. pixel value * Rescale Slope + Rescale Intercept), where min. and
    max. pixel value are determined from (0028,0101) *Bits Stored* and
    (0028,0103) *Pixel Representation*.

    References
    ----------
    * DICOM Standard, Part 3, :dcm:`Annex C.11.1
      <part03/sect_C.11.html#sect_C.11.1>`
    * DICOM Standard, Part 4, :dcm:`Annex N.2.1.1
      <part04/sect_N.2.html#sect_N.2.1.1>`
    """
    if ds.get("ModalityLUTSequence"):
        item = cast(List["Dataset"], ds.ModalityLUTSequence)[0]
        nr_entries = cast(List[int], item.LUTDescriptor)[0] or 2**16
        first_map = cast(List[int], item.LUTDescriptor)[1]
        nominal_depth = cast(List[int], item.LUTDescriptor)[2]

        dtype = 'uint{}'.format(nominal_depth)

        # Ambiguous VR, US or OW
        unc_data: Iterable[int]
        if item['LUTData'].VR == VR.OW:
            endianness = '<' if ds.is_little_endian else '>'
            unpack_fmt = '{}{}H'.format(endianness, nr_entries)
            unc_data = unpack(unpack_fmt, cast(bytes, item.LUTData))
        else:
            unc_data = cast(List[int], item.LUTData)

        lut_data: "np.ndarray" = np.asarray(unc_data, dtype=dtype)

        # IVs < `first_map` get set to first LUT entry (i.e. index 0)
        clipped_iv = np.zeros(arr.shape, dtype=arr.dtype)
        # IVs >= `first_map` are mapped by the Modality LUT
        # `first_map` may be negative, positive or 0
        mapped_pixels = arr >= first_map
        clipped_iv[mapped_pixels] = arr[mapped_pixels] - first_map
        # IVs > number of entries get set to last entry
        np.clip(clipped_iv, 0, nr_entries - 1, out=clipped_iv)

        return cast("np.ndarray", lut_data[clipped_iv])
    elif 'RescaleSlope' in ds and 'RescaleIntercept' in ds:
        arr = arr.astype(np.float64) * cast(float, ds.RescaleSlope)
        arr += cast(float, ds.RescaleIntercept)

    return arr


def apply_voi_lut(
    arr: "np.ndarray",
    ds: "Dataset",
    index: int = 0,
    prefer_lut: bool = True
) -> "np.ndarray":
    """Apply a VOI lookup table or windowing operation to `arr`.

    .. versionadded:: 1.4

    .. versionchanged:: 2.1

        Added the `prefer_lut` keyword parameter

    Parameters
    ----------
    arr : numpy.ndarray
        The :class:`~numpy.ndarray` to apply the VOI LUT or windowing operation
        to.
    ds : dataset.Dataset
        A dataset containing a :dcm:`VOI LUT Module<part03/sect_C.11.2.html>`.
        If (0028,3010) *VOI LUT Sequence* is present then returns an array
        of ``np.uint8`` or ``np.uint16``, depending on the 3rd value of
        (0028,3002) *LUT Descriptor*. If (0028,1050) *Window Center* and
        (0028,1051) *Window Width* are present then returns an array of
        ``np.float64``. If neither are present then `arr` will be returned
        unchanged.
    index : int, optional
        When the VOI LUT Module contains multiple alternative views, this is
        the index of the view to return (default ``0``).
    prefer_lut : bool
        When the VOI LUT Module contains both *Window Width*/*Window Center*
        and *VOI LUT Sequence*, if ``True`` (default) then apply the VOI LUT,
        otherwise apply the windowing operation.

    Returns
    -------
    numpy.ndarray
        An array with applied VOI LUT or windowing operation.

    Notes
    -----
    When the dataset requires a modality LUT or rescale operation as part of
    the Modality LUT module then that must be applied before any windowing
    operation.

    See Also
    --------
    :func:`~pydicom.pixel_data_handlers.util.apply_modality_lut`
    :func:`~pydicom.pixel_data_handlers.util.apply_voi`
    :func:`~pydicom.pixel_data_handlers.util.apply_windowing`

    References
    ----------
    * DICOM Standard, Part 3, :dcm:`Annex C.11.2
      <part03/sect_C.11.html#sect_C.11.2>`
    * DICOM Standard, Part 3, :dcm:`Annex C.8.11.3.1.5
      <part03/sect_C.8.11.3.html#sect_C.8.11.3.1.5>`
    * DICOM Standard, Part 4, :dcm:`Annex N.2.1.1
      <part04/sect_N.2.html#sect_N.2.1.1>`
    """
    valid_voi = False
    if ds.get('VOILUTSequence'):
        ds.VOILUTSequence = cast(List["Dataset"], ds.VOILUTSequence)
        valid_voi = None not in [
            ds.VOILUTSequence[0].get('LUTDescriptor', None),
            ds.VOILUTSequence[0].get('LUTData', None)
        ]
    valid_windowing = None not in [
        ds.get('WindowCenter', None),
        ds.get('WindowWidth', None)
    ]

    if valid_voi and valid_windowing:
        if prefer_lut:
            return apply_voi(arr, ds, index)

        return apply_windowing(arr, ds, index)

    if valid_voi:
        return apply_voi(arr, ds, index)

    if valid_windowing:
        return apply_windowing(arr, ds, index)

    return arr


def apply_voi(
    arr: "np.ndarray", ds: "Dataset", index: int = 0
) -> "np.ndarray":
    """Apply a VOI lookup table to `arr`.

    .. versionadded:: 2.1

    Parameters
    ----------
    arr : numpy.ndarray
        The :class:`~numpy.ndarray` to apply the VOI LUT to.
    ds : dataset.Dataset
        A dataset containing a :dcm:`VOI LUT Module<part03/sect_C.11.2.html>`.
        If (0028,3010) *VOI LUT Sequence* is present then returns an array
        of ``np.uint8`` or ``np.uint16``, depending on the 3rd value of
        (0028,3002) *LUT Descriptor*, otherwise `arr` will be returned
        unchanged.
    index : int, optional
        When the VOI LUT Module contains multiple alternative views, this is
        the index of the view to return (default ``0``).

    Returns
    -------
    numpy.ndarray
        An array with applied VOI LUT.

    See Also
    --------
    :func:`~pydicom.pixel_data_handlers.util.apply_modality_lut`
    :func:`~pydicom.pixel_data_handlers.util.apply_windowing`

    References
    ----------
    * DICOM Standard, Part 3, :dcm:`Annex C.11.2
      <part03/sect_C.11.html#sect_C.11.2>`
    * DICOM Standard, Part 3, :dcm:`Annex C.8.11.3.1.5
      <part03/sect_C.8.11.3.html#sect_C.8.11.3.1.5>`
    * DICOM Standard, Part 4, :dcm:`Annex N.2.1.1
      <part04/sect_N.2.html#sect_N.2.1.1>`
    """
    if not ds.get('VOILUTSequence'):
        return arr

    if not np.issubdtype(arr.dtype, np.integer):
        warnings.warn(
            "Applying a VOI LUT on a float input array may give "
            "incorrect results"
        )

    # VOI LUT Sequence contains one or more items
    item = cast(List["Dataset"], ds.VOILUTSequence)[index]
    lut_descriptor = cast(List[int], item.LUTDescriptor)
    nr_entries = lut_descriptor[0] or 2**16
    first_map = lut_descriptor[1]

    # PS3.3 C.8.11.3.1.5: may be 8, 10-16
    nominal_depth = lut_descriptor[2]
    if nominal_depth in list(range(10, 17)):
        dtype = 'uint16'
    elif nominal_depth == 8:
        dtype = 'uint8'
    else:
        raise NotImplementedError(
            f"'{nominal_depth}' bits per LUT entry is not supported"
        )

    # Ambiguous VR, US or OW
    unc_data: Iterable[int]
    if item['LUTData'].VR == VR.OW:
        endianness = '<' if ds.is_little_endian else '>'
        unpack_fmt = f'{endianness}{nr_entries}H'
        unc_data = unpack(unpack_fmt, cast(bytes, item.LUTData))
    else:
        unc_data = cast(List[int], item.LUTData)

    lut_data: "np.ndarray" = np.asarray(unc_data, dtype=dtype)

    # IVs < `first_map` get set to first LUT entry (i.e. index 0)
    clipped_iv = np.zeros(arr.shape, dtype=dtype)
    # IVs >= `first_map` are mapped by the VOI LUT
    # `first_map` may be negative, positive or 0
    mapped_pixels = arr >= first_map
    clipped_iv[mapped_pixels] = arr[mapped_pixels] - first_map
    # IVs > number of entries get set to last entry
    np.clip(clipped_iv, 0, nr_entries - 1, out=clipped_iv)

    return cast("np.ndarray", lut_data[clipped_iv])


def apply_windowing(
    arr: "np.ndarray", ds: "Dataset", index: int = 0
) -> "np.ndarray":
    """Apply a windowing operation to `arr`.

    .. versionadded:: 2.1

    Parameters
    ----------
    arr : numpy.ndarray
        The :class:`~numpy.ndarray` to apply the windowing operation to.
    ds : dataset.Dataset
        A dataset containing a :dcm:`VOI LUT Module<part03/sect_C.11.2.html>`.
        If (0028,1050) *Window Center* and (0028,1051) *Window Width* are
        present then returns an array of ``np.float64``, otherwise `arr` will
        be returned unchanged.
    index : int, optional
        When the VOI LUT Module contains multiple alternative views, this is
        the index of the view to return (default ``0``).

    Returns
    -------
    numpy.ndarray
        An array with applied windowing operation.

    Notes
    -----
    When the dataset requires a modality LUT or rescale operation as part of
    the Modality LUT module then that must be applied before any windowing
    operation.

    See Also
    --------
    :func:`~pydicom.pixel_data_handlers.util.apply_modality_lut`
    :func:`~pydicom.pixel_data_handlers.util.apply_voi`

    References
    ----------
    * DICOM Standard, Part 3, :dcm:`Annex C.11.2
      <part03/sect_C.11.html#sect_C.11.2>`
    * DICOM Standard, Part 3, :dcm:`Annex C.8.11.3.1.5
      <part03/sect_C.8.11.3.html#sect_C.8.11.3.1.5>`
    * DICOM Standard, Part 4, :dcm:`Annex N.2.1.1
      <part04/sect_N.2.html#sect_N.2.1.1>`
    """
    if "WindowWidth" not in ds and "WindowCenter" not in ds:
        return arr

    if ds.PhotometricInterpretation not in ['MONOCHROME1', 'MONOCHROME2']:
        raise ValueError(
            "When performing a windowing operation only 'MONOCHROME1' and "
            "'MONOCHROME2' are allowed for (0028,0004) Photometric "
            "Interpretation"
        )

    # May be LINEAR (default), LINEAR_EXACT, SIGMOID or not present, VM 1
    voi_func = cast(str, getattr(ds, 'VOILUTFunction', 'LINEAR')).upper()
    # VR DS, VM 1-n
    elem = ds['WindowCenter']
    center = (
        cast(List[float], elem.value)[index] if elem.VM > 1 else elem.value
    )
    center = cast(float, center)
    elem = ds['WindowWidth']
    width = cast(List[float], elem.value)[index] if elem.VM > 1 else elem.value
    width = cast(float, width)

    # The output range depends on whether or not a modality LUT or rescale
    #   operation has been applied
    ds.BitsStored = cast(int, ds.BitsStored)
    y_min: float
    y_max: float
    if ds.get('ModalityLUTSequence'):
        # Unsigned - see PS3.3 C.11.1.1.1
        y_min = 0
        item = cast(List["Dataset"], ds.ModalityLUTSequence)[0]
        bit_depth = cast(List[int], item.LUTDescriptor)[2]
        y_max = 2**bit_depth - 1
    elif ds.PixelRepresentation == 0:
        # Unsigned
        y_min = 0
        y_max = 2**ds.BitsStored - 1
    else:
        # Signed
        y_min = -2**(ds.BitsStored - 1)
        y_max = 2**(ds.BitsStored - 1) - 1

    slope = ds.get('RescaleSlope', None)
    intercept = ds.get('RescaleIntercept', None)
    if slope is not None and intercept is not None:
        ds.RescaleSlope = cast(float, ds.RescaleSlope)
        ds.RescaleIntercept = cast(float, ds.RescaleIntercept)
        # Otherwise its the actual data range
        y_min = y_min * ds.RescaleSlope + ds.RescaleIntercept
        y_max = y_max * ds.RescaleSlope + ds.RescaleIntercept

    y_range = y_max - y_min
    arr = arr.astype('float64')

    if voi_func in ['LINEAR', 'LINEAR_EXACT']:
        # PS3.3 C.11.2.1.2.1 and C.11.2.1.3.2
        if voi_func == 'LINEAR':
            if width < 1:
                raise ValueError(
                    "The (0028,1051) Window Width must be greater than or "
                    "equal to 1 for a 'LINEAR' windowing operation"
                )
            center -= 0.5
            width -= 1
        elif width <= 0:
            raise ValueError(
                "The (0028,1051) Window Width must be greater than 0 "
                "for a 'LINEAR_EXACT' windowing operation"
            )

        below = arr <= (center - width / 2)
        above = arr > (center + width / 2)
        between = np.logical_and(~below, ~above)

        arr[below] = y_min
        arr[above] = y_max
        if between.any():
            arr[between] = (
                ((arr[between] - center) / width + 0.5) * y_range + y_min
            )
    elif voi_func == 'SIGMOID':
        # PS3.3 C.11.2.1.3.1
        if width <= 0:
            raise ValueError(
                "The (0028,1051) Window Width must be greater than 0 "
                "for a 'SIGMOID' windowing operation"
            )

        arr = y_range / (1 + np.exp(-4 * (arr - center) / width)) + y_min
    else:
        raise ValueError(
            f"Unsupported (0028,1056) VOI LUT Function value '{voi_func}'"
        )

    return arr


def convert_color_space(
    arr: "np.ndarray", current: str, desired: str, per_frame: bool = False
) -> "np.ndarray":
    """Convert the image(s) in `arr` from one color space to another.

    .. versionchanged:: 1.4

        Added support for ``YBR_FULL_422``

    .. versionchanged:: 2.2

        Added `per_frame` keyword parameter.

    Parameters
    ----------
    arr : numpy.ndarray
        The image(s) as a :class:`numpy.ndarray` with
        :attr:`~numpy.ndarray.shape` (frames, rows, columns, 3)
        or (rows, columns, 3).
    current : str
        The current color space, should be a valid value for (0028,0004)
        *Photometric Interpretation*. One of ``'RGB'``, ``'YBR_FULL'``,
        ``'YBR_FULL_422'``.
    desired : str
        The desired color space, should be a valid value for (0028,0004)
        *Photometric Interpretation*. One of ``'RGB'``, ``'YBR_FULL'``,
        ``'YBR_FULL_422'``.
    per_frame : bool, optional
        If ``True`` and the input array contains multiple frames then process
        each frame individually to reduce memory usage. Default ``False``.

    Returns
    -------
    numpy.ndarray
        The image(s) converted to the desired color space.

    References
    ----------

    * DICOM Standard, Part 3,
      :dcm:`Annex C.7.6.3.1.2<part03/sect_C.7.6.3.html#sect_C.7.6.3.1.2>`
    * ISO/IEC 10918-5:2012 (`ITU T.871
      <https://www.ijg.org/files/T-REC-T.871-201105-I!!PDF-E.pdf>`_),
      Section 7
    """
    def _no_change(arr: "np.ndarray") -> "np.ndarray":
        return arr

    _converters = {
        'YBR_FULL_422': {
            'YBR_FULL_422': _no_change,
            'YBR_FULL': _no_change,
            'RGB': _convert_YBR_FULL_to_RGB,
        },
        'YBR_FULL': {
            'YBR_FULL': _no_change,
            'YBR_FULL_422': _no_change,
            'RGB': _convert_YBR_FULL_to_RGB,
        },
        'RGB': {
            'RGB': _no_change,
            'YBR_FULL': _convert_RGB_to_YBR_FULL,
            'YBR_FULL_422': _convert_RGB_to_YBR_FULL,
        }
    }
    try:
        converter = _converters[current][desired]
    except KeyError:
        raise NotImplementedError(
            f"Conversion from {current} to {desired} is not supported."
        )

    if len(arr.shape) == 4 and per_frame:
        for idx, frame in enumerate(arr):
            arr[idx] = converter(frame)

        return arr

    return converter(arr)


def _convert_RGB_to_YBR_FULL(arr: "np.ndarray") -> "np.ndarray":
    """Return an ndarray converted from RGB to YBR_FULL color space.

    Parameters
    ----------
    arr : numpy.ndarray
        An ndarray of an 8-bit per channel images in RGB color space.

    Returns
    -------
    numpy.ndarray
        The array in YBR_FULL color space.

    References
    ----------

    * DICOM Standard, Part 3,
      :dcm:`Annex C.7.6.3.1.2<part03/sect_C.7.6.3.html#sect_C.7.6.3.1.2>`
    * ISO/IEC 10918-5:2012 (`ITU T.871
      <https://www.ijg.org/files/T-REC-T.871-201105-I!!PDF-E.pdf>`_),
      Section 7
    """
    orig_dtype = arr.dtype

    rgb_to_ybr = np.asarray(
        [[+0.299, -0.299 / 1.772, +0.701 / 1.402],
         [+0.587, -0.587 / 1.772, -0.587 / 1.402],
         [+0.114, +0.886 / 1.772, -0.114 / 1.402]],
        dtype=np.float32
    )

    arr = np.matmul(arr, rgb_to_ybr, dtype=np.float32)
    arr += [0.5, 128.5, 128.5]
    # Round(x) -> floor of (arr + 0.5) : 0.5 added in previous step
    np.floor(arr, out=arr)
    # Max(0, arr) -> 0 if 0 >= arr, arr otherwise
    # Min(arr, 255) -> arr if arr <= 255, 255 otherwise
    np.clip(arr, 0, 255, out=arr)

    return arr.astype(orig_dtype)


def _convert_YBR_FULL_to_RGB(arr: "np.ndarray") -> "np.ndarray":
    """Return an ndarray converted from YBR_FULL to RGB color space.

    Parameters
    ----------
    arr : numpy.ndarray
        An ndarray of an 8-bit per channel images in YBR_FULL color space.

    Returns
    -------
    numpy.ndarray
        The array in RGB color space.

    References
    ----------

    * DICOM Standard, Part 3,
      :dcm:`Annex C.7.6.3.1.2<part03/sect_C.7.6.3.html#sect_C.7.6.3.1.2>`
    * ISO/IEC 10918-5:2012, Section 7
    """
    orig_dtype = arr.dtype

    ybr_to_rgb = np.asarray(
        [[1.000, 1.000, 1.000],
         [0.000, -0.114 * 1.772 / 0.587, 1.772],
         [1.402, -0.299 * 1.402 / 0.587, 0.000]],
        dtype=np.float32
    )

    arr = arr.astype(np.float32)
    arr -= [0, 128, 128]

    # Round(x) -> floor of (arr + 0.5)
    np.matmul(arr, ybr_to_rgb, out=arr)
    arr += 0.5
    np.floor(arr, out=arr)
    # Max(0, arr) -> 0 if 0 >= arr, arr otherwise
    # Min(arr, 255) -> arr if arr <= 255, 255 otherwise
    np.clip(arr, 0, 255, out=arr)

    return arr.astype(orig_dtype)


def dtype_corrected_for_endianness(
    is_little_endian: bool, numpy_dtype: "np.dtype"
) -> "np.dtype":
    """Return a :class:`numpy.dtype` corrected for system and :class:`Dataset`
    endianness.

    Parameters
    ----------
    is_little_endian : bool
        The endianness of the affected :class:`~pydicom.dataset.Dataset`.
    numpy_dtype : numpy.dtype
        The numpy data type used for the *Pixel Data* without considering
        endianness.

    Raises
    ------
    ValueError
        If `is_little_endian` is ``None``, e.g. not initialized.

    Returns
    -------
    numpy.dtype
        The numpy data type used for the *Pixel Data* without considering
        endianness.
    """
    if is_little_endian is None:
        raise ValueError("Dataset attribute 'is_little_endian' "
                         "has to be set before writing the dataset")

    if is_little_endian != (byteorder == 'little'):
        return numpy_dtype.newbyteorder('S')

    return numpy_dtype


def expand_ybr422(src: ByteString, bits_allocated: int) -> bytes:
    """Return ``YBR_FULL_422`` data expanded to ``YBR_FULL``.

    Uncompressed datasets with a (0028,0004) *Photometric Interpretation* of
    ``"YBR_FULL_422"`` are subsampled in the horizontal direction by halving
    the number of Cb and Cr pixels (i.e. there are two Y pixels for every Cb
    and Cr pixel). This function expands the ``YBR_FULL_422`` data to remove
    the subsampling and the output is therefore ``YBR_FULL``.

    Parameters
    ----------
    src : bytes or bytearray
        The YBR_FULL_422 pixel data to be expanded.
    bits_allocated : int
        The number of bits used to store each pixel, as given by (0028,0100)
        *Bits Allocated*.

    Returns
    -------
    bytes
        The expanded data (as YBR_FULL).
    """
    # YBR_FULL_422 is Y Y Cb Cr (i.e. 2 Y pixels for every Cb and Cr pixel)
    n_bytes = bits_allocated // 8
    length = len(src) // 2 * 3
    dst = bytearray(length)

    step_src = n_bytes * 4
    step_dst = n_bytes * 6
    for ii in range(n_bytes):
        c_b = src[2 * n_bytes + ii::step_src]
        c_r = src[3 * n_bytes + ii::step_src]

        dst[0 * n_bytes + ii::step_dst] = src[0 * n_bytes + ii::step_src]
        dst[1 * n_bytes + ii::step_dst] = c_b
        dst[2 * n_bytes + ii::step_dst] = c_r

        dst[3 * n_bytes + ii::step_dst] = src[1 * n_bytes + ii::step_src]
        dst[4 * n_bytes + ii::step_dst] = c_b
        dst[5 * n_bytes + ii::step_dst] = c_r

    return bytes(dst)


def _expand_segmented_lut(
    data: Tuple[int, ...],
    fmt: str,
    nr_segments: Optional[int] = None,
    last_value: Optional[int] = None
) -> List[int]:
    """Return a list containing the expanded lookup table data.

    Parameters
    ----------
    data : tuple of int
        The decoded segmented palette lookup table data. May be padded by a
        trailing null.
    fmt : str
        The format of the data, should contain `'B'` for 8-bit, `'H'` for
        16-bit, `'<'` for little endian and `'>'` for big endian.
    nr_segments : int, optional
        Expand at most `nr_segments` from the data. Should be used when
        the opcode is ``2`` (indirect). If used then `last_value` should also
        be used.
    last_value : int, optional
        The previous value in the expanded lookup table. Should be used when
        the opcode is ``2`` (indirect). If used then `nr_segments` should also
        be used.

    Returns
    -------
    list of int
        The reconstructed lookup table data.

    References
    ----------

    * DICOM Standard, Part 3, Annex C.7.9
    """
    # Indirect segment byte offset is dependent on endianness for 8-bit
    # Little endian: e.g. 0x0302 0x0100, big endian, e.g. 0x0203 0x0001
    indirect_ii = [3, 2, 1, 0] if '<' in fmt else [2, 3, 0, 1]

    lut: List[int] = []
    offset = 0
    segments_read = 0
    # Use `offset + 1` to account for possible trailing null
    #   can do this because all segment types are longer than 2
    while offset + 1 < len(data):
        opcode = data[offset]
        length = data[offset + 1]
        offset += 2

        if opcode == 0:
            # C.7.9.2.1: Discrete segment
            lut.extend(data[offset:offset + length])
            offset += length
        elif opcode == 1:
            # C.7.9.2.2: Linear segment
            if lut:
                y0 = lut[-1]
            elif last_value:
                # Indirect segment with linear segment at 0th offset
                y0 = last_value
            else:
                raise ValueError(
                    "Error expanding a segmented palette color lookup table: "
                    "the first segment cannot be a linear segment"
                )

            y1 = data[offset]
            offset += 1

            if y0 == y1:
                lut.extend([y1] * length)
            else:
                step = (y1 - y0) / length
                vals = np.around(np.linspace(y0 + step, y1, length))
                lut.extend([int(vv) for vv in vals])
        elif opcode == 2:
            # C.7.9.2.3: Indirect segment
            if not lut:
                raise ValueError(
                    "Error expanding a segmented palette color lookup table: "
                    "the first segment cannot be an indirect segment"
                )

            if 'B' in fmt:
                # 8-bit segment entries
                ii = [data[offset + vv] for vv in indirect_ii]
                byte_offset = (ii[0] << 8 | ii[1]) << 16 | (ii[2] << 8 | ii[3])
                offset += 4
            else:
                # 16-bit segment entries
                byte_offset = data[offset + 1] << 16 | data[offset]
                offset += 2

            lut.extend(
                _expand_segmented_lut(data[byte_offset:], fmt, length, lut[-1])
            )
        else:
            raise ValueError(
                "Error expanding a segmented palette lookup table: "
                f"unknown segment type '{opcode}'"
            )

        segments_read += 1
        if segments_read == nr_segments:
            return lut

    return lut


def get_expected_length(ds: "Dataset", unit: str = 'bytes') -> int:
    """Return the expected length (in terms of bytes or pixels) of the *Pixel
    Data*.

    +------------------------------------------------+-------------+
    | Element                                        | Required or |
    +-------------+---------------------------+------+ optional    |
    | Tag         | Keyword                   | Type |             |
    +=============+===========================+======+=============+
    | (0028,0002) | SamplesPerPixel           | 1    | Required    |
    +-------------+---------------------------+------+-------------+
    | (0028,0004) | PhotometricInterpretation | 1    | Required    |
    +-------------+---------------------------+------+-------------+
    | (0028,0008) | NumberOfFrames            | 1C   | Optional    |
    +-------------+---------------------------+------+-------------+
    | (0028,0010) | Rows                      | 1    | Required    |
    +-------------+---------------------------+------+-------------+
    | (0028,0011) | Columns                   | 1    | Required    |
    +-------------+---------------------------+------+-------------+
    | (0028,0100) | BitsAllocated             | 1    | Required    |
    +-------------+---------------------------+------+-------------+

    .. versionchanged:: 1.4

        Added support for a *Photometric Interpretation* of  ``YBR_FULL_422``

    Parameters
    ----------
    ds : Dataset
        The :class:`~pydicom.dataset.Dataset` containing the Image Pixel module
        and *Pixel Data*.
    unit : str, optional
        If ``'bytes'`` then returns the expected length of the *Pixel Data* in
        whole bytes and NOT including an odd length trailing NULL padding
        byte. If ``'pixels'`` then returns the expected length of the *Pixel
        Data* in terms of the total number of pixels (default ``'bytes'``).

    Returns
    -------
    int
        The expected length of the *Pixel Data* in either whole bytes or
        pixels, excluding the NULL trailing padding byte for odd length data.
    """
    rows = cast(int, ds.Rows)
    columns = cast(int, ds.Columns)
    samples_per_pixel = cast(int, ds.SamplesPerPixel)
    bits_allocated = cast(int, ds.BitsAllocated)

    length = rows * columns * samples_per_pixel
    length *= get_nr_frames(ds)

    if unit == 'pixels':
        return length

    # Correct for the number of bytes per pixel
    if bits_allocated == 1:
        # Determine the nearest whole number of bytes needed to contain
        #   1-bit pixel data. e.g. 10 x 10 1-bit pixels is 100 bits, which
        #   are packed into 12.5 -> 13 bytes
        length = length // 8 + (length % 8 > 0)
    else:
        length *= bits_allocated // 8

    # DICOM Standard, Part 4, Annex C.7.6.3.1.2
    if ds.PhotometricInterpretation == 'YBR_FULL_422':
        length = length // 3 * 2

    return length


def get_image_pixel_ids(ds: "Dataset") -> Dict[str, int]:
    """Return a dict of the pixel data affecting element's :func:`id` values.

    .. versionadded:: 1.4

    +------------------------------------------------+
    | Element                                        |
    +-------------+---------------------------+------+
    | Tag         | Keyword                   | Type |
    +=============+===========================+======+
    | (0028,0002) | SamplesPerPixel           | 1    |
    +-------------+---------------------------+------+
    | (0028,0004) | PhotometricInterpretation | 1    |
    +-------------+---------------------------+------+
    | (0028,0006) | PlanarConfiguration       | 1C   |
    +-------------+---------------------------+------+
    | (0028,0008) | NumberOfFrames            | 1C   |
    +-------------+---------------------------+------+
    | (0028,0010) | Rows                      | 1    |
    +-------------+---------------------------+------+
    | (0028,0011) | Columns                   | 1    |
    +-------------+---------------------------+------+
    | (0028,0100) | BitsAllocated             | 1    |
    +-------------+---------------------------+------+
    | (0028,0101) | BitsStored                | 1    |
    +-------------+---------------------------+------+
    | (0028,0103) | PixelRepresentation       | 1    |
    +-------------+---------------------------+------+
    | (7FE0,0008) | FloatPixelData            | 1C   |
    +-------------+---------------------------+------+
    | (7FE0,0009) | DoubleFloatPixelData      | 1C   |
    +-------------+---------------------------+------+
    | (7FE0,0010) | PixelData                 | 1C   |
    +-------------+---------------------------+------+

    Parameters
    ----------
    ds : Dataset
        The :class:`~pydicom.dataset.Dataset` containing the pixel data.

    Returns
    -------
    dict
        A dict containing the :func:`id` values for the elements that affect
        the pixel data.

    """
    keywords = [
        'SamplesPerPixel', 'PhotometricInterpretation', 'PlanarConfiguration',
        'NumberOfFrames', 'Rows', 'Columns', 'BitsAllocated', 'BitsStored',
        'PixelRepresentation', 'FloatPixelData', 'DoubleFloatPixelData',
        'PixelData'
    ]

    return {kw: id(getattr(ds, kw, None)) for kw in keywords}


def get_j2k_parameters(codestream: bytes) -> Dict[str, object]:
    """Return a dict containing JPEG 2000 component parameters.

    .. versionadded:: 2.1

    Parameters
    ----------
    codestream : bytes
        The JPEG 2000 (ISO/IEC 15444-1) codestream to be parsed.

    Returns
    -------
    dict
        A dict containing parameters for the first component sample in the
        JPEG 2000 `codestream`, or an empty dict if unable to parse the data.
        Available parameters are ``{"precision": int, "is_signed": bool}``.
    """
    try:
        # First 2 bytes must be the SOC marker - if not then wrong format
        if codestream[0:2] != b'\xff\x4f':
            return {}

        # SIZ is required to be the second marker - Figure A-3 in 15444-1
        if codestream[2:4] != b'\xff\x51':
            return {}

        # See 15444-1 A.5.1 for format of the SIZ box and contents
        ssiz = codestream[42]
        if ssiz & 0x80:
            return {"precision": (ssiz & 0x7F) + 1, "is_signed": True}

        return {"precision": ssiz + 1, "is_signed": False}
    except (IndexError, TypeError):
        pass

    return {}


def get_nr_frames(ds: "Dataset") -> int:
    """Return NumberOfFrames or 1 if NumberOfFrames is None.

    Parameters
    ----------
    ds : dataset.Dataset
        The :class:`~pydicom.dataset.Dataset` containing the Image Pixel module
        corresponding to the data in `arr`.

    Returns
    -------
    int
        An integer for the NumberOfFrames or 1 if NumberOfFrames is None
    """
    nr_frames: Optional[int] = getattr(ds, 'NumberOfFrames', 1)
    # 'NumberOfFrames' may exist in the DICOM file but have value equal to None
    if nr_frames is None:
        warnings.warn("A value of None for (0028,0008) 'Number of Frames' is "
                      "non-conformant. It's recommended that this value be "
                      "changed to 1")
        nr_frames = 1

    return nr_frames


def pack_bits(arr: "np.ndarray", pad: bool = True) -> bytes:
    """Pack a binary :class:`numpy.ndarray` for use with *Pixel Data*.

    .. versionadded:: 1.2

    Should be used in conjunction with (0028,0100) *Bits Allocated* = 1.

    .. versionchanged:: 2.1

        Added the `pad` keyword parameter and changed to allow `arr` to be
        2 or 3D.

    Parameters
    ----------
    arr : numpy.ndarray
        The :class:`numpy.ndarray` containing 1-bit data as ints. `arr` must
        only contain integer values of 0 and 1 and must have an 'uint'  or
        'int' :class:`numpy.dtype`. For the sake of efficiency it's recommended
        that the length of `arr` be a multiple of 8 (i.e. that any empty
        bit-padding to round out the byte has already been added). The input
        `arr` should either be shaped as (rows, columns) or (frames, rows,
        columns) or the equivalent 1D array used to ensure that the packed
        data is in the correct order.
    pad : bool, optional
        If ``True`` (default) then add a null byte to the end of the packed
        data to ensure even length, otherwise no padding will be added.

    Returns
    -------
    bytes
        The bit packed data.

    Raises
    ------
    ValueError
        If `arr` contains anything other than 0 or 1.

    References
    ----------
    DICOM Standard, Part 5,
    :dcm:`Section 8.1.1<part05/chapter_8.html#sect_8.1.1>` and
    :dcm:`Annex D<part05/chapter_D.html>`
    """
    if arr.shape == (0,):
        return bytes()

    # Test array
    if not np.array_equal(arr, arr.astype(bool)):
        raise ValueError(
            "Only binary arrays (containing ones or zeroes) can be packed."
        )

    if len(arr.shape) > 1:
        arr = arr.ravel()

    # The array length must be a multiple of 8, pad the end
    if arr.shape[0] % 8:
        arr = np.append(arr, np.zeros(8 - arr.shape[0] % 8))

    arr = np.packbits(arr.astype('u1'), bitorder="little")

    packed: bytes = arr.tobytes()
    if pad:
        return packed + b'\x00' if len(packed) % 2 else packed

    return packed


def pixel_dtype(ds: "Dataset", as_float: bool = False) -> "np.dtype":
    """Return a :class:`numpy.dtype` for the pixel data in `ds`.

    Suitable for use with IODs containing the Image Pixel module (with
    ``as_float=False``) and the Floating Point Image Pixel and Double Floating
    Point Image Pixel modules (with ``as_float=True``).

    +------------------------------------------+------------------+
    | Element                                  | Supported        |
    +-------------+---------------------+------+ values           |
    | Tag         | Keyword             | Type |                  |
    +=============+=====================+======+==================+
    | (0028,0101) | BitsAllocated       | 1    | 1, 8, 16, 32, 64 |
    +-------------+---------------------+------+------------------+
    | (0028,0103) | PixelRepresentation | 1    | 0, 1             |
    +-------------+---------------------+------+------------------+

    .. versionchanged:: 1.4

        Added `as_float` keyword parameter and support for float dtypes.


    Parameters
    ----------
    ds : Dataset
        The :class:`~pydicom.dataset.Dataset` containing the pixel data you
        wish to get the data type for.
    as_float : bool, optional
        If ``True`` then return a float dtype, otherwise return an integer
        dtype (default ``False``). Float dtypes are only supported when
        (0028,0101) *Bits Allocated* is 32 or 64.

    Returns
    -------
    numpy.dtype
        A :class:`numpy.dtype` suitable for containing the pixel data.

    Raises
    ------
    NotImplementedError
        If the pixel data is of a type that isn't supported by either numpy
        or *pydicom*.
    """
    if not HAVE_NP:
        raise ImportError("Numpy is required to determine the dtype.")

    if ds.is_little_endian is None:
        ds.is_little_endian = ds.file_meta.TransferSyntaxUID.is_little_endian

    if not as_float:
        # (0028,0103) Pixel Representation, US, 1
        #   Data representation of the pixel samples
        #   0x0000 - unsigned int
        #   0x0001 - 2's complement (signed int)
        pixel_repr = cast(int, ds.PixelRepresentation)
        if pixel_repr == 0:
            dtype_str = 'uint'
        elif pixel_repr == 1:
            dtype_str = 'int'
        else:
            raise ValueError(
                "Unable to determine the data type to use to contain the "
                f"Pixel Data as a value of '{pixel_repr}' for '(0028,0103) "
                "Pixel Representation' is invalid"
            )
    else:
        dtype_str = 'float'

    # (0028,0100) Bits Allocated, US, 1
    #   The number of bits allocated for each pixel sample
    #   PS3.5 8.1.1: Bits Allocated shall either be 1 or a multiple of 8
    #   For bit packed data we use uint8
    bits_allocated = cast(int, ds.BitsAllocated)
    if bits_allocated == 1:
        dtype_str = 'uint8'
    elif bits_allocated > 0 and bits_allocated % 8 == 0:
        dtype_str += str(bits_allocated)
    else:
        raise ValueError(
            "Unable to determine the data type to use to contain the "
            f"Pixel Data as a value of '{bits_allocated}' for '(0028,0100) "
            "Bits Allocated' is invalid"
        )

    # Check to see if the dtype is valid for numpy
    try:
        dtype = np.dtype(dtype_str)
    except TypeError:
        raise NotImplementedError(
            f"The data type '{dtype_str}' needed to contain the Pixel Data "
            "is not supported by numpy"
        )

    # Correct for endianness of the system vs endianness of the dataset
    if ds.is_little_endian != (byteorder == 'little'):
        # 'S' swap from current to opposite
        dtype = dtype.newbyteorder('S')

    return dtype


def reshape_pixel_array(ds: "Dataset", arr: "np.ndarray") -> "np.ndarray":
    """Return a reshaped :class:`numpy.ndarray` `arr`.

    +------------------------------------------+-----------+----------+
    | Element                                  | Supported |          |
    +-------------+---------------------+------+ values    |          |
    | Tag         | Keyword             | Type |           |          |
    +=============+=====================+======+===========+==========+
    | (0028,0002) | SamplesPerPixel     | 1    | N > 0     | Required |
    +-------------+---------------------+------+-----------+----------+
    | (0028,0006) | PlanarConfiguration | 1C   | 0, 1      | Optional |
    +-------------+---------------------+------+-----------+----------+
    | (0028,0008) | NumberOfFrames      | 1C   | N > 0     | Optional |
    +-------------+---------------------+------+-----------+----------+
    | (0028,0010) | Rows                | 1    | N > 0     | Required |
    +-------------+---------------------+------+-----------+----------+
    | (0028,0011) | Columns             | 1    | N > 0     | Required |
    +-------------+---------------------+------+-----------+----------+

    (0028,0008) *Number of Frames* is required when *Pixel Data* contains
    more than 1 frame. (0028,0006) *Planar Configuration* is required when
    (0028,0002) *Samples per Pixel* is greater than 1. For certain
    compressed transfer syntaxes it is always taken to be either 0 or 1 as
    shown in the table below.

    +---------------------------------------------+-----------------------+
    | Transfer Syntax                             | Planar Configuration  |
    +------------------------+--------------------+                       |
    | UID                    | Name               |                       |
    +========================+====================+=======================+
    | 1.2.840.10008.1.2.4.50 | JPEG Baseline      | 0                     |
    +------------------------+--------------------+-----------------------+
    | 1.2.840.10008.1.2.4.57 | JPEG Lossless,     | 0                     |
    |                        | Non-hierarchical   |                       |
    +------------------------+--------------------+-----------------------+
    | 1.2.840.10008.1.2.4.70 | JPEG Lossless,     | 0                     |
    |                        | Non-hierarchical,  |                       |
    |                        | SV1                |                       |
    +------------------------+--------------------+-----------------------+
    | 1.2.840.10008.1.2.4.80 | JPEG-LS Lossless   | 0                     |
    +------------------------+--------------------+-----------------------+
    | 1.2.840.10008.1.2.4.81 | JPEG-LS Lossy      | 0                     |
    +------------------------+--------------------+-----------------------+
    | 1.2.840.10008.1.2.4.90 | JPEG 2000 Lossless | 0                     |
    +------------------------+--------------------+-----------------------+
    | 1.2.840.10008.1.2.4.91 | JPEG 2000 Lossy    | 0                     |
    +------------------------+--------------------+-----------------------+
    | 1.2.840.10008.1.2.5    | RLE Lossless       | 1                     |
    +------------------------+--------------------+-----------------------+

    .. versionchanged:: 2.1

        JPEG-LS transfer syntaxes changed to *Planar Configuration* of 0

    Parameters
    ----------
    ds : dataset.Dataset
        The :class:`~pydicom.dataset.Dataset` containing the Image Pixel module
        corresponding to the data in `arr`.
    arr : numpy.ndarray
        The 1D array containing the pixel data.

    Returns
    -------
    numpy.ndarray
        A reshaped array containing the pixel data. The shape of the array
        depends on the contents of the dataset:

        * For single frame, single sample data (rows, columns)
        * For single frame, multi-sample data (rows, columns, planes)
        * For multi-frame, single sample data (frames, rows, columns)
        * For multi-frame, multi-sample data (frames, rows, columns, planes)

    References
    ----------

    * DICOM Standard, Part 3,
      :dcm:`Annex C.7.6.3.1<part03/sect_C.7.6.3.html#sect_C.7.6.3.1>`
    * DICOM Standard, Part 5, :dcm:`Section 8.2<part05/sect_8.2.html>`
    """
    if not HAVE_NP:
        raise ImportError("Numpy is required to reshape the pixel array.")

    nr_frames = get_nr_frames(ds)
    nr_samples = cast(int, ds.SamplesPerPixel)

    if nr_frames < 1:
        raise ValueError(
            f"Unable to reshape the pixel array as a value of {nr_frames} for "
            "(0028,0008) 'Number of Frames' is invalid."
        )

    if nr_samples < 1:
        raise ValueError(
            f"Unable to reshape the pixel array as a value of {nr_samples} "
            "for (0028,0002) 'Samples per Pixel' is invalid."
        )

    # Valid values for Planar Configuration are dependent on transfer syntax
    if nr_samples > 1:
        transfer_syntax = ds.file_meta.TransferSyntaxUID
        if transfer_syntax in ['1.2.840.10008.1.2.4.50',
                               '1.2.840.10008.1.2.4.57',
                               '1.2.840.10008.1.2.4.70',
                               '1.2.840.10008.1.2.4.80',
                               '1.2.840.10008.1.2.4.81',
                               '1.2.840.10008.1.2.4.90',
                               '1.2.840.10008.1.2.4.91']:
            planar_configuration = 0
        elif transfer_syntax in ['1.2.840.10008.1.2.5']:
            planar_configuration = 1
        else:
            planar_configuration = ds.PlanarConfiguration

        if planar_configuration not in [0, 1]:
            raise ValueError(
                "Unable to reshape the pixel array as a value of "
                f"{planar_configuration} for (0028,0006) 'Planar "
                "Configuration' is invalid."
            )

    rows = cast(int, ds.Rows)
    columns = cast(int, ds.Columns)
    if nr_frames > 1:
        # Multi-frame
        if nr_samples == 1:
            # Single plane
            arr = arr.reshape(nr_frames, rows, columns)
        else:
            # Multiple planes, usually 3
            if planar_configuration == 0:
                arr = arr.reshape(nr_frames, rows, columns, nr_samples)
            else:
                arr = arr.reshape(nr_frames, nr_samples, rows, columns)
                arr = arr.transpose(0, 2, 3, 1)
    else:
        # Single frame
        if nr_samples == 1:
            # Single plane
            arr = arr.reshape(rows, columns)
        else:
            # Multiple planes, usually 3
            if planar_configuration == 0:
                arr = arr.reshape(rows, columns, nr_samples)
            else:
                arr = arr.reshape(nr_samples, rows, columns)
                arr = arr.transpose(1, 2, 0)

    return arr


def unpack_bits(
    src: bytes, as_array: bool = True
) -> Union["np.ndarray", bytes]:
    """Unpack the bit-packed data in `src`.

    Suitable for use when (0028,0011) *Bits Allocated* or (60xx,0100) *Overlay
    Bits Allocated* is 1.

    If `NumPy <https://numpy.org/>`_ is available then it will be used to
    unpack the data, otherwise only the standard library will be used, which
    is about 20 times slower.

    .. versionchanged:: 2.3

        Added the `as_array` keyword parameter, support for unpacking
        without NumPy, and added :class:`bytes` as a possible return type

    Parameters
    ----------
    src : bytes
        The bit-packed data.
    as_array : bool, optional
        If ``False`` then return the unpacked data as :class:`bytes`, otherwise
        return a :class:`numpy.ndarray` (default, requires NumPy).

    Returns
    -------
    bytes or numpy.ndarray
        The unpacked data as an :class:`numpy.ndarray` (if NumPy is available
        and ``as_array == True``) or :class:`bytes` otherwise.

    Raises
    ------
    ValueError
        If `as_array` is ``True`` and NumPy is not available.

    References
    ----------
    DICOM Standard, Part 5,
    :dcm:`Section 8.1.1<part05/chapter_8.html#sect_8.1.1>` and
    :dcm:`Annex D<part05/chapter_D.html>`
    """
    if HAVE_NP:
        arr = np.frombuffer(src, dtype="u1")
        arr = np.unpackbits(arr, bitorder="little")

        return arr if as_array else arr.tobytes()

    if as_array:
        raise ValueError("unpack_bits() requires NumPy if 'as_array = True'")

    return b"".join(map(_UNPACK_LUT.__getitem__, src))
