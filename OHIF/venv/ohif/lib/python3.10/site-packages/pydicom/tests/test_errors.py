# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Tests for errors.py"""

import pytest

from pydicom.errors import InvalidDicomError


def test_message():
    """Test InvalidDicomError with a message"""

    def _test():
        raise InvalidDicomError('test msg')
    with pytest.raises(InvalidDicomError, match='test msg'):
        _test()


def test_no_message():
    """Test InvalidDicomError with no message"""

    def _test():
        raise InvalidDicomError
    with pytest.raises(InvalidDicomError,
                       match='The specified file is not a valid DICOM '
                             'file.'):
        _test()
