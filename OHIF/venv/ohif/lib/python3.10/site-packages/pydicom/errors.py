# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Module for pydicom exception classes"""

from typing import Any


class InvalidDicomError(Exception):
    """Exception that is raised when the the file does not appear to be DICOM.

    Usually raised when the "DICM" prefix is not present at position 128 in
    the file.

    To force reading the file (because maybe it is a DICOM file without
    a header), use ``dcmread(..., force=True)``.
    """

    def __init__(self, *args: Any) -> None:
        if not args:
            args = ('The specified file is not a valid DICOM file.', )
        Exception.__init__(self, *args)


class BytesLengthException(Exception):
    """Exception that is raised for an unexpected number of bytes."""
    pass
