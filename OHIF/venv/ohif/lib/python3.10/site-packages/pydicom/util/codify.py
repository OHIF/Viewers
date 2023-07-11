# Copyright 2008-2021 pydicom authors. See LICENSE file for details.
"""
Produce runnable python code which can recreate DICOM objects or files.

Can run as a script to produce code for an entire file,
or import and use specific functions to provide code for pydicom DICOM classes

"""

# Run this from the same directory as a "base" dicom file and
# this code will output to screen the dicom parameters like:
#    ds.PatientName = 'TEST'
# etc for all parameters in the file.
# This can then be pasted into a python file and parameters edited as necessary
# to create a DICOM file from scratch

import argparse
import os.path
import re
import sys
from typing import Optional, List, Callable

import pydicom
from pydicom.datadict import dictionary_keyword
from pydicom.dataelem import DataElement
from pydicom.dataset import Dataset
from pydicom.tag import BaseTag
from pydicom.valuerep import BYTES_VR, AMBIGUOUS_VR, VR
from pydicom.cli.main import filespec_help, filespec_parser


line_term = "\n"

# Precompiled search patterns for camel_to_underscore()
first_cap_re = re.compile("(.)([A-Z][a-z]+)")
all_cap_re = re.compile("([a-z0-9])([A-Z])")


def camel_to_underscore(name: str) -> str:
    """Convert name from CamelCase to lower_case_with_underscores"""
    # From http://stackoverflow.com/questions/1175208
    s1 = first_cap_re.sub(r"\1_\2", name)
    return all_cap_re.sub(r"\1_\2", s1).lower()


def tag_repr(tag: BaseTag) -> str:
    """String of tag value as (0xgggg, 0xeeee)"""
    return f"(0x{tag.group:04x}, 0x{tag.element:04x})"


def default_name_filter(name: str) -> str:
    """Callable to reduce some names in code to more readable short form

    :arg name: a sequence variable name or sequence item name
    :return: a shorter version of name if a known conversion,
             else return original name

    """
    name = camel_to_underscore(name)
    name = name.replace("control_point", "cp")
    name = name.replace("reference", "ref")
    name = name.replace("fraction_group", "frxn_gp")
    return name


# Functions to produce python code
def code_imports() -> str:
    """Code the import statements needed by other codify results

    :return: a string of import statement lines

    """
    line1 = "import pydicom"
    line2 = "from pydicom.dataset import Dataset, FileMetaDataset"
    line3 = "from pydicom.sequence import Sequence"
    return line_term.join((line1, line2, line3))


def code_dataelem(
    dataelem: DataElement,
    dataset_name: str = "ds",
    exclude_size: Optional[int] = None,
    include_private: bool = False
) -> str:
    """Code lines for a single DICOM data element

    Parameters
    ----------

    dataelem : DataElement
        The DataElement instance to turn into code
    dataset_name : str
        The variable name of the Dataset containing `dataelem`
    exclude_size : Union[int, None]
        If specified, values longer than this (in bytes)
        will only have a commented string for a value,
        causing a syntax error when the code is run,
        and thus prompting the user to remove or fix that line.

    Returns
    -------
    str
        A string containing code to recreate the data element
        If the data element is a sequence, calls code_sequence
    """

    if dataelem.VR == VR.SQ:
        return code_sequence(
            dataelem, dataset_name, exclude_size, include_private
        )

    # If in DICOM dictionary, set using the keyword
    # If not (e.g. is private element), set using add_new method
    have_keyword = True
    try:
        keyword = dictionary_keyword(dataelem.tag)
    except KeyError:
        have_keyword = False

    valuerep = repr(dataelem.value)

    if exclude_size:
        if (
            dataelem.VR in (BYTES_VR | AMBIGUOUS_VR) - {VR.US_SS}
            and not isinstance(dataelem.value, (int, float))
            and len(dataelem.value) > exclude_size
        ):
            valuerep = f"# XXX Array of {len(dataelem.value)} bytes excluded"

    if have_keyword:
        line = f"{dataset_name}.{keyword} = {valuerep}"
    else:
        tag = tag_repr(dataelem.tag)
        vr = dataelem.VR
        line = f"{dataset_name}.add_new({tag}, '{vr}', {valuerep})"

    return line


