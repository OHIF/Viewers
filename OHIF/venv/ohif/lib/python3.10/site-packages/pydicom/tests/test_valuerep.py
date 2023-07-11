# -*- coding: utf-8 -*-
# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Test suite for valuerep.py"""

import copy
from datetime import datetime, date, time, timedelta, timezone
from decimal import Decimal
from itertools import chain
import pickle
import math
import sys
from typing import Union

import pytest

import pydicom
from pydicom import config, valuerep
from pydicom.config import settings
from pydicom.data import get_testdata_file
from pydicom.dataset import Dataset
from pydicom._dicom_dict import DicomDictionary, RepeatersDictionary
from pydicom.tag import Tag
from pydicom.valuerep import (
    DS, IS, DSfloat, DSdecimal, PersonName, VR, STANDARD_VR,
    AMBIGUOUS_VR, STR_VR, BYTES_VR, FLOAT_VR, INT_VR, LIST_VR
)
from pydicom.values import convert_value


badvr_name = get_testdata_file("badVR.dcm")
default_encoding = "iso8859"


@pytest.fixture(params=(True, False))
def enforce_valid_both_fixture(request):
    """Fixture to run tests with enforce_valid_values with both True and False
       and ensure it is reset afterwards regardless of whether test succeeds.
    """
    orig_reading_validation_mode = settings.reading_validation_mode
    settings.reading_validation_mode = (
        config.RAISE if request.param
        else config.WARN
    )
    yield
    settings.reading_validation_mode = orig_reading_validation_mode


class TestTM:
    """Unit tests for pickling TM"""
    def test_pickling(self):
        # Check that a pickled TM is read back properly
        tm = pydicom.valuerep.TM("212223")
        assert tm == time(21, 22, 23)
        assert tm.original_string == "212223"
        assert tm == time(21, 22, 23)
        loaded_tm = pickle.loads(pickle.dumps(tm))
        assert loaded_tm == tm
        assert loaded_tm.original_string == tm.original_string
        assert str(loaded_tm) == str(tm)

    def test_pickling_tm_from_time(self):
        tm = pydicom.valuerep.TM(time(21, 22, 23))
        assert tm.original_string == "212223"
        time_string = pickle.dumps(tm)
        loaded_tm = pickle.loads(time_string)
        assert loaded_tm == tm
        assert loaded_tm.original_string == tm.original_string
        assert str(loaded_tm) == str(tm)

    def test_str_and_repr(self):
        assert str(pydicom.valuerep.TM("212223.1234")) == "212223.1234"
        assert repr(pydicom.valuerep.TM("212223.1234")) == '"212223.1234"'
        assert str(pydicom.valuerep.TM("212223")) == "212223"
        assert repr(pydicom.valuerep.TM("212223")) == '"212223"'
        assert str(pydicom.valuerep.TM("2122")) == "2122"
        assert repr(pydicom.valuerep.TM("2122")) == '"2122"'
        assert str(pydicom.valuerep.TM("21")) == "21"
        assert str(pydicom.valuerep.TM(time(21, 22, 23))) == "212223"
        assert str(pydicom.valuerep.TM(
            time(21, 22, 23, 24))) == "212223.000024"
        assert str(pydicom.valuerep.TM(time(1, 2, 3))) == "010203"
        assert repr(pydicom.valuerep.TM(time(1, 2, 3))) == '"010203"'

    def test_new_empty_str(self):
        """Test converting an empty string."""
        assert pydicom.valuerep.TM('') is None

    def test_new_str_conversion(self):
        """Test converting strings to times."""
        tm = pydicom.valuerep.TM('00')
        assert tm == time(0, 0, 0)
        tm = pydicom.valuerep.TM('23')
        assert tm == time(23, 0, 0)
        msg = r"Unable to convert non-conformant value '24' to 'TM' object"
        with pytest.raises(ValueError, match=msg):
            pydicom.valuerep.TM('24')

        tm = pydicom.valuerep.TM('0000')
        assert tm == time(0, 0, 0)
        tm = pydicom.valuerep.TM('2359')
        assert tm == time(23, 59, 0)
        msg = r"Unable to convert non-conformant value '2360' to 'TM' object"
        with pytest.raises(ValueError, match=msg):
            pydicom.valuerep.TM('2360')

        tm = pydicom.valuerep.TM('000000')
        assert tm == time(0, 0, 0)
        # Valid DICOM TM seconds range is 0..60, but time is 0..59
        msg = (
            r"'datetime.time' doesn't allow a value of '60' for the "
            r"seconds component, changing to '59'"
        )
        with pytest.warns(UserWarning, match=msg):
            tm = pydicom.valuerep.TM('235960')
        assert tm == time(23, 59, 59)

        msg = r"Unable to convert non-conformant value '235' to 'TM' object"
        with pytest.raises(ValueError, match=msg):
            pydicom.valuerep.TM('235')

    def test_new_obj_conversion(self):
        """Test other conversion attempts."""
        assert pydicom.valuerep.TM(None) is None
        tm = pydicom.valuerep.TM("010203.123456")
        assert pydicom.valuerep.TM(tm) == time(1, 2, 3, 123456)
        assert tm == pydicom.valuerep.TM(tm)
        tm = pydicom.valuerep.TM(time(1, 2, 3))
        assert isinstance(tm, pydicom.valuerep.TM)
        assert tm == time(1, 2, 3)

        msg = r"Unable to convert '123456' to 'TM' object"
        with pytest.raises(ValueError, match=msg):
            pydicom.valuerep.TM(123456)

    def test_comparison(self):
        tm = pydicom.valuerep.TM("010203.123456")
        tm_object = time(1, 2, 3, 123456)
        assert tm == tm
        assert tm != 1
        assert tm == tm_object
        assert tm_object == tm
        assert hash(tm) == hash(tm_object)
        assert tm == pydicom.valuerep.TM(tm_object)
        assert tm < time(1, 2, 3, 123457)
        assert tm != time(1, 2, 3, 123457)
        assert tm < pydicom.valuerep.TM(time(1, 2, 3, 123457))
        assert tm <= time(1, 2, 3, 123457)
        assert tm <= tm_object
        assert tm > time(1, 2, 3)
        assert tm > pydicom.valuerep.TM(time(1, 2, 3))
        assert tm >= time(1, 2, 3)
        assert time(1, 2, 3, 123457) > tm
        assert tm_object >= tm
        assert time(1, 2, 3) < tm
        with pytest.raises(TypeError):
            tm > 5

    def test_time_behavior(self):
        """Test that TM behaves like time."""
        tm = pydicom.valuerep.TM("010203.123456")
        assert tm.hour == 1
        assert tm.second == 3
        assert tm.microsecond == 123456
        assert tm.replace(hour=23) == time(23, 2, 3, 123456)
        assert "minute" in dir(tm)
        assert "original_string" in dir(tm)


