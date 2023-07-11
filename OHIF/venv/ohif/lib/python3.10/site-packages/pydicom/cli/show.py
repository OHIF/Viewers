# Copyright 2019 pydicom authors. See LICENSE file for details.
"""Pydicom command line interface program for `pydicom show`"""

import argparse
from typing import Optional, List, Union, Callable

from pydicom.dataset import Dataset
from pydicom.cli.main import filespec_help, filespec_parser


def add_subparser(subparsers: argparse._SubParsersAction) -> None:
    subparser = subparsers.add_parser(
        "show", description="Display all or part of a DICOM file"
    )
    subparser.add_argument(
        "filespec", help=filespec_help, type=filespec_parser
    )
    subparser.add_argument(
        "-x",
        "--exclude-private",
        help="Don't show private data elements",
        action="store_true",
    )
    subparser.add_argument(
        "-t", "--top", help="Only show top level", action="store_true"
    )
    subparser.add_argument(
        "-q",
        "--quiet",
        help="Only show basic information",
        action="store_true",
    )

    subparser.set_defaults(func=do_command)


def do_command(args: argparse.Namespace) -> None:
    if len(args.filespec) != 1:
        raise NotImplementedError(
            "Show can only work on a single DICOM file input"
        )

    ds, element_val = args.filespec[0]
    if not element_val:
        element_val = ds

    if args.exclude_private:
        ds.remove_private_tags()

    if args.quiet and isinstance(element_val, Dataset):
        show_quiet(element_val)
    elif args.top and isinstance(element_val, Dataset):
        print(element_val.top())
    else:
        print(str(element_val))


def SOPClassname(ds: Dataset) -> Optional[str]:
    class_uid = ds.get("SOPClassUID")
    if class_uid is None:
        return None
    return f"SOPClassUID: {class_uid.name}"


def quiet_rtplan(ds: Dataset) -> Optional[str]:
    if "BeamSequence" not in ds:
        return None

    plan_label = ds.get("RTPlanLabel")
    plan_name = ds.get("RTPlanName")
    line = f"Plan Label: {plan_label}  "
    if plan_name:
        line += f"Plan Name: {plan_name}"
    lines = [line]

    if "FractionGroupSequence" in ds:  # it should be, is mandatory
        for fraction_group in ds.FractionGroupSequence:
            fraction_group_num = fraction_group.get("FractionGroupNumber", "")
            descr = fraction_group.get("FractionGroupDescription", "")
            fractions = fraction_group.get("NumberOfFractionsPlanned")
            fxn_info = f"{fractions} fraction(s) planned" if fractions else ""
            lines.append(
                f"Fraction Group {fraction_group_num} {descr} {fxn_info}"
            )
            num_brachy = fraction_group.get("NumberOfBrachyApplicationSetups")
            lines.append(f"   Brachy Application Setups: {num_brachy}")
            for refd_beam in fraction_group.ReferencedBeamSequence:
                ref_num = refd_beam.get("ReferencedBeamNumber")
                dose = refd_beam.get("BeamDose")
                mu = refd_beam.get("BeamMeterset")
                line = f"   Beam {ref_num} "
                if dose or mu:
                    line += f"Dose {dose} Meterset {mu}"
                lines.append(line)

    for beam in ds.BeamSequence:
        beam_num = beam.get("BeamNumber")
        beam_name = beam.get("BeamName")
        beam_type = beam.get("BeamType")
        beam_delivery = beam.get("TreatmentDeliveryType")
        beam_radtype = beam.get("RadiationType")
        line = (
            f"Beam {beam_num} '{beam_name}' {beam_delivery} "
            f"{beam_type} {beam_radtype}"
        )

        if beam_type == "STATIC":
            cp = beam.ControlPointSequence[0]
            if cp:
                energy = cp.get("NominalBeamEnergy")
                gantry = cp.get("GantryAngle")
                bld = cp.get("BeamLimitingDeviceAngle")
                couch = cp.get("PatientSupportAngle")
                line += (
                    f" energy {energy} gantry {gantry}, coll {bld}, "
                    f"couch {couch}"
                )


        wedges = beam.get("NumberOfWedges")
        comps = beam.get("NumberOfCompensators")
        boli = beam.get("NumberOfBoli")
        blocks = beam.get("NumberOfBlocks")

        line += (
            f" ({wedges} wedges, {comps} comps, {boli} boli,"
            f" {blocks} blocks)"
        )

        lines.append(line)

    return "\n".join(lines)


def quiet_image(ds: Dataset) -> Optional[str]:
    if "SOPClassUID" not in ds or "Image Storage" not in ds.SOPClassUID.name:
        return None

    results = [
        f"{name}: {ds.get(name, 'N/A')}"
        for name in [
            "BitsStored",
            "Modality",
            "Rows",
            "Columns",
            "SliceLocation",
        ]
    ]
    return "\n".join(results)


# Items to show in quiet mode
# Item can be a callable or a DICOM keyword
quiet_items: List[Union[Callable[[Dataset], Optional[str]], str]] = [
    SOPClassname,
    "PatientName",
    "PatientID",
    # Images
    "StudyID",
    "StudyDate",
    "StudyTime",
    "StudyDescription",
    quiet_image,
    quiet_rtplan,
]


def show_quiet(ds: Dataset) -> None:
    for item in quiet_items:
        if callable(item):
            result = item(ds)
            if result:
                print(result)
        else:
            print(f"{item}: {ds.get(item, 'N/A')}")