def code_sequence(
    dataelem: DataElement,
    dataset_name: str = "ds",
    exclude_size: Optional[int] = None,
    include_private: bool = False,
    name_filter: Callable[[str], str] = default_name_filter,
) -> str:
    """Code lines for recreating a Sequence data element

    Parameters
    ----------
    dataelem : DataElement
        The DataElement instance whose value is the Sequence
    dataset_name : str
        Variable name of the dataset containing the Sequence
    exclude_size : int, optional
        If not ``None``, values longer than this (in bytes) will only have a
        commented string for a value, causing a syntax error when the code is
        run, and thus prompting the user to remove or fix that line.
    include_private: bool
        If ``False`` (default) private elements are skipped, otherwise private
        data elements will be coded.
    name_filter: Callable[[str], str]
        A callable taking a sequence name or sequence item name, and returning
        a shorter name for easier code reading

    Returns
    -------
    str
        A string containing code lines to recreate a DICOM sequence
    """

    lines = []
    seq = dataelem.value
    seq_name = dataelem.name
    seq_item_name = seq_name.replace(" Sequence", "")
    try:
        seq_keyword = dictionary_keyword(dataelem.tag)
    except KeyError:
        seq_keyword = f"Tag{dataelem.tag:08x}"

    # Create comment line to document the start of Sequence
    lines.append("")
    lines.append("# " + seq_name)

    # Code line to create a new Sequence object
    if name_filter:
        seq_var = name_filter(seq_keyword)
    lines.append(seq_var + " = Sequence()")

    # Code line to add the sequence to its parent
    lines.append(dataset_name + "." + seq_keyword + " = " + seq_var)

    # Code lines to add sequence items to the Sequence
    for i, ds in enumerate(seq):
        # Determine index to use. If seq item has a data element with 'Index',
        #    use that; if one with 'Number', use that, else start at 1
        index_keyword = seq_keyword.replace("Sequence", "") + "Index"
        number_keyword = seq_keyword.replace("Sequence", "") + "Number"
        if hasattr(ds, index_keyword):
            index_str = str(getattr(ds, index_keyword))
        elif hasattr(ds, number_keyword):
            index_str = str(getattr(ds, number_keyword))
        else:
            index_str = str(i + 1)

        # Code comment line to mark start of sequence item
        lines.append("")
        lines.append("# " + seq_name + ": " + seq_item_name + " " + index_str)

        # Determine the variable name to use for the sequence item (dataset)
        ds_name = seq_var.replace("_sequence", "") + index_str

        # Code the sequence item
        code_item = code_dataset(ds, ds_name, exclude_size, include_private)
        lines.append(code_item)

        # Code the line to append the item to its parent sequence
        lines.append(seq_var + ".append(" + ds_name + ")")

    # Join the lines and return a single string
    return line_term.join(lines)


def code_dataset(
    ds: Dataset,
    dataset_name: str = "ds",
    exclude_size: Optional[int] = None,
    include_private: bool = False,
    is_file_meta: bool = False,
) -> str:
    """Return Python code for creating `ds`.

    Parameters
    ----------
    ds : pydicom.dataset.Dataset
        The dataset to codify.
    dataset_name : str, optional
        The Python variable name to use for the dataset, default ``'ds'``.
    exclude_size : int, optional
        If not ``None``, values longer than this (in bytes) will only have a
        commented string for a value, causing a syntax error when the code is
        run, and thus prompting the user to remove or fix that line.
    include_private : bool, optional
        If ``False`` (default) private elements are skipped, otherwise private
        data elements will be coded.
    is_file_meta : bool, optional
        ``True`` if `ds` contains file meta information elements.

    Returns
    -------
    str
        The codified dataset.
    """

    lines = []
    ds_class = " = FileMetaDataset()" if is_file_meta else " = Dataset()"
    lines.append(dataset_name + ds_class)
    for dataelem in ds:
        # If a private data element and flag says so, skip it and go to next
        if not include_private and dataelem.tag.is_private:
            continue
        # Otherwise code the line and add it to the lines list
        code_line = code_dataelem(
            dataelem, dataset_name, exclude_size, include_private
        )
        lines.append(code_line)
        # Add blank line if just coded a sequence
        if dataelem.VR == VR.SQ:
            lines.append("")
    # If sequence was end of this dataset, remove the extra blank line
    if len(lines) and lines[-1] == "":
        lines.pop()
    # Join all the code lines and return them
    return line_term.join(lines)


def code_file(
    filename: str,
    exclude_size: Optional[int] = None,
    include_private: bool = False
) -> str:
    """Write a complete source code file to recreate a DICOM file

    Parameters
    ----------
    filename : str
        Complete path and filename of a DICOM file to convert
    exclude_size : Union[int,None]
        If not None, values longer than this (in bytes)
        will only have a commented string for a value,
        causing a syntax error when the code is run,
        and thus prompting the user to remove or fix that line.
    include_private : bool
        If ``False`` (default), private elements are skipped
        If ``True``, private data elements will be coded.

    Returns
    -------
    str
        A string containing code lines to recreate the entire DICOM file

    """
    ds = pydicom.dcmread(filename, force=True)
    return code_file_from_dataset(ds, exclude_size, include_private)


