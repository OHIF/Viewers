# Copyright 2008-2021 pydicom authors. See LICENSE file for details.
"""Handle alternate character sets for character strings."""

import codecs
import re
from typing import (
    List, Set, Optional, Union, TYPE_CHECKING, MutableSequence, cast,
    Sequence,
)
import warnings

from pydicom import config
from pydicom.valuerep import (
    TEXT_VR_DELIMS, PersonName, VR, CUSTOMIZABLE_CHARSET_VR
)

if TYPE_CHECKING:  # pragma: no cover
    from pydicom.dataelem import DataElement


# default encoding if no encoding defined - corresponds to ISO IR 6 / ASCII
default_encoding = "iso8859"

# Map DICOM Specific Character Set to python equivalent
# https://docs.python.org/3/library/codecs.html#standard-encodings
python_encoding = {

    # default character set for DICOM
    '': default_encoding,

    # alias for latin_1 too (iso_ir_6 exists as an alias to 'ascii')
    'ISO_IR 6': default_encoding,
    'ISO_IR 13': 'shift_jis',
    'ISO_IR 100': 'latin_1',
    'ISO_IR 101': 'iso8859_2',
    'ISO_IR 109': 'iso8859_3',
    'ISO_IR 110': 'iso8859_4',
    'ISO_IR 126': 'iso_ir_126',  # Greek
    'ISO_IR 127': 'iso_ir_127',  # Arabic
    'ISO_IR 138': 'iso_ir_138',  # Hebrew
    'ISO_IR 144': 'iso_ir_144',  # Russian
    'ISO_IR 148': 'iso_ir_148',  # Turkish
    'ISO_IR 166': 'iso_ir_166',  # Thai
    'ISO 2022 IR 6': 'iso8859',  # alias for latin_1 too
    'ISO 2022 IR 13': 'shift_jis',
    'ISO 2022 IR 87': 'iso2022_jp',
    'ISO 2022 IR 100': 'latin_1',
    'ISO 2022 IR 101': 'iso8859_2',
    'ISO 2022 IR 109': 'iso8859_3',
    'ISO 2022 IR 110': 'iso8859_4',
    'ISO 2022 IR 126': 'iso_ir_126',
    'ISO 2022 IR 127': 'iso_ir_127',
    'ISO 2022 IR 138': 'iso_ir_138',
    'ISO 2022 IR 144': 'iso_ir_144',
    'ISO 2022 IR 148': 'iso_ir_148',
    'ISO 2022 IR 149': 'euc_kr',
    'ISO 2022 IR 159': 'iso2022_jp_2',
    'ISO 2022 IR 166': 'iso_ir_166',
    'ISO 2022 IR 58': 'iso_ir_58',
    'ISO_IR 192': 'UTF8',  # from Chinese example, 2008 PS3.5 Annex J p1-4
    'GB18030': 'GB18030',
    'ISO 2022 GBK': 'GBK',  # from DICOM correction CP1234
    'ISO 2022 58': 'GB2312',  # from DICOM correction CP1234
    'GBK': 'GBK',  # from DICOM correction CP1234
}

# these encodings cannot be used with code extensions
# see DICOM Standard, Part 3, Table C.12-5
# and DICOM Standard, Part 5, Section 6.1.2.5.4, item d
STAND_ALONE_ENCODINGS = ('ISO_IR 192', 'GBK', 'GB18030')

# the escape character used to mark the start of escape sequences
ESC = b'\x1b'

# Map Python encodings to escape sequences as defined in PS3.3 in tables
# C.12-3 (single-byte) and C.12-4 (multi-byte character sets).
CODES_TO_ENCODINGS = {
    ESC + b'(B': default_encoding,  # used to switch to ASCII G0 code element
    ESC + b'-A': 'latin_1',
    ESC + b')I': 'shift_jis',  # switches to ISO-IR 13
    ESC + b'(J': 'shift_jis',  # switches to ISO-IR 14 (shift_jis handles both)
    ESC + b'$B': 'iso2022_jp',
    ESC + b'-B': 'iso8859_2',
    ESC + b'-C': 'iso8859_3',
    ESC + b'-D': 'iso8859_4',
    ESC + b'-F': 'iso_ir_126',
    ESC + b'-G': 'iso_ir_127',
    ESC + b'-H': 'iso_ir_138',
    ESC + b'-L': 'iso_ir_144',
    ESC + b'-M': 'iso_ir_148',
    ESC + b'-T': 'iso_ir_166',
    ESC + b'$)C': 'euc_kr',
    ESC + b'$(D': 'iso2022_jp_2',
    ESC + b'$)A': 'iso_ir_58',
}