class TestDT:
    """Unit tests for pickling DT"""
    def test_pickling(self):
        # Check that a pickled DT is read back properly
        dt = pydicom.valuerep.DT("19111213212123")
        assert dt == datetime(1911, 12, 13, 21, 21, 23)
        data1_string = pickle.dumps(dt)
        loaded_dt = pickle.loads(data1_string)
        assert loaded_dt == dt
        assert dt.original_string == loaded_dt.original_string
        assert str(loaded_dt) == str(dt)

    def test_pickling_with_timezone(self):
        dt = pydicom.valuerep.DT("19111213212123-0630")
        loaded_dt = pickle.loads(pickle.dumps(dt))
        assert loaded_dt == dt
        assert loaded_dt.original_string == dt.original_string
        assert str(loaded_dt) == str(dt)

    def test_pickling_dt_from_datetime(self):
        dt = pydicom.valuerep.DT(datetime(2222, 11, 23, 1, 2, 3, 4))
        assert dt.original_string == "22221123010203.000004"
        loaded_dt = pickle.loads(pickle.dumps(dt))
        assert loaded_dt == dt
        assert loaded_dt.original_string == dt.original_string
        assert str(dt) == str(loaded_dt)

    def test_pickling_dt_from_datetime_with_timezone(self):
        tz_info = timezone(timedelta(seconds=-23400), '-0630')
        dt_object = datetime(2022, 12, 31, 23, 59, 59, 42, tzinfo=tz_info)
        dt = pydicom.valuerep.DT(dt_object)
        assert dt.original_string == "20221231235959.000042-0630"
        loaded_dt = pickle.loads(pickle.dumps(dt))
        assert dt == loaded_dt
        assert dt.original_string == loaded_dt.original_string
        assert str(dt) == str(loaded_dt)

    def test_new_empty_str(self):
        """Test converting an empty string."""
        assert pydicom.valuerep.DT('') is None

    def test_new_obj_conversion(self):
        """Test other conversion attempts."""
        assert pydicom.valuerep.DT(None) is None
        dt = pydicom.valuerep.DT("10010203")
        assert pydicom.valuerep.DT(dt) == datetime(1001, 2, 3)
        assert dt == pydicom.valuerep.DT(dt)
        dt = pydicom.valuerep.DT(datetime(1001, 2, 3))
        assert isinstance(dt, pydicom.valuerep.DT)
        assert dt == datetime(1001, 2, 3)

        msg = r"Unable to convert '123456' to 'DT' object"
        with pytest.raises(ValueError, match=msg):
            pydicom.valuerep.DT(123456)

    def test_new_str_conversion(self):
        """Test string conversion."""
        # Valid DICOM TM seconds range is 0..60, but time is 0..59
        msg = (
            r"'datetime.datetime' doesn't allow a value of '60' for the "
            r"seconds component, changing to '59'"
        )
        with pytest.warns(UserWarning, match=msg):
            dt = pydicom.valuerep.DT('20010101235960')
        assert str(dt) == "20010101235960"
        assert dt == datetime(2001, 1, 1, 23, 59, 59)

        msg = (
            r"Unable to convert non-conformant value 'a2000,00,00' to 'DT' "
            r"object"
        )
        with pytest.raises(ValueError, match=msg):
            pydicom.valuerep.DT("a2000,00,00")

    def test_str_and_repr(self):
        dt = datetime(1911, 12, 13, 21, 21, 23)
        assert str(pydicom.valuerep.DT(dt)) == "19111213212123"
        assert repr(pydicom.valuerep.DT(dt)) == '"19111213212123"'
        assert str(pydicom.valuerep.DT("19111213212123")) == "19111213212123"
        assert str(pydicom.valuerep.DA("1001.02.03")) == "1001.02.03"
        assert repr(pydicom.valuerep.DA("1001.02.03")) == '"1001.02.03"'
        tz_info = timezone(timedelta(seconds=21600), '+0600')
        dt = datetime(2022, 1, 2, 8, 9, 7, 123456, tzinfo=tz_info)
        assert str(pydicom.valuerep.DT(dt)) == "20220102080907.123456+0600"
        assert repr(pydicom.valuerep.DT(dt)) == '"20220102080907.123456+0600"'
        tz_info = timezone(timedelta(seconds=-23400), '-0630')
        dt = datetime(2022, 12, 31, 23, 59, 59, 42, tzinfo=tz_info)
        assert str(pydicom.valuerep.DT(dt)) == "20221231235959.000042-0630"
        assert repr(pydicom.valuerep.DT(dt)) == '"20221231235959.000042-0630"'

    def test_comparison(self):
        dt = pydicom.valuerep.DT("19111213212123")
        dt_object = datetime(1911, 12, 13, 21, 21, 23)
        assert dt == dt
        assert dt != 1
        assert dt == dt_object
        assert dt_object == dt
        assert hash(dt) == hash(dt_object)
        assert dt == pydicom.valuerep.DT(dt_object)
        assert dt < datetime(1911, 12, 13, 21, 21, 23, 123)
        assert dt != datetime(1911, 12, 13, 21, 21, 24)
        assert dt < pydicom.valuerep.DT(datetime(1911, 12, 13, 21, 21, 24))
        assert dt <= datetime(1911, 12, 13, 21, 21, 23)
        assert dt <= dt_object
        assert dt > datetime(1911, 12, 13, 21, 21, 22)
        assert dt > pydicom.valuerep.DT(datetime(1911, 12, 13, 21, 21, 22))
        assert dt >= datetime(1911, 12, 13, 21, 21, 23)
        assert datetime(1911, 12, 13, 21, 21, 24) > dt
        assert dt_object >= dt
        assert datetime(1911, 12, 13, 21, 21, 22) < dt
        with pytest.raises(TypeError):
            dt > 5

    def test_datetime_behavior(self):
        """Test that DT behaves like datetime."""
        tz_info = timezone(timedelta(seconds=-23400), '-0630')
        dt_object = datetime(2022, 12, 31, 23, 59, 59, 42, tzinfo=tz_info)
        dt = pydicom.valuerep.DT(dt_object)
        assert dt == dt_object
        assert dt_object == dt
        assert dt.year == 2022
        assert dt.month == 12
        assert dt.hour == 23
        assert dt.second == 59
        assert dt.microsecond == 42
        assert dt.tzinfo == tz_info
        assert dt.today().date() == dt_object.today().date()
        assert "hour" in dir(dt)
        assert "original_string" in dir(dt)


class TestDA:
    """Unit tests for pickling DA"""
    def test_pickling(self):
        # Check that a pickled DA is read back properly
        x = pydicom.valuerep.DA("19111213")
        assert date(1911, 12, 13) == x
        x.original_string = "hello"
        data1_string = pickle.dumps(x)
        x2 = pickle.loads(data1_string)
        assert x == x2
        assert x.original_string == x2.original_string
        assert str(x) == str(x2)

    def test_new_obj_conversion(self):
        """Test other conversion attempts."""
        assert pydicom.valuerep.DA(None) is None
        x = pydicom.valuerep.DA("10010203")
        assert date(1001, 2, 3) == pydicom.valuerep.DA(x)
        assert x == pydicom.valuerep.DA(x)
        x = pydicom.valuerep.DA(date(1001, 2, 3))
        assert isinstance(x, pydicom.valuerep.DA)
        assert date(1001, 2, 3) == x

        msg = r"Unable to convert '123456' to 'DA' object"
        with pytest.raises(ValueError, match=msg):
            pydicom.valuerep.DA(123456)

    def test_str_and_repr(self):
        assert str(pydicom.valuerep.DA(date(1001, 2, 3))) == "10010203"
        assert repr(pydicom.valuerep.DA(date(1001, 2, 3))) == '"10010203"'
        assert str(pydicom.valuerep.DA("10010203")) == "10010203"
        assert repr(pydicom.valuerep.DA("10010203")) == '"10010203"'
        assert str(pydicom.valuerep.DA("1001.02.03")) == "1001.02.03"
        assert repr(pydicom.valuerep.DA("1001.02.03")) == '"1001.02.03"'

    def test_comparison(self):
        da = pydicom.valuerep.DA("19111213")
        da_object = date(1911, 12, 13)
        assert da == da
        assert da != 1
        assert da == da_object
        assert hash(da) == hash(da_object)
        assert da_object == da
        assert da == pydicom.valuerep.DA(da_object)
        assert da < date(1911, 12, 14)
        assert da != date(1901, 12, 13)
        assert da < pydicom.valuerep.DA(date(1912, 12, 13))
        assert da <= date(1911, 12, 13)
        assert da <= da_object
        assert da > date(1911, 12, 12)
        assert da > pydicom.valuerep.DA(date(1911, 12, 12))
        assert da >= date(1911, 12, 13)
        assert date(1911, 12, 14) > da
        assert da_object >= da
        assert date(1911, 12, 12) < da
        with pytest.raises(TypeError):
            da > 5

    def test_date_behavior(self):
        da = pydicom.valuerep.DA("10010203")
        da_object = date(1001, 2, 3)
        assert da == da_object
        assert da_object == da
        assert da.year == 1001
        assert da.month == 2
        assert da.day == 3
        assert da.today() == da_object.today()
        assert "day" in dir(da)
        assert "original_string" in dir(da)


