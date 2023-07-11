# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""pydicom package -- easily handle DICOM files.
   See Quick Start below.

-----------
Quick Start
-----------

1. A simple program to read a dicom file, modify a value, and write to a new
   file::

    from pydicom.filereader import dcmread
    dataset = dcmread("file1.dcm")
    dataset.PatientName = 'anonymous'
    dataset.save_as("file2.dcm")

2. See the files in the examples directory that came with this package for more
   examples, including some interactive sessions.

3. Learn the methods of the Dataset class; that is the one you will work with
   most directly.

4. Questions and comments can be directed to the pydicom google group:
   http://groups.google.com/group/pydicom

5. Bugs and other issues can be reported in the issue tracker:
   https://www.github.com/pydicom/pydicom

"""
import warnings

from pydicom.dataelem import DataElement
from pydicom.dataset import Dataset, FileDataset
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    from pydicom.filereader import read_file
    from pydicom.filewriter import write_file

from pydicom.filereader import dcmread
from pydicom.filewriter import dcmwrite
from pydicom.sequence import Sequence

from ._version import __version__, __version_info__, __dicom_version__

__all__ = ['DataElement',
           'Dataset',
           'FileDataset',
           'Sequence',
           'dcmread',
           'dcmwrite',
           'read_file',
           'write_file',
           '__version__',
           '__version_info__']