ENCODINGS_TO_CODES = {v: k for k, v in CODES_TO_ENCODINGS.items()}
ENCODINGS_TO_CODES['shift_jis'] = ESC + b')I'

# Multi-byte character sets except Korean are handled by Python.
# To decode them, the escape sequence shall be preserved in the input byte
# string, and will be removed during decoding by Python.
handled_encodings = ('iso2022_jp', 'iso2022_jp_2', 'iso_ir_58')


def _encode_to_jis_x_0201(value: str, errors: str = 'strict') -> bytes:
    """Convert a unicode string into JIS X 0201 byte string using shift_jis
    encodings.
    shift_jis is a superset of jis_x_0201. So we can regard the encoded value
    as jis_x_0201 if it is single byte character.

    Parameters
    ----------
    value : str
        The unicode string as presented to the user.
    errors : str
        The behavior of a character which could not be encoded. If 'strict' is
        passed, raise an UnicodeEncodeError. If any other value is passed,
        non ISO IR 14 characters are replaced by the ASCII '?'.

    Returns
    -------
    bytes
        The encoded string. If some characters in value could not be encoded to
        JIS X 0201, and `errors` is not set to 'strict', they are replaced to
        '?'.

    Raises
    ------
    UnicodeEncodeError
        If errors is set to 'strict' and `value` could not be encoded with
        JIS X 0201.
    """

    encoder_class = codecs.getincrementalencoder('shift_jis')
    encoder = encoder_class()

    # If errors is not strict, this function is used as fallback.
    # In this case, we use only ISO IR 14 to encode given value
    # without escape sequence.
    if errors != 'strict' or value == '':
        encoded = b''
        for c in value:
            try:
                b = encoder.encode(c)
            except UnicodeEncodeError:
                b = b'?'

            if len(b) != 1 or 0x80 <= ord(b):
                b = b'?'
            encoded += b
        return encoded

    encoded = encoder.encode(value[0])
    if len(encoded) != 1:
        raise UnicodeEncodeError(
            'shift_jis', value, 0, len(value), 'illegal multibyte sequence')

    msb = ord(encoded) & 0x80  # msb is 1 for ISO IR 13, 0 for ISO IR 14
    for i, c in enumerate(value[1:], 1):
        try:
            b = encoder.encode(c)
        except UnicodeEncodeError as e:
            e.start = i
            e.end = len(value)
            raise e
        if len(b) != 1 or ((ord(b) & 0x80) ^ msb) != 0:
            character_set = 'ISO IR 14' if msb == 0 else 'ISO IR 13'
            msg = 'Given character is out of {}'.format(character_set)
            raise UnicodeEncodeError('shift_jis', value, i, len(value), msg)
        encoded += b

    return encoded


def _encode_to_jis_x_0208(value: str, errors: str = 'strict') -> bytes:
    """Convert a unicode string into JIS X 0208 encoded bytes."""
    return _encode_to_given_charset(value, 'ISO 2022 IR 87', errors=errors)


def _encode_to_jis_x_0212(value: str, errors: str = 'strict') -> bytes:
    """Convert a unicode string into JIS X 0212 encoded bytes."""
    return _encode_to_given_charset(value, 'ISO 2022 IR 159', errors=errors)


