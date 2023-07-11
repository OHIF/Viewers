# Copyright 2008-2020 pydicom authors. See LICENSE file for details.
"""Test suite for util functions"""
from io import BytesIO
from pathlib import Path

import pytest

from pydicom.fileutil import path_from_pathlike


class PathLike:
    """Minimal example for path-like object"""
    def __init__(self, path: str):
        self.path = path

    def __fspath__(self):
        return self.path


class TestPathFromPathLike:
    """Test the fileutil module"""

    def test_non_pathlike_is_returned_unaltered(self):
        assert 'test.dcm' == path_from_pathlike('test.dcm')
        assert path_from_pathlike(None) is None
        file_like = BytesIO()
        assert file_like == path_from_pathlike(file_like)
        assert 42 == path_from_pathlike(42)

    def test_pathlib_path(self):
        assert 'test.dcm' == path_from_pathlike(Path('test.dcm'))

    def test_path_like(self):
        assert 'test.dcm' == path_from_pathlike(PathLike('test.dcm'))
