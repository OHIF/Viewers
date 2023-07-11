# Copyright 2008-2019 pydicom authors. See LICENSE file for details.
"""Unit tests for the pydicom.config module."""

import logging
import sys
import os
import importlib

import pytest

from pydicom import dcmread, DataElement
from pydicom.config import debug
from pydicom.data import get_testdata_file
from pydicom import config
from pydicom.dataelem import RawDataElement, DataElement_from_raw
from pydicom.dataset import Dataset
from pydicom.filebase import DicomBytesIO
from pydicom.tag import Tag

DS_PATH = get_testdata_file("CT_small.dcm")
PYTEST = [int(x) for x in pytest.__version__.split(".")]


@pytest.mark.skipif(PYTEST[:2] < [3, 4], reason="no caplog")
class TestDebug:
    """Tests for config.debug()."""

    def setup(self):
        self.logger = logging.getLogger("pydicom")

    def teardown(self):
        # Reset to just NullHandler
        self.logger.handlers = [self.logger.handlers[0]]

    def test_default(self, caplog):
        """Test that the default logging handler is a NullHandler."""
        assert 1 == len(self.logger.handlers)
        assert isinstance(self.logger.handlers[0], logging.NullHandler)

        with caplog.at_level(logging.DEBUG, logger="pydicom"):
            ds = dcmread(DS_PATH)

            assert "Call to dcmread()" not in caplog.text
            assert "Reading File Meta Information preamble..." in caplog.text
            assert "Reading File Meta Information prefix..." in caplog.text
            assert "00000080: 'DICM' prefix found" in caplog.text

    def test_debug_on_handler_null(self, caplog):
        """Test debug(True, False)."""
        debug(True, False)
        assert 1 == len(self.logger.handlers)
        assert isinstance(self.logger.handlers[0], logging.NullHandler)

        with caplog.at_level(logging.DEBUG, logger="pydicom"):
            ds = dcmread(DS_PATH)

            assert "Call to dcmread()" in caplog.text
            assert "Reading File Meta Information preamble..." in caplog.text
            assert "Reading File Meta Information prefix..." in caplog.text
            assert "00000080: 'DICM' prefix found" in caplog.text
            msg = (
                "0000989c: fc ff fc ff 4f 42 00 00 7e 00 00 00    "
                "(fffc, fffc) OB Length: 126"
            )
            assert msg in caplog.text

    def test_debug_off_handler_null(self, caplog):
        """Test debug(False, False)."""
        debug(False, False)
        assert 1 == len(self.logger.handlers)
        assert isinstance(self.logger.handlers[0], logging.NullHandler)

        with caplog.at_level(logging.DEBUG, logger="pydicom"):
            ds = dcmread(DS_PATH)

            assert "Call to dcmread()" not in caplog.text
            assert "Reading File Meta Information preamble..." in caplog.text
            assert "Reading File Meta Information prefix..." in caplog.text
            assert "00000080: 'DICM' prefix found" in caplog.text

    def test_debug_on_handler_stream(self, caplog):
        """Test debug(True, True)."""
        debug(True, True)
        assert 2 == len(self.logger.handlers)
        assert isinstance(self.logger.handlers[0], logging.NullHandler)
        assert isinstance(self.logger.handlers[1], logging.StreamHandler)

        with caplog.at_level(logging.DEBUG, logger="pydicom"):
            ds = dcmread(DS_PATH)

            assert "Call to dcmread()" in caplog.text
            assert "Reading File Meta Information preamble..." in caplog.text
            assert "Reading File Meta Information prefix..." in caplog.text
            assert "00000080: 'DICM' prefix found" in caplog.text
            msg = (
                "0000989c: fc ff fc ff 4f 42 00 00 7e 00 00 00    "
                "(fffc, fffc) OB Length: 126"
            )
            assert msg in caplog.text

    def test_debug_off_handler_stream(self, caplog):
        """Test debug(False, True)."""
        debug(False, True)
        assert 2 == len(self.logger.handlers)
        assert isinstance(self.logger.handlers[0], logging.NullHandler)
        assert isinstance(self.logger.handlers[1], logging.StreamHandler)

        with caplog.at_level(logging.DEBUG, logger="pydicom"):
            ds = dcmread(DS_PATH)

            assert "Call to dcmread()" not in caplog.text
            assert "Reading File Meta Information preamble..." in caplog.text
            assert "Reading File Meta Information prefix..." in caplog.text
            assert "00000080: 'DICM' prefix found" in caplog.text


@pytest.fixture(scope="function", params=["config", "env"])
def future_setter(request, monkeypatch):
    if request.param == "config":
        config.future_behavior()
        yield
    else:
        monkeypatch.setenv("PYDICOM_FUTURE", "True")
        importlib.reload(config)
        yield

    config.future_behavior(False)


class TestFuture:
    def test_reload(self):
        importlib.reload(config)
        assert not config._use_future

    def test_compat_import(self, future_setter):
        """Import error if pydicom future behavior is set"""
        with pytest.raises(ImportError):
            import pydicom.compat

    def test_file_meta_class(self, future_setter):
        """FileMetaDataset required type in pydicom future behavior"""
        ds = Dataset()
        with pytest.raises(TypeError):
            ds.file_meta = Dataset()

    def test_invalid_keyword_raise(self, future_setter):
        ds = Dataset()
        with pytest.raises(ValueError):
            ds.bitsStored = 42

    def test_write_invalid_values(self, future_setter):
        ds = Dataset()
        ds.is_implicit_VR = True
        ds.is_little_endian = True
        ds.SpecificCharacterSet = "ISO_IR 192"
        ds.add(DataElement(0x00080050, "SH", "洪^吉洞=홍^길동"))
        with pytest.raises(ValueError):
            ds.save_as(DicomBytesIO())


class TestSettings:
    @pytest.fixture
    def enforce_valid_values(self):
        config.enforce_valid_values = True
        yield
        config.enforce_valid_values = False

    def test_default_for_reading_validation_mode(self):
        raw = RawDataElement(Tag(0x88880002), None, 4, b'unknown',
                             0, True, True)
        with pytest.warns(UserWarning):
            DataElement_from_raw(raw)

    def test_reading_validation_mode_with_enforce_valid_values(
            self, enforce_valid_values):
        raw = RawDataElement(Tag(0x88880002), None, 4, b'unknown',
                             0, True, True)
        with pytest.raises(KeyError):
            DataElement_from_raw(raw)

    def test_default_for_writing_validation_mode(self):
        ds = Dataset()
        ds.is_implicit_VR = True
        ds.is_little_endian = True
        ds.SpecificCharacterSet = "ISO_IR 192"
        ds.add(DataElement(0x00080050, "SH", "洪^吉洞=홍^길동"))
        with pytest.warns(UserWarning):
            ds.save_as(DicomBytesIO())

    def test_writing_validation_mode_with_enforce_valid_values(
            self, enforce_valid_values):
        ds = Dataset()
        ds.is_implicit_VR = True
        ds.is_little_endian = True
        ds.SpecificCharacterSet = "ISO_IR 192"
        ds.add(DataElement(0x00080050, "SH", "洪^吉洞=홍^길동"))
        with pytest.raises(ValueError):
            ds.save_as(DicomBytesIO())
