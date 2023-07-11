# Copyright 2008-2021 pydicom authors. See LICENSE file for details.
"""Functions for converting values of DICOM
   data elements to proper python types
"""

import re
from io import BytesIO
from struct import (unpack, calcsize)
from typing import (
    Optional, Union, List, Tuple, cast, MutableSequence, Any
)

# don't import datetime_conversion directly
from pydicom import config
from pydicom.charset import default_encoding, decode_bytes
from pydicom.config import logger, have_numpy
from pydicom.dataelem import empty_value_for_VR, RawDataElement
from pydicom.errors import BytesLengthException
from pydicom.filereader import read_sequence
from pydicom.multival import MultiValue
from pydicom.sequence import Sequence
from pydicom.tag import (Tag, TupleTag, BaseTag)
import pydicom.uid
import pydicom.valuerep  # don't import DS directly as can be changed by config
from pydicom.valuerep import (
    MultiString, DA, DT, TM, TEXT_VR_DELIMS, IS, CUSTOMIZABLE_CHARSET_VR,
    VR as VR_, validate_value
)

try:
    import numpy
    have_numpy = True
except ImportError:
    have_numpy = False

from pydicom.valuerep import PersonName


def convert_tag(
    byte_string: bytes, is_little_endian: bool, offset: int = 0
) -> BaseTag:
    """Return a decoded :class:`BaseTag<pydicom.tag.BaseTag>` from the encoded
    `byte_string`.

    Parameters
    ----------
    byte_string : bytes
        The encoded tag.
    is_little_endian : bool
        ``True`` if the encoding is little endian, ``False`` otherwise.
    offset : int, optional
        The byte offset in `byte_string` to the start of the tag.

    Returns
    -------
    BaseTag
        The decoded tag.
    """
    fmt = "<HH" if is_little_endian else ">HH"
    value = cast(Tuple[int, int], unpack(fmt, byte_string[offset:offset + 4]))
    return TupleTag(value)


