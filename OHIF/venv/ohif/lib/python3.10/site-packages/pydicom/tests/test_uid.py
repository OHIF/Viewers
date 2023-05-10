# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Test suite for uid.py"""

from importlib import import_module
import sys
import uuid

import pytest

from pydicom._storage_sopclass_uids import CTImageStorage
from pydicom.uid import UID, generate_uid, PYDICOM_ROOT_UID, JPEGLSNearLossless
import pydicom.uid


def test_storage_sopclass_uids():
    assert CTImageStorage == pydicom.uid.CTImageStorage


def test_jpeglossless_warning():
    """Test warning when importing JPEGLossless for Python 3.7+."""
    if sys.version_info[:2] < (3, 7):
        from pydicom.uid import JPEGLossless
        assert '1.2.840.10008.1.2.4.70' == JPEGLossless
    else:
        msg = (
            r"In pydicom v3.0 the UID for 'JPEGLossless' will change "
            r"from '1.2.840.10008.1.2.4.70' to '1.2.840.10008.1.2.4.57' to "
            r"match its UID keyword. Use 'JPEGLosslessSV1' instead"
        )
        with pytest.warns(UserWarning, match=msg):
            from pydicom.uid import JPEGLossless
            assert '1.2.840.10008.1.2.4.70' == JPEGLossless


def test_deprecation_warnings():
    """Test deprecations warnings for other UIDs for Python 3.7+."""
    _deprecations = {
        "JPEGBaseline": ("1.2.840.10008.1.2.4.50", "JPEGBaseline8Bit"),
        "JPEGExtended": ("1.2.840.10008.1.2.4.51", "JPEGExtended12Bit"),
        "JPEGLSLossy": ("1.2.840.10008.1.2.4.81", "JPEGLSNearLossless"),
        "JPEG2000MultiComponentLossless": (
            "1.2.840.10008.1.2.4.92", "JPEG2000MCLossless"
        ),
        "JPEG2000MultiComponent": ("1.2.840.10008.1.2.4.93", "JPEG2000MC"),
    }

    if sys.version_info[:2] < (3, 7):
        for name, (value, replacement) in _deprecations.items():
            uid = getattr(pydicom.uid, name)

            assert value == uid
    else:
        for name, (value, replacement) in _deprecations.items():
            msg = (
                f"The UID constant '{name}' is deprecated and will be removed "
                f"in pydicom v3.0, use '{replacement}' instead"
            )
            with pytest.warns(DeprecationWarning, match=msg):
                uid = getattr(pydicom.uid, name)
                assert value == uid


class TestGenerateUID:
    def test_generate_uid(self):
        """Test UID generator"""
        # Test standard UID generation with pydicom prefix
        uid = generate_uid()
        assert uid[:26] == PYDICOM_ROOT_UID
        assert len(uid) <= 64

        # Test standard UID generation with no prefix
        uid = generate_uid(None)
        assert uid[:5] == '2.25.'
        assert len(uid) <= 64

        # Test invalid UID prefixes
        for invalid_prefix in (('1' * 63) + '.',
                               '',
                               '.',
                               '1',
                               '1.2',
                               '1.2..3.',
                               '1.a.2.',
                               '1.01.1.'):
            with pytest.raises(ValueError):
                generate_uid(prefix=invalid_prefix)

        # Test some valid prefixes and make sure they survive
        for valid_prefix in ('0.',
                             '1.',
                             '1.23.',
                             '1.0.23.',
                             ('1' * 62) + '.',
                             '1.2.3.444444.'):
            uid = generate_uid(prefix=valid_prefix)

            assert uid[:len(valid_prefix)] == valid_prefix
            assert len(uid) <= 64

    def test_entropy_src(self):
        """Test UID generator with default entropy sources"""
        # Should be different
        uid = generate_uid(entropy_srcs=None)
        assert uid != generate_uid(entropy_srcs=None)

    def test_entropy_src_custom(self):
        """Test UID generator with custom entropy sources"""
        # Should be identical
        uid = generate_uid(entropy_srcs=['lorem', 'ipsum'])
        rf = '1.2.826.0.1.3680043.8.498.87507166259346337659265156363895084463'
        assert uid == rf
        assert len(uid) == 64

    def test_none(self):
        """Test generate_uid(None)."""
        uid = generate_uid(prefix=None)
        # Check prefix
        assert '2.25.' == uid[:5]
        # Check UUID suffix
        as_uuid = uuid.UUID(int=int(uid[5:]))
        assert isinstance(as_uuid, uuid.UUID)
        assert as_uuid.version == 4
        assert as_uuid.variant == uuid.RFC_4122

    def test_none_iterate(self):
        """Test generate_uid(None) generates valid UIDs."""
        # Generate random UIDs, if a bad method then should eventually fail
        for ii in range(10000):
            uid = generate_uid(None)
            assert uid.is_valid


