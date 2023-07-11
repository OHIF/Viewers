# Copyright 2008-2021 pydicom authors. See LICENSE file for details.
"""Functions related to writing DICOM data."""

from struct import pack
import sys
from typing import (
    Union, BinaryIO, Any, cast, Sequence, MutableSequence, Iterable, Optional,
    List
)
import warnings
import zlib

from pydicom import config
from pydicom.charset import default_encoding, convert_encodings, encode_string
from pydicom.config import have_numpy
from pydicom.dataelem import DataElement_from_raw, DataElement, RawDataElement
from pydicom.dataset import Dataset, validate_file_meta, FileMetaDataset
from pydicom.filebase import DicomFile, DicomFileLike, DicomBytesIO, DicomIO
from pydicom.fileutil import path_from_pathlike, PathType
from pydicom.multival import MultiValue
from pydicom.tag import (Tag, ItemTag, ItemDelimiterTag, SequenceDelimiterTag,
                         tag_in_exception)
from pydicom.uid import DeflatedExplicitVRLittleEndian, UID
from pydicom.valuerep import (
    PersonName, IS, DSclass, DA, DT, TM, EXPLICIT_VR_LENGTH_32, VR,
    AMBIGUOUS_VR, CUSTOMIZABLE_CHARSET_VR, validate_value
)
from pydicom.values import convert_numbers

if have_numpy:
    import numpy


# (0018,9810) Zero Velocity Pixel Value
# (0022,1452) Mapped Pixel Value
# (0028,0104)/(0028,0105) Smallest/Largest Valid Pixel Value
# (0028,0106)/(0028,0107) Smallest/Largest Image Pixel Value
# (0028,0108)/(0028,0109) Smallest/Largest Pixel Value in Series
# (0028,0110)/(0028,0111) Smallest/Largest Image Pixel Value in Plane
# (0028,0120) Pixel Padding Value
# (0028,0121) Pixel Padding Range Limit
# (0028,1101-1103) Red/Green/Blue Palette Color Lookup Table Descriptor
# (0028,3002) LUT Descriptor
# (0040,9216)/(0040,9211) Real World Value First/Last Value Mapped
# (0060,3004)/(0060,3006) Histogram First/Last Bin Value
_us_ss_tags = {
    0x00189810, 0x00221452, 0x00280104, 0x00280105, 0x00280106,
    0x00280107, 0x00280108, 0x00280109, 0x00280110, 0x00280111,
    0x00280120, 0x00280121, 0x00281101, 0x00281102, 0x00281103,
    0x00283002, 0x00409211, 0x00409216, 0x00603004, 0x00603006,
}

# (5400,0110) Channel Minimum Value
# (5400,0112) Channel Maximum Value
# (5400,100A) Waveform Padding Data
# (5400,1010) Waveform Data
_ob_ow_tags = {0x54000110, 0x54000112, 0x5400100A, 0x54001010}

# (60xx,3000) Overlay Data
_overlay_data_tags = {x << 16 | 0x3000 for x in range(0x6000, 0x601F, 2)}


def _correct_ambiguous_vr_element(
    elem: DataElement, ds: Dataset, is_little_endian: bool
) -> DataElement:
    """Implementation for `correct_ambiguous_vr_element`.
    See `correct_ambiguous_vr_element` for description.
    """
    # 'OB or OW': 7fe0,0010 PixelData
    if elem.tag == 0x7fe00010:
        # Compressed Pixel Data
        # PS3.5 Annex A.4
        #   If encapsulated, VR is OB and length is undefined
        if elem.is_undefined_length:
            elem.VR = VR.OB
        elif ds.is_implicit_VR:
            # Non-compressed Pixel Data - Implicit Little Endian
            # PS3.5 Annex A1: VR is always OW
            elem.VR = VR.OW
        else:
            # Non-compressed Pixel Data - Explicit VR
            # PS3.5 Annex A.2:
            # If BitsAllocated is > 8 then VR shall be OW,
            # else may be OB or OW.
            # If we get here, the data has not been written before
            # or has been converted from Implicit Little Endian,
            # so we default to OB for BitsAllocated 1 or 8
            elem.VR = VR.OW if cast(int, ds.BitsAllocated) > 8 else VR.OB

    # 'US or SS' and dependent on PixelRepresentation
    elif elem.tag in _us_ss_tags:
        # US if PixelRepresentation value is 0x0000, else SS
        #   For references, see the list at
        #   https://github.com/darcymason/pydicom/pull/298
        # PixelRepresentation is usually set in the root dataset
        while 'PixelRepresentation' not in ds and ds.parent and ds.parent():
            ds = cast(Dataset, ds.parent())
        # if no pixel data is present, none if these tags is used,
        # so we can just ignore a missing PixelRepresentation in this case
        if (
            'PixelRepresentation' not in ds
            and 'PixelData' not in ds
            or ds.PixelRepresentation == 0
        ):
            elem.VR = VR.US
            byte_type = 'H'
        else:
            elem.VR = VR.SS
            byte_type = 'h'

        if elem.VM == 0:
            return elem

        # Need to handle type check for elements with VM > 1
        elem_value = (
            elem.value if elem.VM == 1 else cast(Sequence[Any], elem.value)[0]
        )
        if not isinstance(elem_value, int):
            elem.value = convert_numbers(
                cast(bytes, elem.value), is_little_endian, byte_type
            )

    # 'OB or OW' and dependent on WaveformBitsAllocated
    elif elem.tag in _ob_ow_tags:
        # If WaveformBitsAllocated is > 8 then OW, otherwise may be
        #   OB or OW.
        #   See PS3.3 C.10.9.1.
        if ds.is_implicit_VR:
            elem.VR = VR.OW
        else:
            elem.VR = (
                VR.OW if cast(int, ds.WaveformBitsAllocated) > 8 else VR.OB
            )

    # 'US or OW': 0028,3006 LUTData
    elif elem.tag == 0x00283006:
        # First value in LUT Descriptor is how many values in
        #   LUTData, if there's only one value then must be US
        # As per PS3.3 C.11.1.1.1
        if cast(Sequence[int], ds.LUTDescriptor)[0] == 1:
            elem.VR = VR.US
            if elem.VM == 0:
                return elem

            elem_value = (
                elem.value if elem.VM == 1
                else cast(Sequence[Any], elem.value)[0]
            )
            if not isinstance(elem_value, int):
                elem.value = convert_numbers(
                    cast(bytes, elem.value), is_little_endian, 'H'
                )
        else:
            elem.VR = VR.OW

    # 'OB or OW': 60xx,3000 OverlayData and dependent on Transfer Syntax
    elif elem.tag in _overlay_data_tags:
        # Implicit VR must be OW, explicit VR may be OB or OW
        #   as per PS3.5 Section 8.1.2 and Annex A
        elem.VR = VR.OW

    return elem


