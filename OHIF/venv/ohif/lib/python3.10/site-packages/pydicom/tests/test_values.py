# -*- coding: utf-8 -*-
# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Tests for dataset.py"""

import pytest

from pydicom.tag import Tag
from pydicom.values import (
    convert_value, converters, convert_tag, convert_ATvalue, convert_DA_string,
    convert_text, convert_single_string, convert_AE_string
)
from pydicom.valuerep import VR


class TestConvertTag:
    def test_big_endian(self):
        """Test convert_tag with a big endian byte string"""
        bytestring = b'\x00\x10\x00\x20'
        assert convert_tag(bytestring, False) == Tag(0x0010, 0x0020)

    def test_little_endian(self):
        """Test convert_tag with a little endian byte string"""
        bytestring = b'\x10\x00\x20\x00'
        assert convert_tag(bytestring, True) == Tag(0x0010, 0x0020)

    def test_offset(self):
        """Test convert_tag with an offset"""
        bytestring = b'\x12\x23\x10\x00\x20\x00\x34\x45'
        assert convert_tag(bytestring, True, 0) == Tag(0x2312, 0x0010)
        assert convert_tag(bytestring, True, 2) == Tag(0x0010, 0x0020)

    @pytest.mark.skip(reason='empty bytestring not handled properly')
    def test_empty_bytestring(self):
        """Test convert_tag with empty bytestring"""
        bytestring = b''
        assert convert_tag(bytestring, True) == ''

    @pytest.mark.skip(reason='bad bytestring not handled properly')
    def test_bad_bytestring(self):
        """Test convert_tag with a bad bytestring"""
        bytestring = b'\x10\x00'
        convert_tag(bytestring, True)


class TestConvertAE:
    def test_strip_blanks(self):
        bytestring = b'  AE_TITLE '
        assert 'AE_TITLE' == convert_AE_string(bytestring, True)

    def test_convert_multival(self):
        bytestring = b'AE_ONE\\AE_TWO'
        assert ['AE_ONE', 'AE_TWO'] == convert_AE_string(bytestring, True)


class TestConvertText:
    def test_single_value(self):
        """Test that encoding can change inside a text string"""
        bytestring = (b'Dionysios is \x1b\x2d\x46'
                      b'\xc4\xe9\xef\xed\xf5\xf3\xe9\xef\xf2')
        encodings = ['latin_1', 'iso_ir_126']
        assert 'Dionysios is Διονυσιος' == convert_text(bytestring, encodings)

    def test_multi_value(self):
        """Test that backslash is handled as value separator"""
        bytestring = (b'Buc^J\xe9r\xf4me\\\x1b\x2d\x46'
                      b'\xc4\xe9\xef\xed\xf5\xf3\xe9\xef\xf2\\'
                      b'\x1b\x2d\x4C'
                      b'\xbb\xee\xda\x63\x65\xdc\xd1\x79\x70\xd3')
        encodings = ['latin_1', 'iso_ir_144', 'iso_ir_126']
        assert ['Buc^Jérôme', 'Διονυσιος', 'Люкceмбypг'] == convert_text(
            bytestring, encodings)

    def test_single_value_with_backslash(self):
        """Test that backslash is handled as character"""
        bytestring = (b'Buc^J\xe9r\xf4me\\\x1b\x2d\x46'
                      b'\xc4\xe9\xef\xed\xf5\xf3\xe9\xef\xf2\\'
                      b'\x1b\x2d\x4C'
                      b'\xbb\xee\xda\x63\x65\xdc\xd1\x79\x70\xd3')
        encodings = ['latin_1', 'iso_ir_144', 'iso_ir_126']
        assert 'Buc^Jérôme\\Διονυσιος\\Люкceмбypг' == convert_single_string(
            bytestring, encodings)

    def test_single_value_with_unknown_encoding(self):
        bytestring = b'Buc^J\xe9r\xf4me'
        encodings = ['unknown']
        msg = "Unknown encoding 'unknown' - using default encoding instead"
        with pytest.warns(UserWarning, match=msg):
            assert convert_single_string(bytestring, encodings) == 'Buc^Jérôme'

    def test_single_value_with_unknown_encoding_raises(
            self, enforce_valid_values):
        bytestring = b'Buc^J\xe9r\xf4me'
        encodings = ['unknown']
        with pytest.raises(LookupError, match="unknown encoding: unknown"):
            convert_single_string(bytestring, encodings)

    def test_single_value_with_delimiters(self):
        """Test that delimiters reset the encoding"""
        bytestring = (b'\x1b\x2d\x46'
                      b'\xc4\xe9\xef\xed\xf5\xf3\xe9\xef\xf2'
                      b'\r\nJ\xe9r\xf4me/'
                      b'\x1b\x2d\x4C'
                      b'\xbb\xee\xda\x63\x65\xdc\xd1\x79\x70\xd3'
                      b'\tJ\xe9r\xf4me')
        encodings = ['latin_1', 'iso_ir_144', 'iso_ir_126']
        expected = 'Διονυσιος\r\nJérôme/Люкceмбypг\tJérôme'
        assert expected == convert_single_string(bytestring, encodings)

    def test_value_ending_with_padding(self):
        bytestring = b'Value ending with spaces   '
        assert 'Value ending with spaces' == convert_single_string(bytestring)
        assert 'Value ending with spaces' == convert_text(bytestring)

        bytestring = b'Values  \\with spaces   '
        assert ['Values', 'with spaces'] == convert_text(bytestring)

        bytestring = b'Value ending with zeros\0\0\0'
        assert 'Value ending with zeros' == convert_single_string(bytestring)
        assert 'Value ending with zeros' == convert_text(bytestring)

        bytestring = b'Values\0\0\\with zeros\0'
        assert ['Values', 'with zeros'] == convert_text(bytestring)