def _encode_to_given_charset(
    value: str, character_set: str, errors: str = 'strict'
) -> bytes:
    """Encode a unicode string using the given character set.

    The escape sequence which is located at the end of the encoded value has
    to vary depending on the value 1 of SpecificCharacterSet. So we have to
    trim it and append the correct escape sequence manually.

    Parameters
    ----------
    value : text type
        The unicode string as presented to the user.
    character_set: str:
        Character set for result.
    errors : str
        The behavior of a character which could not be encoded. This value
        is passed to errors argument of str.encode().

    Returns
    -------
    bytes
        The encoded string. If some characters in value could not be encoded to
        given character_set, it depends on the behavior of corresponding python
        encoder.

    Raises
    ------
    UnicodeEncodeError
        If errors is set to 'strict' and `value` could not be encoded with
        given character_set.
    """

    encoding = python_encoding[character_set]
    # If errors is not strict, this function is used as fallback.
    # So keep the tail escape sequence of encoded for backward compatibility.
    if errors != 'strict':
        return value.encode(encoding, errors=errors)

    encoder_class = codecs.getincrementalencoder(encoding)
    encoder = encoder_class()

    encoded = encoder.encode(value[0])
    if not encoded.startswith(ENCODINGS_TO_CODES[encoding]):
        raise UnicodeEncodeError(
            encoding, value, 0, len(value),
            'Given character is out of {}'.format(character_set))

    for i, c in enumerate(value[1:], 1):
        try:
            b = encoder.encode(c)
        except UnicodeEncodeError as e:
            e.start = i
            e.end = len(value)
            raise e
        if b[:1] == ESC:
            raise UnicodeEncodeError(
                encoding, value, i, len(value),
                'Given character is out of {}'.format(character_set))
        encoded += b
    return encoded


def _get_escape_sequence_for_encoding(
    encoding: str, encoded: Optional[bytes] = None
) -> bytes:
    """ Return an escape sequence corresponding to the given encoding. If
    encoding is 'shift_jis', return 'ESC)I' or 'ESC(J' depending on the first
    byte of encoded.

    Parameters
    ----------
    encoding : str
        An encoding is used to specify  an escape sequence.
    encoded : bytes
        The encoded value is used to choose an escape sequence if encoding is
        'shift_jis'.

    Returns
    -------
    bytes
        Escape sequence for encoded value.
    """

    ESC_ISO_IR_14 = ESC + b'(J'
    ESC_ISO_IR_13 = ESC + b')I'

    if encoding == 'shift_jis':
        if encoded is None:
            return ESC_ISO_IR_14

        first_byte = encoded[0]
        if 0x80 <= first_byte:
            return ESC_ISO_IR_13

        return ESC_ISO_IR_14
    return ENCODINGS_TO_CODES.get(encoding, b'')


# These encodings need escape sequence to handle alphanumeric characters.
need_tail_escape_sequence_encodings = ('iso2022_jp', 'iso2022_jp_2')


custom_encoders = {
    'shift_jis': _encode_to_jis_x_0201,
    'iso2022_jp': _encode_to_jis_x_0208,
    'iso2022_jp_2': _encode_to_jis_x_0212
}


def decode_bytes(
    value: bytes, encodings: Sequence[str], delimiters: Set[int]
) -> str:
    """Decode an encoded byte `value` into a unicode string using `encodings`.

    .. versionadded:: 1.2

    Parameters
    ----------
    value : bytes
        The encoded byte string in the DICOM element value.
    encodings : list of str
        The encodings needed to decode the string as a list of Python
        encodings, converted from the encodings in (0008,0005) *Specific
        Character Set*.
    delimiters : set of int
        A set of characters or character codes, each of which resets the
        encoding in `value`.

    Returns
    -------
    str
        The decoded unicode string. If the value could not be decoded,
        and :attr:`~pydicom.config.settings.reading_validation_mode`
        is not ``RAISE``, a warning is issued, and `value` is
        decoded using the first encoding with replacement characters,
        resulting in data loss.

    Raises
    ------
    UnicodeDecodeError
        If :attr:`~pydicom.config.settings.reading_validation_mode`
        is ``RAISE`` and `value` could not be decoded with the given
        encodings.
    LookupError
        If :attr:`~pydicom.config.settings.reading_validation_mode`
        is ``RAISE`` and the given encodings are invalid.
    """
    # shortcut for the common case - no escape sequences present
    if ESC not in value:
        first_encoding = encodings[0]
        try:
            return value.decode(first_encoding)
        except LookupError:
            if config.settings.reading_validation_mode == config.RAISE:
                raise
            # IGNORE is handled as WARN here, as this is
            # not an optional validation check
            warnings.warn(
                f"Unknown encoding '{first_encoding}' - using default "
                "encoding instead"
            )
            first_encoding = default_encoding
            return value.decode(first_encoding)
        except UnicodeError:
            if config.settings.reading_validation_mode == config.RAISE:
                raise
            warnings.warn(
                "Failed to decode byte string with encoding "
                f"'{first_encoding}' - using replacement characters in "
                "decoded string"
            )
            return value.decode(first_encoding, errors='replace')

    # Each part of the value that starts with an escape sequence is decoded
    # separately. If it starts with an escape sequence, the
    # corresponding encoding is used, otherwise (e.g. the first part if it
    # does not start with an escape sequence) the first encoding.
    # See PS3.5, 6.1.2.4 and 6.1.2.5 for the use of code extensions.
    #
    # The following regex splits the value into these parts, by matching
    # the substring until the first escape character, and subsequent
    # substrings starting with an escape character.
    regex = b'(^[^\x1b]+|[\x1b][^\x1b]*)'
    fragments: List[bytes] = re.findall(regex, value)

    # decode each byte string fragment with it's corresponding encoding
    # and join them all together
    return ''.join([
        _decode_fragment(fragment, encodings, delimiters)
        for fragment in fragments
    ])