class TestIsValidDS:
    """Unit tests for the is_valid_ds function."""
    @pytest.mark.parametrize(
        's',
        [
            '1',
            '3.14159265358979',
            '-1234.456e78',
            '1.234E-5',
            '1.234E+5',
            '+1',
            '    42',  # leading spaces allowed
            '42    ',  # trailing spaces allowed
        ]
    )
    def test_valid(self, s: str):
        """Various valid decimal strings."""
        assert pydicom.valuerep.is_valid_ds(s)

    @pytest.mark.parametrize(
        's',
        [
            'nan',
            '-inf',
            '3.141592653589793',  # too long
            '1,000',              # no commas
            '1 000',              # no embedded spaces
            '127.0.0.1',          # not a number
            '1.e'                 # not a number
        ]
    )
    def test_invalid(self, s: str):
        """Various invalid decimal strings."""
        assert not pydicom.valuerep.is_valid_ds(s)


class TestTruncateFloatForDS:
    """Unit tests for float truncation function"""
    def check_valid(self, s: str) -> bool:
        # Use the pydicom test function
        if not pydicom.valuerep.is_valid_ds(s):
            return False

        # Disallow floats ending in '.' since this may not be correctly
        # interpreted
        if s.endswith('.'):
            return False

        # Otherwise return True
        return True

    @pytest.mark.parametrize(
        'val,expected_str',
        [
            [1.0, "1.0"],
            [0.0, "0.0"],
            [-0.0, "-0.0"],
            [0.123, "0.123"],
            [-0.321, "-0.321"],
            [0.00001, "1e-05"],
            [3.14159265358979323846, '3.14159265358979'],
            [-3.14159265358979323846, '-3.1415926535898'],
            [5.3859401928763739403e-7, '5.3859401929e-07'],
            [-5.3859401928763739403e-7, '-5.385940193e-07'],
            [1.2342534378125532912998323e10, '12342534378.1255'],
            [6.40708699858767842501238e13, '64070869985876.8'],
            [1.7976931348623157e+308, '1.797693135e+308'],
        ]
    )
    def test_auto_format(self, val: float, expected_str: str):
        """Test truncation of some basic values."""
        assert pydicom.valuerep.format_number_as_ds(val) == expected_str

    @pytest.mark.parametrize(
        'exp', [-101, -100, 100, 101] + list(range(-16, 17))
    )
    def test_powers_of_pi(self, exp: int):
        """Raise pi to various powers to test truncation."""
        val = math.pi * 10 ** exp
        s = pydicom.valuerep.format_number_as_ds(val)
        assert self.check_valid(s)

    @pytest.mark.parametrize(
        'exp', [-101, -100, 100, 101] + list(range(-16, 17))
    )
    def test_powers_of_negative_pi(self, exp: int):
        """Raise negative pi to various powers to test truncation."""
        val = -math.pi * 10 ** exp
        s = pydicom.valuerep.format_number_as_ds(val)
        assert self.check_valid(s)

    @pytest.mark.parametrize(
        'val', [float('-nan'), float('nan'), float('-inf'), float('inf')]
    )
    def test_invalid(self, val: float):
        """Test non-finite floating point numbers raise an error"""
        with pytest.raises(ValueError):
            pydicom.valuerep.format_number_as_ds(val)

    def test_wrong_type(self):
        """Test calling with a string raises an error"""
        with pytest.raises(
                TypeError,
                match="'val' must be of type float or decimal.Decimal"
        ):
            pydicom.valuerep.format_number_as_ds('1.0')


class TestDS:
    """Unit tests for DS values"""
    def test_empty_value(self):
        assert DS(None) is None
        assert DS("") == ""
        assert DS("   ") == "   "

    def test_float_values(self):
        val = DS(0.9)
        assert isinstance(val, DSfloat)
        assert 0.9 == val
        val = DS("0.9")
        assert isinstance(val, DSfloat)
        assert 0.9 == val


class TestDSfloat:
    """Unit tests for pickling DSfloat"""
    def test_pickling(self, enforce_valid_both_fixture):
        # Check that a pickled DSFloat is read back properly
        x = DSfloat(9.0)
        x.original_string = "hello"
        data1_string = pickle.dumps(x)
        x2 = pickle.loads(data1_string)
        assert x.real == x2.real
        assert x.original_string == x2.original_string

    def test_new_empty(self, enforce_valid_both_fixture):
        """Test passing an empty value."""
        assert isinstance(DSfloat(''), str)
        assert DSfloat('') == ''
        assert DSfloat(None) is None

    def test_str_value(self, enforce_valid_both_fixture):
        """Test creating using str"""
        assert DSfloat('1.20') == 1.2
        assert DSfloat('1.20') == 1.20
        assert DSfloat('1.20 ') == 1.2
        assert DSfloat('1.20 ') == 1.20
        assert DSfloat('1.20') != '1.2'
        assert DSfloat('1.20') == '1.20'
        assert DSfloat('1.20 ') == '1.20'

    def test_str(self, enforce_valid_both_fixture):
        """Test DSfloat.__str__()."""
        val = DSfloat(1.1)
        assert str(val) == '1.1'

        val = DSfloat("1.1")
        assert str(val) == '1.1'

    def test_repr(self, enforce_valid_both_fixture):
        """Test DSfloat.__repr__()."""
        val = DSfloat(1.1)
        assert repr(val) == "'1.1'"

        val = DSfloat("1.1")
        assert repr(val) == "'1.1'"
        assert repr(val) == repr("1.1")
        assert repr(val) == repr('1.1')

    def test_DSfloat(self, enforce_valid_both_fixture):
        """Test creating a value using DSfloat."""
        x = DSfloat('1.2345')
        y = DSfloat(x)
        assert x == y
        assert y == x
        assert 1.2345 == y
        assert "1.2345" == y.original_string

    def test_DSdecimal(self, enforce_valid_both_fixture):
        """Test creating a value using DSdecimal."""
        x = DSdecimal('1.2345')
        y = DSfloat(x)
        assert 1.2345 == y
        assert "1.2345" == y.original_string

    def test_auto_format(self, enforce_valid_both_fixture):
        """Test truncating floats"""
        x = DSfloat(math.pi, auto_format=True)

        # Float representation should be unaltered by truncation
        assert x == math.pi
        # String representations should be correctly formatted
        assert str(x) == '3.14159265358979'
        assert repr(x) == repr('3.14159265358979')

    def test_auto_format_from_invalid_DS(self, disable_value_validation):
        """Test truncating floats"""
        # A DSfloat that has a non-valid string representation
        x = DSfloat(math.pi)

        # Use this to initialise another with auto_format set to true
        y = DSfloat(x, auto_format=True)

        # Float representation should be unaltered by truncation
        assert y == math.pi
        # String representations should be correctly formatted
        assert str(y) == '3.14159265358979'
        assert repr(y) == repr("3.14159265358979")

    def test_auto_format_invalid_string(self, enforce_valid_both_fixture):
        """If the user supplies an invalid string, this should be formatted."""
        x = DSfloat('3.141592653589793', auto_format=True)

        # Float representation should be unaltered by truncation
        assert x == float('3.141592653589793')
        # String representations should be correctly formatted
        assert str(x) == '3.14159265358979'
        assert repr(x) == repr("3.14159265358979")

    def test_auto_format_valid_string(self, enforce_valid_both_fixture):
        """If the user supplies a valid string, this should not be altered."""
        x = DSfloat('1.234e-1', auto_format=True)

        # Float representation should be correct
        assert x == 0.1234
        # String representations should be unaltered
        assert str(x) == '1.234e-1'
        assert repr(x) == repr("1.234e-1")

    def test_enforce_valid_values_length(self):
        """Test that errors are raised when length is too long."""
        with pytest.raises(OverflowError):
            valuerep.DSfloat('3.141592653589793',
                             validation_mode=config.RAISE)

    def test_DSfloat_auto_format(self):
        """Test creating a value using DSfloat copies auto_format"""
        x = DSfloat(math.pi, auto_format=True)
        y = DSfloat(x)
        assert x == y
        assert y == x
        assert y.auto_format
        assert math.pi == y
        assert str(y) == '3.14159265358979'
        assert repr(y) == repr("3.14159265358979")

    @pytest.mark.parametrize(
        'val',
        [
            'nan', '-nan', 'inf', '-inf', float('nan'), float('-nan'),
            float('-inf'), float('inf')
        ]
    )
    def test_enforce_valid_values_value(
        self, val: Union[float, str]
    ):
        """Test that errors are raised when value is invalid."""
        with pytest.raises(ValueError):
            valuerep.DSfloat(val, validation_mode=config.RAISE)

    def test_comparison_operators(self):
        """Tests for the comparison operators"""
        float_decimal = DSfloat(Decimal(1234.5))
        for val in (DSfloat("1234.5"), DSfloat(1234.5), float_decimal):
            assert val == Decimal(1234.5)
            assert val != Decimal(1235)
            assert val < Decimal(1235)
            assert val <= Decimal(1235)
            assert val > Decimal(1233)
            assert val >= Decimal(1233)

            assert val == 1234.5
            assert val != 1235.0
            assert val < 1235.0
            assert val <= 1235.0
            assert val > 1233.0
            assert val >= 1233.0

            assert val == "1234.5"
            assert val != " 1234.5"
            assert val != "1234.50"
            assert val != "1234.5 "
            assert val != "1235"

            with pytest.raises(TypeError, match="'<' not supported"):
                val < "1235"

            with pytest.raises(TypeError, match="'<=' not supported"):
                val <= "1235"

            with pytest.raises(TypeError, match="'>' not supported"):
                val > "1233"

            with pytest.raises(TypeError, match="'>=' not supported"):
                val >= "1233"

    def test_hash(self):
        """Test hash(DSfloat)"""
        assert hash(DSfloat(1.2345)) == hash(1.2345)
        assert hash(DSfloat('1.2345')) == hash(1.2345)


