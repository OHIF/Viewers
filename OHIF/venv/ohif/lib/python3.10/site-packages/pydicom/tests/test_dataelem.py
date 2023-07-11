# -*- coding: utf-8 -*-
# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Unit tests for the pydicom.dataelem module."""

# Many tests of DataElement class are implied in test_dataset also
import math

import pytest

from pydicom import filewriter, config, dcmread
from pydicom.charset import default_encoding
from pydicom.data import get_testdata_file
from pydicom.datadict import add_private_dict_entry
from pydicom.dataelem import (
    DataElement,
    RawDataElement,
    DataElement_from_raw,
)
from pydicom.dataset import Dataset
from pydicom.errors import BytesLengthException
from pydicom.filebase import DicomBytesIO
from pydicom.multival import MultiValue
from pydicom.tag import Tag, BaseTag
from pydicom.tests.test_util import save_private_dict
from pydicom.uid import UID
from pydicom.valuerep import DSfloat, validate_value


class TestDataElement:
    """Tests for dataelem.DataElement."""
    @pytest.fixture(autouse=True)
    def create_data(self, disable_value_validation):
        self.data_elementSH = DataElement((1, 2), "SH", "hello")
        self.data_elementIS = DataElement((1, 2), "IS", "42")
        self.data_elementDS = DataElement((1, 2), "DS", "42.00001")
        self.data_elementMulti = DataElement((1, 2), "DS",
                                             ['42.1', '42.2', '42.3'])
        self.data_elementCommand = DataElement(0x00000000, 'UL', 100)
        self.data_elementPrivate = DataElement(0x00090000, 'UL', 101)
        self.data_elementRetired = DataElement(0x00080010, 'SH', "102")
        config.use_none_as_empty_text_VR_value = False
        yield
        config.use_none_as_empty_text_VR_value = False

    @pytest.fixture
    def replace_un_with_known_vr(self):
        old_value = config.replace_un_with_known_vr
        config.replace_un_with_known_vr = True
        yield
        config.replace_un_with_known_vr = old_value

    def test_AT(self):
        """VR of AT takes Tag variants when set"""
        elem1 = DataElement("OffendingElement", "AT", 0x100010)
        elem2 = DataElement("OffendingElement", "AT", (0x10, 0x10))
        elem3 = DataElement(
            "FrameIncrementPointer", "AT", [0x540010, 0x540020]
        )
        elem4 = DataElement("OffendingElement", "AT", "PatientName")
        assert isinstance(elem1.value, BaseTag)
        assert isinstance(elem2.value, BaseTag)
        assert elem1.value == elem2.value == elem4.value
        assert elem1.value == 0x100010
        assert isinstance(elem3.value, MultiValue)
        assert len(elem3.value) == 2

        # Test also using Dataset, and check 0x00000000 works
        ds = Dataset()
        ds.OffendingElement = 0
        assert isinstance(ds.OffendingElement, BaseTag)
        ds.OffendingElement = (0x0000, 0x0000)
        assert isinstance(ds.OffendingElement, BaseTag)
        assert ds.OffendingElement == 0

        # An invalid Tag should throw an error
        with pytest.raises(OverflowError):
            _ = DataElement("OffendingElement", "AT", 0x100000000)

    def test_VM_1(self):
        """DataElement: return correct value multiplicity for VM > 1"""
        assert 3 == self.data_elementMulti.VM

    def test_VM_2(self):
        """DataElement: return correct value multiplicity for VM = 1"""
        assert 1 == self.data_elementIS.VM

    def test_DSFloat_conversion(self):
        """Test that strings are correctly converted if changing the value."""
        assert isinstance(self.data_elementDS.value, DSfloat)
        assert isinstance(self.data_elementMulti.value[0], DSfloat)
        assert DSfloat('42.1') == self.data_elementMulti.value[0]

        # multi-value append/insert
        self.data_elementMulti.value.append('42.4')
        assert isinstance(self.data_elementMulti.value[3], DSfloat)
        assert DSfloat('42.4') == self.data_elementMulti.value[3]

        self.data_elementMulti.value.insert(0, '42.0')
        assert isinstance(self.data_elementMulti.value[0], DSfloat)
        assert DSfloat('42.0') == self.data_elementMulti.value[0]

        # change single value of multi-value
        self.data_elementMulti.value[3] = '123.4'
        assert isinstance(self.data_elementMulti.value[3], DSfloat)
        assert DSfloat('123.4') == self.data_elementMulti.value[3]

    def test_DSFloat_conversion_auto_format(self):
        """Test that strings are being auto-formatted correctly."""
        data_element = DataElement((1, 2), "DS",
                                   DSfloat(math.pi, auto_format=True))
        assert math.pi == data_element.value
        assert '3.14159265358979' == str(data_element.value)

    def test_backslash(self):
        """DataElement: String with '\\' sets multi-valued data_element."""
        data_element = DataElement((1, 2), "DS", r"42.1\42.2\42.3")
        assert 3 == data_element.VM

    def test_UID(self):
        """DataElement: setting or changing UID results in UID type."""
        ds = Dataset()
        ds.TransferSyntaxUID = "1.2.3"
        assert isinstance(ds.TransferSyntaxUID, UID)
        ds.TransferSyntaxUID += ".4.5.6"
        assert isinstance(ds.TransferSyntaxUID, UID)

    def test_keyword(self):
        """DataElement: return correct keyword"""
        assert 'CommandGroupLength' == self.data_elementCommand.keyword
        assert '' == self.data_elementPrivate.keyword

    def test_retired(self):
        """DataElement: return correct is_retired"""
        assert self.data_elementCommand.is_retired is False
        assert self.data_elementRetired.is_retired is True
        assert self.data_elementPrivate.is_retired is False

    def test_name_group_length(self):
        """Test DataElement.name for Group Length element"""
        elem = DataElement(0x00100000, 'LO', 12345)
        assert 'Group Length' == elem.name

    def test_name_unknown_private(self):
        """Test DataElement.name with an unknown private element"""
        elem = DataElement(0x00110010, 'LO', 12345)
        elem.private_creator = 'TEST'
        assert 'Private tag data' == elem.name
        elem = DataElement(0x00110F00, 'LO', 12345)
        assert elem.tag.is_private
        assert elem.private_creator is None
        assert 'Private tag data' == elem.name

    def test_name_unknown(self):
        """Test DataElement.name with an unknown element"""
        elem = DataElement(0x00000004, 'LO', 12345)
        assert '' == elem.name

    def test_equality_standard_element(self):
        """DataElement: equality returns correct value for simple elements"""
        dd = DataElement(0x00100010, 'PN', 'ANON')
        assert dd == dd
        ee = DataElement(0x00100010, 'PN', 'ANON')
        assert dd == ee

        # Check value
        ee.value = 'ANAN'
        assert not dd == ee

        # Check tag
        ee = DataElement(0x00100011, 'PN', 'ANON')
        assert not dd == ee

        # Check VR
        ee = DataElement(0x00100010, 'SH', 'ANON')
        assert not dd == ee

        dd = DataElement(0x00080018, 'UI', '1.2.3.4')
        ee = DataElement(0x00080018, 'UI', '1.2.3.4')
        assert dd == ee

        ee = DataElement(0x00080018, 'PN', '1.2.3.4')
        assert not dd == ee

    def test_equality_private_element(self):
        """DataElement: equality returns correct value for private elements"""
        dd = DataElement(0x01110001, 'PN', 'ANON')
        assert dd == dd
        ee = DataElement(0x01110001, 'PN', 'ANON')
        assert dd == ee

        # Check value
        ee.value = 'ANAN'
        assert not dd == ee

        # Check tag
        ee = DataElement(0x01110002, 'PN', 'ANON')
        assert not dd == ee

        # Check VR
        ee = DataElement(0x01110001, 'SH', 'ANON')
        assert not dd == ee

    def test_equality_sequence_element(self):
        """DataElement: equality returns correct value for sequence elements"""
        dd = DataElement(0x300A00B0, 'SQ', [])
        assert dd == dd
        ee = DataElement(0x300A00B0, 'SQ', [])
        assert dd == ee

        # Check value
        e = Dataset()
        e.PatientName = 'ANON'
        ee.value = [e]
        assert not dd == ee

        # Check tag
        ee = DataElement(0x01110002, 'SQ', [])
        assert not dd == ee

        # Check VR
        ee = DataElement(0x300A00B0, 'SH', [])
        assert not dd == ee

        # Check with dataset
        dd = DataElement(0x300A00B0, 'SQ', [Dataset()])
        dd.value[0].PatientName = 'ANON'
        ee = DataElement(0x300A00B0, 'SQ', [Dataset()])
        ee.value[0].PatientName = 'ANON'
        assert dd == ee

        # Check uneven sequences
        dd.value.append(Dataset())
        dd.value[1].PatientName = 'ANON'
        assert not dd == ee

        ee.value.append(Dataset())
        ee.value[1].PatientName = 'ANON'
        assert dd == ee
        ee.value.append(Dataset())
        ee.value[2].PatientName = 'ANON'
        assert not dd == ee

    def test_equality_not_rlement(self):
        """DataElement: equality returns correct value when not same class"""
        dd = DataElement(0x00100010, 'PN', 'ANON')
        ee = {'0x00100010': 'ANON'}
        assert not dd == ee

    def test_equality_inheritance(self):
        """DataElement: equality returns correct value for subclasses"""

        class DataElementPlus(DataElement):
            pass

        dd = DataElement(0x00100010, 'PN', 'ANON')
        ee = DataElementPlus(0x00100010, 'PN', 'ANON')
        assert ee == ee
        assert dd == ee
        assert ee == dd

        ee = DataElementPlus(0x00100010, 'PN', 'ANONY')
        assert not dd == ee
        assert not ee == dd

    def test_equality_class_members(self):
        """Test equality is correct when ignored class members differ."""
        dd = DataElement(0x00100010, 'PN', 'ANON')
        dd.showVR = False
        dd.file_tell = 10
        dd.maxBytesToDisplay = 0
        dd.descripWidth = 0
        assert DataElement(0x00100010, 'PN', 'ANON') == dd

    def test_inequality_standard(self):
        """Test DataElement.__ne__ for standard element"""
        dd = DataElement(0x00100010, 'PN', 'ANON')
        assert not dd != dd
        assert DataElement(0x00100010, 'PN', 'ANONA') != dd

        # Check tag
        assert DataElement(0x00100011, 'PN', 'ANON') != dd

        # Check VR
        assert DataElement(0x00100010, 'SH', 'ANON') != dd

    def test_inequality_sequence(self):
        """Test DataElement.__ne__ for sequence element"""
        dd = DataElement(0x300A00B0, 'SQ', [])
        assert not dd != dd
        assert not DataElement(0x300A00B0, 'SQ', []) != dd
        ee = DataElement(0x300A00B0, 'SQ', [Dataset()])
        assert ee != dd

        # Check value
        dd.value = [Dataset()]
        dd[0].PatientName = 'ANON'
        ee[0].PatientName = 'ANON'
        assert not ee != dd
        ee[0].PatientName = 'ANONA'
        assert ee != dd

    def test_hash(self):
        """Test hash(DataElement) raises TypeError"""
        with pytest.raises(TypeError, match=r"unhashable"):
            hash(DataElement(0x00100010, 'PN', 'ANON'))

    def test_repeater_str(self):
        """Test a repeater group element displays the element name."""
        elem = DataElement(0x60023000, 'OB', b'\x00')
        assert 'Overlay Data' in elem.__str__()

    def test_str_no_vr(self):
        """Test DataElement.__str__ output with no VR"""
        elem = DataElement(0x00100010, 'PN', 'ANON')
        assert "(0010, 0010) Patient's Name" in str(elem)
        assert "PN: 'ANON'" in str(elem)
        elem.showVR = False
        assert "(0010, 0010) Patient's Name" in str(elem)
        assert 'PN' not in str(elem)

    def test_repr_seq(self):
        """Test DataElement.__repr__ with a sequence"""
        elem = DataElement(0x300A00B0, 'SQ', [Dataset()])
        elem[0].PatientID = '1234'
        assert repr(elem) == repr(elem.value)

    def test_getitem_raises(self):
        """Test DataElement.__getitem__ raise if value not indexable"""
        elem = DataElement(0x00100010, 'US', 123)
        with pytest.raises(TypeError):
            elem[0]

    def test_repval_large_elem(self):
        """Test DataElement.repval doesn't return a huge string for a large
        value"""
        elem = DataElement(0x00820003, 'UT', 'a' * 1000)
        assert len(elem.repval) < 100

    def test_repval_large_vm(self):
        """Test DataElement.repval doesn't return a huge string for a large
        vm"""
        elem = DataElement(0x00080054, 'AE', 'a\\' * 1000 + 'a')
        assert len(elem.repval) < 100

    def test_repval_strange_type(self):
        """Test DataElement.repval doesn't break with bad types"""
        elem = DataElement(0x00020001, 'OB', 0)
        assert len(elem.repval) < 100

    def test_private_tag_in_repeater_range(self):
        """Test that an unknown private tag (e.g. a tag not in the private
        dictionary) in the repeater range is not handled as a repeater tag
        if using Implicit Little Endian transfer syntax."""
        # regression test for #689
        ds = Dataset()
        ds[0x50f10010] = RawDataElement(
            Tag(0x50f10010), None, 8, b'FDMS 1.0', 0, True, True)
        ds[0x50f1100a] = RawDataElement(
            Tag(0x50f1100a), None, 6, b'ACC0.6', 0, True, True)
        private_creator_data_elem = ds[0x50f10010]
        assert 'Private Creator' == private_creator_data_elem.name
        assert 'LO' == private_creator_data_elem.VR

        private_data_elem = ds[0x50f1100a]
        assert '[FNC Parameters]' == private_data_elem.name
        assert 'SH' == private_data_elem.VR

    def test_private_repeater_tag(self):
        """Test that a known private tag in the repeater range is correctly
        handled using Implicit Little Endian transfer syntax."""
        ds = Dataset()
        ds[0x60210012] = RawDataElement(
            Tag(0x60210012), None, 12, b'PAPYRUS 3.0 ', 0, True, True)
        ds[0x60211200] = RawDataElement(
            Tag(0x60211200), None, 6, b'123456', 0, True, True)
        private_creator_data_elem = ds[0x60210012]
        assert 'Private Creator' == private_creator_data_elem.name
        assert 'LO' == private_creator_data_elem.VR

        private_data_elem = ds[0x60211200]
        assert '[Overlay ID]' == private_data_elem.name
        assert 'IS' == private_data_elem.VR

    def test_known_tags_with_UN_VR(self, replace_un_with_known_vr):
        """Known tags with VR UN are correctly decoded."""
        ds = Dataset()
        ds[0x00080005] = DataElement(0x00080005, 'UN', b'ISO_IR 126')
        ds[0x00100010] = DataElement(0x00100010, 'UN',
                                     'Διονυσιος'.encode('iso_ir_126'))
        ds.decode()
        assert 'CS' == ds[0x00080005].VR
        assert 'PN' == ds[0x00100010].VR
        assert 'Διονυσιος' == ds[0x00100010].value

        ds = Dataset()
        ds[0x00080005] = DataElement(0x00080005, 'UN',
                                     b'ISO 2022 IR 100\\ISO 2022 IR 126')
        ds[0x00100010] = DataElement(0x00100010, 'UN',
                                     b'Dionysios=\x1b\x2d\x46'
                                     + 'Διονυσιος'.encode('iso_ir_126'))
        ds.decode()
        assert 'CS' == ds[0x00080005].VR
        assert 'PN' == ds[0x00100010].VR
        assert 'Dionysios=Διονυσιος' == ds[0x00100010].value

    def test_reading_ds_with_known_tags_with_UN_VR(
            self, replace_un_with_known_vr):
        """Known tags with VR UN are correctly read."""
        test_file = get_testdata_file('explicit_VR-UN.dcm')
        ds = dcmread(test_file)
        assert 'CS' == ds[0x00080005].VR
        assert 'TM' == ds[0x00080030].VR
        assert 'PN' == ds[0x00100010].VR
        assert 'PN' == ds[0x00100010].VR
        assert 'DA' == ds[0x00100030].VR

    def test_unknown_tags_with_UN_VR(self):
        """Unknown tags with VR UN are not decoded."""
        ds = Dataset()
        ds[0x00080005] = DataElement(0x00080005, 'CS', b'ISO_IR 126')
        ds[0x00111010] = DataElement(0x00111010, 'UN',
                                     'Διονυσιος'.encode('iso_ir_126'))
        ds.decode()
        assert 'UN' == ds[0x00111010].VR
        assert 'Διονυσιος'.encode('iso_ir_126') == ds[0x00111010].value

    def test_tag_with_long_value_UN_VR(self):
        """Tag with length > 64kb with VR UN is not changed."""
        ds = Dataset()
        ds[0x00080005] = DataElement(0x00080005, 'CS', b'ISO_IR 126')

        single_value = b'123456.789012345'
        large_value = b'\\'.join([single_value] * 4500)
        ds[0x30040058] = DataElement(0x30040058, 'UN',
                                     large_value,
                                     is_undefined_length=False)
        ds.decode()
        assert 'UN' == ds[0x30040058].VR

    @pytest.mark.parametrize('use_none, empty_value',
                             ((True, None), (False, '')))
    def test_empty_text_values(self, use_none, empty_value,
                               no_datetime_conversion):
        """Test that assigning an empty value behaves as expected."""
        def check_empty_text_element(value):
            setattr(ds, tag_name, value)
            elem = ds[tag_name]
            assert bool(elem.value) is False
            assert 0 == elem.VM
            assert elem.value == value
            fp = DicomBytesIO()
            filewriter.write_dataset(fp, ds)
            ds_read = dcmread(fp, force=True)
            assert empty_value == ds_read[tag_name].value

        text_vrs = {
            'AE': 'RetrieveAETitle',
            'AS': 'PatientAge',
            'CS': 'QualityControlSubject',
            'DA': 'PatientBirthDate',
            'DT': 'AcquisitionDateTime',
            'LO': 'DataSetSubtype',
            'LT': 'ExtendedCodeMeaning',
            'PN': 'PatientName',
            'SH': 'CodeValue',
            'ST': 'InstitutionAddress',
            'TM': 'StudyTime',
            'UC': 'LongCodeValue',
            'UI': 'SOPClassUID',
            'UR': 'CodingSchemeURL',
            'UT': 'StrainAdditionalInformation',
        }
        config.use_none_as_empty_text_VR_value = use_none
        ds = Dataset()
        ds.is_little_endian = True
        # set value to new element
        for tag_name in text_vrs.values():
            check_empty_text_element(None)
            del ds[tag_name]
            check_empty_text_element('')
            del ds[tag_name]
            check_empty_text_element([])
            del ds[tag_name]

        # set value to existing element
        for tag_name in text_vrs.values():
            check_empty_text_element(None)
            check_empty_text_element('')
            check_empty_text_element([])
            check_empty_text_element(None)

    def test_empty_binary_values(self):
        """Test that assigning an empty value behaves as expected for
        non-text VRs."""
        def check_empty_binary_element(value):
            setattr(ds, tag_name, value)
            elem = ds[tag_name]
            assert bool(elem.value) is False
            assert 0 == elem.VM
            assert elem.value == value
            fp = DicomBytesIO()
            filewriter.write_dataset(fp, ds)
            ds_read = dcmread(fp, force=True)
            assert ds_read[tag_name].value is None

        non_text_vrs = {
            'AT': 'OffendingElement',
            'DS': 'PatientWeight',
            'IS': 'BeamNumber',
            'SL': 'RationalNumeratorValue',
            'SS': 'SelectorSSValue',
            'UL': 'SimpleFrameList',
            'US': 'SourceAcquisitionBeamNumber',
            'FD': 'RealWorldValueLUTData',
            'FL': 'VectorAccuracy',
            'OB': 'FillPattern',
            'OD': 'DoubleFloatPixelData',
            'OF': 'UValueData',
            'OL': 'TrackPointIndexList',
            'OW': 'TrianglePointIndexList',
            'UN': 'SelectorUNValue',
        }
        ds = Dataset()
        ds.is_little_endian = True
        # set value to new element
        for tag_name in non_text_vrs.values():
            check_empty_binary_element(None)
            del ds[tag_name]
            check_empty_binary_element([])
            del ds[tag_name]
            check_empty_binary_element(MultiValue(int, []))
            del ds[tag_name]

        # set value to existing element
        for tag_name in non_text_vrs.values():
            check_empty_binary_element(None)
            check_empty_binary_element([])
            check_empty_binary_element(MultiValue(int, []))
            check_empty_binary_element(None)

    def test_empty_sequence_is_handled_as_array(self):
        ds = Dataset()
        ds.AcquisitionContextSequence = []
        elem = ds['AcquisitionContextSequence']
        assert bool(elem.value) is False
        assert 0 == elem.VM
        assert elem.value == []

        fp = DicomBytesIO()
        fp.is_little_endian = True
        fp.is_implicit_VR = True
        filewriter.write_dataset(fp, ds)
        ds_read = dcmread(fp, force=True)
        elem = ds_read['AcquisitionContextSequence']
        assert 0 == elem.VM
        assert elem.value == []

    def test_is_private(self):
        """Test the is_private property."""
        elem = DataElement(0x00090010, 'UN', None)
        assert elem.is_private
        elem = DataElement(0x00080010, 'UN', None)
        assert not elem.is_private