def correct_ambiguous_vr_element(
    elem: DataElement, ds: Dataset, is_little_endian: bool
) -> DataElement:
    """Attempt to correct the ambiguous VR element `elem`.

    When it's not possible to correct the VR, the element will be returned
    unchanged. Currently the only ambiguous VR elements not corrected for are
    all retired or part of DICONDE.

    If the VR is corrected and is 'US' or 'SS' then the value will be updated
    using the :func:`~pydicom.values.convert_numbers` function.

    Parameters
    ----------
    elem : dataelem.DataElement
        The element with an ambiguous VR.
    ds : dataset.Dataset
        The dataset containing `elem`.
    is_little_endian : bool
        The byte ordering of the values in the dataset.

    Returns
    -------
    dataelem.DataElement
        The corrected element
    """
    if elem.VR in AMBIGUOUS_VR:
        # convert raw data elements before handling them
        if isinstance(elem, RawDataElement):
            elem = DataElement_from_raw(elem, dataset=ds)
            ds.__setitem__(elem.tag, elem)

        try:
            _correct_ambiguous_vr_element(elem, ds, is_little_endian)
        except AttributeError as e:
            raise AttributeError(
                f"Failed to resolve ambiguous VR for tag {elem.tag}: " + str(e)
            )

    return elem


def correct_ambiguous_vr(ds: Dataset, is_little_endian: bool) -> Dataset:
    """Iterate through `ds` correcting ambiguous VR elements (if possible).

    When it's not possible to correct the VR, the element will be returned
    unchanged. Currently the only ambiguous VR elements not corrected for are
    all retired or part of DICONDE.

    If the VR is corrected and is 'US' or 'SS' then the value will be updated
    using the :func:`~pydicom.values.convert_numbers` function.

    Parameters
    ----------
    ds : pydicom.dataset.Dataset
        The dataset containing ambiguous VR elements.
    is_little_endian : bool
        The byte ordering of the values in the dataset.

    Returns
    -------
    ds : dataset.Dataset
        The corrected dataset

    Raises
    ------
    AttributeError
        If a tag is missing in `ds` that is required to resolve the ambiguity.
    """
    # Iterate through the elements
    for elem in ds:
        # raw data element sequences can be written as they are, because we
        # have ensured that the transfer syntax has not changed at this point
        if elem.VR == VR.SQ:
            for item in cast(MutableSequence[Dataset], elem.value):
                correct_ambiguous_vr(item, is_little_endian)
        elif elem.VR in AMBIGUOUS_VR:
            correct_ambiguous_vr_element(elem, ds, is_little_endian)
    return ds


def write_numbers(fp: DicomIO, elem: DataElement, struct_format: str) -> None:
    """Write a "value" of type struct_format from the dicom file.

    "Value" can be more than one number.

    Parameters
    ----------
    fp : file-like
        The file-like to write the encoded data to.
    elem : dataelem.DataElement
        The element to encode.
    struct_format : str
        The character format as used by the struct module.
    """
    endianChar = '><'[fp.is_little_endian]
    value = elem.value
    if value == "":
        return  # don't need to write anything for empty string

    format_string = endianChar + struct_format
    try:
        try:
            # works only if list, not if string or number
            value.append
        except AttributeError:  # is a single value - the usual case
            fp.write(pack(format_string, value))
        else:
            for val in cast(Iterable[Any], value):
                fp.write(pack(format_string, val))
    except Exception as e:
        raise IOError(
            f"{str(e)}\nfor data_element:\n{str(elem)}"
        )


def write_OBvalue(fp: DicomIO, elem: DataElement) -> None:
    """Write a data_element with VR of 'other byte' (OB)."""
    if len(elem.value) % 2:
        # Pad odd length values
        fp.write(cast(bytes, elem.value))
        fp.write(b'\x00')
    else:
        fp.write(cast(bytes, elem.value))


def write_OWvalue(fp: DicomIO, elem: DataElement) -> None:
    """Write a data_element with VR of 'other word' (OW).

    Note: This **does not currently do the byte swapping** for Endian state.
    """
    # XXX for now just write the raw bytes without endian swapping
    fp.write(cast(bytes, elem.value))