class TestDSdecimal:
    @pytest.fixture
    def allow_ds_float(self):
        old_value = config.allow_DS_float
        config.allow_DS_float = True
        yield
        config.allow_DS_float = old_value

    """Unit tests for pickling DSdecimal"""
    def test_pickling(self):
        # Check that a pickled DSdecimal is read back properly
        # DSdecimal actually prefers original_string when
        # reading back
        x = DSdecimal(19)
        x.original_string = "19"
        data1_string = pickle.dumps(x)
        x2 = pickle.loads(data1_string)
        assert x.real == x2.real
        assert x.original_string == x2.original_string

    def test_float_value(self, allow_ds_float):
        assert 9 == DSdecimal(9.0)
        config.allow_DS_float = False
        msg = "cannot be instantiated with a float value"
        with pytest.raises(TypeError, match=msg):
            DSdecimal(9.0)

    def test_new_empty(self):
        """Test passing an empty value."""
        assert DSdecimal('') == ''
        assert DSdecimal('  ') == '  '
        assert DSdecimal(None) is None

    def test_str_value(self):
        """Test creating using str"""
        # Not equal because float(1.2) != Decimal('1.2')
        assert DSdecimal('1.20') != 1.2
        assert DSdecimal('1.20') != 1.20
        # Decimal(1.2) is different to Decimal('1.2')
        assert DSdecimal('1.20') == Decimal('1.2')
        assert DSdecimal('1.20') == Decimal('1.20')
        assert DSdecimal('1.20 ') == Decimal('1.2')
        assert DSdecimal('1.20 ') == Decimal('1.20')
        assert DSdecimal('1.20') != '1.2'
        assert DSdecimal('1.20') == '1.20'
        assert DSdecimal('1.20 ') == '1.20'

    def test_DSfloat(self):
        """Test creating a value using DSfloat."""
        x = DSdecimal('1.2345')
        y = DSdecimal(x)
        assert x == y
        assert y == x
        assert Decimal("1.2345") == y
        assert "1.2345" == y.original_string

    def test_DSdecimal(self, allow_ds_float):
        """Test creating a value using DSdecimal."""
        x = DSfloat('1.2345')
        y = DSdecimal(x)
        assert Decimal(1.2345) == y
        assert "1.2345" == y.original_string

    def test_repr(self):
        """Test repr(DSdecimal)."""
        x = DSdecimal('1.2345')
        assert repr(x) == repr('1.2345')

    def test_string_too_long(self):
        msg = ("Values for elements with a VR of 'DS' values must be <= 16 "
               "characters long. Use a smaller string, *")
        with pytest.warns(UserWarning, match=msg):
            x = DSdecimal(Decimal(math.pi), auto_format=False)

    def test_string_too_long_raises(self, enforce_valid_values):
        msg = ("Values for elements with a VR of 'DS' values must be <= 16 "
               "characters long. Use a smaller string, *")
        with pytest.raises(OverflowError, match=msg):
            x = DSdecimal(Decimal(math.pi), auto_format=False)

    def test_auto_format(self, enforce_valid_both_fixture):
        """Test truncating decimal"""
        x = DSdecimal(Decimal(math.pi), auto_format=True)

        # Decimal representation should be unaltered by truncation
        assert x == Decimal(math.pi)
        # String representations should be correctly formatted
        assert str(x) == '3.14159265358979'
        assert repr(x) == repr("3.14159265358979")

    def test_auto_format_from_invalid_DS(self, allow_ds_float,
                                         disable_value_validation):
        """Test truncating floats"""
        # A DSdecimal that has a non-valid string representation
        x = DSdecimal(math.pi)

        # Use this to initialise another with auto_format set to true
        y = DSdecimal(x, auto_format=True)

        # Float representation should be unaltered by truncation
        assert y == math.pi
        # String representations should be correctly formatted
        assert str(y) == '3.14159265358979'
        assert repr(y) == repr("3.14159265358979")

    def test_auto_format_invalid_string(self, enforce_valid_both_fixture):
        """If the user supplies an invalid string, this should be formatted."""
        x = DSdecimal('3.141592653589793', auto_format=True)

        # Decimal representation should be unaltered by truncation
        assert x == Decimal('3.141592653589793')
        # String representations should be correctly formatted
        assert str(x) == '3.14159265358979'
        assert repr(x) == repr("3.14159265358979")

    @pytest.mark.parametrize(
        'val',
        [
            'NaN', '-NaN', 'Infinity', '-Infinity', Decimal('NaN'),
            Decimal('-NaN'), Decimal('-Infinity'), Decimal('Infinity')
        ]
    )
    def test_enforce_valid_values_value(
        self, val: Union[Decimal, str]
    ):
        """Test that errors are raised when value is invalid."""
        with pytest.raises(ValueError):
            valuerep.DSdecimal(val,
                               validation_mode=config.RAISE)

    def test_auto_format_valid_string(self, enforce_valid_both_fixture):
        """If the user supplies a valid string, this should not be altered."""
        x = DSdecimal('1.234e-1', auto_format=True)

        # Decimal representation should be correct
        assert x == Decimal('1.234e-1')
        # String representations should be unaltered
        assert str(x) == '1.234e-1'
        assert repr(x) == repr("1.234e-1")

    def test_DSdecimal_auto_format(self, allow_ds_float):
        """Test creating a value using DSdecimal copies auto_format"""
        x = DSdecimal(math.pi, auto_format=True)
        y = DSdecimal(x)
        assert x == y
        assert y == x
        assert y.auto_format
        assert math.pi == y
        assert str(y) == '3.14159265358979'
        assert repr(y) == repr("3.14159265358979")

    def test_comparison_operators(self, allow_ds_float):
        """Tests for the comparison operators"""
        decimal_decimal = DSdecimal(Decimal(1234.5))
        for val in (DSdecimal("1234.5"), DSdecimal(1234.5), decimal_decimal):
            assert val == Decimal(1234.5)
            assert val != Decimal(1235)
            assert val < Decimal(1235)
            assert val <= Decimal(1235)
            assert val > Decimal(1233)
            assert val >= Decimal(1233)

            assert val == 1234.5
            assert val != 1235.0
            assert val < 1235.0
            assert val <= 1235.0
            assert val > 1233.0
            assert val >= 1233.0

            assert val == "1234.5"
            assert val != " 1234.5"
            assert val != "1234.50"
            assert val != "1234.5 "
            assert val != "1235"

            with pytest.raises(TypeError, match="'<' not supported"):
                val < "1235"

            with pytest.raises(TypeError, match="'<=' not supported"):
                val <= "1235"

            with pytest.raises(TypeError, match="'>' not supported"):
                val > "1233"

            with pytest.raises(TypeError, match="'>=' not supported"):
                val >= "1233"

    def test_hash(self, allow_ds_float, disable_value_validation):
        """Test hash(DSdecimal)"""
        assert hash(DSdecimal(1.2345)) == hash(Decimal(1.2345))
        assert hash(DSdecimal('1.2345')) == hash(Decimal('1.2345'))