decode_string = decode_bytes


def _decode_fragment(
    byte_str: bytes, encodings: Sequence[str], delimiters: Set[int]
) -> str:
    """Decode a byte string encoded with a single encoding.

    If `byte_str` starts with an escape sequence, the encoding corresponding
    to this sequence is used for decoding if present in `encodings`,
    otherwise the first value in encodings.
    If a delimiter occurs inside the string, it resets the encoding to the
    first encoding in case of single-byte encodings.

    Parameters
    ----------
    byte_str : bytes
        The encoded string to be decoded.
    encodings: list of str
        The list of Python encodings as converted from the values in the
        Specific Character Set tag.
    delimiters: set of int
        A set of characters or character codes, each of which resets the
        encoding in `byte_str`.

    Returns
    -------
    str
        The decoded unicode string. If the value could not be decoded,
        and :attr:`~pydicom.config.settings.reading_validation_mode` is not
        set to ``RAISE``, a warning is issued, and the value is
        decoded using the first encoding with replacement characters,
        resulting in data loss.

    Raises
    ------
    UnicodeDecodeError
        If :attr:`~pydicom.config.settings.reading_validation_mode` is set
        to ``RAISE`` and `value` could not be decoded with the given
        encodings.

    References
    ----------
    * DICOM Standard, Part 5,
      :dcm:`Sections 6.1.2.4<part05/chapter_6.html#sect_6.1.2.4>` and
      :dcm:`6.1.2.5<part05/chapter_6.html#sect_6.1.2.5>`
    * DICOM Standard, Part 3,
      :dcm:`Annex C.12.1.1.2<part03/sect_C.12.html#sect_C.12.1.1.2>`
    """
    try:
        if byte_str.startswith(ESC):
            return _decode_escaped_fragment(byte_str, encodings, delimiters)
        # no escape sequence - use first encoding
        return byte_str.decode(encodings[0])
    except UnicodeError:
        if config.settings.reading_validation_mode == config.RAISE:
            raise
        warnings.warn(
            "Failed to decode byte string with encodings: "
            f"{', '.join(encodings)} - using replacement characters in "
            "decoded string"
        )
        return byte_str.decode(encodings[0], errors='replace')


def _decode_escaped_fragment(
    byte_str: bytes, encodings: Sequence[str], delimiters: Set[int]
) -> str:
    """Decodes a byte string starting with an escape sequence.

    See `_decode_fragment` for parameter description and more information.
    """
    # all 4-character escape codes start with one of two character sets
    seq_length = 4 if byte_str.startswith((b'\x1b$(', b'\x1b$)')) else 3
    encoding = CODES_TO_ENCODINGS.get(byte_str[:seq_length], '')
    if encoding in encodings or encoding == default_encoding:
        if encoding in handled_encodings:
            # Python strips the escape sequences for this encoding.
            # Any delimiters must be handled correctly by `byte_str`.
            return byte_str.decode(encoding)

        # Python doesn't know about the escape sequence -
        # we have to strip it before decoding
        byte_str = byte_str[seq_length:]

        # If a delimiter occurs in the string, it resets the encoding.
        # The following returns the first occurrence of a delimiter in
        # the byte string, or None if it does not contain any.
        index = next(
            (idx for idx, ch in enumerate(byte_str) if ch in delimiters),
            None
        )
        if index is not None:
            # the part of the string after the first delimiter
            # is decoded with the first encoding
            return (byte_str[:index].decode(encoding) +
                    byte_str[index:].decode(encodings[0]))

        # No delimiter - use the encoding defined by the escape code
        return byte_str.decode(encoding)

    # unknown escape code - use first encoding
    msg = "Found unknown escape sequence in encoded string value"
    if config.settings.reading_validation_mode == config.RAISE:
        raise ValueError(msg)

    warnings.warn(msg + f" - using encoding {encodings[0]}")
    return byte_str.decode(encodings[0], errors='replace')