def code_file_from_dataset(
    ds: Dataset,
    exclude_size: Optional[int] = None,
    include_private: bool = False
) -> str:
    """Write a complete source code file to recreate a DICOM file

    Parameters
    ----------
    filename : str
        Complete path and filename of a DICOM file to convert
    exclude_size : Union[int,None]
        If not None, values longer than this (in bytes)
        will only have a commented string for a value,
        causing a syntax error when the code is run,
        and thus prompting the user to remove or fix that line.
    include_private : bool
        If ``False`` (default), private elements are skipped
        If ``True``, private data elements will be coded.

    Returns
    -------
    str
        A string containing code lines to recreate the entire DICOM file

    """
    lines = []

    # Code a nice header for the python file
    filename = ds.get("filename")
    identifier = f"DICOM file '{filename}'" if filename else "non-file dataset"

    lines.append(f"# Coded version of {identifier}")
    lines.append("# Produced by pydicom codify utility script")

    # Code the necessary imports
    lines.append(code_imports())
    lines.append("")

    # Code the file_meta information
    if hasattr(ds, 'file_meta'):
        lines.append("# File meta info data elements")
        code_meta = code_dataset(
            ds.file_meta,
            "file_meta",
            exclude_size,
            include_private,
            is_file_meta=True,
        )
        lines.append(code_meta)
        lines.append("")

    # Code the main dataset
    lines.append("# Main data elements")
    code_ds = code_dataset(
        ds, exclude_size=exclude_size, include_private=include_private
    )
    lines.append(code_ds)
    lines.append("")

    # Add the file meta to the dataset, and set transfer syntax
    if hasattr(ds, 'file_meta'):
        lines.append("ds.file_meta = file_meta")
    lines.append("ds.is_implicit_VR = " + str(ds.is_implicit_VR))
    lines.append("ds.is_little_endian = " + str(ds.is_little_endian))

    # Return the complete code string
    return line_term.join(lines)


def set_parser_arguments(
    parser: argparse.ArgumentParser, default_exclude_size: int
) -> None:
    parser.add_argument(
        "filespec",
        help=filespec_help,
        type=filespec_parser,
    )
    parser.add_argument(
        "outfile",
        nargs="?",
        type=argparse.FileType("w"),
        help=(
            "Filename to write Python code to, if not specified then code is "
            "written to stdout"
        ),
        default=sys.stdout,
    )
    parser.add_argument(
        "-e",
        "--exclude-size",
        type=int,
        default=default_exclude_size,
        help=(
            "Exclude binary data larger than specified (default: "
            f"{default_exclude_size} bytes)"
        ),
    )
    parser.add_argument(
        "-p",
        "--include-private",
        action="store_true",
        help="Include private data elements (default is to exclude them)",
    )
    parser.add_argument(
        "-s",
        "--save-as",
        help=(
            "Specify the filename for ds.save_as(save_filename); "
            "otherwise the input name + '_from_codify' will be used"
        ),
    )


def do_codify(args: argparse.Namespace) -> None:
    # Convert the requested dataset to python/pydicom code lines
    if len(args.filespec) != 1:
        raise NotImplementedError(
            "Codify can only work on a single DICOM file input"
        )

    ds, element = args.filespec[0]
    filename = ds.filename

    if element and not isinstance(element, Dataset):
        raise NotImplementedError(
            f"Codify can only code a Dataset, not a {type(element)}"
        )

    code_str = code_file_from_dataset(
        element or ds, args.exclude_size, args.include_private
    )

    # If requested, write a code line to save the dataset
    if args.save_as:
        save_as_filename = args.save_as
    else:
        base, _ = os.path.splitext(filename)
        save_as_filename = base + "_from_codify" + ".dcm"
    save_line = (
        f"\nds.save_as(r'{save_as_filename}', write_like_original=False)"
    )
    code_str += save_line

    # Write the code lines to specified file or to standard output
    # For test_util, captured output .name throws error, ignore it:
    try:
        if args.outfile.name != "<stdout>":
            print(f"Writing code to file '{args.outfile.name}'")
    except AttributeError:
        pass
    args.outfile.write(code_str)


def main(default_exclude_size: int, args: Optional[List[str]] = None) -> None:
    """Create Python code according to user options

    Parameters:
    -----------
    default_exclude_size : int
        Values longer than this will be coded as a commented syntax error
    args : List[str], optional
        Command-line arguments to parse.  If ``None`` then :attr:`sys.argv` is
        used.
    """
    parser = argparse.ArgumentParser(
        description="Produce python/pydicom code from a DICOM file",
        epilog=(
            "Binary data (e.g. pixels) larger than --exclude-size "
            f"(default {default_exclude_size} bytes) is not included. A "
            "dummy line with a syntax error is produced. "
            "Private data elements are not included by default."
        ),
    )
    set_parser_arguments(parser, default_exclude_size)
    do_codify(parser.parse_args(args))


if __name__ == "__main__":  # pragma: no cover
    main(default_exclude_size=100)