class TestIS:
    """Unit tests for IS"""
    def test_empty_value(self):
        assert IS(None) is None
        assert IS("") == ""
        assert IS("  ") == "  "

    def test_str_value(self):
        """Test creating using str"""
        assert IS('1') == 1
        assert IS('1 ') == 1
        assert IS(' 1 ') == 1

    def test_valid_value(self, disable_value_validation):
        assert 42 == IS(42)
        assert 42 == IS("42")
        assert 42 == IS("42.0")
        assert 42 == IS(42.0)

    def test_invalid_value(self, disable_value_validation):
        with pytest.raises(TypeError, match="Could not convert value"):
            IS(0.9)
        with pytest.raises(TypeError, match="Could not convert value"):
            IS("0.9")
        with pytest.raises(ValueError, match="could not convert string"):
            IS("foo")

    def test_pickling(self):
        # Check that a pickled IS is read back properly
        x = IS(921)
        x.original_string = "hello"
        data1_string = pickle.dumps(x)
        x2 = pickle.loads(data1_string)
        assert x.real == x2.real
        assert x.original_string == x2.original_string

    def test_longint(self, allow_reading_invalid_values):
        # Check that a long int is read properly
        # Will not work with enforce_valid_values
        x = IS(3103050000)
        data1_string = pickle.dumps(x)
        x2 = pickle.loads(data1_string)
        assert x.real == x2.real

    def test_overflow(self):
        msg = (
            r"Elements with a VR of IS must have a value between -2\*\*31 "
            r"and \(2\*\*31 - 1\). Set "
            r"'config.settings.reading_validation_mode' to 'WARN' "
            r"to override the value check"
        )
        with pytest.raises(OverflowError, match=msg):
            IS(3103050000, validation_mode=config.RAISE)

    def test_str(self, disable_value_validation):
        """Test IS.__str__()."""
        val = IS(1)
        assert str(val) == '1'

        val = IS("1")
        assert str(val) == '1'

        val = IS("1.0")
        assert str(val) == '1.0'

    def test_repr(self, disable_value_validation):
        """Test IS.__repr__()."""
        val = IS(1)
        assert repr(val) == repr('1')

        val = IS("1")
        assert repr(val) == repr('1')
        assert repr(val) == repr("1")

        val = IS("1.0")
        assert str(val) == '1.0'

    def test_comparison_operators(self):
        """Tests for the comparison operators"""
        for val in (IS("1234"), IS(1234), IS(1234.0)):
            assert val == 1234
            assert val != 1235
            assert val < 1235
            assert val <= 1235
            assert val > 1233
            assert val >= 1233

            assert val == 1234.0
            assert val != 1235.0
            assert val < 1235.0
            assert val <= 1235.0
            assert val > 1233.0
            assert val >= 1233.0

            assert val == "1234"
            assert val != "1234.0"
            assert val != "1235"
            assert val != "1234 "
            assert val != " 1234"

            with pytest.raises(TypeError, match="'<' not supported"):
                val < "1235"

            with pytest.raises(TypeError, match="'<=' not supported"):
                val <= "1235"

            with pytest.raises(TypeError, match="'>' not supported"):
                val > "1233"

            with pytest.raises(TypeError, match="'>=' not supported"):
                val >= "1233"

    def test_hash(self):
        """Test hash(IS)"""
        assert hash(IS(1)) == hash(1)
        assert hash(IS('1')) == hash(1)


class TestBadValueRead:
    """Unit tests for handling a bad value for a VR
       (a string in a number VR here)"""
    def setup(self):
        class TagLike:
            pass

        self.tag = TagLike()
        self.tag.value = b"1A"
        self.tag.is_little_endian = True
        self.tag.is_implicit_VR = False
        self.tag.tag = Tag(0x0010, 0x0020)
        self.tag.length = 2
        self.default_retry_order = pydicom.values.convert_retry_VR_order

    def teardown(self):
        pydicom.values.convert_retry_VR_order = self.default_retry_order

    def test_read_bad_value_in_VR_default(self, disable_value_validation):
        # found a conversion
        assert "1A" == convert_value("SH", self.tag)
        # converted with fallback vr "SH"
        assert "1A" == convert_value("IS", self.tag)

        pydicom.values.convert_retry_VR_order = ["FL", "UL"]
        # no fallback VR succeeded, returned original value untranslated
        assert b"1A" == convert_value("IS", self.tag)

    def test_read_bad_value_in_VR_enforce_valid_value(
            self, enforce_valid_values):
        # found a conversion
        assert "1A" == convert_value("SH", self.tag)
        # invalid literal for base 10
        with pytest.raises(ValueError):
            convert_value("IS", self.tag)


class TestDecimalString:
    """Unit tests unique to the use of DS class
       derived from python Decimal"""
    @pytest.fixture(autouse=True)
    def ds_decimal(self):
        original = config.use_DS_decimal
        config.DS_decimal(True)
        yield
        config.DS_decimal(original)

    def test_DS_decimal_set(self):
        config.use_DS_decimal = False
        config.DS_decimal(True)
        assert config.use_DS_decimal is True

    def test_valid_decimal_strings(self):
        # Ensures that decimal.Decimal doesn't cause a valid string to become
        # invalid
        valid_str = "-9.81338674e-006"
        ds = valuerep.DS(valid_str)
        assert isinstance(ds, valuerep.DSdecimal)
        assert len(str(ds)) <= 16

    def test_invalid_decimal_strings(self):
        # Now the input string truly is invalid
        invalid_string = "-9.813386743e-006"
        with pytest.raises(ValueError):
            valuerep.DS(invalid_string, validation_mode=config.RAISE)


