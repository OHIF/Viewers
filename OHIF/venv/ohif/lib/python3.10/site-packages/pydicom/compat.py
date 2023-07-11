# Copyright 2008-2020 pydicom authors. See LICENSE file for details.
"""Compatibility functions for previous Python 2 support"""

# Python 2 only - warn and mark this as deprecated.
import warnings

from pydicom import config

if config._use_future:
    raise ImportError(
        "Pydicom Future Error: compat module will be removed in pydicom 3.0"
    )

warnings.warn(
    "Starting in pydicom 3.0, the compat module (used for Python 2)"
    " will be removed",
    DeprecationWarning
)

# Text types
text_type = str
string_types = (str, )
char_types = (str, bytes)
number_types = (int, )
int_type = int
