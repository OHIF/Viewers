# Copyright 2008-2020 pydicom authors. See LICENSE file for details.
"""Hold DicomFile class, which does basic I/O for a dicom file."""

from io import BytesIO
from struct import unpack, pack
from types import TracebackType
from typing import (
    Tuple, Optional, BinaryIO, Callable, Type, Union, cast, TextIO,
    TYPE_CHECKING, Any
)

try:
    from typing import Protocol  # added in 3.8
except ImportError:
    Protocol = object  # type: ignore[assignment]

from pydicom.tag import Tag, BaseTag, TagType


# Customise the type hints for read() and seek()
class Reader(Protocol):
    def __call__(self, size: int = -1) -> bytes: ...


class Seeker(Protocol):
    def __call__(self, offset: int, whence: int = 0) -> int: ...


class DicomIO:
    """File object which holds transfer syntax info and anything else we need.
    """

    # number of times to read if don't get requested bytes
    max_read_attempts = 3

    # default
    defer_size = None

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        # start with this by default
        self._implicit_VR = True
        self.write: Callable[[bytes], int]
        self.parent_read: Reader
        self.seek: Seeker
        self.tell: Callable[[], int]

    def read_le_tag(self) -> Tuple[int, int]:
        """Read and return two unsigned shorts (little endian) from the file.
        """
        bytes_read = self.read(4, need_exact_length=True)
        return cast(Tuple[int, int], unpack(b"<HH", bytes_read))

    def read_be_tag(self) -> Tuple[int, int]:
        """Read and return two unsigned shorts (big endian) from the file."""
        bytes_read = self.read(4, need_exact_length=True)
        return cast(Tuple[int, int], unpack(b">HH", bytes_read))

    def write_tag(self, tag: TagType) -> None:
        """Write a dicom tag (two unsigned shorts) to the file."""
        # make sure is an instance of class, not just a tuple or int
        if not isinstance(tag, BaseTag):
            tag = Tag(tag)
        self.write_US(tag.group)
        self.write_US(tag.element)

    def read_leUS(self) -> int:
        """Return an unsigned short from the file with little endian byte order
        """
        val: Tuple[int, ...] = unpack(b"<H", self.read(2))
        return val[0]

    def read_beUS(self) -> int:
        """Return an unsigned short from the file with big endian byte order"""
        val: Tuple[int, ...] = unpack(b">H", self.read(2))
        return val[0]

    def read_leUL(self) -> int:
        """Return an unsigned long read with little endian byte order"""
        val: Tuple[int, ...] = unpack(b"<L", self.read(4))
        return val[0]

    def read(
        self, length: Optional[int] = None, need_exact_length: bool = False
    ) -> bytes:
        """Reads the required length, returns EOFError if gets less

        If length is ``None``, then read all bytes
        """
        parent_read = self.parent_read  # super(DicomIO, self).read
        if length is None:
            return parent_read()  # get all of it

        bytes_read = parent_read(length)
        if len(bytes_read) < length and need_exact_length:
            # Didn't get all the desired bytes. Keep trying to get the rest.
            # If reading across network, might want to add a delay here
            attempts = 0
            max_reads = self.max_read_attempts
            while attempts < max_reads and len(bytes_read) < length:
                bytes_read += parent_read(length - len(bytes_read))
                attempts += 1
            num_bytes = len(bytes_read)
            if num_bytes < length:
                start_pos = self.tell() - num_bytes
                msg = (
                    f"Unexpected end of file. Read {len(bytes_read)} bytes "
                    f"of {length} expected starting at position "
                    f"0x{start_pos:x}"
                )
                raise EOFError(msg)
        return bytes_read

    def write_leUS(self, val: int) -> None:
        """Write an unsigned short with little endian byte order"""
        self.write(pack(b"<H", val))

    def write_leUL(self, val: int) -> None:
        """Write an unsigned long with little endian byte order"""
        self.write(pack(b"<L", val))

    def write_beUS(self, val: int) -> None:
        """Write an unsigned short with big endian byte order"""
        self.write(pack(b">H", val))

    def write_beUL(self, val: int) -> None:
        """Write an unsigned long with big endian byte order"""
        self.write(pack(b">L", val))

    write_US = write_leUS
    write_UL = write_leUL

    def read_beUL(self) -> int:
        """Return an unsigned long read with big endian byte order"""
        val: Tuple[int, ...] = unpack(b">L", self.read(4))
        return val[0]

    # Set up properties is_little_endian and is_implicit_VR
    # Big/Little Endian changes functions to read unsigned
    # short or long, e.g. length fields etc
    @property
    def is_little_endian(self) -> bool:
        return self._little_endian

    @is_little_endian.setter
    def is_little_endian(self, value: bool) -> None:
        self._little_endian = value
        if value:  # Little Endian
            self.read_US = self.read_leUS
            self.read_UL = self.read_leUL
            self.write_US = self.write_leUS  # type: ignore[assignment]
            self.write_UL = self.write_leUL  # type: ignore[assignment]
            self.read_tag = self.read_le_tag
        else:  # Big Endian
            self.read_US = self.read_beUS
            self.read_UL = self.read_beUL
            self.write_US = self.write_beUS  # type: ignore[assignment]
            self.write_UL = self.write_beUL  # type: ignore[assignment]
            self.read_tag = self.read_be_tag

    @property
    def is_implicit_VR(self) -> bool:
        return self._implicit_VR

    @is_implicit_VR.setter
    def is_implicit_VR(self, value: bool) -> None:
        self._implicit_VR = value


class DicomFileLike(DicomIO):
    def __init__(
        self,
        file_like_obj: Union[TextIO, BinaryIO, BytesIO],
        *args: Any,
        **kwargs: Any
    ) -> None:
        super().__init__(*args, **kwargs)
        self.parent = file_like_obj
        self.parent_read = getattr(file_like_obj, "read", self.no_read)
        self.write = getattr(file_like_obj, "write", self.no_write)
        self.seek = getattr(file_like_obj, "seek", self.no_seek)
        self.tell = file_like_obj.tell
        self.close = file_like_obj.close
        self.name: str = getattr(file_like_obj, 'name', '<no filename>')

    def no_write(self, bytes_read: bytes) -> int:
        """Used for file-like objects where no write is available"""
        raise IOError("This DicomFileLike object has no write() method")

    def no_read(self, size: int = -1) -> bytes:
        """Used for file-like objects where no read is available"""
        raise IOError("This DicomFileLike object has no read() method")

    def no_seek(self, offset: int, whence: int = 0) -> int:
        """Used for file-like objects where no seek is available"""
        raise IOError("This DicomFileLike object has no seek() method")

    def __enter__(self) -> "DicomFileLike":
        return self

    def __exit__(
        self,
        *exc_info: Tuple[
            Optional[Type[BaseException]],
            Optional[BaseException],
            Optional[TracebackType]
        ]
    ) -> None:
        self.close()


def DicomFile(*args: Any, **kwargs: Any) -> DicomFileLike:
    return DicomFileLike(open(*args, **kwargs))


class DicomBytesIO(DicomFileLike):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(BytesIO(*args, **kwargs))

    def getvalue(self) -> bytes:
        self.parent = cast(BytesIO, self.parent)
        return self.parent.getvalue()