class TestPersonName:
    def test_last_first(self):
        """PN: Simple Family-name^Given-name works..."""
        pn = PersonName("Family^Given")
        assert "Family" == pn.family_name
        assert "Given" == pn.given_name
        assert "" == pn.name_suffix
        assert "" == pn.phonetic

    def test_copy(self):
        """PN: Copy and deepcopy works..."""
        pn = PersonName(
            "Hong^Gildong="
            "\033$)C\373\363^\033$)C\321\316\324\327="
            "\033$)C\310\253^\033$)C\261\346\265\277",
            [default_encoding, "euc_kr"],
        )
        pn_copy = copy.copy(pn)
        assert pn == pn_copy
        assert pn.components == pn_copy.components
        # the copied object references the original components
        assert pn_copy.components is pn.components
        assert pn.encodings == pn_copy.encodings

        pn_copy = copy.deepcopy(pn)
        assert pn == pn_copy
        assert pn.components == pn_copy.components
        # deepcopy() returns the same immutable objects (tuples)
        assert pn_copy.components is pn.components
        assert pn.encodings is pn_copy.encodings

    def test_three_component(self):
        """PN: 3component (single-byte, ideographic,
        phonetic characters) works..."""
        # Example name from PS3.5-2008 section I.2 p. 108
        pn = PersonName(
            "Hong^Gildong="
            "\033$)C\373\363^\033$)C\321\316\324\327="
            "\033$)C\310\253^\033$)C\261\346\265\277"
        )
        assert ("Hong", "Gildong") == (pn.family_name, pn.given_name)

    def test_formatting(self):
        """PN: Formatting works..."""
        pn = PersonName("Family^Given")
        assert pn.family_comma_given() == "Family, Given"
        s = pn.formatted('%(family_name)s, %(given_name)s')
        assert s == "Family, Given"

    def test_unicode_kr(self):
        """PN: 3component in unicode works (Korean)..."""
        # Example name from PS3.5-2008 section I.2 p. 101
        pn = PersonName(
            b"Hong^Gildong="
            b"\033$)C\373\363^\033$)C\321\316\324\327="
            b"\033$)C\310\253^\033$)C\261\346\265\277",
            [default_encoding, "euc_kr"],
        )

        # PersonName does not decode the components automatically
        pn = pn.decode()
        assert ("Hong", "Gildong") == (pn.family_name, pn.given_name)
        assert "洪^吉洞" == pn.ideographic
        assert "홍^길동" == pn.phonetic

    def test_unicode_jp_from_bytes(self):
        """PN: 3component in unicode works (Japanese)..."""
        # Example name from PS3.5-2008 section H  p. 98
        pn = PersonName(
            b"Yamada^Tarou="
            b"\033$B;3ED\033(B^\033$BB@O:\033(B="
            b"\033$B$d$^$@\033(B^\033$B$?$m$&\033(B",
            [default_encoding, "iso2022_jp"],
        )
        pn = pn.decode()
        assert ("Yamada", "Tarou") == (pn.family_name, pn.given_name)
        assert "山田^太郎" == pn.ideographic
        assert "やまだ^たろう" == pn.phonetic

    def test_unicode_jp_from_bytes_comp_delimiter(self):
        """The example encoding without the escape sequence before '='"""
        pn = PersonName(
            b"Yamada^Tarou="
            b"\033$B;3ED\033(B^\033$BB@O:="
            b"\033$B$d$^$@\033(B^\033$B$?$m$&\033(B",
            [default_encoding, "iso2022_jp"],
        )
        pn = pn.decode()
        assert ("Yamada", "Tarou") == (pn.family_name, pn.given_name)
        assert "山田^太郎" == pn.ideographic
        assert "やまだ^たろう" == pn.phonetic

    def test_unicode_jp_from_bytes_caret_delimiter(self):
        """PN: 3component in unicode works (Japanese)..."""
        # Example name from PS3.5-2008 section H  p. 98
        pn = PersonName(
            b"Yamada^Tarou="
            b"\033$B;3ED\033(B^\033$BB@O:\033(B="
            b"\033$B$d$^$@\033(B^\033$B$?$m$&\033(B",
            [default_encoding, "iso2022_jp"],
        )
        pn = pn.decode()
        assert ("Yamada", "Tarou") == (pn.family_name, pn.given_name)
        assert "山田^太郎" == pn.ideographic
        assert "やまだ^たろう" == pn.phonetic

    def test_unicode_jp_from_unicode(self):
        """A person name initialized from unicode is already decoded"""
        pn = PersonName(
            "Yamada^Tarou=山田^太郎=やまだ^たろう", [default_encoding, "iso2022_jp"]
        )
        assert ("Yamada", "Tarou") == (pn.family_name, pn.given_name)
        assert "山田^太郎" == pn.ideographic
        assert "やまだ^たろう" == pn.phonetic

    def test_not_equal(self):
        """PN3: Not equal works correctly (issue 121)..."""
        # Meant to only be used in python 3 but doing simple check here
        from pydicom.valuerep import PersonName

        pn = PersonName("John^Doe")
        assert not pn != "John^Doe"

    def test_encoding_carried(self):
        """Test encoding is carried over to a new PN3 object"""
        # Issue 466
        from pydicom.valuerep import PersonName

        pn = PersonName("John^Doe", encodings="iso_ir_126")
        assert pn.encodings == ("iso_ir_126",)
        pn2 = PersonName(pn)
        assert pn2.encodings == ("iso_ir_126",)

    def test_hash(self):
        """Test that the same name creates the same hash."""
        # Regression test for #785
        pn1 = PersonName("John^Doe^^Dr", encodings=default_encoding)
        pn2 = PersonName("John^Doe^^Dr", encodings=default_encoding)
        assert hash(pn1) == hash(pn2)
        pn3 = PersonName("John^Doe", encodings=default_encoding)
        assert hash(pn1) != hash(pn3)

        pn1 = PersonName(
            "Yamada^Tarou=山田^太郎=やまだ^たろう", [default_encoding, "iso2022_jp"]
        )
        pn2 = PersonName(
            "Yamada^Tarou=山田^太郎=やまだ^たろう", [default_encoding, "iso2022_jp"]
        )
        assert hash(pn1) == hash(pn2)

    def test_next(self):
        """Test that the next function works on it's own"""
        # Test getting the first character
        pn1 = PersonName("John^Doe^^Dr", encodings=default_encoding)
        pn1_itr = iter(pn1)
        assert next(pn1_itr) == "J"

        # Test getting multiple characters
        pn2 = PersonName(
            "Yamada^Tarou=山田^太郎=やまだ^たろう", [default_encoding, "iso2022_jp"]
        )
        pn2_itr = iter(pn2)
        assert next(pn2_itr) == "Y"
        assert next(pn2_itr) == "a"

        # Test getting all characters
        pn3 = PersonName("SomeName")
        pn3_itr = iter(pn3)
        assert next(pn3_itr) == "S"
        assert next(pn3_itr) == "o"
        assert next(pn3_itr) == "m"
        assert next(pn3_itr) == "e"
        assert next(pn3_itr) == "N"
        assert next(pn3_itr) == "a"
        assert next(pn3_itr) == "m"
        assert next(pn3_itr) == "e"

        # Attempting to get next character should stop the iteration
        # I.e. next can only start once
        with pytest.raises(StopIteration):
            next(pn3_itr)

        # Test that next() doesn't work without instantiating an iterator
        pn4 = PersonName("SomeName")
        msg = r"'PersonName' object is not an iterator"
        with pytest.raises(TypeError, match=msg):
            next(pn4)

    def test_iterator(self):
        """Test that iterators can be correctly constructed"""
        name_str = "John^Doe^^Dr"
        pn1 = PersonName(name_str)

        for i, c in enumerate(pn1):
            assert name_str[i] == c

        # Ensure that multiple iterators can be created on the same variable
        for i, c in enumerate(pn1):
            assert name_str[i] == c

        for s in iter(PersonName(name_str)):
            pass

    def test_contains(self):
        """Test that characters can be check if they are within the name"""
        pn1 = PersonName("John^Doe")
        assert "J" in pn1
        assert "o" in pn1
        assert "x" not in pn1
        assert "^" in pn1

    def test_length(self):
        """Test len(PN)"""
        pn1 = PersonName("John^Doe")
        assert len(pn1) == 8

        # "Hong^Gildong=洪^吉洞=홍^길동"
        pn = PersonName.from_named_components(
            family_name='Hong',
            given_name='Gildong',
            family_name_ideographic=b'\033$)C\373\363',
            given_name_ideographic=b'\033$)C\321\316\324\327',
            family_name_phonetic=b'\033$)C\310\253',
            given_name_phonetic=b'\033$)C\261\346\265\277',
            encodings=[default_encoding, 'euc_kr'],
        )
        pn = pn.decode()
        assert len(pn) == 12 + 1 + 4 + 1 + 4

    def test_from_named_components(self):
        # Example from DICOM standard, part 5, sect 6.2.1.1
        pn = PersonName.from_named_components(
            family_name='Adams',
            given_name='John Robert Quincy',
            name_prefix='Rev.',
            name_suffix='B.A. M.Div.'
        )
        assert pn == 'Adams^John Robert Quincy^^Rev.^B.A. M.Div.'
        assert pn.family_name == 'Adams'
        assert pn.given_name == 'John Robert Quincy'
        assert pn.name_prefix == 'Rev.'
        assert pn.name_suffix == 'B.A. M.Div.'

    def test_from_named_components_kr_from_bytes(self):
        # Example name from PS3.5-2008 section I.2 p. 108
        pn = PersonName.from_named_components(
            family_name='Hong',
            given_name='Gildong',
            family_name_ideographic=b'\033$)C\373\363',
            given_name_ideographic=b'\033$)C\321\316\324\327',
            family_name_phonetic=b'\033$)C\310\253',
            given_name_phonetic=b'\033$)C\261\346\265\277',
            encodings=[default_encoding, 'euc_kr'],
        )
        pn = pn.decode()
        assert ("Hong", "Gildong") == (pn.family_name, pn.given_name)
        assert "洪^吉洞" == pn.ideographic
        assert "홍^길동" == pn.phonetic

    def test_from_named_components_kr_from_unicode(self):
        # Example name from PS3.5-2008 section I.2 p. 108
        pn = PersonName.from_named_components(
            family_name='Hong',
            given_name='Gildong',
            family_name_ideographic='洪',
            given_name_ideographic='吉洞',
            family_name_phonetic='홍',
            given_name_phonetic='길동',
            encodings=[default_encoding, 'euc_kr'],
        )
        pn = pn.decode()
        assert ("Hong", "Gildong") == (pn.family_name, pn.given_name)
        assert "洪^吉洞" == pn.ideographic
        assert "홍^길동" == pn.phonetic

    def test_from_named_components_jp_from_bytes(self):
        # Example name from PS3.5-2008 section H  p. 98
        pn = PersonName.from_named_components(
            family_name='Yamada',
            given_name='Tarou',
            family_name_ideographic=b'\033$B;3ED\033(B',
            given_name_ideographic=b'\033$BB@O:\033(B',
            family_name_phonetic=b'\033$B$d$^$@\033(B',
            given_name_phonetic=b'\033$B$?$m$&\033(B',
            encodings=[default_encoding, 'iso2022_jp'],
        )
        pn = pn.decode()
        assert ("Yamada", "Tarou") == (pn.family_name, pn.given_name)
        assert "山田^太郎" == pn.ideographic
        assert "やまだ^たろう" == pn.phonetic

    def test_from_named_components_jp_from_unicode(self):
        # Example name from PS3.5-2008 section H  p. 98
        pn = PersonName.from_named_components(
            family_name='Yamada',
            given_name='Tarou',
            family_name_ideographic='山田',
            given_name_ideographic='太郎',
            family_name_phonetic='やまだ',
            given_name_phonetic='たろう',
            encodings=[default_encoding, 'iso2022_jp'],
        )
        pn = pn.decode()
        assert ("Yamada", "Tarou") == (pn.family_name, pn.given_name)
        assert "山田^太郎" == pn.ideographic
        assert "やまだ^たろう" == pn.phonetic

    def test_from_named_components_veterinary(self):
        # Example from DICOM standard, part 5, sect 6.2.1.1
        # A horse whose responsible organization is named ABC Farms, and whose
        # name is "Running On Water"
        pn = PersonName.from_named_components_veterinary(
            responsible_party_name='ABC Farms',
            patient_name='Running on Water',
        )
        assert pn == 'ABC Farms^Running on Water'
        assert pn.family_name == 'ABC Farms'
        assert pn.given_name == 'Running on Water'

    def test_from_named_components_with_separator(self):
        # If the names already include separator chars
        # a ValueError should be raised
        with pytest.raises(ValueError):
            PersonName.from_named_components(given_name='Yamada^Tarou')

    def test_from_named_components_with_separator_from_bytes(self):
        # If the names already include separator chars
        # a ValueError should be raised
        with pytest.raises(ValueError):
            PersonName.from_named_components(
                family_name_ideographic=b'\033$B;3ED\033(B^\033$BB@O:\033(B',
                encodings=[default_encoding, 'iso2022_jp'],
            )


