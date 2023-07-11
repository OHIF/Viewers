# Copyright 2008-2020 pydicom authors. See LICENSE file for details.

from importlib import reload
import typing

import pytest

import pydicom
from pydicom.data import get_testdata_file
from pydicom.filereader import dcmread

try:
    import numpy as np
    HAVE_NP = True
except ImportError:
    HAVE_NP = False

try:
    from pydicom.waveforms import numpy_handler as NP_HANDLER
    from pydicom.waveforms.numpy_handler import (
        generate_multiplex, multiplex_array
    )
except ImportError:
    NP_HANDLER = None


ECG = get_testdata_file('waveform_ecg.dcm')


@pytest.mark.skipif(HAVE_NP, reason="Numpy available")
def test_waveform_array_raises():
    """Test waveform_array raises exception for all syntaxes."""
    ds = dcmread(ECG)
    msg = r"The waveform data handler requires numpy"
    with pytest.raises(RuntimeError, match=msg):
        ds.waveform_array(0)


@pytest.mark.skipif(not HAVE_NP, reason="Numpy not available")
def test_simple():
    """Simple functionality test."""
    ds = dcmread(ECG)
    arr = ds.waveform_array(index=0)
    arr = ds.waveform_array(index=1)


@pytest.mark.skipif(not HAVE_NP, reason="Numpy not available")
class TestHandlerGenerateMultiplex:
    """Tests for the waveform numpy_handler.generate_multiplex."""
    def test_no_waveform_sequence(self):
        """Test that missing waveform sequence raises exception."""
        ds = dcmread(ECG)
        del ds.WaveformSequence
        msg = (
            r"No \(5400,0100\) Waveform Sequence element found in the dataset"
        )
        gen = generate_multiplex(ds)
        with pytest.raises(AttributeError, match=msg):
            next(gen)

    def test_missing_required(self):
        """Test that missing required element in sequence raises exception."""
        ds = dcmread(ECG)
        item = ds.WaveformSequence[0]
        del item.NumberOfWaveformSamples
        msg = (
            f"Unable to convert the waveform multiplex group with index "
            f"0 as the following required elements are missing from "
            f"the sequence item: NumberOfWaveformSamples"
        )
        gen = generate_multiplex(ds)
        with pytest.raises(AttributeError, match=msg):
            next(gen)

    def test_as_raw(self):
        """Test that as_raw=True works as expected."""
        ds = dcmread(ECG)
        gen = generate_multiplex(ds, as_raw=True)
        arr = next(gen)
        assert [80, 65, 50, 35, 37] == arr[0:5, 0].tolist()
        assert [90, 85, 80, 75, 77] == arr[0:5, 1].tolist()
        assert arr.dtype == 'int16'
        assert arr.flags.writeable
        assert (10000, 12) == arr.shape

    def test_not_as_raw(self):
        """Test that as_raw=False works as expected."""
        ds = dcmread(ECG)
        gen = generate_multiplex(ds, as_raw=False)
        arr = next(gen)
        assert [100, 81.25, 62.5, 43.75, 46.25] == arr[0:5, 0].tolist()
        assert [112.5, 106.25, 100, 93.75, 96.25] == arr[0:5, 1].tolist()
        assert arr.dtype == 'float'
        assert arr.flags.writeable
        assert (10000, 12) == arr.shape


@pytest.mark.skipif(not HAVE_NP, reason="Numpy not available")
class TestHandlerMultiplexArray:
    """Tests for the waveform numpy_handler.multiplex_array."""
    def test_no_waveform_sequence(self):
        """Test that missing waveform sequence raises exception."""
        ds = dcmread(ECG)
        del ds.WaveformSequence
        msg = (
            r"No \(5400,0100\) Waveform Sequence element found in the dataset"
        )
        with pytest.raises(AttributeError, match=msg):
            multiplex_array(ds, 0)

    def test_missing_required(self):
        """Test that missing required element in sequence raises exception."""
        ds = dcmread(ECG)
        item = ds.WaveformSequence[0]
        del item.NumberOfWaveformSamples
        msg = (
            f"Unable to convert the waveform multiplex group with index "
            f"0 as the following required elements are missing from "
            f"the sequence item: NumberOfWaveformSamples"
        )
        with pytest.raises(AttributeError, match=msg):
            multiplex_array(ds, 0)

    def test_as_raw(self):
        """Test that as_raw=True works as expected."""
        ds = dcmread(ECG)
        arr = multiplex_array(ds, index=0, as_raw=True)
        assert [80, 65, 50, 35, 37] == arr[0:5, 0].tolist()
        assert [90, 85, 80, 75, 77] == arr[0:5, 1].tolist()
        assert arr.dtype == 'int16'
        assert arr.flags.writeable
        assert (10000, 12) == arr.shape

        arr = multiplex_array(ds, index=1, as_raw=True)
        assert [10, 10, 30, 35, 25] == arr[0:5, 0].tolist()
        assert [80, 80, 80, 85, 80] == arr[0:5, 1].tolist()
        assert arr.dtype == 'int16'
        assert arr.flags.writeable
        assert (1200, 12) == arr.shape

    def test_not_as_raw(self):
        """Test that as_raw=False works as expected."""
        ds = dcmread(ECG)
        arr = multiplex_array(ds, index=0, as_raw=False)
        assert [100, 81.25, 62.5, 43.75, 46.25] == arr[0:5, 0].tolist()
        assert [112.5, 106.25, 100, 93.75, 96.25] == arr[0:5, 1].tolist()
        assert arr.dtype == 'float'
        assert arr.flags.writeable
        assert (10000, 12) == arr.shape
