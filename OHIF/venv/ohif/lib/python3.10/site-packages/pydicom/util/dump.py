# Copyright 2008-2021 pydicom authors. See LICENSE file for details.
"""Utility functions used in debugging writing and reading"""

from io import BytesIO
import os
import sys
from typing import Union, Optional, BinaryIO, TYPE_CHECKING

from pydicom.valuerep import VR

if TYPE_CHECKING:  # pragma: no cover
    from pydicom.dataset import Dataset


def print_character(ordchr: int) -> str:
    """Return a printable character, or '.' for non-printable ones."""
    if 31 < ordchr < 126 and ordchr != 92:
        return chr(ordchr)

    return "."


def filedump(
    filename: Union[str, bytes, os.PathLike],
    start_address: int = 0,
    stop_address: Optional[int] = None,
) -> str:
    """Dump out the contents of a file to a standard hex dump 16 bytes wide"""

    with open(filename, "rb") as f:
        return hexdump(f, start_address, stop_address)


def datadump(
    data: bytes, start_address: int = 0, stop_address: Optional[int] = None
) -> str:
    """Return a hex string representation of `data`."""
    return hexdump(BytesIO(data), start_address, stop_address)


def hexdump(
    f: BinaryIO,
    start_address: int = 0,
    stop_address: Optional[int] = None,
    show_address: bool = True,
) -> str:
    """Return a formatted string of hex bytes and characters in data.

    This is a utility function for debugging file writing.

    Parameters
    ----------
    f : BinaryIO
        The file-like to dump.
    start_address : int, optional
        The offset where the dump should start (default ``0``)
    stop_address : int, optional
        The offset where the dump should end, by default the entire file will
        be dumped.
    show_address : bool, optional
        If ``True`` (default) then include the offset of each line of output.

    Returns
    -------
    str
    """

    s = []

    # Determine the maximum number of characters for the offset
    max_offset_len = len(f"{f.seek(0, 2):X}")
    if stop_address:
        max_offset_len = len(f"{stop_address:X}")

    f.seek(start_address)
    while True:
        offset = f.tell()
        if stop_address and offset > stop_address:
            break

        data = f.read(16)
        if not data:
            break

        current = []

        if show_address:
            # Offset at the start of the current line
            current.append(f"{offset:0{max_offset_len}X}  ")

        # Add hex version of the current line
        b = " ".join([f"{x:02X}" for x in data])
        current.append(f"{b:<49}")  # if fewer than 16 bytes, pad out to length

        # Append the ASCII version of the current line (or . if not ASCII)
        current.append("".join([print_character(x) for x in data]))

        s.append("".join(current))

    return "\n".join(s)


def pretty_print(
    ds: "Dataset", indent_level: int = 0, indent_chars: str = "  "
) -> None:
    """Print a dataset directly, with indented levels.

    This is just like Dataset._pretty_str, but more useful for debugging as it
    prints each item immediately rather than composing a string, making it
    easier to immediately see where an error in processing a dataset starts.

    """

    indent = indent_chars * indent_level
    next_indent = indent_chars * (indent_level + 1)
    for elem in ds:
        if elem.VR == VR.SQ:  # a sequence
            print(
                f"{indent}{elem.tag} {elem.name} -- {len(elem.value)} item(s)"
            )
            for dataset in elem.value:
                pretty_print(dataset, indent_level + 1)
                print(next_indent + "---------")
        else:
            print(indent + repr(elem))


if __name__ == "__main__":  # pragma: no cover
    filename = sys.argv[1]
    start_address = 0
    stop_address = None
    if len(sys.argv) > 2:  # then have start address
        start_address = eval(sys.argv[2])
    if len(sys.argv) > 3:
        stop_address = eval(sys.argv[3])

    print(filedump(filename, start_address, stop_address))
