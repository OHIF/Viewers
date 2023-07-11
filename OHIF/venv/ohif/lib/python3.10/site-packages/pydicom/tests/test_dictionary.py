# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Test for datadict.py"""

import pytest

from pydicom import DataElement
from pydicom.dataset import Dataset
from pydicom.datadict import (keyword_for_tag, dictionary_description,
                              dictionary_has_tag, repeater_has_tag,
                              repeater_has_keyword, get_private_entry,
                              dictionary_VM, private_dictionary_VR,
                              private_dictionary_VM, add_private_dict_entries,
                              add_private_dict_entry)
from pydicom.datadict import add_dict_entry, add_dict_entries
from pydicom.tests.test_util import save_private_dict


class TestDict:
    def test_tag_not_found(self):
        """dicom_dictionary: CleanName returns blank string for unknown tag"""
        assert '' == keyword_for_tag(0x99991111)

    def test_repeaters(self):
        """dicom_dictionary: Tags with "x" return correct dict info........"""
        assert 'Transform Label' == dictionary_description(0x280400)
        assert ('Rows For Nth Order Coefficients' ==
                dictionary_description(0x280410))

    def test_dict_has_tag(self):
        """Test dictionary_has_tag"""
        assert dictionary_has_tag(0x00100010)
        assert not dictionary_has_tag(0x11110010)
        assert dictionary_has_tag("PatientName")
        assert not dictionary_has_tag("PatientMane")

    def test_repeater_has_tag(self):
        """Test repeater_has_tag"""
        assert repeater_has_tag(0x60000010)
        assert repeater_has_tag(0x60020010)
        assert not repeater_has_tag(0x00100010)

    def test_repeater_has_keyword(self):
        """Test repeater_has_keyword"""
        assert repeater_has_keyword('OverlayData')
        assert not repeater_has_keyword('PixelData')

    def test_get_private_entry(self):
        """Test get_private_entry"""
        # existing entry
        entry = get_private_entry((0x0903, 0x0011), 'GEIIS PACS')
        assert 'US' == entry[0]  # VR
        assert '1' == entry[1]  # VM
        assert 'Significant Flag' == entry[2]  # name
        assert not entry[3]  # is retired

        # existing entry in another slot
        entry = get_private_entry((0x0903, 0x1011), 'GEIIS PACS')
        assert 'Significant Flag' == entry[2]  # name

        # non-existing entry
        with pytest.raises(KeyError):
            get_private_entry((0x0903, 0x0011), 'Nonexisting')
        with pytest.raises(KeyError):
            get_private_entry((0x0903, 0x0091), 'GEIIS PACS')

    def test_add_entry(self):
        """dicom_dictionary: Can add and use a single dictionary entry"""
        add_dict_entry(0x10021001, "UL", "TestOne", "Test One")
        add_dict_entry(0x10021002, "DS", "TestTwo", "Test Two", VM='3')
        ds = Dataset()
        ds.TestOne = 'test'
        ds.TestTwo = ['1', '2', '3']

    def test_add_entry_raises_for_private_tag(self):
        with pytest.raises(ValueError,
                           match='Private tags cannot be '
                                 'added using "add_dict_entries"'):
            add_dict_entry(0x10011101, 'DS', 'Test One', 'Test One')

    def test_add_entries(self):
        """dicom_dictionary: add and use a dict of new dictionary entries"""
        new_dict_items = {
            0x10021001: ('UL', '1', "Test One", '', 'TestOne'),
            0x10021002: ('DS', '3', "Test Two", '', 'TestTwo'),
        }
        add_dict_entries(new_dict_items)
        ds = Dataset()
        ds.TestOne = 'test'
        ds.TestTwo = ['1', '2', '3']

    def test_add_entries_raises_for_private_tags(self):
        new_dict_items = {
            0x10021001: ('UL', '1', 'Test One', '', 'TestOne'),
            0x10011002: ('DS', '3', 'Test Two', '', 'TestTwo'),
        }
        with pytest.raises(ValueError, match='Private tags cannot be added '
                                             'using "add_dict_entries"'):
            add_dict_entries(new_dict_items)

    def test_add_private_entry(self):
        with save_private_dict():
            add_private_dict_entry(
                'ACME 3.1', 0x10011101, 'DS', 'Test One', '3')
            entry = get_private_entry((0x1001, 0x0001), 'ACME 3.1')
            assert 'DS' == entry[0]  # VR
            assert '3' == entry[1]  # VM
            assert 'Test One' == entry[2]  # description

    def test_add_private_entry_raises_for_non_private_tag(self):
        msg = (
            r"Non-private tags cannot be added using "
            r"'add_private_dict_entries\(\)' \- use "
            r"'add_dict_entries\(\)' instead"
        )
        with pytest.raises(ValueError, match=msg):
            add_private_dict_entry('ACME 3.1', 0x10021101, 'DS', 'Test One')

    def test_add_private_entries(self):
        """dicom_dictionary: add and use a dict of new dictionary entries"""
        new_dict_items = {
            0x10011001: ('SH', '1', "Test One",),
            0x10011002: ('DS', '3', "Test Two", '', 'TestTwo'),
        }
        add_private_dict_entries('ACME 3.1', new_dict_items)
        ds = Dataset()
        ds[0x10010010] = DataElement(0x10010010, 'LO', 'ACME 3.1')
        ds[0x10011001] = DataElement(0x10011001, 'SH', 'Test')
        ds[0x10011002] = DataElement(0x10011002, 'DS', '1\\2\\3')

        assert 'Test' == ds[0x10011001].value
        assert [1, 2, 3] == ds[0x10011002].value

    def test_add_private_entries_raises_for_non_private_tags(self):
        new_dict_items = {
            0x10021001: ('UL', '1', 'Test One', '', 'TestOne'),
            0x10011002: ('DS', '3', 'Test Two', '', 'TestTwo'),
        }
        msg = (
            r"Non-private tags cannot be added using "
            r"'add_private_dict_entries\(\)' \- use "
            r"'add_dict_entries\(\)' instead"
        )
        with pytest.raises(ValueError, match=msg):
            add_private_dict_entries('ACME 3.1', new_dict_items)

    def test_dictionary_VM(self):
        """Test dictionary_VM"""
        assert dictionary_VM(0x00000000) == '1'
        assert dictionary_VM(0x00081163) == '2'
        assert dictionary_VM(0x0000901) == '1-n'
        assert dictionary_VM(0x00041141) == '1-8'
        assert dictionary_VM(0x00080008) == '2-n'
        assert dictionary_VM(0x00080309) == '1-3'
        assert dictionary_VM(0x00081162) == '3-3n'

    def test_private_dict_VR(self):
        """Test private_dictionary_VR"""
        assert private_dictionary_VR(0x00090000, 'ACUSON') == 'IS'

    def test_private_dict_VM(self):
        """Test private_dictionary_VM"""
        assert private_dictionary_VM(0x00090000, 'ACUSON') == '1'
