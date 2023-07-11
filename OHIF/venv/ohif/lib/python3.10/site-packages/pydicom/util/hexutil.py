# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Miscellaneous utility routines relating to hex and byte strings"""

from binascii import a2b_hex, b2a_hex
from typing import Union

from pydicom.charset import default_encoding


def hex2bytes(hexstring: Union[str, bytes]) -> bytes:
    """Return bytestring for a string of hex bytes separated by whitespace

    This is useful for creating specific byte sequences for testing, using
    python's implied concatenation for strings with comments allowed.

    Examples
    --------

    ::
        hex_string = (
            "08 00 32 10 "  # (0008, 1032) SQ "Procedure Code Sequence"
            "08 00 00 00 "  # length 8
            "fe ff 00 e0 "  # (fffe, e000) Item Tag
        )
        byte_string = hex2bytes(hex_string)

    Note in the example that all lines except the first must
    start with a space, alternatively the space could
    end the previous line.
    """

    # This works in both 3.x and 2.x because the first conditional evaluates to
    # true in 2.x so the difference in bytes constructor doesn't matter
    if isinstance(hexstring, bytes):
        return a2b_hex(hexstring.replace(b" ", b""))

    if isinstance(hexstring, str):
        return a2b_hex(bytes(hexstring.replace(" ", ""), default_encoding))

    raise TypeError('argument shall be bytes or string type')


def bytes2hex(byte_string: bytes) -> str:
    """Return a hex string representation of encoded bytes."""
    s = b2a_hex(byte_string).decode()
    return " ".join(s[i:i + 2] for i in range(0, len(s), 2))