class TestRawDataElement:

    """Tests for dataelem.RawDataElement."""
    def test_invalid_tag_warning(self, allow_reading_invalid_values):
        """RawDataElement: conversion of unknown tag warns..."""
        raw = RawDataElement(Tag(0x88880088), None, 4, b'unknown',
                             0, True, True)

        with pytest.warns(UserWarning, match=r"\(8888, 0088\)"):
            element = DataElement_from_raw(raw)
            assert element.VR == 'UN'

    def test_key_error(self, enforce_valid_values):
        """RawDataElement: conversion of unknown tag throws KeyError..."""
        # raw data element -> tag VR length value
        #                       value_tell is_implicit_VR is_little_endian'
        # Unknown (not in DICOM dict), non-private, non-group 0 for this test
        raw = RawDataElement(Tag(0x88880002), None, 4, b'unknown',
                             0, True, True)

        with pytest.raises(KeyError, match=r"\(8888, 0002\)"):
            DataElement_from_raw(raw)

    def test_valid_tag(self, no_datetime_conversion):
        """RawDataElement: conversion of known tag succeeds..."""
        raw = RawDataElement(Tag(0x00080020), 'DA', 8, b'20170101',
                             0, False, True)
        element = DataElement_from_raw(raw, default_encoding)
        assert 'Study Date' == element.name
        assert 'DA' == element.VR
        assert '20170101' == element.value

        raw = RawDataElement(Tag(0x00080000), None, 4, b'\x02\x00\x00\x00',
                             0, True, True)
        elem = DataElement_from_raw(raw, default_encoding)
        assert 'UL' == elem.VR

    def test_data_element_without_encoding(self):
        """RawDataElement: no encoding needed."""
        raw = RawDataElement(Tag(0x00104000), 'LT', 23,
                             b'comment\\comment2\\comment3',
                             0, False, True)
        element = DataElement_from_raw(raw)
        assert 'Patient Comments' == element.name

    def test_unknown_vr(self):
        """Test converting a raw element with unknown VR"""
        raw = RawDataElement(Tag(0x00080000), 'AA', 8, b'20170101',
                             0, False, True)
        with pytest.raises(NotImplementedError):
            DataElement_from_raw(raw, default_encoding)

    @pytest.fixture
    def accept_wrong_length(self, request):
        old_value = config.convert_wrong_length_to_UN
        config.convert_wrong_length_to_UN = request.param
        yield
        config.convert_wrong_length_to_UN = old_value

    @pytest.mark.parametrize("accept_wrong_length", [False], indirect=True)
    def test_wrong_bytes_length_exception(self, accept_wrong_length):
        """Check exception when number of raw bytes is not correct."""
        raw = RawDataElement(Tag(0x00190000), 'FD', 1, b'1', 0, False, True)
        with pytest.raises(BytesLengthException):
            DataElement_from_raw(raw)

    @pytest.mark.parametrize("accept_wrong_length", [True], indirect=True)
    def test_wrong_bytes_length_convert_to_UN(self, accept_wrong_length):
        """Check warning and behavior for incorrect number of raw bytes."""
        value = b'1'
        raw = RawDataElement(Tag(0x00190000), 'FD', 1, value, 0, False, True)
        msg = (
            r"Expected total bytes to be an even multiple of bytes per value. "
            r"Instead received b'1' with length 1 and struct format 'd' which "
            r"corresponds to bytes per value of 8. This occurred while trying "
            r"to parse \(0019, 0000\) according to VR 'FD'. "
            r"Setting VR to 'UN'."
        )
        with pytest.warns(UserWarning, match=msg):
            raw_elem = DataElement_from_raw(raw)
            assert 'UN' == raw_elem.VR
            assert value == raw_elem.value

    def test_read_known_private_tag_implicit(self):
        fp = DicomBytesIO()
        ds = Dataset()
        ds.is_implicit_VR = True
        ds.is_little_endian = True
        ds[0x00410010] = RawDataElement(
            Tag(0x00410010), "LO", 8, b"ACME 3.2", 0, True, True)
        ds[0x00411001] = RawDataElement(
            Tag(0x00411001), "US", 2, b"\x2A\x00", 0, True, True)
        ds[0x00431001] = RawDataElement(
            Tag(0x00431001), "SH", 8, b"Unknown ", 0, True, True)
        ds.save_as(fp)
        ds = dcmread(fp, force=True)
        elem = ds[0x00411001]
        assert elem.VR == "UN"
        assert elem.name == "Private tag data"
        assert elem.value == b"\x2A\x00"

        with save_private_dict():
            add_private_dict_entry("ACME 3.2", 0x00410001, "US", "Some Number")
            ds = dcmread(fp, force=True)
            elem = ds[0x00411001]
            assert elem.VR == "US"
            assert elem.name == "[Some Number]"
            assert elem.value == 42

            # Unknown private tag is handled as before
            elem = ds[0x00431001]
            assert elem.VR == "UN"
            assert elem.name == "Private tag data"
            assert elem.value == b"Unknown "

    def test_read_known_private_tag_explicit(self):
        fp = DicomBytesIO()
        ds = Dataset()
        ds.is_implicit_VR = False
        ds.is_little_endian = True
        ds[0x00410010] = RawDataElement(
            Tag(0x00410010), "LO", 8, b"ACME 3.2", 0, False, True)
        ds[0x00411002] = RawDataElement(
            Tag(0x00411002), "UN", 8, b"SOME_AET", 0, False, True)
        ds.save_as(fp)
        ds = dcmread(fp, force=True)
        elem = ds[0x00411002]
        assert elem.VR == "UN"
        assert elem.name == "Private tag data"
        assert elem.value == b"SOME_AET"

        with save_private_dict():
            add_private_dict_entry("ACME 3.2", 0x00410002, "AE", "Some AET")
            ds = dcmread(fp, force=True)
            elem = ds[0x00411002]
            assert elem.VR == "AE"
            assert elem.name == "[Some AET]"
            assert elem.value == "SOME_AET"

    def test_read_known_private_tag_explicit_no_lookup(
            self, dont_replace_un_with_known_vr):
        with save_private_dict():
            add_private_dict_entry(
                "ACME 3.2", 0x00410003, "IS", "Another Number")
            fp = DicomBytesIO()
            ds = Dataset()
            ds.is_implicit_VR = False
            ds.is_little_endian = True
            ds[0x00410010] = RawDataElement(
                Tag(0x00410010), "LO", 8, b"ACME 3.2", 0, False, True)
            ds[0x00411003] = RawDataElement(
                Tag(0x00411003), "UN", 8, b"12345678", 0, False, True)
            ds.save_as(fp)
            ds = dcmread(fp, force=True)
            elem = ds[0x00411003]
            assert elem.VR == "UN"
            assert elem.name == "[Another Number]"
            assert elem.value == b"12345678"