def write_UI(fp: DicomIO, elem: DataElement) -> None:
    """Write a data_element with VR of 'unique identifier' (UI)."""
    write_string(fp, elem, '\0')  # pad with 0-byte to even length


def _is_multi_value(val: Any) -> bool:
    """Return True if `val` is a multi-value container."""
    if have_numpy and isinstance(val, numpy.ndarray):
        return True

    return isinstance(val, (MultiValue, list, tuple))


def multi_string(val: Union[str, Iterable[str]]) -> str:
    """Put a string together with delimiter if has more than one value"""
    if _is_multi_value(val):
        return "\\".join(val)

    return cast(str, val)


def write_PN(
    fp: DicomIO, elem: DataElement, encodings: Optional[List[str]] = None
) -> None:
    if not encodings:
        encodings = [default_encoding]

    val: List[PersonName]
    if elem.VM == 1:
        val = [cast(PersonName, elem.value)]
    else:
        val = cast(List[PersonName], elem.value)

    enc = b'\\'.join([elem.encode(encodings) for elem in val])
    if len(enc) % 2 != 0:
        enc += b' '

    fp.write(enc)


def write_string(fp: DicomIO, elem: DataElement, padding: str = ' ') -> None:
    """Write a single or multivalued ASCII string."""
    val = multi_string(cast(Union[str, Iterable[str]], elem.value))
    if val is not None:
        if len(val) % 2 != 0:
            val += padding  # pad to even length

        if isinstance(val, str):
            val = val.encode(default_encoding)  # type: ignore[assignment]

        fp.write(val)  # type: ignore[arg-type]


def _encode_and_validate_string(vr: str, value: str,
                                encodings: Sequence[str]) -> bytes:
    encoded = encode_string(value, encodings)
    validate_value(vr, encoded, config.settings.writing_validation_mode)
    return encoded


def write_text(
    fp: DicomIO, elem: DataElement, encodings: Optional[List[str]] = None
) -> None:
    """Write a single or multivalued text string."""
    encodings = encodings or [default_encoding]
    val = elem.value
    if val is not None:
        if _is_multi_value(val):
            val = cast(Union[Sequence[bytes], Sequence[str]], val)
            if isinstance(val[0], str):
                val = cast(Sequence[str], val)
                val = b'\\'.join(
                    [_encode_and_validate_string(elem.VR, val, encodings)
                     for val in val]
                )
            else:
                val = cast(Sequence[bytes], val)
                val = b'\\'.join([val for val in val])
        else:
            val = cast(Union[bytes, str], val)
            if isinstance(val, str):
                val = _encode_and_validate_string(elem.VR, val, encodings)

        if len(val) % 2 != 0:
            val = val + b' '  # pad to even length
        fp.write(val)


def write_number_string(fp: DicomIO, elem: DataElement) -> None:
    """Handle IS or DS VR - write a number stored as a string of digits."""
    # If the DS or IS has an original_string attribute, use that, so that
    # unchanged data elements are written with exact string as when read from
    # file
    val = elem.value
    if _is_multi_value(val):
        val = cast(Union[Sequence[IS], Sequence[DSclass]], val)
        val = "\\".join(
            (
                x.original_string if hasattr(x, 'original_string')
                else str(x) for x in val
            )
        )
    else:
        val = cast(Union[IS, DSclass], val)
        if hasattr(val, 'original_string'):
            val = val.original_string
        else:
            val = str(val)

    if len(val) % 2 != 0:
        val = val + ' '  # pad to even length

    val = bytes(val, default_encoding)

    fp.write(val)


def _format_DA(val: Optional[DA]) -> str:
    if val is None:
        return ''

    if hasattr(val, 'original_string'):
        return val.original_string

    return val.strftime("%Y%m%d")


def write_DA(fp: DicomIO, elem: DataElement) -> None:
    val = elem.value
    if isinstance(val, str):
        write_string(fp, elem)
    else:
        if _is_multi_value(val):
            val = cast(Sequence[DA], val)
            val = "\\".join(
                (x if isinstance(x, str) else _format_DA(x) for x in val)
            )
        else:
            val = _format_DA(cast(DA, val))

        if len(val) % 2 != 0:
            val = val + ' '  # pad to even length

        if isinstance(val, str):
            val = val.encode(default_encoding)

        fp.write(val)


def _format_DT(val: Optional[DT]) -> str:
    if val is None:
        return ''

    if hasattr(val, 'original_string'):
        return val.original_string

    if val.microsecond > 0:
        return val.strftime("%Y%m%d%H%M%S.%f%z")

    return val.strftime("%Y%m%d%H%M%S%z")


def write_DT(fp: DicomIO, elem: DataElement) -> None:
    val = elem.value
    if isinstance(val, str):
        write_string(fp, elem)
    else:
        if _is_multi_value(val):
            val = cast(Sequence[DT], val)
            val = "\\".join(
                (x if isinstance(x, str) else _format_DT(x) for x in val)
            )
        else:
            val = _format_DT(cast(DT, val))

        if len(val) % 2 != 0:
            val = val + ' '  # pad to even length

        if isinstance(val, str):
            val = val.encode(default_encoding)

        fp.write(val)


def _format_TM(val: Optional[TM]) -> str:
    if val is None:
        return ''

    if hasattr(val, 'original_string'):
        return val.original_string

    if val.microsecond > 0:
        return val.strftime("%H%M%S.%f")

    return val.strftime("%H%M%S")


