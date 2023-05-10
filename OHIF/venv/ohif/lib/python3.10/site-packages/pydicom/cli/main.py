# Copyright 2020 pydicom authors. See LICENSE file for details.
"""Pydicom command line interface program

Each subcommand is a module within pydicom.cli, which
defines an add_subparser(subparsers) function to set argparse
attributes, and calls set_defaults(func=callback_function)

"""

import argparse
import pkg_resources
import re
from typing import Tuple, cast, List, Any, Dict, Optional, Callable

from pydicom import dcmread
from pydicom.data.data_manager import get_testdata_file
from pydicom.dataset import Dataset


subparsers: Optional[argparse._SubParsersAction] = None


# Restrict the allowed syntax tightly, since use Python `eval`
# on the expression. Do not allow callables, or assignment, for example.
re_kywd_or_item = (
    r"\w+"  # Keyword (\w allows underscore, needed for file_meta)
    r"(\[(-)?\d+\])?"  # Optional [index] or [-index]
)

re_file_spec_object = re.compile(
    re_kywd_or_item + r"(\." + re_kywd_or_item + r")*$"
)

filespec_help = (
    "File specification, in format [pydicom::]filename[::element]. "
    "If `pydicom::` prefix is present, then use the pydicom "
    "test file with that name. If `element` is given, "
    "use only that data element within the file. "
    "Examples: "
    "path/to/your_file.dcm, "
    "your_file.dcm::StudyDate, "
    "pydicom::rtplan.dcm::BeamSequence[0], "
    "yourplan.dcm::BeamSequence[0].BeamNumber"
)


def eval_element(ds: Dataset, element: str) -> Any:
    try:
        return eval("ds." + element, {"ds": ds})
    except AttributeError:
        raise argparse.ArgumentTypeError(
            f"Data element '{element}' is not in the dataset"
        )
    except IndexError as e:
        raise argparse.ArgumentTypeError(
            f"'{element}' has an index error: {str(e)}"
        )


def filespec_parts(filespec: str) -> Tuple[str, str, str]:
    """Parse the filespec format into prefix, filename, element

    Format is [prefix::filename::element]

    Note that ':' can also exist in valid filename, e.g. r'c:\temp\test.dcm'
    """

    *prefix_file, last = filespec.split("::")

    if not prefix_file:  # then only the filename component
        return "", last, ""

    prefix = "pydicom" if prefix_file[0] == "pydicom" else ""
    if prefix:
        prefix_file.pop(0)

    # If list empty after pop above, then have pydicom::filename
    if not prefix_file:
        return prefix, last, ""

    return prefix, "".join(prefix_file), last


def filespec_parser(filespec: str) -> List[Tuple[Dataset, Any]]:
    """Utility to return a dataset and an optional data element value within it

    Note: this is used as an argparse 'type' for adding parsing arguments.

    Parameters
    ----------
    filespec: str
        A filename with optional `pydicom::` prefix and optional data element,
        in format:
            [pydicom::]<filename>[::<element>]
        If an element is specified, it must be a path to a data element,
        sequence item (dataset), or a sequence.
        Examples:
            your_file.dcm
            your_file.dcm::StudyDate
            pydicom::rtplan.dcm::BeamSequence[0]
            pydicom::rtplan.dcm::BeamSequence[0].BeamLimitingDeviceSequence

    Returns
    -------
    List[Tuple[Dataset, Any]]
        Matching pairs of (dataset, data element value)
        This usually is a single pair, but a list is returned for future
        ability to work across multiple files.

    Note
    ----
        This function is meant to be used in a call to an `argparse` libary's
        `add_argument` call for subparsers, with name="filespec" and
        `type=filespec_parser`. When used that way, the resulting args.filespec
        will contain the return values of this function
        (e.g. use `ds, element_val = args.filespec` after parsing arguments)
        See the `pydicom.cli.show` module for an example.

    Raises
    ------
    argparse.ArgumentTypeError
        If the filename does not exist in local path or in pydicom test files,
        or if the optional element is not a valid expression,
        or if the optional element is a valid expression but does not exist
        within the dataset
    """
    prefix, filename, element = filespec_parts(filespec)

    # Get the pydicom test filename even without prefix, in case user forgot it
    try:
        pydicom_filename = cast(str, get_testdata_file(filename))
    except NotImplementedError:  # will get this if absolute path passed
        pydicom_filename = ""

    if prefix == "pydicom":
        filename = pydicom_filename

    # Check element syntax first to avoid unnecessary load of file
    if element and not re_file_spec_object.match(element):
        raise argparse.ArgumentTypeError(
            f"Component '{element}' is not valid syntax for a "
            "data element, sequence, or sequence item"
        )

    # Read DICOM file
    try:
        ds = dcmread(filename, force=True)
    except FileNotFoundError:
        extra = (
            (f", \nbut 'pydicom::{filename}' test data file is available")
            if pydicom_filename
            else ""
        )
        raise argparse.ArgumentTypeError(f"File '{filename}' not found{extra}")
    except Exception as e:
        raise argparse.ArgumentTypeError(
            f"Error reading '{filename}': {str(e)}"
        )

    if not element:
        return [(ds, None)]

    data_elem_val = eval_element(ds, element)

    return [(ds, data_elem_val)]


def help_command(args: argparse.Namespace) -> None:
    if subparsers is None:
        print("No subcommands are available")
        return

    subcommands: List[str] = list(subparsers.choices.keys())
    if args.subcommand and args.subcommand in subcommands:
        subparsers.choices[args.subcommand].print_help()
    else:
        print("Use pydicom help [subcommand] to show help for a subcommand")
        subcommands.remove("help")
        print(f"Available subcommands: {', '.join(subcommands)}")


SubCommandType = Dict[str, Callable[[argparse._SubParsersAction], None]]


def get_subcommand_entry_points() -> SubCommandType:
    subcommands = {}
    for entry_point in pkg_resources.iter_entry_points("pydicom_subcommands"):
        subcommands[entry_point.name] = entry_point.load()

    return subcommands


def main(args: Optional[List[str]] = None) -> None:
    """Entry point for 'pydicom' command line interface

    Parameters
    ----------
    args : List[str], optional
        Command-line arguments to parse.  If ``None``, then :attr:`sys.argv`
        is used.
    """
    global subparsers

    parser = argparse.ArgumentParser(
        prog="pydicom", description="pydicom command line utilities"
    )
    subparsers = parser.add_subparsers(help="subcommand help")

    help_parser = subparsers.add_parser(
        "help", help="display help for subcommands"
    )
    help_parser.add_argument(
        "subcommand", nargs="?", help="Subcommand to show help for"
    )
    help_parser.set_defaults(func=help_command)

    # Get subcommands to register themselves as a subparser
    subcommands = get_subcommand_entry_points()
    for subcommand in subcommands.values():
        subcommand(subparsers)

    ns = parser.parse_args(args)
    if not vars(ns):
        parser.print_help()
    else:
        ns.func(ns)