def encode_string(value: str, encodings: Sequence[str]) -> bytes:
    """Encode a unicode string `value` into :class:`bytes` using `encodings`.

    .. versionadded:: 1.2

    Parameters
    ----------
    value : str
        The unicode string as presented to the user.
    encodings : list of str
        The encodings needed to encode the string as a list of Python
        encodings, converted from the encodings in (0008,0005) *Specific
        Character Set*.

    Returns
    -------
    bytes
        The encoded string. If `value` could not be encoded with any of
        the given encodings, and
        :attr:`~pydicom.config.settings.reading_validation_mode` is not
        ``RAISE``, a warning is issued, and `value` is encoded using
        the first encoding with replacement characters, resulting in data loss.

    Raises
    ------
    UnicodeEncodeError
        If  :attr:`~pydicom.config.settings.writing_validation_mode`
        is set to ``RAISE`` and `value` could not be encoded with the
        supplied encodings.
    """
    for i, encoding in enumerate(encodings):
        try:
            encoded = _encode_string_impl(value, encoding)

            if i > 0 and encoding not in handled_encodings:
                escape_sequence = _get_escape_sequence_for_encoding(
                        encoding, encoded=encoded)
                encoded = escape_sequence + encoded
            if encoding in need_tail_escape_sequence_encodings:
                encoded += _get_escape_sequence_for_encoding(encodings[0])
            return encoded
        except UnicodeError:
            continue

    # if we have more than one encoding, we retry encoding by splitting
    # `value` into chunks that can be encoded with one of the encodings
    if len(encodings) > 1:
        try:
            return _encode_string_parts(value, encodings)
        except ValueError:
            pass
    # all attempts failed - raise or warn and encode with replacement
    # characters
    if config.settings.writing_validation_mode == config.RAISE:
        # force raising a valid UnicodeEncodeError
        value.encode(encodings[0])

    warnings.warn("Failed to encode value with encodings: {} - using "
                  "replacement characters in encoded string"
                  .format(', '.join(encodings)))
    return _encode_string_impl(value, encodings[0], errors='replace')


def _encode_string_parts(value: str, encodings: Sequence[str]) -> bytes:
    """Convert a unicode string into a byte string using the given
    list of encodings.
    This is invoked if `encode_string` failed to encode `value` with a single
    encoding. We try instead to use different encodings for different parts
    of the string, using the encoding that can encode the longest part of
    the rest of the string as we go along.

    Parameters
    ----------
    value : str
        The unicode string as presented to the user.
    encodings : list of str
        The encodings needed to encode the string as a list of Python
        encodings, converted from the encodings in Specific Character Set.

    Returns
    -------
    bytes
        The encoded string, including the escape sequences needed to switch
        between different encodings.

    Raises
    ------
    ValueError
        If `value` could not be encoded with the given encodings.

    """
    encoded = bytearray()
    unencoded_part = value
    best_encoding = default_encoding
    while unencoded_part:
        # find the encoding that can encode the longest part of the rest
        # of the string still to be encoded
        max_index = 0
        for encoding in encodings:
            try:
                _encode_string_impl(unencoded_part, encoding)
                # if we get here, the whole rest of the value can be encoded
                best_encoding = encoding
                max_index = len(unencoded_part)
                break
            except (UnicodeDecodeError, UnicodeEncodeError) as err:
                if err.start > max_index:
                    # err.start is the index of first char we failed to encode
                    max_index = err.start
                    best_encoding = encoding

        # none of the given encodings can encode the first character - give up
        if max_index == 0:
            raise ValueError(
                "None of the given encodings can encode the first character"
            )

        # encode the part that can be encoded with the found encoding
        encoded_part = _encode_string_impl(
            unencoded_part[:max_index], best_encoding
        )
        if best_encoding not in handled_encodings:
            encoded += _get_escape_sequence_for_encoding(
                    best_encoding, encoded=encoded_part
            )
        encoded += encoded_part
        # set remaining unencoded part of the string and handle that
        unencoded_part = unencoded_part[max_index:]
    # unencoded_part is empty - we are done, return the encoded string
    if best_encoding in need_tail_escape_sequence_encodings:
        encoded += _get_escape_sequence_for_encoding(encodings[0])

    return bytes(encoded)