def write_TM(fp: DicomIO, elem: DataElement) -> None:
    val = elem.value
    if isinstance(val, str):
        write_string(fp, elem)
    else:
        if _is_multi_value(val):
            val = cast(Sequence[TM], val)
            val = "\\".join(
                (x if isinstance(x, str) else _format_TM(x) for x in val)
            )
        else:
            val = _format_TM(cast(TM, val))

        if len(val) % 2 != 0:
            val = val + ' '  # pad to even length

        if isinstance(val, str):
            val = val.encode(default_encoding)

        fp.write(val)


def write_data_element(
    fp: DicomIO,
    elem: Union[DataElement, RawDataElement],
    encodings: Optional[Union[str, List[str]]] = None
) -> None:
    """Write the data_element to file fp according to
    dicom media storage rules.
    """
    # Write element's tag
    fp.write_tag(elem.tag)

    # write into a buffer to avoid seeking back which can be expansive
    buffer = DicomBytesIO()
    buffer.is_little_endian = fp.is_little_endian
    buffer.is_implicit_VR = fp.is_implicit_VR

    vr: Optional[str] = elem.VR
    if not fp.is_implicit_VR and vr and len(vr) != 2:
        msg = (
            f"Cannot write ambiguous VR of '{vr}' for data element with "
            f"tag {repr(elem.tag)}.\nSet the correct VR before "
            f"writing, or use an implicit VR transfer syntax"
        )
        raise ValueError(msg)

    if elem.is_raw:
        elem = cast(RawDataElement, elem)
        # raw data element values can be written as they are
        buffer.write(cast(bytes, elem.value))
        is_undefined_length = elem.length == 0xFFFFFFFF
    else:
        elem = cast(DataElement, elem)
        if vr not in writers:
            raise NotImplementedError(
                f"write_data_element: unknown Value Representation '{vr}'"
            )

        encodings = encodings or [default_encoding]
        encodings = convert_encodings(encodings)
        fn, param = writers[cast(VR, vr)]
        is_undefined_length = elem.is_undefined_length
        if not elem.is_empty:
            if vr in CUSTOMIZABLE_CHARSET_VR or vr == VR.SQ:
                fn(buffer, elem, encodings=encodings)  # type: ignore[operator]
            else:
                # Many numeric types use the same writer but with
                # numeric format parameter
                if param is not None:
                    fn(buffer, elem, param)  # type: ignore[operator]
                else:
                    fn(buffer, elem)  # type: ignore[operator]

    # valid pixel data with undefined length shall contain encapsulated
    # data, e.g. sequence items - raise ValueError otherwise (see #238)
    if is_undefined_length and elem.tag == 0x7fe00010:
        encap_item = b'\xfe\xff\x00\xe0'
        if not fp.is_little_endian:
            # Non-conformant endianness
            encap_item = b'\xff\xfe\xe0\x00'
        if not cast(bytes, elem.value).startswith(encap_item):
            raise ValueError(
                "(7FE0,0010) Pixel Data has an undefined length indicating "
                "that it's compressed, but the data isn't encapsulated as "
                "required. See pydicom.encaps.encapsulate() for more "
                "information"
            )

    value_length = buffer.tell()
    if (
        not fp.is_implicit_VR
        and vr not in EXPLICIT_VR_LENGTH_32
        and not is_undefined_length
        and value_length > 0xffff
    ):
        # see PS 3.5, section 6.2.2 for handling of this case
        msg = (
            f"The value for the data element {elem.tag} exceeds the "
            f"size of 64 kByte and cannot be written in an explicit transfer "
            f"syntax. The data element VR is changed from '{vr}' to 'UN' "
            f"to allow saving the data."
        )
        warnings.warn(msg)
        vr = VR.UN

    # write the VR for explicit transfer syntax
    if not fp.is_implicit_VR:
        vr = cast(str, vr)
        fp.write(bytes(vr, default_encoding))

        if vr in EXPLICIT_VR_LENGTH_32:
            fp.write_US(0)  # reserved 2 bytes

    if (
        not fp.is_implicit_VR
        and vr not in EXPLICIT_VR_LENGTH_32
        and not is_undefined_length
    ):
        fp.write_US(value_length)  # Explicit VR length field is 2 bytes
    else:
        # write the proper length of the data_element in the length slot,
        # unless is SQ with undefined length.
        fp.write_UL(0xFFFFFFFF if is_undefined_length else value_length)

    fp.write(buffer.getvalue())
    if is_undefined_length:
        fp.write_tag(SequenceDelimiterTag)
        fp.write_UL(0)  # 4-byte 'length' of delimiter data item


def write_dataset(
    fp: DicomIO,
    dataset: Dataset,
    parent_encoding: Union[str, List[str]] = default_encoding
) -> int:
    """Write a Dataset dictionary to the file. Return the total length written.
    """
    _harmonize_properties(dataset, fp)

    if None in (dataset.is_little_endian, dataset.is_implicit_VR):
        name = dataset.__class__.__name__
        raise AttributeError(
            f"'{name}.is_little_endian' and '{name}.is_implicit_VR' must "
            f"be set appropriately before saving"
        )

    if not dataset.is_original_encoding:
        dataset = correct_ambiguous_vr(dataset, fp.is_little_endian)

    dataset_encoding = cast(
        Union[None, str, List[str]],
        dataset.get('SpecificCharacterSet', parent_encoding)
    )

    fpStart = fp.tell()
    # data_elements must be written in tag order
    tags = sorted(dataset.keys())

    for tag in tags:
        # do not write retired Group Length (see PS3.5, 7.2)
        if tag.element == 0 and tag.group > 6:
            continue

        with tag_in_exception(tag):
            write_data_element(fp, dataset.get_item(tag), dataset_encoding)

    return fp.tell() - fpStart


