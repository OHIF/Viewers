# -*- coding: utf-8 -*-
# Copyright 2008-2020 pydicom authors. See LICENSE file for details.
"""Fixtures used in different tests."""

import pytest
from pydicom import config


@pytest.fixture
def enforce_valid_values():
    value = config.settings.reading_validation_mode
    config.settings.reading_validation_mode = config.RAISE
    yield
    config.settings.reading_validation_mode = value


@pytest.fixture
def allow_reading_invalid_values():
    value = config.settings.reading_validation_mode
    config.settings.reading_validation_mode = config.WARN
    yield
    config.settings.reading_validation_mode = value


@pytest.fixture
def enforce_writing_invalid_values():
    value = config.settings.writing_validation_mode
    config.settings.writing_validation_mode = config.RAISE
    yield
    config.settings.writing_validation_mode = value


@pytest.fixture
def allow_writing_invalid_values():
    value = config.settings.writing_validation_mode
    config.settings.writing_validation_mode = config.WARN
    yield
    config.settings.writing_validation_mode = value


@pytest.fixture
def no_numpy_use():
    use_ds_numpy = config.use_DS_numpy
    use_is_numpy = config.use_IS_numpy
    config.use_DS_numpy = False
    config.use_IS_numpy = False
    yield
    config.use_DS_numpy = use_ds_numpy
    config.use_IS_numpy = use_is_numpy


@pytest.fixture
def no_datetime_conversion():
    datetime_conversion = config.datetime_conversion
    config.datetime_conversion = False
    yield
    config.datetime_conversion = datetime_conversion


@pytest.fixture
def dont_replace_un_with_known_vr():
    old_value = config.replace_un_with_known_vr
    config.replace_un_with_known_vr = False
    yield
    config.replace_un_with_known_vr = old_value


@pytest.fixture
def dont_replace_un_with_sq_vr():
    old_value = config.settings.infer_sq_for_un_vr
    config.settings.infer_sq_for_un_vr = False
    yield
    config.settings.infer_sq_for_un_vr = old_value


@pytest.fixture
def dont_raise_on_writing_invalid_value():
    old_value = config.settings.writing_validation_mode
    config.settings.writing_validation_mode = config.WARN
    yield
    config.settings.writing_validation_mode = old_value


@pytest.fixture
def raise_on_writing_invalid_value():
    old_value = config.settings.writing_validation_mode
    config.settings.writing_validation_mode = config.RAISE
    yield
    config.settings.writing_validation_mode = old_value


@pytest.fixture
def disable_value_validation():
    with config.disable_value_validation():
        yield