def _encode_string_impl(
    value: str, encoding: str, errors: str = 'strict'
) -> bytes:
    """Convert a unicode string into a byte string.

    If given encoding is in `custom_encoders`, use a corresponding
    `custom_encoder`. If given encoding is not in `custom_encoders`, use a
    corresponding python handled encoder.
    """
    if encoding in custom_encoders:
        return custom_encoders[encoding](value, errors=errors)

    return value.encode(encoding, errors=errors)


# DICOM PS3.5-2008 6.1.1 (p 18) says:
#   default is ISO-IR 6 G0, equiv to common chr set of ISO 8859 (PS3.5 6.1.2.1)
#    (0008,0005)  value 1 can *replace* the default encoding...
#           for VRs of SH, LO, ST, LT, PN and UT (PS3.5 6.1.2.3)...
#           with a single-byte character encoding
#  if (0008,0005) is multi-valued, then value 1 (or default if blank)...
#           is used until code extension escape sequence is hit,
#          which can be at start of string, or after CR/LF, FF, or
#          in Person Name PN, after ^ or =
# NOTE also that 7.5.3 SEQUENCE INHERITANCE states that if (0008,0005)
#       is not present in a sequence item then it is inherited from its parent.


def convert_encodings(
    encodings: Union[None, str, MutableSequence[str]]
) -> List[str]:
    """Convert DICOM `encodings` into corresponding Python encodings.

    Handles some common spelling mistakes and issues a warning in this case.

    Handles stand-alone encodings: if they are the first encodings,
    additional encodings are ignored, if they are not the first encoding,
    they are ignored. In both cases, a warning is issued.

    Invalid encodings are replaced with the default encoding with a
    respective warning issued, if
    :attr:`~pydicom.config.settings.reading_validation_mode` is
    ``WARN``, or an exception is raised if it is set to
    ``RAISE``.

    Parameters
    ----------
    encodings : str or list of str
        The encoding or list of encodings as read from (0008,0005)
        *Specific Character Set*.

    Returns
    -------
    list of str
        A :class:`list` of Python encodings corresponding to the DICOM
        encodings. If an encoding is already a Python encoding, it is returned
        unchanged. Encodings with common spelling errors are replaced by the
        correct encoding, and invalid encodings are replaced with the default
        encoding if :attr:`~pydicom.config.settings.reading_validation_mode`
        is not set to ``RAISE``.

    Raises
    ------
    LookupError
        If `encodings` contains a value that could not be converted and
        :attr:`~pydicom.config.settings.reading_validation_mode` is
        ``RAISE``.
    """

    encodings = encodings or ['']
    if isinstance(encodings, str):
        encodings = [encodings]
    else:
        # If a list if passed, we don't want to modify the list
        # in place so copy it
        encodings = encodings[:]
        if not encodings[0]:
            encodings[0] = 'ISO_IR 6'

    py_encodings = []
    for encoding in encodings:
        try:
            py_encodings.append(python_encoding[encoding])
        except KeyError:
            py_encodings.append(
                _python_encoding_for_corrected_encoding(encoding)
            )

    if len(encodings) > 1:
        py_encodings = _handle_illegal_standalone_encodings(
            encodings, py_encodings
        )

    return py_encodings