class TestDateTime:
    """Unit tests for DA, DT, TM conversion to datetime objects"""
    def setup(self):
        config.datetime_conversion = True

    def teardown(self):
        config.datetime_conversion = False

    def test_date(self):
        """DA conversion to datetime.date ..."""
        dicom_date = "19610804"
        da = valuerep.DA(dicom_date)
        # Assert `da` equals to correct `date`
        assert date(1961, 8, 4) == da
        # Assert `da.__repr__` holds original string
        assert '"{0}"'.format(dicom_date) == repr(da)

        dicom_date = "1961.08.04"  # ACR-NEMA Standard 300
        da = valuerep.DA(dicom_date)
        # Assert `da` equals to correct `date`
        assert date(1961, 8, 4) == da
        # Assert `da.__repr__` holds original string
        assert '"{0}"'.format(dicom_date) == repr(da)

        dicom_date = ""
        da = valuerep.DA(dicom_date)
        # Assert `da` equals to no date
        assert da is None

    def test_date_time(self):
        """DT conversion to datetime.datetime ..."""
        dicom_datetime = "1961"
        dt = valuerep.DT(dicom_datetime)
        # Assert `dt` equals to correct `datetime`
        assert datetime(1961, 1, 1) == dt
        # Assert `dt.__repr__` holds original string
        assert '"{0}"'.format(dicom_datetime) == repr(dt)

        dicom_datetime = "19610804"
        dt = valuerep.DT(dicom_datetime)
        # Assert `dt` equals to correct `datetime`
        assert datetime(1961, 8, 4) == dt
        # Assert `dt.__repr__` holds original string
        assert '"{0}"'.format(dicom_datetime) == repr(dt)

        dicom_datetime = "19610804192430.123"
        dt = valuerep.DT(dicom_datetime)
        # Assert `dt` equals to correct `datetime`
        assert datetime(1961, 8, 4, 19, 24, 30, 123000) == dt
        # Assert `dt.__repr__` holds original string
        assert '"{0}"'.format(dicom_datetime) == repr(dt)

        dicom_datetime = "196108041924-1000"
        dt = valuerep.DT(dicom_datetime)
        # Assert `dt` equals to correct `datetime`
        datetime_datetime = datetime(
            1961, 8, 4, 19, 24, 0, 0, timezone(timedelta(seconds=-10 * 3600))
        )
        assert datetime_datetime == dt
        assert timedelta(0, 0, 0, 0, 0, -10) == dt.utcoffset()

        # Assert `dt.__repr__` holds original string
        assert '"{0}"'.format(dicom_datetime) == repr(dt)

    def test_time(self):
        """TM conversion to datetime.time..."""
        dicom_time = "2359"
        tm = valuerep.TM(dicom_time)
        # Assert `tm` equals to correct `time`
        assert time(23, 59) == tm
        # Assert `tm.__repr__` holds original string
        assert '"{0}"'.format(dicom_time) == repr(tm)

        dicom_time = "235900.123"
        tm = valuerep.TM(dicom_time)
        # Assert `tm` equals to correct `time`
        assert time(23, 59, 00, 123000) == tm
        # Assert `tm.__repr__` holds original string
        assert '"{0}"'.format(dicom_time) == repr(tm)

        # Assert `tm` equals to no `time`
        tm = valuerep.TM("")
        assert tm is None