class TestUID:
    """Test DICOM UIDs"""
    def setup(self):
        """Set default UID"""
        self.uid = UID('1.2.840.10008.1.2')

    def test_equality(self):
        """Test that UID.__eq__ works."""
        assert self.uid == UID('1.2.840.10008.1.2')
        assert self.uid == '1.2.840.10008.1.2'
        assert '1.2.840.10008.1.2' == self.uid
        assert not self.uid == 'Implicit VR Little Endian'
        assert not 'Implicit VR Little Endian' == self.uid
        assert not self.uid == UID('1.2.840.10008.1.2.1')
        assert not self.uid == '1.2.840.10008.1.2.1'
        assert not '1.2.840.10008.1.2.1' == self.uid
        # Issue 96
        assert not self.uid == 3
        assert self.uid is not None

    def test_inequality(self):
        """Test that UID.__ne__ works."""
        assert not self.uid != UID('1.2.840.10008.1.2')
        assert not self.uid != '1.2.840.10008.1.2'
        assert not '1.2.840.10008.1.2' != self.uid
        assert self.uid != 'Implicit VR Little Endian'
        assert 'Implicit VR Little Endian' != self.uid
        assert self.uid != UID('1.2.840.10008.1.2.1')
        assert self.uid != '1.2.840.10008.1.2.1'
        assert '1.2.840.10008.1.2.1' != self.uid
        # Issue 96
        assert self.uid != 3

    def test_hash(self):
        """Test that UID.__hash_- works."""
        assert hash(self.uid) == hash(self.uid)

    def test_str(self):
        """Test that UID.__str__ works."""
        assert self.uid.__str__() == '1.2.840.10008.1.2'

    def test_is_implicit_vr(self):
        """Test that UID.is_implicit_VR works."""
        # '1.2.840.10008.1.2' Implicit VR Little Endian
        # '1.2.840.10008.1.2.1' Explicit VR Little Endian
        # '1.2.840.10008.1.2.1.99' Deflated Explicit VR Little Endian
        # '1.2.840.10008.1.2.2' Explicit VR Big Endian
        # '1.2.840.10008.1.2.4.50'JPEG Baseline (Process 1)
        assert UID('1.2.840.10008.1.2').is_implicit_VR
        assert not UID('1.2.840.10008.1.2.1').is_implicit_VR
        assert not UID('1.2.840.10008.1.2.1.99').is_implicit_VR
        assert not UID('1.2.840.10008.1.2.2').is_implicit_VR
        assert not UID('1.2.840.10008.1.2.4.50').is_implicit_VR

        with pytest.raises(ValueError):
            UID('1.2.840.10008.5.1.4.1.1.2').is_implicit_VR

    def test_is_little_endian(self):
        """Test that UID.is_little_endian works."""
        # '1.2.840.10008.1.2' Implicit VR Little Endian
        # '1.2.840.10008.1.2.1' Explicit VR Little Endian
        # '1.2.840.10008.1.2.1.99' Deflated Explicit VR Little Endian
        # '1.2.840.10008.1.2.2' Explicit VR Big Endian
        # '1.2.840.10008.1.2.4.50'JPEG Baseline (Process 1)
        assert UID('1.2.840.10008.1.2').is_little_endian
        assert UID('1.2.840.10008.1.2.1').is_little_endian
        assert UID('1.2.840.10008.1.2.1.99').is_little_endian
        assert not UID('1.2.840.10008.1.2.2').is_little_endian
        assert UID('1.2.840.10008.1.2.4.50').is_little_endian

        with pytest.raises(ValueError):
            UID('1.2.840.10008.5.1.4.1.1.2').is_little_endian

    def test_is_deflated(self):
        """Test that UID.is_deflated works."""
        # '1.2.840.10008.1.2' Implicit VR Little Endian
        # '1.2.840.10008.1.2.1' Explicit VR Little Endian
        # '1.2.840.10008.1.2.1.99' Deflated Explicit VR Little Endian
        # '1.2.840.10008.1.2.2' Explicit VR Big Endian
        # '1.2.840.10008.1.2.4.50'JPEG Baseline (Process 1)
        assert not UID('1.2.840.10008.1.2').is_deflated
        assert not UID('1.2.840.10008.1.2.1').is_deflated
        assert UID('1.2.840.10008.1.2.1.99').is_deflated
        assert not UID('1.2.840.10008.1.2.2').is_deflated
        assert not UID('1.2.840.10008.1.2.4.50').is_deflated

        with pytest.raises(ValueError):
            UID('1.2.840.10008.5.1.4.1.1.2').is_deflated

    def test_is_transfer_syntax(self):
        """Test that UID.is_transfer_syntax works."""
        # '1.2.840.10008.1.2' Implicit VR Little Endian
        # '1.2.840.10008.1.2.1' Explicit VR Little Endian
        # '1.2.840.10008.1.2.1.99' Deflated Explicit VR Little Endian
        # '1.2.840.10008.1.2.2' Explicit VR Big Endian
        # '1.2.840.10008.1.2.4.50'JPEG Baseline (Process 1)
        assert UID('1.2.840.10008.1.2').is_transfer_syntax
        assert UID('1.2.840.10008.1.2.1').is_transfer_syntax
        assert UID('1.2.840.10008.1.2.1.99').is_transfer_syntax
        assert UID('1.2.840.10008.1.2.2').is_transfer_syntax
        assert UID('1.2.840.10008.1.2.4.50').is_transfer_syntax

        assert not UID('1.2.840.10008.5.1.4.1.1.2').is_transfer_syntax

    def test_is_compressed(self):
        """Test that UID.is_compressed works."""
        # '1.2.840.10008.1.2' Implicit VR Little Endian
        # '1.2.840.10008.1.2.1' Explicit VR Little Endian
        # '1.2.840.10008.1.2.1.99' Deflated Explicit VR Little Endian
        # '1.2.840.10008.1.2.2' Explicit VR Big Endian
        # '1.2.840.10008.1.2.4.50'JPEG Baseline (Process 1)
        assert not UID('1.2.840.10008.1.2').is_compressed
        assert not UID('1.2.840.10008.1.2.1').is_compressed
        assert not UID('1.2.840.10008.1.2.1.99').is_compressed
        assert not UID('1.2.840.10008.1.2.2').is_compressed
        assert UID('1.2.840.10008.1.2.4.50').is_compressed

        with pytest.raises(ValueError):
            UID('1.2.840.10008.5.1.4.1.1.2').is_compressed

    def test_is_encapsulated(self):
        """Test that UID.is_encapsulated works."""
        # '1.2.840.10008.1.2' Implicit VR Little Endian
        # '1.2.840.10008.1.2.1' Explicit VR Little Endian
        # '1.2.840.10008.1.2.1.99' Deflated Explicit VR Little Endian
        # '1.2.840.10008.1.2.2' Explicit VR Big Endian
        # '1.2.840.10008.1.2.4.50'JPEG Baseline (Process 1)
        assert not UID('1.2.840.10008.1.2').is_encapsulated
        assert not UID('1.2.840.10008.1.2.1').is_encapsulated
        assert not UID('1.2.840.10008.1.2.1.99').is_encapsulated
        assert not UID('1.2.840.10008.1.2.2').is_encapsulated
        assert UID('1.2.840.10008.1.2.4.50').is_encapsulated

        with pytest.raises(ValueError):
            UID('1.2.840.10008.5.1.4.1.1.2').is_encapsulated

    def test_name(self):
        """Test that UID.name works."""
        assert self.uid.name == 'Implicit VR Little Endian'
        assert UID('1.2.840.10008.5.1.4.1.1.2').name == 'CT Image Storage'

    def test_name_with_equal_hash(self):
        """Test that UID name works for UID with same hash as predefined UID.
        """
        class MockedUID(UID):
            # Force the UID to return the same hash as one of the
            # uid dictionary entries (any will work).
            # The resulting hash collision forces the usage of the `eq`
            # operator while checking for containment in the uid dictionary
            # (regression test for issue #499)
            def __hash__(self):
                return hash(JPEGLSNearLossless)

        uid = MockedUID('1.2.3')
        assert uid.name == '1.2.3'

    def test_type(self):
        """Test that UID.type works."""
        assert self.uid.type == 'Transfer Syntax'
        assert UID('1.2.840.10008.5.1.4.1.1.2').type == 'SOP Class'

    def test_info(self):
        """Test that UID.info works."""
        assert self.uid.info == 'Default Transfer Syntax for DICOM'
        assert UID('1.2.840.10008.5.1.4.1.1.2').info == ''

    def test_is_retired(self):
        """Test that UID.is_retired works."""
        assert not self.uid.is_retired
        assert UID('1.2.840.10008.1.2.2').is_retired

    def test_is_valid(self, disable_value_validation):
        """Test that UID.is_valid works."""
        for invalid_uid in ('1' * 65,
                            '1.' + ('2' * 63),
                            '',
                            '.',
                            '1.',
                            '1.01',
                            '1.a.2'):
            assert not UID(invalid_uid).is_valid

        for valid_uid in ('0',
                          '1',
                          '0.1',
                          '1' * 64,
                          '1.' + ('2' * 62),
                          '1.0.23'):
            assert UID(valid_uid).is_valid

    def test_is_private(self):
        """Test the is_private property"""
        private_uid = UID('1.2.840.10009.1.2')
        assert private_uid.is_private
        assert not self.uid.is_private

    def test_raises(self):
        """Test raises exception if not a str type"""
        with pytest.raises(TypeError):
            UID(1234)

    def test_transitive(self):
        """Test for #256"""
        a = '1.2.840.10008.1.1'
        uid = UID(a)
        b = str(uid)
        assert uid.name == 'Verification SOP Class'
        assert uid == a
        assert uid == b
        assert a == b

    def test_keyword(self):
        """Test the keyword property."""
        assert "ImplicitVRLittleEndian" == self.uid.keyword