def _python_encoding_for_corrected_encoding(encoding: str) -> str:
    """Try to replace the given invalid encoding with a valid encoding by
    checking for common spelling errors, and return the correct Python
    encoding for that encoding. Otherwise check if the
    encoding is already a valid Python encoding, and return that. If both
    attempts fail, return the default encoding.
    Issue a warning for the invalid encoding except for the case where it is
    already converted.
    """
    # standard encodings
    patched = None
    if re.match('^ISO[^_]IR', encoding) is not None:
        patched = 'ISO_IR' + encoding[6:]
    # encodings with code extensions
    elif re.match('^(?=ISO.2022.IR.)(?!ISO 2022 IR )',
                  encoding) is not None:
        patched = 'ISO 2022 IR ' + encoding[12:]

    if patched:
        # handle encoding patched for common spelling errors
        try:
            py_encoding = python_encoding[patched]
            _warn_about_invalid_encoding(encoding, patched)
            return py_encoding
        except KeyError:
            _warn_about_invalid_encoding(encoding)
            return default_encoding

    # fallback: assume that it is already a python encoding
    try:
        codecs.lookup(encoding)
        return encoding
    except LookupError:
        _warn_about_invalid_encoding(encoding)
        return default_encoding


def _warn_about_invalid_encoding(
    encoding: str, patched_encoding: Optional[str] = None
) -> None:
    """Issue a warning for the given invalid encoding.
    If patched_encoding is given, it is mentioned as the
    replacement encoding, other the default encoding.
    If no replacement encoding is given, and
    :attr:`~pydicom.config.settings.reading_validation_mode` is set to
    ``RAISE``, `LookupError` is raised.
    """
    if patched_encoding is None:
        if config.settings.reading_validation_mode == config.RAISE:
            raise LookupError(f"Unknown encoding '{encoding}'")

        msg = f"Unknown encoding '{encoding}' - using default encoding instead"
    else:
        msg = (
            f"Incorrect value for Specific Character Set '{encoding}' - "
            f"assuming '{patched_encoding}'"
        )
    warnings.warn(msg, stacklevel=2)


def _handle_illegal_standalone_encodings(
    encodings: MutableSequence[str], py_encodings: List[str]
) -> List[str]:
    """Check for stand-alone encodings in multi-valued encodings.
    If the first encoding is a stand-alone encoding, the rest of the
    encodings is removed. If any other encoding is a stand-alone encoding,
    it is removed from the encodings.
    """
    if encodings[0] in STAND_ALONE_ENCODINGS:
        warnings.warn(
            (
                f"Value '{encodings[0]}' for Specific Character Set does not "
                f"allow code extensions, ignoring: {', '.join(encodings[1:])}"
            ),
            stacklevel=2
        )
        return py_encodings[:1]

    for i, encoding in reversed(list(enumerate(encodings[1:]))):
        if encoding in STAND_ALONE_ENCODINGS:
            warnings.warn(
                (
                    f"Value '{encoding}' cannot be used as code "
                    "extension, ignoring it"
                ),
                stacklevel=2
            )
            del py_encodings[i + 1]

    return py_encodings


def decode_element(
    elem: "DataElement", dicom_character_set: Optional[Union[str, List[str]]]
) -> None:
    """Apply the DICOM character encoding to a data element

    Parameters
    ----------
    elem : dataelem.DataElement
        The :class:`DataElement<pydicom.dataelem.DataElement>` instance
        containing an encoded byte string value to decode.
    dicom_character_set : str or list of str or None
        The value of (0008,0005) *Specific Character Set*, which may be a
        single value, a multiple value (code extension), or may also be ``''``
        or ``None``, in which case ``'ISO_IR 6'`` will be used.
    """
    if elem.is_empty:
        return

    if not dicom_character_set:
        dicom_character_set = ['ISO_IR 6']

    encodings = convert_encodings(dicom_character_set)

    # decode the string value to unicode
    # PN is special case as may have 3 components with different chr sets
    if elem.VR == VR.PN:
        if elem.VM == 1:
            # elem.value: Union[PersonName, bytes]
            elem.value = cast(PersonName, elem.value).decode(encodings)
        else:
            # elem.value: Iterable[Union[PersonName, bytes]]
            elem.value = [
                cast(PersonName, vv).decode(encodings) for vv in elem.value
            ]
    elif elem.VR in CUSTOMIZABLE_CHARSET_VR:
        # You can't re-decode unicode (string literals in py3)
        if elem.VM == 1:
            if isinstance(elem.value, str):
                # already decoded
                return
            elem.value = decode_bytes(elem.value, encodings, TEXT_VR_DELIMS)
        else:
            output = list()
            for value in elem.value:
                if isinstance(value, str):
                    output.append(value)
                else:
                    output.append(
                        decode_bytes(value, encodings, TEXT_VR_DELIMS)
                    )

            elem.value = output
