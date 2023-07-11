# Copyright 2020 pydicom authors. See LICENSE file for details.
"""
Gather system information and version information for pydicom and auxiliary
modules.

The output is a GitHub-flavoured markdown table whose contents can help
diagnose any perceived bugs in pydicom. This can be pasted directly into a new
GitHub bug report.

This file is intended to be run as an executable module.
"""

import importlib
import platform
import sys
from types import ModuleType
from typing import Optional, Tuple, List, cast


def main() -> None:
    version_rows = [("platform", platform.platform()), ("Python", sys.version)]

    modules = (
        "pydicom", "gdcm", "jpeg_ls", "numpy", "PIL", "pylibjpeg",
        "openjpeg", "libjpeg",
    )
    for module in modules:
        try:
            m = importlib.import_module(module)
        except ImportError:
            version = "_module not found_"
        else:
            version = extract_version(m) or "**cannot determine version**"

        version_rows.append((module, version))

    print_table(version_rows)


def print_table(version_rows: List[Tuple[str, str]]) -> None:
    row_format = "{:12} | {}"
    print(row_format.format("module", "version"))
    print(row_format.format("------", "-------"))
    for module, version in version_rows:
        # Some version strings have multiple lines and need to be squashed
        print(row_format.format(module, version.replace("\n", " ")))


def extract_version(module: ModuleType) -> Optional[str]:
    if module.__name__ == "gdcm":
        return cast(Optional[str], getattr(module, "GDCM_VERSION", None))

    return cast(Optional[str], getattr(module, "__version__", None))


if __name__ == "__main__":
    main()