class TestConvertAT:
    def test_big_endian(self):
        """Test convert_ATvalue with a big endian byte string"""
        # VM 1
        bytestring = b'\x00\x10\x00\x20'
        assert convert_ATvalue(bytestring, False) == Tag(0x0010, 0x0020)

        # VM 3
        bytestring += b'\x00\x10\x00\x30\x00\x10\x00\x40'
        out = convert_ATvalue(bytestring, False)
        assert Tag(0x0010, 0x0020) in out
        assert Tag(0x0010, 0x0030) in out
        assert Tag(0x0010, 0x0040) in out

    def test_little_endian(self):
        """Test convert_ATvalue with a little endian byte string"""
        # VM 1
        bytestring = b'\x10\x00\x20\x00'
        assert convert_ATvalue(bytestring, True) == Tag(0x0010, 0x0020)

        # VM 3
        bytestring += b'\x10\x00\x30\x00\x10\x00\x40\x00'
        out = convert_ATvalue(bytestring, True)
        assert Tag(0x0010, 0x0020) in out
        assert Tag(0x0010, 0x0030) in out
        assert Tag(0x0010, 0x0040) in out

    def test_empty_bytestring(self):
        """Test convert_ATvalue with empty bytestring"""
        bytestring = b''
        assert convert_ATvalue(bytestring, True) == []

    @pytest.mark.skip(reason='bad bytestring not handled properly')
    def test_bad_length(self):
        """Test convert_ATvalue with bad length bytestring"""
        bytestring = b''
        assert convert_ATvalue(bytestring, True) == ''

        bytestring = b'\x10\x00\x20\x00\x10\x00\x30\x00\x10'
        convert_ATvalue(bytestring, True)


class TestConvertDA:
    def test_big_endian(self):
        """Test convert_DA_string with a big endian byte string"""
        # VM 1
        bytestring = b'\x32\x30\x30\x34\x30\x31\x31\x39'
        # byte ordering independent
        assert convert_DA_string(bytestring, False) == '20040119'

        # VM 2
        bytestring += b'\x5c\x31\x39\x39\x39\x31\x32\x31\x32'
        out = convert_DA_string(bytestring, False)
        assert out == ['20040119', '19991212']

    def test_little_endian(self):
        """Test convert_DA_string with a little endian byte string"""
        # VM 1
        bytestring = b'\x32\x30\x30\x34\x30\x31\x31\x39'
        # byte ordering independent
        assert convert_DA_string(bytestring, True) == '20040119'

        # VM 2
        bytestring += b'\x5c\x31\x39\x39\x39\x31\x32\x31\x32'
        out = convert_DA_string(bytestring, True)
        assert out == ['20040119', '19991212']

    def test_empty_bytestring(self):
        """Test convert_DA_string with empty bytestring"""
        bytestring = b''
        assert convert_DA_string(bytestring, True) == ''


class TestConvertValue:
    def test_convert_value_raises(self):
        """Test convert_value raises exception if unsupported VR"""
        converter_func = converters['PN']
        del converters['PN']

        with pytest.raises(NotImplementedError,
                           match="Unknown Value Representation 'PN'"):
            convert_value('PN', None)

        # Fix converters
        converters['PN'] = converter_func
        assert 'PN' in converters


class TestConvertOValues:
    """Test converting values with the 'O' VRs like OB, OW, OF, etc."""
    def test_convert_of(self):
        """Test converting OF."""
        fp = b'\x00\x01\x02\x03'
        assert b'\x00\x01\x02\x03' == converters['OF'](fp, True)


def test_all_converters():
    """Test that the VR decoder functions are complete"""
    assert set(VR) == set(converters)