def _harmonize_properties(ds: Dataset, fp: DicomIO) -> None:
    """Make sure the properties in the dataset and the file pointer are
    consistent, so the user can set both with the same effect.
    Properties set on the destination file object always have preference.
    """
    # ensure preference of fp over dataset
    if hasattr(fp, 'is_little_endian'):
        ds.is_little_endian = fp.is_little_endian
    if hasattr(fp, 'is_implicit_VR'):
        ds.is_implicit_VR = fp.is_implicit_VR

    # write the properties back to have a consistent state
    fp.is_implicit_VR = cast(bool, ds.is_implicit_VR)
    fp.is_little_endian = cast(bool, ds.is_little_endian)


def write_sequence(
    fp: DicomIO, elem: DataElement, encodings: List[str]
) -> None:
    """Write a sequence contained in `data_element` to the file-like `fp`.

    Parameters
    ----------
    fp : file-like
        The file-like to write the encoded data to.
    data_element : dataelem.DataElement
        The sequence element to write to `fp`.
    encodings : list of str
        The character encodings to use on text values.
    """
    # write_data_element has already written the VR='SQ' (if needed) and
    #    a placeholder for length"""
    for ds in cast(Iterable[Dataset], elem.value):
        write_sequence_item(fp, ds, encodings)


def write_sequence_item(
    fp: DicomIO, dataset: Dataset, encodings: List[str]
) -> None:
    """Write a `dataset` in a sequence to the file-like `fp`.

    This is similar to writing a data_element, but with a specific tag for
    Sequence Item.

    See DICOM Standard, Part 5, :dcm:`Section 7.5<sect_7.5.html>`.

    Parameters
    ----------
    fp : file-like
        The file-like to write the encoded data to.
    dataset : Dataset
        The :class:`Dataset<pydicom.dataset.Dataset>` to write to `fp`.
    encodings : list of str
        The character encodings to use on text values.
    """
    fp.write_tag(ItemTag)  # marker for start of Sequence Item
    length_location = fp.tell()  # save location for later.
    # will fill in real value later if not undefined length
    fp.write_UL(0xffffffff)
    write_dataset(fp, dataset, parent_encoding=encodings)
    if getattr(dataset, "is_undefined_length_sequence_item", False):
        fp.write_tag(ItemDelimiterTag)
        fp.write_UL(0)  # 4-bytes 'length' field for delimiter item
    else:  # we will be nice and set the lengths for the reader of this file
        location = fp.tell()
        fp.seek(length_location)
        fp.write_UL(location - length_location - 4)  # 4 is length of UL
        fp.seek(location)  # ready for next data_element


def write_UN(fp: DicomIO, elem: DataElement) -> None:
    """Write a byte string for an DataElement of value 'UN' (unknown)."""
    fp.write(cast(bytes, elem.value))


def write_ATvalue(fp: DicomIO, elem: DataElement) -> None:
    """Write a data_element tag to a file."""
    try:
        iter(cast(Sequence[Any], elem.value))  # see if is multi-valued AT;
        # Note will fail if Tag ever derived from true tuple rather than being
        # a long
    except TypeError:
        # make sure is expressed as a Tag instance
        tag = Tag(cast(int, elem.value))
        fp.write_tag(tag)
    else:
        tags = [Tag(tag) for tag in cast(Sequence[int], elem.value)]
        for tag in tags:
            fp.write_tag(tag)


