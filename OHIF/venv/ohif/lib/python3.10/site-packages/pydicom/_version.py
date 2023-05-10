"""Pure python package for DICOM medical file reading and writing."""
import re
from typing import cast, Match


__version__: str = '2.3.1'

result = cast(Match[str], re.match(r'(\d+\.\d+\.\d+).*', __version__))
__version_info__ = tuple(result.group(1).split('.'))


# DICOM Standard version used for:
#   _dicom_dict.py, _uid_dict.py and uid.py
__dicom_version__: str = '2022a'