def test_person_name_unicode_warns():
    """Test deprecation warning for PersonNameUnicode."""
    if sys.version_info[:2] < (3, 7):
        from pydicom.valuerep import PersonNameUnicode

    else:
        msg = (
            r"'PersonNameUnicode' is deprecated and will be removed in "
            r"pydicom v3.0, use 'PersonName' instead"
        )
        with pytest.warns(DeprecationWarning, match=msg):
            from pydicom.valuerep import PersonNameUnicode

    assert PersonNameUnicode == PersonName


VALUE_REFERENCE = [
    # (VR, Python setter type, (VM 0 values), (VM >= 1 values), keyword)
    ("AE", str, (None, ""), ("foo", "bar"), 'Receiver'),
    ("AS", str, (None, ""), ("foo", "bar"), 'PatientAge'),
    ("AT", int, (None, ), (0, 2**32 - 1), 'OffendingElement'),
    ("CS", str, (None, ""), ("foo", "bar"), 'QualityControlSubject'),
    ("DA", str, (None, ""), ("20010203", "20020304"), 'PatientBirthDate'),
    ("DS", str, (None, ""), ("-1.5", "3.2"), 'PatientWeight'),
    ("DS", int, (None, ""), (-1, 3), 'PatientWeight'),
    ("DS", float, (None, ""), (-1.5, 3.2), 'PatientWeight'),
    ("DT", str, (None, ""), ("20010203040506", "2000"), 'AcquisitionDateTime'),
    ("FD", float, (None, ), (-1.5, 3.2), 'RealWorldValueLUTData'),
    ("FL", float, (None, ), (-1.5, 3.2), 'VectorAccuracy'),
    ("IS", str, (None, ""), ("0", "25"), 'BeamNumber'),
    ("IS", int, (None, ""), (0, 25), 'BeamNumber'),
    ("IS", float, (None, ""), (0.0, 25.0), 'BeamNumber'),
    ("LO", str, (None, ""), ("foo", "bar"), 'DataSetSubtype'),
    ("LT", str, (None, ""), ("foo", "bar"), 'ExtendedCodeMeaning'),
    ("OB", bytes, (None, b""), (b"\x00\x01", ), 'FillPattern'),
    ("OD", bytes, (None, b""), (b"\x00\x01", ), 'DoubleFloatPixelData'),
    ("OF", bytes, (None, b""), (b"\x00\x01", ), 'UValueData'),
    ("OL", bytes, (None, b""), (b"\x00\x01", ), 'TrackPointIndexList'),
    ("OV", bytes, (None, b""), (b"\x00\x01", ), 'SelectorOVValue'),
    ("OW", bytes, (None, b""), (b"\x00\x01", ), 'TrianglePointIndexList'),
    ("PN", str, (None, ""), ("foo", "bar"), 'PatientName'),
    ("SH", str, (None, ""), ("foo", "bar"), 'CodeValue'),
    ("SL", int, (None, ), (-2**31, 2**31 - 1), 'RationalNumeratorValue'),
    ("SQ", list, ([], ), (Dataset(), Dataset()), 'BeamSequence'),
    ("SS", int, (None, ), (-2**15, 2**15 - 1), 'SelectorSSValue'),
    ("ST", str, (None, ""), ("foo", "bar"), 'InstitutionAddress'),
    ("SV", int, (None, ), (-2**63, 2**63 - 1), 'SelectorSVValue'),
    ("TM", str, (None, ""), ("123456", "000000"), 'StudyTime'),
    ("UC", str, (None, ""), ("foo", "bar"), 'LongCodeValue'),
    ("UI", str, (None, ""), ("foo", "bar"), 'SOPClassUID'),
    ("UL", int, (None, ), (0, 2**32 - 1), 'SimpleFrameList'),
    ("UN", bytes, (None, b""), (b"\x00\x01", ), 'SelectorUNValue'),
    ("UR", str, (None, ""), ("foo", "bar"), 'CodingSchemeURL'),
    ("US", int, (None, ), (0, 2**16 - 1), 'SourceAcquisitionBeamNumber'),
    ("UT", str, (None, ""), ("foo", "bar"), 'StrainAdditionalInformation'),
    ("UV", int, (None, ), (0, 2**64 - 1), 'SelectorUVValue')
]


@pytest.mark.parametrize("vr, pytype, vm0, vmN, keyword", VALUE_REFERENCE)
def test_set_value(vr, pytype, vm0, vmN, keyword, disable_value_validation):
    """Test that element values are set consistently"""
    # Test VM = 0
    ds = Dataset()
    for value in vm0:
        setattr(ds, keyword, value)
        elem = ds[keyword]
        assert elem.VR == vr
        assert elem.value == value
        assert value == elem.value

    # Test VM = 1
    if vr != 'SQ':
        ds = Dataset()
        value = vmN[0]
        setattr(ds, keyword, value)
        elem = ds[keyword]
        assert elem.value == value
        assert value == elem.value

    # Test VM = 1 as list
    ds = Dataset()
    value = vmN[0]
    setattr(ds, keyword, [value])
    elem = ds[keyword]
    if vr == 'SQ':
        assert elem.value[0] == value
        assert value == elem.value[0]
    else:
        assert elem.value == value
        assert value == elem.value

    if vr[0] == 'O' or vr == 'UN':
        return

    # Test VM > 1
    ds = Dataset()
    value = vmN[0]
    setattr(ds, keyword, list(vmN))
    elem = ds[keyword]
    assert elem.value == list(vmN)
    assert list(vmN) == elem.value


@pytest.mark.parametrize("vr, pytype, vm0, vmN, keyword", VALUE_REFERENCE)
def test_assigning_bytes(vr, pytype, vm0, vmN, keyword):
    """Test that byte VRs are excluded from the backslash check."""
    if pytype == bytes:
        ds = Dataset()
        value = b"\x00\x01" + b"\\" + b"\x02\x03"
        setattr(ds, keyword, value)
        elem = ds[keyword]
        assert elem.VR == vr
        assert elem.value == value
        assert elem.VM == 1


class TestVR:
    def test_behavior(self):
        """Test that VR class behaves as expected"""
        assert isinstance(VR.AE, str)
        assert VR.AE == "AE"
        assert VR.US_SS_OW == "US or SS or OW"

    def test_all_present(self):
        """Test all VRs are configured"""
        elem = chain(DicomDictionary.values(), RepeatersDictionary.values())
        ref = {v[0] for v in elem} - {"NONE"}
        assert ref == STANDARD_VR | AMBIGUOUS_VR
        # Test all have Python built-in
        assert STANDARD_VR == BYTES_VR | FLOAT_VR | INT_VR | LIST_VR | STR_VR