def write_file_meta_info(
    fp: DicomIO, file_meta: FileMetaDataset, enforce_standard: bool = True
) -> None:
    """Write the File Meta Information elements in `file_meta` to `fp`.

    If `enforce_standard` is ``True`` then the file-like `fp` should be
    positioned past the 128 byte preamble + 4 byte prefix (which should
    already have been written).

    **DICOM File Meta Information Group Elements**

    From the DICOM standard, Part 10,
    :dcm:`Section 7.1<part10/chapter_7.html#sect_7.1>`,  any DICOM file shall
    contain a 128-byte preamble, a 4-byte DICOM prefix 'DICM' and (at a
    minimum) the following Type 1 DICOM Elements (from
    :dcm:`Table 7.1-1<part10/chapter_7.html#table_7.1-1>`):

    * (0002,0000) *File Meta Information Group Length*, UL, 4
    * (0002,0001) *File Meta Information Version*, OB, 2
    * (0002,0002) *Media Storage SOP Class UID*, UI, N
    * (0002,0003) *Media Storage SOP Instance UID*, UI, N
    * (0002,0010) *Transfer Syntax UID*, UI, N
    * (0002,0012) *Implementation Class UID*, UI, N

    If `enforce_standard` is ``True`` then (0002,0000) will be added/updated,
    (0002,0001) and (0002,0012) will be added if not already present and the
    other required elements will be checked to see if they exist. If
    `enforce_standard` is ``False`` then `file_meta` will be written as is
    after minimal validation checking.

    The following Type 3/1C Elements may also be present:

    * (0002,0013) *Implementation Version Name*, SH, N
    * (0002,0016) *Source Application Entity Title*, AE, N
    * (0002,0017) *Sending Application Entity Title*, AE, N
    * (0002,0018) *Receiving Application Entity Title*, AE, N
    * (0002,0102) *Private Information*, OB, N
    * (0002,0100) *Private Information Creator UID*, UI, N

    If `enforce_standard` is ``True`` then (0002,0013) will be added/updated.

    *Encoding*

    The encoding of the *File Meta Information* shall be *Explicit VR Little
    Endian*.

    Parameters
    ----------
    fp : file-like
        The file-like to write the File Meta Information to.
    file_meta : pydicom.dataset.Dataset
        The File Meta Information elements.
    enforce_standard : bool
        If ``False``, then only the *File Meta Information* elements already in
        `file_meta` will be written to `fp`. If ``True`` (default) then a DICOM
        Standards conformant File Meta will be written to `fp`.

    Raises
    ------
    ValueError
        If `enforce_standard` is ``True`` and any of the required *File Meta
        Information* elements are missing from `file_meta`, with the
        exception of (0002,0000), (0002,0001) and (0002,0012).
    ValueError
        If any non-Group 2 Elements are present in `file_meta`.
    """
    validate_file_meta(file_meta, enforce_standard)

    if enforce_standard and 'FileMetaInformationGroupLength' not in file_meta:
        # Will be updated with the actual length later
        file_meta.FileMetaInformationGroupLength = 0

    # Write the File Meta Information Group elements
    # first write into a buffer to avoid seeking back, that can be
    # expansive and is not allowed if writing into a zip file
    buffer = DicomBytesIO()
    buffer.is_little_endian = True
    buffer.is_implicit_VR = False
    write_dataset(buffer, file_meta)

    # If FileMetaInformationGroupLength is present it will be the first written
    #   element and we must update its value to the correct length.
    if 'FileMetaInformationGroupLength' in file_meta:
        # Update the FileMetaInformationGroupLength value, which is the number
        #   of bytes from the end of the FileMetaInformationGroupLength element
        #   to the end of all the File Meta Information elements.
        # FileMetaInformationGroupLength has a VR of 'UL' and so has a value
        #   that is 4 bytes fixed. The total length of when encoded as
        #   Explicit VR must therefore be 12 bytes.
        file_meta.FileMetaInformationGroupLength = buffer.tell() - 12
        buffer.seek(0)
        write_data_element(buffer, file_meta[0x00020000])

    fp.write(buffer.getvalue())


def _write_dataset(
    fp: DicomIO, dataset: Dataset, write_like_original: bool
) -> None:
    """Write the Data Set to a file-like. Assumes the file meta information,
    if any, has been written.
    """

    # if we want to write with the same endianness and VR handling as
    # the read dataset we want to preserve raw data elements for
    # performance reasons (which is done by get_item);
    # otherwise we use the default converting item getter
    if dataset.is_original_encoding:
        get_item = Dataset.get_item
    else:
        get_item = Dataset.__getitem__  # type: ignore[assignment]

    # WRITE DATASET
    # The transfer syntax used to encode the dataset can't be changed
    #   within the dataset.
    # Write any Command Set elements now as elements must be in tag order
    #   Mixing Command Set with other elements is non-conformant so we
    #   require `write_like_original` to be True
    command_set = get_item(dataset, slice(0x00000000, 0x00010000))
    if command_set and write_like_original:
        fp.is_implicit_VR = True
        fp.is_little_endian = True
        write_dataset(fp, command_set)

    # Set file VR and endianness. MUST BE AFTER writing META INFO (which
    #   requires Explicit VR Little Endian) and COMMAND SET (which requires
    #   Implicit VR Little Endian)
    fp.is_implicit_VR = cast(bool, dataset.is_implicit_VR)
    fp.is_little_endian = cast(bool, dataset.is_little_endian)

    # Write non-Command Set elements now
    write_dataset(fp, get_item(dataset, slice(0x00010000, None)))