class TestDataElementValidation:

    @staticmethod
    def check_invalid_vr(vr, value, check_warn=True):
        msg = fr"Invalid value for VR {vr}: *"
        if check_warn:
            with pytest.warns(UserWarning, match=msg):
                DataElement(0x00410001, vr, value, validation_mode=config.WARN)
            with pytest.warns(UserWarning, match=msg):
                validate_value(vr, value, config.WARN)
        with pytest.raises(ValueError, match=msg):
            DataElement(0x00410001, vr, value, validation_mode=config.RAISE)
        with pytest.raises(ValueError, match=msg):
            validate_value(vr, value, config.RAISE)

    @staticmethod
    def check_valid_vr(vr, value):
        DataElement(0x00410001, vr, value, validation_mode=config.RAISE)
        validate_value(vr, value, config.RAISE)

    @pytest.mark.parametrize("vr, length", (
            ("AE", 17), ("CS", 17), ("DS", 27), ("LO", 66), ("LT", 10250),
            ("SH", 17), ("ST", 1025), ("UI", 65)
    ))
    def test_maxvalue_exceeded(self, vr, length, no_datetime_conversion):
        msg = fr"The value length \({length}\) exceeds the maximum length *"
        with pytest.warns(UserWarning, match=msg):
            DataElement(0x00410001, vr, "1" * length,
                        validation_mode=config.WARN)
        with pytest.raises(ValueError, match=msg):
            DataElement(0x00410001, vr, "2" * length,
                        validation_mode=config.RAISE)

    @pytest.mark.parametrize("value", ("Руссский", b"ctrl\tchar", "new\n",
                                       b"newline\n", "Äneas"))
    def test_invalid_ae(self, value):
        self.check_invalid_vr("AE", value)

    @pytest.mark.parametrize("value", ("My AETitle", b"My AETitle", "", None))
    def test_valid_ae(self, value):
        self.check_valid_vr("AE", value)

    @pytest.mark.parametrize("value", ("12Y", "0012Y", b"012B", "Y012",
                                       "012Y\n"))
    def test_invalid_as(self, value):
        self.check_invalid_vr("AS", value)

    @pytest.mark.parametrize("value",
                             ("012Y", "345M", b"052W", b"789D", "", None))
    def test_valid_as(self, value):
        self.check_valid_vr("AS", value)

    @pytest.mark.parametrize("value", (
            "abcd", b"ABC+D", "ABCD-Z", "ÄÖÜ", "ÄÖÜ".encode("utf-8"), "ABC\n"))
    def test_invalid_cs(self, value):
        self.check_invalid_vr("CS", value)

    @pytest.mark.parametrize(
        "value", ("VALID_13579 ", b"VALID_13579", "", None)
    )
    def test_valid_cs(self, value):
        self.check_valid_vr("CS", value)

    @pytest.mark.parametrize(
        "value",
        ("201012", "2010122505", b"20102525", b"-20101225-", "20101620",
         "20101040", "20101033", "20101225 20201224 ")
    )
    def test_invalid_da(self, value):
        self.check_invalid_vr("DA", value)

    @pytest.mark.parametrize(
        "value", (b"19560303", "20101225-20201224 ",
                  b"-19560303", "19560303-", "", None)
    )
    def test_valid_da(self, value):
        self.check_valid_vr("DA", value)

    @pytest.mark.parametrize(
        "value",
        ("201012+", "20A0", "+-123.66", "-123.5 E4", b"123F4 ", "- 195.6")
    )
    def test_invalid_ds(self, value):
        self.check_invalid_vr("DS", value, check_warn=False)

    @pytest.mark.parametrize(
        "value", ("12345", "+.1234 ", "-0345.76", b"1956E3",
                  b"-1956e+3", "+195.6e-3", "", None)
    )
    def test_valid_ds(self, value):
        self.check_valid_vr("DS", value)

    @pytest.mark.parametrize(
        "value", ("201012+", "20A0", b"123.66", "-1235E4", "12 34")
    )
    def test_invalid_is(self, value):
        self.check_invalid_vr("IS", value, check_warn=False)

    @pytest.mark.parametrize(
        "value", (" 12345 ", b"+1234 ", "-034576", "", None)
    )
    def test_valid_is(self, value):
        self.check_valid_vr("IS", value)

    @pytest.mark.parametrize(
        "value",
        ("234", "1", "01015", "225959.", b"0000.345", "222222.2222222",
         "-1234-", "+123456", b"-123456-1330", "006000", "005961", "0000aa",
         "0000.00", "123461-1330", "123400-1360")
    )
    def test_invalid_tm(self, value):
        self.check_invalid_vr("TM", value)

    @pytest.mark.parametrize(
        "value",
        ("23", "1234", b"010159", "225959.3", "000000.345", "222222.222222",
         "-1234", "123456-", b"123460-1330", "005960", "", None)
    )
    def test_valid_tm(self, value):
        self.check_valid_vr("TM", value)

    @pytest.mark.parametrize(
        "value",
        ("19", "198", "20011", b"20200101.222", "187712311", "20001301",
         "19190432010159", "203002020222.2222222", b"203002020270.2",
         "1984+2000", "+1877123112-0030", "19190430010161", "19190430016000")
    )
    def test_invalid_dt(self, value):
        self.check_invalid_vr("DT", value)

    @pytest.mark.parametrize(
        "value",
        ("1984", "200112", b"20200101", "1877123112", "200006012020",
         "19190420015960", "20300202022222.222222", b"20300202022222.2",
         "1984+0600", "1877123112-0030", "20300202022222.2-1200",
         "20000101-", "-2020010100", "1929-1997", "", None)
    )
    def test_valid_dt(self, value):
        self.check_valid_vr("DT", value)

    @pytest.mark.parametrize("value", (
            "Руссский", "ctrl\tchar", '"url"', "a<b", "{abc}"))
    def test_invalid_ui(self, value):
        self.check_invalid_vr("UR", value)

    @pytest.mark.parametrize(
        "value", ("1234.567890.333", "0.0.0", "1234." * 12 + "1234"
                  "", None)
    )
    def test_valid_ui(self, value):
        self.check_valid_vr("UI", value)

    @pytest.mark.parametrize("value", (
            ".123.456", "00.1.2", "123..456", "123.45.", "12a.45", "123.04"))
    def test_invalid_ur(self, value):
        self.check_invalid_vr("UI", value)

    @pytest.mark.parametrize(
        "value", ("https://www.a.b/sdf_g?a=1&b=5",
                  "/a#b(c)[d]@!", "'url'", "", None)
    )
    def test_valid_ur(self, value):
        self.check_valid_vr("UR", value)

    def test_invalid_pn(self):
        msg = r"The number of PN components length \(4\) exceeds *"
        with pytest.warns(UserWarning, match=msg):
            DataElement(0x00410001, "PN", "Jim=John=Jimmy=Jonny",
                        validation_mode=config.WARN)
        msg = r"The PN component length \(65\) exceeds *"
        with pytest.raises(ValueError, match=msg):
            DataElement(0x00410001, "PN", b"Jimmy" * 13,
                        validation_mode=config.RAISE)

    @pytest.mark.parametrize(
        "value", ("John^Doe", "Yamada^Tarou=山田^太郎", "", None)
    )
    def test_valid_pn(self, value):
        self.check_valid_vr("PN", value)

    def test_write_invalid_length_non_ascii_text(
            self, enforce_writing_invalid_values):
        fp = DicomBytesIO()
        ds = Dataset()
        ds.is_implicit_VR = True
        ds.is_little_endian = True
        ds.SpecificCharacterSet = "ISO_IR 192"  # UTF-8
        # the string length is 9, so constructing the data element
        # is possible
        ds.add(DataElement(0x00080050, "SH", "洪^吉洞=홍^길동"))

        # encoding the element during writing shall fail,
        # as the encoded length is 21, while only 16 bytes are allowed for SH
        msg = r"The value length \(21\) exceeds the maximum length of 16 *"
        with pytest.raises(ValueError, match=msg):
            ds.save_as(fp)

    def test_write_invalid_non_ascii_pn(self, enforce_writing_invalid_values):
        fp = DicomBytesIO()
        ds = Dataset()
        ds.is_implicit_VR = False
        ds.is_little_endian = True
        ds.SpecificCharacterSet = "ISO_IR 192"  # UTF-8
        # string length is 40
        ds.add(DataElement(0x00100010, "PN", "洪^吉洞" * 10))

        msg = r"The PN component length \(100\) exceeds the maximum allowed *"
        with pytest.raises(ValueError, match=msg):
            ds.save_as(fp)

    def test_read_invalid_length_non_ascii_text(self):
        fp = DicomBytesIO()
        ds = Dataset()
        ds.is_implicit_VR = True
        ds.is_little_endian = True
        ds.SpecificCharacterSet = "ISO_IR 192"  # UTF-8
        ds.add(DataElement(0x00080050, "SH", "洪^吉洞=홍^길동"))
        # disable value validation to write an invalid value
        with config.disable_value_validation():
            ds.save_as(fp)

        # no warning will be issued during reading, as only RawDataElement
        # objects are read
        ds = dcmread(fp, force=True)


def test_elem_description_deprecated():
    """Test deprecation warning for DataElement.description()"""
    elem = DataElement("PatientName", "PN", "Citizen^Jan")
    msg = (
        r"'DataElement.description\(\)' is deprecated and will be removed in "
        r"v3.0, use 'DataElement.name' instead"
    )
    with pytest.warns(DeprecationWarning, match=msg):
        assert elem.description() == "Patient's Name"
