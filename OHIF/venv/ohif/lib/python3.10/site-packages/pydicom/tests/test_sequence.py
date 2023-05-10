# Copyright 2008-2020 pydicom authors. See LICENSE file for details.
"""Unit tests for the pydicom.sequence module."""

import weakref

import pytest

from pydicom.dataset import Dataset
from pydicom.sequence import Sequence


class TestSequence:
    def testDefaultInitialization(self):
        """Sequence: Ensure a valid Sequence is created"""
        empty = Sequence()
        assert 0 == len(empty)

    def testValidInitialization(self):
        """Sequence: Ensure valid creation of Sequences using Dataset inputs"""
        inputs = {'PatientPosition': 'HFS',
                  'PatientSetupNumber': '1',
                  'SetupTechniqueDescription': ''}
        patientSetups = Dataset()
        patientSetups.update(inputs)

        # Construct the sequence
        seq = Sequence((patientSetups,))
        assert isinstance(seq[0], Dataset)

    def testInvalidInitialization(self):
        """Sequence: Raise error if inputs are not iterables or Datasets"""
        # Error on construction with single Dataset
        with pytest.raises(TypeError):
            Sequence(Dataset())
        # Test for non-iterable
        with pytest.raises(TypeError):
            Sequence(1)
        # Test for invalid iterable contents
        with pytest.raises(TypeError):
            Sequence([1, 2])

    def testInvalidAssignment(self):
        """Sequence: validate exception for invalid assignment"""
        seq = Sequence([Dataset(), ])
        # Attempt to assign an integer to the first element
        with pytest.raises(TypeError):
            seq.__setitem__(0, 1)

    def testValidAssignment(self):
        """Sequence: ensure ability to assign a Dataset to a Sequence item"""
        ds = Dataset()
        ds.add_new((1, 1), 'IS', 1)

        # Create a single element Sequence first
        seq = Sequence([Dataset(), ])
        seq[0] = ds

        assert ds == seq[0]

    def test_str(self):
        """Test string output of the sequence"""
        ds = Dataset()
        ds.BeamSequence = [Dataset()]
        ds.BeamSequence[0].PatientName = 'TEST'
        ds.BeamSequence[0].PatientID = '12345'

        out = str(ds.BeamSequence)
        assert "[(0010, 0010) Patient's Name" in out
        assert "PN: 'TEST'" in out
        assert "(0010, 0020) Patient ID" in out
        assert "LO: '12345']" in out

    def test_adding_datasets(self):
        """Tests for adding datasets to the Sequence"""
        ds_a = Dataset()
        ds_a.Rows = 1
        ds_b = Dataset()
        ds_b.Rows = 2
        ds_c = Dataset()
        ds_c.Rows = 3
        ds_d = Dataset()
        ds_d.Rows = 4
        ds_e = Dataset()
        ds_e.Rows = 5

        parent = Dataset()
        parent.PatientName = "Parent"

        seq = Sequence()
        seq.parent = parent
        assert isinstance(seq.parent, weakref.ReferenceType)
        seq.append(ds_a)
        seq.append(ds_c)
        seq.insert(1, ds_b)
        assert 3 == len(seq)
        for ds in seq:
            assert isinstance(ds.parent, weakref.ReferenceType)

        seq[1] = ds_e
        assert ds_e == seq[1]
        assert [ds_a, ds_e, ds_c] == seq
        seq[1:1] = [ds_d]
        assert [ds_a, ds_d, ds_e, ds_c] == seq
        seq[1:2] = [ds_c, ds_e]
        assert [ds_a, ds_c, ds_e, ds_e, ds_c] == seq
        for ds in seq:
            assert isinstance(ds.parent, weakref.ReferenceType)

        msg = r"Can only assign an iterable of 'Dataset'"
        with pytest.raises(TypeError, match=msg):
            seq[1:1] = ds_d

    def test_extending(self):
        """Test Sequence.extend()."""
        ds_a = Dataset()
        ds_a.Rows = 1
        ds_b = Dataset()
        ds_b.Rows = 2
        ds_c = Dataset()
        ds_c.Rows = 3
        ds_d = Dataset()
        ds_d.Rows = 4
        ds_e = Dataset()
        ds_e.Rows = 5

        parent = Dataset()
        parent.PatientName = "Parent"

        seq = Sequence()
        seq.parent = parent
        assert isinstance(seq.parent, weakref.ReferenceType)
        seq.extend([ds_a, ds_b, ds_c])
        assert [ds_a, ds_b, ds_c] == seq

        msg = r"An iterable of 'Dataset' is required"
        with pytest.raises(TypeError, match=msg):
            seq.extend(ds_d)
        assert [ds_a, ds_b, ds_c] == seq

        seq.extend([ds_d, ds_e])
        assert [ds_a, ds_b, ds_c, ds_d, ds_e] == seq
        for ds in seq:
            assert isinstance(ds.parent, weakref.ReferenceType)

    def test_iadd(self):
        """Test Sequence() += [Dataset()]."""
        ds_a = Dataset()
        ds_a.Rows = 1
        ds_b = Dataset()
        ds_b.Rows = 2
        ds_c = Dataset()
        ds_c.Rows = 3
        ds_d = Dataset()
        ds_d.Rows = 4
        ds_e = Dataset()
        ds_e.Rows = 5

        parent = Dataset()
        parent.PatientName = "Parent"

        seq = Sequence()
        seq.parent = parent
        assert isinstance(seq.parent, weakref.ReferenceType)
        seq += [ds_a, ds_b, ds_c]
        assert [ds_a, ds_b, ds_c] == seq

        msg = r"An iterable of 'Dataset' is required"
        with pytest.raises(TypeError, match=msg):
            seq += ds_d
        assert [ds_a, ds_b, ds_c] == seq

        seq += [ds_d, ds_e]
        assert [ds_a, ds_b, ds_c, ds_d, ds_e] == seq

        for ds in seq:
            assert isinstance(ds.parent, weakref.ReferenceType)