def dcmwrite(
    filename: Union[PathType, BinaryIO],
    dataset: Dataset,
    write_like_original: bool = True
) -> None:
    """Write `dataset` to the `filename` specified.

    If `write_like_original` is ``True`` then the :class:`Dataset` will be
    written as is (after minimal validation checking) and may or may not
    contain all or parts of the *File Meta Information* (and hence may or
    may not be conformant with the DICOM File Format).

    If `write_like_original` is ``False``, `dataset` will be stored in the
    :dcm:`DICOM File Format <part10/chapter_7.html>`.  To do
    so requires that the ``Dataset.file_meta`` attribute
    exists and contains a :class:`Dataset` with the required (Type 1) *File
    Meta Information Group* elements. The byte stream of the `dataset` will be
    placed into the file after the DICOM *File Meta Information*.

    **File Meta Information**

    The *File Meta Information* consists of a 128-byte preamble, followed by
    a 4 byte ``b'DICM'`` prefix, followed by the *File Meta Information Group*
    elements.

    **Preamble and Prefix**

    The ``dataset.preamble`` attribute shall be 128-bytes long or ``None`` and
    is available for use as defined by the Application Profile or specific
    implementations. If the preamble is not used by an Application Profile or
    specific implementation then all 128 bytes should be set to ``0x00``. The
    actual preamble written depends on `write_like_original` and
    ``dataset.preamble`` (see the table below).

    +------------------+------------------------------+
    |                  | write_like_original          |
    +------------------+-------------+----------------+
    | dataset.preamble | True        | False          |
    +==================+=============+================+
    | None             | no preamble | 128 0x00 bytes |
    +------------------+-------------+----------------+
    | 128 bytes        | dataset.preamble             |
    +------------------+------------------------------+

    The prefix shall be the bytestring ``b'DICM'`` and will be written if and
    only if the preamble is present.

    **File Meta Information Group Elements**

    The preamble and prefix are followed by a set of DICOM elements from the
    (0002,eeee) group. Some of these elements are required (Type 1) while
    others are optional (Type 3/1C). If `write_like_original` is ``True``
    then the *File Meta Information Group* elements are all optional. See
    :func:`~pydicom.filewriter.write_file_meta_info` for more information on
    which elements are required.

    The *File Meta Information Group* elements should be included within their
    own :class:`~pydicom.dataset.Dataset` in the ``dataset.file_meta``
    attribute.

    If (0002,0010) *Transfer Syntax UID* is included then the user must ensure
    its value is compatible with the values for the
    ``dataset.is_little_endian`` and ``dataset.is_implicit_VR`` attributes.
    For example, if ``is_little_endian`` and ``is_implicit_VR`` are both
    ``True`` then the Transfer Syntax UID must be 1.2.840.10008.1.2 *Implicit
    VR Little Endian*. See the DICOM Standard, Part 5,
    :dcm:`Section 10<part05/chapter_10.html>` for more information on Transfer
    Syntaxes.

    *Encoding*

    The preamble and prefix are encoding independent. The File Meta elements
    are encoded as *Explicit VR Little Endian* as required by the DICOM
    Standard.

    **Dataset**

    A DICOM Dataset representing a SOP Instance related to a DICOM Information
    Object Definition. It is up to the user to ensure the `dataset` conforms
    to the DICOM Standard.

    *Encoding*

    The `dataset` is encoded as specified by the ``dataset.is_little_endian``
    and ``dataset.is_implicit_VR`` attributes. It's up to the user to ensure
    these attributes are set correctly (as well as setting an appropriate
    value for ``dataset.file_meta.TransferSyntaxUID`` if present).

    Parameters
    ----------
    filename : str or PathLike or file-like
        Name of file or the file-like to write the new DICOM file to.
    dataset : pydicom.dataset.FileDataset
        Dataset holding the DICOM information; e.g. an object read with
        :func:`~pydicom.filereader.dcmread`.
    write_like_original : bool, optional
        If ``True`` (default), preserves the following information from
        the Dataset (and may result in a non-conformant file):

        - preamble -- if the original file has no preamble then none will be
          written.
        - file_meta -- if the original file was missing any required *File
          Meta Information Group* elements then they will not be added or
          written.
          If (0002,0000) *File Meta Information Group Length* is present then
          it may have its value updated.
        - seq.is_undefined_length -- if original had delimiters, write them now
          too, instead of the more sensible length characters
        - is_undefined_length_sequence_item -- for datasets that belong to a
          sequence, write the undefined length delimiters if that is
          what the original had.

        If ``False``, produces a file conformant with the DICOM File Format,
        with explicit lengths for all elements.

    Raises
    ------
    AttributeError
        If either ``dataset.is_implicit_VR`` or ``dataset.is_little_endian``
        have not been set.
    ValueError
        If group 2 elements are in ``dataset`` rather than
        ``dataset.file_meta``, or if a preamble is given but is not 128 bytes
        long, or if Transfer Syntax is a compressed type and pixel data is not
        compressed.

    See Also
    --------
    pydicom.dataset.Dataset
        Dataset class with relevant attributes and information.
    pydicom.dataset.Dataset.save_as
        Write a DICOM file from a dataset that was read in with ``dcmread()``.
        ``save_as()`` wraps ``dcmwrite()``.
    """
    tsyntax: Optional[UID]
    try:
        tsyntax = dataset.file_meta.TransferSyntaxUID
    except AttributeError:
        tsyntax = None

    cls_name = dataset.__class__.__name__
    encoding = (dataset.is_implicit_VR, dataset.is_little_endian)

    # Ensure is_little_endian and is_implicit_VR are set
    if None in encoding:
        if tsyntax is None:
            raise AttributeError(
                f"'{cls_name}.is_little_endian' and "
                f"'{cls_name}.is_implicit_VR' must be set appropriately "
                "before saving"
            )

        if not tsyntax.is_private:
            dataset.is_little_endian = tsyntax.is_little_endian
            dataset.is_implicit_VR = tsyntax.is_implicit_VR

    if tsyntax and not tsyntax.is_private:
        # PS3.5 Annex A.4 - the length of encapsulated pixel data is undefined
        #   and native pixel data uses actual length
        if "PixelData" in dataset:
            dataset['PixelData'].is_undefined_length = tsyntax.is_compressed

        # PS3.5 Annex A.4 - encapsulated datasets use Explicit VR Little
        if tsyntax.is_compressed and encoding != (False, True):
            warnings.warn(
                "All encapsulated (compressed) transfer syntaxes must use "
                "explicit VR little endian encoding for the dataset. Set "
                f"'{cls_name}.is_little_endian = True' and '{cls_name}."
                "is_implicit_VR = False' before saving"
            )

    # Check that dataset's group 0x0002 elements are only present in the
    #   `dataset.file_meta` Dataset - user may have added them to the wrong
    #   place
    if dataset.group_dataset(0x0002) != Dataset():
        raise ValueError(
            f"File Meta Information Group Elements (0002,eeee) should be in "
            f"their own Dataset object in the "
            f"'{dataset.__class__.__name__}.file_meta' attribute."
        )

    # A preamble is required under the DICOM standard, however if
    #   `write_like_original` is True we treat it as optional
    preamble = getattr(dataset, 'preamble', None)
    if preamble and len(preamble) != 128:
        raise ValueError(
            f"'{dataset.__class__.__name__}.preamble' must be 128-bytes long."
        )
    if not preamble and not write_like_original:
        # The default preamble is 128 0x00 bytes.
        preamble = b'\x00' * 128

    # File Meta Information is required under the DICOM standard, however if
    #   `write_like_original` is True we treat it as optional
    if not write_like_original:
        # the checks will be done in write_file_meta_info()
        dataset.fix_meta_info(enforce_standard=False)
    else:
        dataset.ensure_file_meta()

    # Check for decompression, give warnings if inconsistencies
    # If decompressed, then pixel_array is now used instead of PixelData
    if dataset.is_decompressed:
        if dataset.file_meta.TransferSyntaxUID.is_compressed:
            raise ValueError(
                f"The Transfer Syntax UID element in "
                f"'{dataset.__class__.__name__}.file_meta' is compressed "
                f"but the pixel data has been decompressed"
            )

        # Force PixelData to the decompressed version
        dataset.PixelData = dataset.pixel_array.tobytes()

    caller_owns_file = True
    # Open file if not already a file object
    filename = path_from_pathlike(filename)
    if isinstance(filename, str):
        fp = DicomFile(filename, 'wb')
        # caller provided a file name; we own the file handle
        caller_owns_file = False
    else:
        try:
            fp = DicomFileLike(filename)
        except AttributeError:
            raise TypeError("dcmwrite: Expected a file path or a file-like, "
                            "but got " + type(filename).__name__)
    try:
        # WRITE FILE META INFORMATION
        if preamble:
            # Write the 'DICM' prefix if and only if we write the preamble
            fp.write(preamble)
            fp.write(b'DICM')

        tsyntax = None
        if dataset.file_meta:  # May be an empty Dataset
            # If we want to `write_like_original`, don't enforce_standard
            write_file_meta_info(
                fp, dataset.file_meta, enforce_standard=not write_like_original
            )
            tsyntax = cast(UID, getattr(
                dataset.file_meta, "TransferSyntaxUID", None))

        if tsyntax == DeflatedExplicitVRLittleEndian:
            # See PS3.5 section A.5
            # when writing, the entire dataset following
            #     the file metadata is prepared the normal way,
            #     then "deflate" compression applied.
            buffer = DicomBytesIO()
            _write_dataset(buffer, dataset, write_like_original)

            # Compress the encoded data and write to file
            compressor = zlib.compressobj(wbits=-zlib.MAX_WBITS)
            deflated = compressor.compress(
                buffer.parent.getvalue()  # type: ignore[union-attr]
            )
            deflated += compressor.flush()
            if len(deflated) % 2:
                deflated += b'\x00'

            fp.write(deflated)
        else:
            _write_dataset(fp, dataset, write_like_original)

    finally:
        if not caller_owns_file:
            fp.close()


