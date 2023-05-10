# Copyright 2008-2021 pydicom authors. See LICENSE file for details.
"""Read a dicom media file"""

import os
from struct import Struct, unpack
from types import TracebackType
from typing import (
    Iterator, Tuple, Optional, Union, Type, cast, BinaryIO, Callable
)

from pydicom.misc import size_in_bytes
from pydicom.datadict import dictionary_VR
from pydicom.tag import TupleTag, ItemTag
from pydicom.uid import UID
from pydicom.valuerep import EXPLICIT_VR_LENGTH_32


extra_length_VRs_b = tuple(vr.encode('ascii') for vr in EXPLICIT_VR_LENGTH_32)
ExplicitVRLittleEndian = b'1.2.840.10008.1.2.1'
ImplicitVRLittleEndian = b'1.2.840.10008.1.2'
DeflatedExplicitVRLittleEndian = b'1.2.840.10008.1.2.1.99'
ExplicitVRBigEndian = b'1.2.840.10008.1.2.2'


_ElementType = Tuple[
    Tuple[int, int], Optional[bytes], int, Optional[bytes], int
]


class dicomfile:
    """Context-manager based DICOM file object with data element iteration"""

    def __init__(self, filename: Union[str, bytes, os.PathLike]) -> None:
        self.fobj = fobj = open(filename, "rb")

        # Read the DICOM preamble, if present
        self.preamble: Optional[bytes] = fobj.read(0x80)
        dicom_prefix = fobj.read(4)
        if dicom_prefix != b"DICM":
            self.preamble = None
            fobj.seek(0)

    def __enter__(self) -> "dicomfile":
        return self

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType]
    ) -> Optional[bool]:
        self.fobj.close()

        return None

    def __iter__(self) -> Iterator[_ElementType]:
        # Need the transfer_syntax later
        tsyntax: Optional[UID] = None

        # Yield the file meta info elements
        file_meta = data_element_generator(
            self.fobj,
            is_implicit_VR=False,
            is_little_endian=True,
            stop_when=lambda group, elem: group != 2
        )

        for elem in file_meta:
            if elem[0] == (0x0002, 0x0010):
                value = cast(bytes, elem[3])
                tsyntax = UID(value.strip(b" \0").decode('ascii'))

            yield elem

        # Continue to yield elements from the main data
        if not tsyntax:
            raise NotImplementedError("No transfer syntax in file meta info")

        ds_gen = data_element_generator(
            self.fobj, tsyntax.is_implicit_VR, tsyntax.is_little_endian
        )
        for elem in ds_gen:
            yield elem


def data_element_generator(
    fp: BinaryIO,
    is_implicit_VR: bool,
    is_little_endian: bool,
    stop_when: Optional[Callable[[int, int], bool]] = None,
    defer_size: Optional[Union[str, int, float]] = None,
) -> Iterator[_ElementType]:
    """:return: (tag, VR, length, value, value_tell,
                                 is_implicit_VR, is_little_endian)
    """
    endian_chr = "<" if is_little_endian else ">"

    if is_implicit_VR:
        element_struct = Struct(endian_chr + "HHL")
    else:  # Explicit VR
        # tag, VR, 2-byte length (or 0 if special VRs)
        element_struct = Struct(endian_chr + "HH2sH")
        extra_length_struct = Struct(endian_chr + "L")  # for special VRs
        extra_length_unpack = extra_length_struct.unpack  # for lookup speed

    # Make local variables so have faster lookup
    fp_read = fp.read
    fp_tell = fp.tell
    element_struct_unpack = element_struct.unpack
    defer_size = size_in_bytes(defer_size)

    while True:
        # Read tag, VR, length, get ready to read value
        bytes_read = fp_read(8)
        if len(bytes_read) < 8:
            return  # at end of file

        if is_implicit_VR:
            # must reset VR each time; could have set last iteration (e.g. SQ)
            vr = None
            group, elem, length = element_struct_unpack(bytes_read)
        else:  # explicit VR
            group, elem, vr, length = element_struct_unpack(bytes_read)
            if vr in extra_length_VRs_b:
                length = extra_length_unpack(fp_read(4))[0]

        # Positioned to read the value, but may not want to -- check stop_when
        value_tell = fp_tell()
        if stop_when is not None:
            if stop_when(group, elem):
                rewind_length = 8
                if not is_implicit_VR and vr in extra_length_VRs_b:
                    rewind_length += 4
                fp.seek(value_tell - rewind_length)

                return

        # Reading the value
        # First case (most common): reading a value with a defined length
        if length != 0xFFFFFFFF:
            if defer_size is not None and length > defer_size:
                # Flag as deferred by setting value to None, and skip bytes
                value = None
                fp.seek(fp_tell() + length)
            else:
                value = fp_read(length)
            # import pdb;pdb.set_trace()
            yield ((group, elem), vr, length, value, value_tell)

        # Second case: undefined length - must seek to delimiter,
        # unless is SQ type, in which case is easier to parse it, because
        # undefined length SQs and items of undefined lengths can be nested
        # and it would be error-prone to read to the correct outer delimiter
        else:
            # Try to look up type to see if is a SQ
            # if private tag, won't be able to look it up in dictionary,
            #   in which case just ignore it and read the bytes unless it is
            #   identified as a Sequence
            if vr is None:
                try:
                    vr = dictionary_VR((group, elem)).encode('ascii')
                except KeyError:
                    # Look ahead to see if it consists of items and
                    # is thus a SQ
                    next_tag = TupleTag(
                        cast(
                            Tuple[int, int],
                            unpack(endian_chr + "HH", fp_read(4)),
                        )
                    )
                    # Rewind the file
                    fp.seek(fp_tell() - 4)
                    if next_tag == ItemTag:
                        vr = b'SQ'

            if vr == b'SQ':
                yield ((group, elem), vr, length, None, value_tell)
            else:
                raise NotImplementedError(
                    "This reader does not handle undefined length except "
                    "for SQ"
                )