class TestUIDPrivate:
    """Test private UIDs"""
    def setup(self):
        """Set default UID"""
        self.uid = UID('9.9.999.90009.1.2')

    def test_equality(self):
        """Test that UID.__eq__ works with private UIDs."""
        assert self.uid == UID('9.9.999.90009.1.2')
        assert self.uid == '9.9.999.90009.1.2'
        assert not self.uid == UID('9.9.999.90009.1.3')
        assert not self.uid == '9.9.999.90009.1.3'

    def test_inequality(self):
        """Test that UID.__ne__ works with private UIDs."""
        assert not self.uid != UID('9.9.999.90009.1.2')
        assert not self.uid != '9.9.999.90009.1.2'
        assert self.uid != UID('9.9.999.90009.1.3')
        assert self.uid != '9.9.999.90009.1.3'

    def test_hash(self):
        """Test that UID.__hash_- works with private UIDs."""
        assert hash(self.uid) == hash(self.uid)

    def test_str(self):
        """Test that UID.__str__ works with private UIDs."""
        assert self.uid.__str__() == '9.9.999.90009.1.2'

    def test_is_implicit_vr(self):
        """Test that UID.is_implicit_VR works with private UIDs."""
        with pytest.raises(ValueError):
            self.uid.is_implicit_VR

    def test_is_little_endian(self):
        """Test that UID.is_little_endian works with private UIDs."""
        with pytest.raises(ValueError):
            self.uid.is_little_endian

    def test_is_deflated(self):
        """Test that UID.is_deflated works with private UIDs."""
        with pytest.raises(ValueError):
            self.uid.is_deflated

    def test_is_transfer_syntax(self):
        """Test that UID.is_transfer_syntax works with private UIDs."""
        with pytest.raises(ValueError):
            self.uid.is_transfer_syntax

    def test_is_compressed(self):
        """Test that UID.is_compressed works with private UIDs."""
        with pytest.raises(ValueError):
            self.uid.is_compressed

    def test_is_encapsulated(self):
        """Test that UID.is_encapsulated works with private UIDs."""
        with pytest.raises(ValueError):
            self.uid.is_encapsulated

    def test_name(self):
        """Test that UID.name works with private UIDs."""
        assert self.uid.name == '9.9.999.90009.1.2'

    def test_type(self):
        """Test that UID.type works with private UIDs."""
        assert self.uid.type == ''

    def test_info(self):
        """Test that UID.info works with private UIDs."""
        assert self.uid.info == ''

    def test_is_retired(self):
        """Test that UID.is_retired works with private UIDs."""
        assert not self.uid.is_retired

    def test_is_valid(self):
        """Test that UID.is_valid works with private UIDs."""
        assert self.uid.is_valid

    def test_is_private(self):
        """Test that UID.is_private works with private UIDs."""
        assert self.uid.is_private

    def test_keyword(self):
        """Test the keyword property."""
        assert "" == self.uid.keyword