def convert_AE_string(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> Union[str, MutableSequence[str]]:
    """Return a decoded 'AE' value.

    Elements with VR of 'AE' have non-significant leading and trailing spaces.

    Parameters
    ----------
    byte_string : bytes
        The encoded 'AE' element value.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    struct_format : str, optional
        Not used.

    Returns
    -------
    str
        The decoded 'AE' value without non-significant spaces.
    """
    # Differs from convert_string because leading spaces are non-significant
    values = byte_string.decode(default_encoding).split('\\')
    values = [s.strip() for s in values]
    if len(values) == 1:
        return values[0]

    return MultiValue(str, values)


def convert_ATvalue(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> Union[BaseTag, MutableSequence[BaseTag]]:
    """Return a decoded 'AT' value.

    Parameters
    ----------
    byte_string : bytes
        The encoded 'AT' element value.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    struct_format : str, optional
        Not used.

    Returns
    -------
    BaseTag or MultiValue of BaseTag
        The decoded value(s).
    """
    length = len(byte_string)
    if length == 4:
        return convert_tag(byte_string, is_little_endian)

    # length > 4
    if length % 4 != 0:
        logger.warning(
            "Expected length to be multiple of 4 for VR 'AT', "
            f"got length {length}"
        )
    return MultiValue(
        Tag,
        [
            convert_tag(byte_string, is_little_endian, offset=x)
            for x in range(0, length, 4)
        ]
    )


def _DA_from_str(value: str) -> DA:
    return DA(value.rstrip())


def convert_DA_string(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> Union[str, DA, MutableSequence[str], MutableSequence[DA]]:
    """Return a decoded 'DA' value.

    Parameters
    ----------
    byte_string : bytes
        The encoded 'DA' element value.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    struct_format : str, optional
        Not used.

    Returns
    -------
    str or MultiValue of str or valuerep.DA or MultiValue of valuerep.DA
        If
        :attr:`~pydicom.config.datetime_conversion` is ``True`` then returns
        either :class:`~pydicom.valuerep.DA` or a :class:`list` of ``DA``,
        otherwise returns :class:`str` or ``list`` of ``str``.
    """
    if config.datetime_conversion:
        splitup = byte_string.decode(default_encoding).split("\\")
        if len(splitup) == 1:
            return _DA_from_str(splitup[0])

        return MultiValue(_DA_from_str, splitup)

    return convert_string(byte_string, is_little_endian, struct_format)


def convert_DS_string(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> Union[
    pydicom.valuerep.DSclass, MutableSequence[pydicom.valuerep.DSclass],
    "numpy.float64", "numpy.ndarray"
]:
    """Return a decoded 'DS' value.

    .. versionchanged:: 2.0

        The option to return numpy values was added.

    Parameters
    ----------
    byte_string : bytes
        The encoded 'DS' element value.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    struct_format : str, optional
        Not used.

    Returns
    -------
    :class:`~pydicom.valuerep.DSfloat`, :class:`~pydicom.valuerep.DSdecimal`, :class:`numpy.float64`, MultiValue of DSfloat/DSdecimal or :class:`numpy.ndarray` of :class:`numpy.float64`

        If :attr:`~pydicom.config.use_DS_decimal` is ``False`` (default),
        returns a :class:`~pydicom.valuerep.DSfloat` or list of them

        If :attr:`~pydicom.config.use_DS_decimal` is ``True``,
        returns a :class:`~pydicom.valuerep.DSdecimal` or list of them

        If :data:`~pydicom.config.use_DS_numpy` is ``True``,
        returns a :class:`numpy.float64` or a :class:`numpy.ndarray` of them

    Raises
    ------
    ValueError
        If :data:`~pydicom.config.use_DS_numpy` is ``True`` and the string
        contains non-valid characters

    ImportError
        If :data:`~pydicom.config.use_DS_numpy` is ``True`` and numpy is not
        available
    """
    num_string = byte_string.decode(default_encoding)
    # Below, go directly to DS class instance
    # rather than factory DS, but need to
    # ensure last string doesn't have
    # blank padding (use strip())
    if config.use_DS_numpy:
        if not have_numpy:
            raise ImportError("use_DS_numpy set but numpy not installed")
        # Check for valid characters. Numpy ignores many
        regex = r'[ \\0-9\.+eE-]*\Z'
        if re.match(regex, num_string) is None:
            raise ValueError(
                "DS: char(s) not in repertoire: '{}'".format(
                    re.sub(regex[:-2], '', num_string)
                )
            )
        value = numpy.fromstring(num_string, dtype='f8', sep="\\")
        if len(value) == 1:  # Don't use array for one number
            return value[0]

        return value

    return MultiString(num_string.strip(), valtype=pydicom.valuerep.DSclass)


def _DT_from_str(value: str) -> DT:
    value = value.rstrip()
    length = len(value)
    if length < 4 or length > 26:
        logger.warning(
            f"Expected length between 4 and 26, got length {length}"
        )

    return DT(value)


def convert_DT_string(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> Union[str, DT, MutableSequence[str], MutableSequence[DT]]:
    """Return a decoded 'DT' value.

    Parameters
    ----------
    byte_string : bytes
        The encoded 'DT' element value.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    struct_format : str, optional
        Not used.

    Returns
    -------
    str or MultiValue of str or valuerep.DT or MultiValue of DT
        If
        :attr:`~pydicom.config.datetime_conversion` is ``True`` then returns
        :class:`~pydicom.valuerep.DT` or a :class:`list` of ``DT``, otherwise
        returns :class:`str` or ``list`` of ``str``.
    """
    if config.datetime_conversion:
        splitup = byte_string.decode(default_encoding).split("\\")
        if len(splitup) == 1:
            return _DT_from_str(splitup[0])

        return MultiValue(_DT_from_str, splitup)

    return convert_string(byte_string, is_little_endian, struct_format)


def convert_IS_string(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> Union[IS, MutableSequence[IS], "numpy.int64", "numpy.ndarray"]:
    """Return a decoded 'IS' value.

    .. versionchanged:: 2.0

        The option to return numpy values was added.

    Parameters
    ----------
    byte_string : bytes
        The encoded 'IS' element value.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    struct_format : str, optional
        Not used.

    Returns
    -------
    :class:`~pydicom.valuerep.IS` or MultiValue of them, or :class:`numpy.int64` or :class:`~numpy.ndarray` of them

        If :data:`~pydicom.config.use_IS_numpy` is ``False`` (default), returns
        a single :class:`~pydicom.valuerep.IS` or a list of them

        If :data:`~pydicom.config.use_IS_numpy` is ``True``, returns
        a single :class:`numpy.int64` or a :class:`~numpy.ndarray` of them

    Raises
    ------
    ValueError
        If :data:`~pydicom.config.use_IS_numpy` is ``True`` and the string
        contains non-valid characters
    ImportError
        If :data:`~pydicom.config.use_IS_numpy` is ``True`` and numpy is not
        available
    """
    num_string = byte_string.decode(default_encoding)

    if config.use_IS_numpy:
        if not have_numpy:
            raise ImportError("use_IS_numpy set but numpy not installed")
        # Check for valid characters. Numpy ignores many
        regex = r'[ \\0-9\.+-]*\Z'
        if re.match(regex, num_string) is None:
            raise ValueError(
                "IS: char(s) not in repertoire: '{}'".format(
                    re.sub(regex[:-2], '', num_string)
                )
            )
        value = numpy.fromstring(num_string, dtype='i8', sep=chr(92))  # 92:'\'
        if len(value) == 1:  # Don't use array for one number
            return cast("numpy.int64", value[0])

        return cast("numpy.ndarray", value)

    return MultiString(num_string, valtype=pydicom.valuerep.IS)


def convert_numbers(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: str
) -> Union[str, int, float, MutableSequence[int], MutableSequence[float]]:
    """Return a decoded numerical VR value.

    Given an encoded DICOM Element value, use `struct_format` and the
    endianness of the data to decode it.

    Parameters
    ----------
    byte_string : bytes
        The encoded numerical VR element value.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    struct_format : str
        The format of the numerical data encoded in `byte_string`. Should be a
        valid format for :func:`struct.unpack()` without the endianness.

    Returns
    -------
    str
        If there is no encoded data in `byte_string` then an empty string will
        be returned.
    value
        If `byte_string` encodes a single value then it will be returned.
    list
        If `byte_string` encodes multiple values then a list of the decoded
        values will be returned.
    """
    endianChar = '><'[is_little_endian]

    # "=" means use 'standard' size, needed on 64-bit systems.
    bytes_per_value = calcsize("=" + struct_format)
    length = len(byte_string)

    if length % bytes_per_value != 0:
        raise BytesLengthException(
            "Expected total bytes to be an even multiple of bytes per value. "
            f"Instead received {byte_string!r} with length {length} and "
            f"struct format '{struct_format}' which corresponds to bytes per "
            f"value of {bytes_per_value}."
        )

    format_string = f"{endianChar}{length // bytes_per_value}{struct_format}"
    value: Union[Tuple[int, ...], Tuple[float, ...]] = (
        unpack(format_string, byte_string)
    )

    # if the number is empty, then return the empty
    # string rather than empty list
    if len(value) == 0:
        return ''

    if len(value) == 1:
        return value[0]

    # convert from tuple to a list so can modify if need to
    return list(value)


def convert_OBvalue(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> bytes:
    """Return encoded 'OB' value as :class:`bytes`."""
    return byte_string


def convert_OWvalue(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> bytes:
    """Return the encoded 'OW' value as :class:`bytes`.

    No byte swapping will be performed.
    """
    # for now, Maybe later will have own routine
    return convert_OBvalue(byte_string, is_little_endian)


def convert_OVvalue(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> bytes:
    """Return the encoded 'OV' value as :class:`bytes`.

    .. versionadded:: 1.4

    No byte swapping will be performed.
    """
    # for now, Maybe later will have own routine
    return convert_OBvalue(byte_string, is_little_endian)


def convert_PN(
    byte_string: bytes, encodings: Optional[List[str]] = None
) -> Union[PersonName, MutableSequence[PersonName]]:
    """Return a decoded 'PN' value.

    Parameters
    ----------
    byte_string : bytes
        The encoded 'PN' element value.
    encodings : list of str, optional
        A list of the character encoding schemes used to encode the 'PN' value.

    Returns
    -------
    valuerep.PersonName or MultiValue of PersonName
        The decoded 'PN' value(s).
    """
    def get_valtype(x: bytes) -> PersonName:
        return PersonName(x, encodings).decode()

    b_split = byte_string.rstrip(b'\x00 ').split(b'\\')
    if len(b_split) == 1:
        return get_valtype(b_split[0])

    return MultiValue(get_valtype, b_split)


def convert_string(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> Union[str, MutableSequence[str]]:
    """Return a decoded string VR value.

    String VRs are 'AE', AS', 'CS' and optionally (depending on
    :ref:`pydicom.config <api_config>`) 'DA', 'DT', and 'TM'.

    Parameters
    ----------
    byte_string : bytes
        The encoded text VR element value.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    struct_format : str, optional
        Not used.

    Returns
    -------
    str or MultiValue of str
        The decoded value(s).
    """
    return MultiString(byte_string.decode(default_encoding))


def convert_text(
    byte_string: bytes, encodings: Optional[List[str]] = None,
    vr: str = None
) -> Union[str, MutableSequence[str]]:
    """Return a decoded text VR value.

    Text VRs are 'SH', 'LO' and 'UC'.

    Parameters
    ----------
    byte_string : bytes
        The encoded text VR element value.
    encodings : list of str, optional
        A list of the character encoding schemes used to encode the value.
    vr : str
        The value representation of the element. Needed for validation.

    Returns
    -------
    str or list of str
        The decoded value(s).
    """
    values = byte_string.split(b'\\')
    as_strings = [convert_single_string(value, encodings, vr)
                  for value in values]
    if len(as_strings) == 1:
        return as_strings[0]

    return MultiValue(str, as_strings,
                      validation_mode=config.settings.reading_validation_mode)


def convert_single_string(
    byte_string: bytes, encodings: Optional[List[str]] = None,
    vr: str = None,
) -> str:
    """Return decoded text, ignoring backslashes and trailing spaces.

    Parameters
    ----------
    byte_string : bytes
        The encoded string.
    encodings : list of str, optional
        A list of the character encoding schemes used to encode the text.
    vr : str
        The value representation of the element. Needed for validation.

    Returns
    -------
    str
        The decoded text.
    """
    if vr is not None:
        validate_value(
            vr, byte_string, config.settings.reading_validation_mode)
    encodings = encodings or [default_encoding]
    value = decode_bytes(byte_string, encodings, TEXT_VR_DELIMS)
    return value.rstrip('\0 ')


def convert_SQ(
    byte_string: bytes,
    is_implicit_VR: bool,
    is_little_endian: bool,
    encoding: Optional[List[str]] = None,
    offset: int = 0
) -> Sequence:
    """Return a decoded 'SQ' value.

    Parameters
    ----------
    byte_string : bytes
        The encoded 'SQ' element value.
    is_implicit_VR : bool
        ``True`` if the value is encoded as implicit VR, ``False`` otherwise.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    encoding : list of str, optional
        The character encoding scheme(s) used to encoded any text VR elements
        within the sequence value. ``'iso8859'`` is used by default.
    offset : int, optional
        The byte offset in `byte_string` to the start of the sequence value.

    Returns
    -------
    sequence.Sequence
        The decoded sequence.
    """
    encodings = encoding or [default_encoding]
    fp = BytesIO(byte_string)
    seq = read_sequence(fp, is_implicit_VR, is_little_endian,
                        len(byte_string), encodings, offset)
    return seq


def _TM_from_str(value: str) -> TM:
    value = value.rstrip()
    length = len(value)
    if (length < 2 or length > 16) and length != 0:
        logger.warning(
            f"Expected length between 2 and 16, got length {length}"
        )

    return TM(value)


def convert_TM_string(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> Union[str, TM, MutableSequence[str], MutableSequence[TM]]:
    """Return a decoded 'TM' value.

    Parameters
    ----------
    byte_string : bytes
        The encoded 'TM' element value.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    struct_format : str, optional
        Not used.

    Returns
    -------
    str or list of str or valuerep.TM or list of valuerep.TM
        If
        :attr:`~pydicom.config.datetime_conversion` is ``True`` then returns
        either :class:`~pydicom.valuerep.TM` or a :class:`list` of ``TM``,
        otherwise returns :class:`str` or ``list`` of ``str``.
    """
    if config.datetime_conversion:
        splitup = byte_string.decode(default_encoding).split("\\")
        if len(splitup) == 1:
            return _TM_from_str(splitup[0])

        return MultiValue(_TM_from_str, splitup)

    return convert_string(byte_string, is_little_endian)


def convert_UI(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> Union[pydicom.uid.UID, MutableSequence[pydicom.uid.UID]]:
    """Return a decoded 'UI' value.

    Elements with VR of 'UI' may have a non-significant trailing null ``0x00``.

    Parameters
    ----------
    byte_string : bytes
        The encoded 'UI' element value.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    struct_format : str, optional
        Not used.

    Returns
    -------
    uid.UID or list of uid.UID
        The decoded 'UI' element value without trailing nulls or spaces.
    """
    # Convert to str and remove any trailing nulls or spaces
    value = byte_string.decode(default_encoding)
    return MultiString(value.rstrip('\0 '), pydicom.uid.UID)


def convert_UN(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> bytes:
    """Return the encoded 'UN' value as :class:`bytes`."""
    return byte_string


def convert_UR_string(
    byte_string: bytes,
    is_little_endian: bool,
    struct_format: Optional[str] = None
) -> str:
    """Return a decoded 'UR' value.

    Elements with VR of 'UR' may not be multi-valued and trailing spaces are
    non-significant.

    Parameters
    ----------
    byte_string : bytes
        The encoded 'UR' element value.
    is_little_endian : bool
        ``True`` if the value is encoded as little endian, ``False`` otherwise.
    struct_format : str, optional
        Not used.

    Returns
    -------
    bytes or str
        The encoded 'UR' element value without any trailing spaces.
    """
    return byte_string.decode(default_encoding).rstrip()


def convert_value(
    VR: str,
    raw_data_element: RawDataElement,
    encodings: Optional[Union[str, MutableSequence[str]]] = None
) -> Union[Any, MutableSequence[Any]]:
    """Return the element value decoded using the appropriate decoder.

    Parameters
    ----------
    VR : str
        The element's VR.
    raw_data_element : pydicom.dataelem.RawDataElement
        The encoded element value.
    encodings : list of str, optional
        A list of the character encoding schemes used to encode any text
        elements.

    Returns
    -------
    type or MultiValue of type
        The element value decoded using the appropriate decoder.
    """
    if VR not in converters:
        # `VR` characters are in the ascii alphabet ranges 65 - 90, 97 - 122
        char_range = list(range(65, 91)) + list(range(97, 123))
        # If the VR characters are outside that range then print hex values
        if ord(VR[0]) not in char_range or ord(VR[1]) not in char_range:
            VR = ' '.join(['0x{:02x}'.format(ord(ch)) for ch in VR])
        raise NotImplementedError(f"Unknown Value Representation '{VR}'")

    if raw_data_element.length == 0:
        return empty_value_for_VR(VR)

    # Look up the function to convert that VR
    # Dispatch two cases: a plain converter,
    # or a number one which needs a format string
    VR = cast(VR_, VR)
    if isinstance(converters[VR], tuple):
        converter, num_format = cast(tuple, converters[VR])
    else:
        converter = converters[VR]
        num_format = None

    # Ensure that encodings is a list
    encodings = encodings or [default_encoding]
    if isinstance(encodings, str):
        encodings = [encodings]

    byte_string = raw_data_element.value
    is_little_endian = raw_data_element.is_little_endian
    is_implicit_VR = raw_data_element.is_implicit_VR

    # Not only two cases. Also need extra info if is a raw sequence
    # Pass all encodings to the converter if needed
    try:
        if VR == VR_.PN:
            return converter(byte_string, encodings)

        if VR in CUSTOMIZABLE_CHARSET_VR:
            # SH, LO, ST, LT, UC, UT - PN already done
            return converter(byte_string, encodings, VR)

        if VR != VR_.SQ:
            return converter(byte_string, is_little_endian, num_format)

        # SQ
        return converter(
            byte_string,
            is_implicit_VR,
            is_little_endian,
            encodings,
            raw_data_element.value_tell
        )
    except ValueError:
        if config.settings.reading_validation_mode == config.RAISE:
            # The user really wants an exception here
            raise

    logger.debug(
        f"Unable to convert tag {raw_data_element.tag} with VR {VR} using "
        "the standard value converter"
    )
    for vr in [val for val in convert_retry_VR_order if val != VR]:
        try:
            return convert_value(vr, raw_data_element, encodings)
        except Exception:
            pass

    logger.debug(
        f"Could not convert value for tag {raw_data_element.tag} with "
        "any VR in the 'convert_retry_VR_order' list"
    )
    return raw_data_element.value


convert_retry_VR_order = [
    VR_.SH, VR_.UL, VR_.SL, VR_.US, VR_.SS, VR_.FL, VR_.FD, VR_.OF, VR_.OB,
    VR_.UI, VR_.DA, VR_.TM, VR_.PN, VR_.IS, VR_.DS, VR_.LT, VR_.SQ, VR_.UN,
    VR_.AT, VR_.OW, VR_.DT, VR_.UT,
]
# converters map a VR to the function
# to read the value(s). for convert_numbers,
# the converter maps to a tuple
# (function, struct_format)
# (struct_format in python struct module style)
converters = {
    VR_.AE: convert_AE_string,
    VR_.AS: convert_string,
    VR_.AT: convert_ATvalue,
    VR_.CS: convert_string,
    VR_.DA: convert_DA_string,
    VR_.DS: convert_DS_string,
    VR_.DT: convert_DT_string,
    VR_.FD: (convert_numbers, 'd'),
    VR_.FL: (convert_numbers, 'f'),
    VR_.IS: convert_IS_string,
    VR_.LO: convert_text,
    VR_.LT: convert_single_string,
    VR_.OB: convert_OBvalue,
    VR_.OD: convert_OBvalue,
    VR_.OF: convert_OWvalue,
    VR_.OL: convert_OBvalue,
    VR_.OW: convert_OWvalue,
    VR_.OV: convert_OVvalue,
    VR_.PN: convert_PN,
    VR_.SH: convert_text,
    VR_.SL: (convert_numbers, 'l'),
    VR_.SQ: convert_SQ,
    VR_.SS: (convert_numbers, 'h'),
    VR_.ST: convert_single_string,
    VR_.SV: (convert_numbers, 'q'),
    VR_.TM: convert_TM_string,
    VR_.UC: convert_text,
    VR_.UI: convert_UI,
    VR_.UL: (convert_numbers, 'L'),
    VR_.UN: convert_UN,
    VR_.UR: convert_UR_string,
    VR_.US: (convert_numbers, 'H'),
    VR_.UT: convert_single_string,
    VR_.UV: (convert_numbers, 'Q'),
    VR_.OB_OW: convert_OBvalue,
    VR_.US_SS: convert_OWvalue,
    VR_.US_OW: convert_OWvalue,
    VR_.US_SS_OW: convert_OWvalue,
}