def __getattr__(name: str) -> Any:
    if name == 'write_file':
        warnings.warn(
            "'write_file' is deprecated and will be removed in v3.0, use "
            "'dcmwrite' instead",
            DeprecationWarning
        )
        return globals()['dcmwrite']

    raise AttributeError(f"module {__name__} has no attribute {name}")


if sys.version_info[:2] < (3, 7):
    write_file = dcmwrite


# Map each VR to a function which can write it
# for write_numbers, the Writer maps to a tuple (function, struct_format)
#   (struct_format is python's struct module format)
writers = {
    VR.AE: (write_string, None),
    VR.AS: (write_string, None),
    VR.AT: (write_ATvalue, None),
    VR.CS: (write_string, None),
    VR.DA: (write_DA, None),
    VR.DS: (write_number_string, None),
    VR.DT: (write_DT, None),
    VR.FD: (write_numbers, 'd'),
    VR.FL: (write_numbers, 'f'),
    VR.IS: (write_number_string, None),
    VR.LO: (write_text, None),
    VR.LT: (write_text, None),
    VR.OB: (write_OBvalue, None),
    VR.OD: (write_OWvalue, None),
    VR.OF: (write_OWvalue, None),
    VR.OL: (write_OWvalue, None),
    VR.OW: (write_OWvalue, None),
    VR.OV: (write_OWvalue, None),
    VR.PN: (write_PN, None),
    VR.SH: (write_text, None),
    VR.SL: (write_numbers, 'l'),
    VR.SQ: (write_sequence, None),
    VR.SS: (write_numbers, 'h'),
    VR.ST: (write_text, None),
    VR.SV: (write_numbers, 'q'),
    VR.TM: (write_TM, None),
    VR.UC: (write_text, None),
    VR.UI: (write_UI, None),
    VR.UL: (write_numbers, 'L'),
    VR.UN: (write_UN, None),
    VR.UR: (write_string, None),
    VR.US: (write_numbers, 'H'),
    VR.UT: (write_text, None),
    VR.UV: (write_numbers, 'Q'),
    VR.US_SS: (write_OWvalue, None),
    VR.US_OW: (write_OWvalue, None),
    VR.US_SS_OW: (write_OWvalue, None),
    VR.OB_OW: (write_OBvalue, None),
}
