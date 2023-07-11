# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Many point of entry for pydicom read and write functions"""
import warnings

with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    from pydicom.filereader import read_file, read_dicomdir
    from pydicom.filewriter import write_file

from pydicom.filereader import dcmread
from pydicom.filewriter import dcmwrite
