# Copyright 2008-2020 pydicom authors. See LICENSE file for details.
"""DICOM File-set handling."""

import copy
import os
from pathlib import Path
import re
import shutil
from tempfile import TemporaryDirectory
from typing import (
    Iterator, Optional, Union, Any, List, cast, Iterable, Dict, Callable
)
import warnings

from pydicom.charset import default_encoding
from pydicom.datadict import tag_for_keyword, dictionary_description
from pydicom.dataelem import DataElement
from pydicom.dataset import Dataset, FileMetaDataset, FileDataset
from pydicom.filebase import DicomBytesIO, DicomFileLike
from pydicom.filereader import dcmread
from pydicom.filewriter import (
    write_dataset, write_data_element, write_file_meta_info
)
from pydicom.tag import Tag, BaseTag
import pydicom.uid as sop
from pydicom.uid import (
    generate_uid,
    UID,
    ExplicitVRLittleEndian,
    ImplicitVRLittleEndian,
    MediaStorageDirectoryStorage,
)


# Regex for conformant File ID paths - PS3.10 Section 8.5
_RE_FILE_ID = re.compile("^[A-Z0-9_]*$")
# Prefixes to use when generating File ID components
_PREFIXES = {
    "PATIENT": "PT",
    "STUDY": "ST",
    "SERIES": "SE",
    "IMAGE": "IM",
    "RT DOSE": "RD",
    "RT STRUCTURE SET": "RS",
    "RT PLAN": "RP",
    "RT TREAT RECORD": "RX",
    "PRESENTATION": "PR",
    "WAVEFORM": "WV",
    "SR DOCUMENT": "SR",
    "KEY OBJECT DOC": "KY",
    "SPECTROSCOPY": "SP",
    "RAW DATA": "RW",
    "REGISTRATION": "RG",
    "FIDUCIAL": "FD",
    "HANGING PROTOCOL": "HG",
    "ENCAP DOC": "ED",
    "VALUE MAP": "VM",
    "STEREOMETRIC": "SX",
    "PALETTE": "PA",
    "IMPLANT": "IP",
    "IMPLANT ASSY": "IA",
    "IMPLANT GROUP": "IG",
    "PLAN": "PL",
    "MEASUREMENT": "MX",
    "SURFACE": "SF",
    "SURFACE SCAN": "SS",
    "TRACT": "TR",
    "ASSESSMENT": "AS",
    "RADIOTHERAPY": "RT",
    "PRIVATE": "P",
}
_FIRST_OFFSET = "OffsetOfTheFirstDirectoryRecordOfTheRootDirectoryEntity"
_NEXT_OFFSET = "OffsetOfTheNextDirectoryRecord"
_LOWER_OFFSET = "OffsetOfReferencedLowerLevelDirectoryEntity"
_LAST_OFFSET = "OffsetOfTheLastDirectoryRecordOfTheRootDirectoryEntity"


def generate_filename(
    prefix: str = "", start: int = 0, alphanumeric: bool = False
) -> Iterator[str]:
    """Yield File IDs for a File-set.

    Maximum number of File IDs is:

    * Numeric: (10 ** (8 - `prefix`)) - `start`
    * Alphanumeric: (36 ** (8 - `prefix`)) - `start`

    Parameters
    ----------
    prefix : str, optional
        The prefix to use for all filenames, default (``""``).
    start : int, optional
        The starting index to use for the suffixes, (default ``0``).
        i.e. if you want to start at ``'00010'`` then `start` should be ``10``.
    alphanumeric : bool, optional
        If ``False`` (default) then only generate suffixes using the characters
        [0-9], otherwise use [0-9][A-Z].

    Yields
    ------
    str
        A unique filename with 8 characters, with each incremented by 1 from
        the previous one (i.e. ``'00000000'``, ``'00000001'``, ``'00000002'``,
        and so on).
    """
    if len(prefix) > 7:
        raise ValueError("The 'prefix' must be less than 8 characters long")

    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if not alphanumeric:
        chars = chars[:10]

    idx = start
    b = len(chars)
    length = 8 - len(prefix)
    while idx < b ** length:
        n = idx
        suffix = ""
        while n:
            suffix += chars[n % b]
            n //= b

        yield f"{prefix}{suffix[::-1]:>0{length}}"
        idx += 1


def is_conformant_file_id(path: Path) -> bool:
    """Return ``True`` if `path` is a conformant File ID.

    **Conformance**

    * :dcm:`No more than 8 components<part03/sect_F.3.2.2.html>` (parts) in
      the path
    * :dcm:`No more than 8 characters per component<part03/sect_F.3.2.2.html>`
    * :dcm:`Characters in a component must be ASCII<part10/sect_8.2.html>`
    * :dcm:`Valid characters in a component are 0-9, A-Z and _
      <part10/sect_8.5.html>`

    Parameters
    ----------
    path : pathlib.Path
        The path to check, relative to the File-set root directory.

    Returns
    -------
    bool
        ``True`` if `path` is conformant, ``False`` otherwise.
    """
    # No more than 8 characters per component
    parts = path.parts
    if any([len(pp) > 8 for pp in parts]):
        return False

    # No more than 8 components
    if len(parts) > 8:
        return False

    # Characters in the path are ASCII
    chars = ''.join(parts)
    try:
        chars.encode(encoding="ascii", errors="strict")
    except UnicodeEncodeError:
        return False

    # Characters are in [0-9][A-Z] and _
    if re.match(_RE_FILE_ID, chars):
        return True

    return False


class RecordNode(Iterable["RecordNode"]):
    """Representation of a DICOMDIR's directory record.

    Attributes
    ----------
    children : list of RecordNode
        The current node's child nodes (if any)
    instance : FileInstance or None
        If the current node is a leaf node, a
        :class:`~pydicom.fileset.FileInstance` for the corresponding SOP
        Instance.
    """
    def __init__(self, record: Optional[Dataset] = None) -> None:
        """Create a new ``RecordNode``.

        Parameters
        ----------
        record : pydicom.dataset.Dataset, optional
            A *Directory Record Sequence's* directory record.
        """
        self.children: List["RecordNode"] = []
        self.instance: Optional[FileInstance] = None
        self._parent: Optional["RecordNode"] = None
        self._record: Dataset

        if record:
            self._set_record(record)

        # When the record is encoded as part of the *Directory Record Sequence*
        #   this is the offset to the start of the sequence item containing
        #   the record - not guaranteed to be up-to-date
        self._offset = 0
        # The offset to the start of the encoded record's *Offset of the
        #   Next Directory Record* and *Offset of Referenced Lower Level
        #   Directory Entity* values - use _encode_record() to set them
        self._offset_next = 0
        self._offset_lower = 0

    def add(self, leaf: "RecordNode") -> None:
        """Add a leaf to the tree.

        Parameters
        ----------
        leaf : pydicom.fileset.RecordNode
            A leaf node (i.e. one with a
            :class:`~pydicom.fileset.FileInstance`) to be added to the tree
            (if not already present).
        """
        # Move up to the branch's furthest ancestor with a directory record
        node = leaf.root
        if node is self:
            node = node.children[0]

        # Move back down, inserting at the point where the node is unique
        current = self.root
        while node in current and node.children:
            current = current[node]
            node = node.children[0]

        node.parent = current

    @property
    def ancestors(self) -> List["RecordNode"]:
        """Return a list of the current node's ancestors, ordered from nearest
        to furthest.
        """
        return [nn for nn in self.reverse() if nn is not self]

    @property
    def component(self) -> str:
        """Return a File ID component as :class:`str` for the current node."""
        if self.is_root:
            raise ValueError(
                "The root node doesn't contribute a File ID component"
            )

        prefix = _PREFIXES[self.record_type]
        if self.record_type == "PRIVATE":
            prefix = f"{prefix}{self.depth}"

        chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        if not self.file_set._use_alphanumeric:
            chars = chars[:10]

        suffix = ""
        n = self.index
        b = len(chars)
        while n:
            suffix += chars[n % b]
            n //= b

        idx = f"{suffix[::-1]:>0{8 - len(prefix)}}"

        return f"{prefix}{idx}"

    def __contains__(self, key: Union[str, "RecordNode"]) -> bool:
        """Return ``True`` if the current node has a child matching `key`."""
        if isinstance(key, RecordNode):
            key = key.key

        return key in [child.key for child in self.children]

    def __delitem__(self, key: Union[str, "RecordNode"]) -> None:
        """Remove one of the current node's children and if the current node
        becomes childless recurse upwards and delete it from its parent.
        """
        if isinstance(key, RecordNode):
            key = key.key

        if key not in self:
            raise KeyError(key)

        self.children = [ii for ii in self.children if ii.key != key]

        # Recurse upwards to the root, removing any empty nodes
        if not self.children and not self.is_root:
            del self.parent[self]

    @property
    def depth(self) -> int:
        "Return the number of nodes to the level below the tree root"
        return len(list(self.reverse())) - 1

    def _encode_record(self, force_implicit: bool = False) -> int:
        """Encode the node's directory record.

        * Encodes the record as explicit VR little endian
        * Sets the ``RecordNode._offset_next`` and ``RecordNode._offset_lower``
          attributes to the position of the start of the values of the *Offset
          of the Next Directory Record* and *Offset of Referenced Lower Level
          Directory Entity* elements. Note that the offsets are relative to
          the start of the current directory record.

        The values for the *Offset Of The Next Directory Record* and *Offset
        of Referenced Lower Level Directory Entity* elements are not guaranteed
        to be correct.

        Parameters
        ----------
        force_implicit : bool, optional
            ``True`` to force using implicit VR encoding, which is
            non-conformant. Default ``False``.

        Returns
        -------
        int
            The length of the encoded directory record.

        See Also
        --------
        :meth:`~pydicom.fileset.RecordNode._update_record_offsets`
        """
        fp = DicomBytesIO()
        fp.is_little_endian = True
        fp.is_implicit_VR = force_implicit

        encoding = self._record.get('SpecificCharacterSet', default_encoding)

        for tag in sorted(self._record.keys()):
            if tag.element == 0 and tag.group > 6:
                continue

            # (0004,1400) Offset Of The Next Directory Record
            # (0004,1420) Offset Of Referenced Lower Level Directory Entity
            # Offset from start of tag to start of value for VR UL is always 8
            #   however the absolute position may change with transfer syntax
            if tag == 0x00041400:
                self._offset_next = fp.tell() + 8
            elif tag == 0x00041420:
                self._offset_lower = fp.tell() + 8

            write_data_element(fp, self._record[tag], encoding)

        return len(fp.getvalue())

    @property
    def _file_id(self) -> Optional[Path]:
        """Return the *Referenced File ID* as a :class:`~pathlib.Path`.

        Returns
        -------
        pathlib.Path or None
            The *Referenced File ID* from the directory record as a
            :class:`pathlib.Path` or ``None`` if the element value is null.
        """
        if "ReferencedFileID" in self._record:
            elem = self._record["ReferencedFileID"]
            if elem.VM == 1:
                return Path(cast(str, self._record.ReferencedFileID))
            if elem.VM > 1:
                return Path(*cast(List[str], self._record.ReferencedFileID))

            return None

        raise AttributeError("No 'Referenced File ID' in the directory record")

    @property
    def file_set(self) -> "FileSet":
        """Return the tree's :class:`~pydicom.fileset.FileSet`."""
        return self.root.file_set

    def __getitem__(self, key: Union[str, "RecordNode"]) -> "RecordNode":
        """Return the current node's child using it's
        :attr:`~pydicom.fileset.RecordNode.key`
        """
        if isinstance(key, RecordNode):
            key = key.key

        for child in self.children:
            if key == child.key:
                return child

        raise KeyError(key)

    @property
    def has_instance(self) -> bool:
        """Return ``True`` if the current node corresponds to an instance."""
        return self.instance is not None

    @property
    def index(self) -> int:
        """Return the index of the current node amongst its siblings."""
        if not self.parent:
            return 0

        return self.parent.children.index(self)

    @property
    def is_root(self) -> bool:
        """Return ``True`` if the current node is the tree's root node."""
        return False

    def __iter__(self) -> Iterator["RecordNode"]:
        """Yield this node (unless it's the root node) and all nodes below it.
        """
        if not self.is_root:
            yield self

        for child in self.children:
            yield from child

    @property
    def key(self) -> str:
        """Return a unique key for the node's record as :class:`str`."""
        rtype = self.record_type
        if rtype == "PATIENT":
            # PS3.3, Annex F.5.1: Each Patient ID is unique within a File-set
            return cast(str, self._record.PatientID)
        if rtype == "STUDY":
            # PS3.3, Annex F.5.2: Type 1C
            if "StudyInstanceUID" in self._record:
                return cast(UID, self._record.StudyInstanceUID)
            else:
                return cast(UID, self._record.ReferencedSOPInstanceUIDInFile)
        if rtype == "SERIES":
            return cast(UID, self._record.SeriesInstanceUID)
        if rtype == "PRIVATE":
            return cast(UID, self._record.PrivateRecordUID)

        # PS3.3, Table F.3-3: Required if record references an instance
        try:
            return cast(UID, self._record.ReferencedSOPInstanceUIDInFile)
        except AttributeError as exc:
            raise AttributeError(
                f"Invalid '{rtype}' record - missing required element "
                "'Referenced SOP Instance UID in File'"
            ) from exc

    @property
    def next(self) -> Optional["RecordNode"]:
        """Return the node after the current one (if any), or ``None``."""
        if not self.parent:
            return None

        try:
            return self.parent.children[self.index + 1]
        except IndexError:
            return None

    @property
    def parent(self) -> "RecordNode":
        """Return the current node's parent (if it has one)."""
        return cast("RecordNode", self._parent)

    @parent.setter
    def parent(self, node: "RecordNode") -> None:
        """Set the parent of the current node."""
        self._parent = node
        if node is not None and self not in node.children:
            node.children.append(self)

    def prettify(self, indent_char: str = '  ') -> List[str]:
        """Return the tree structure as a list of pretty strings, starting at
        the current node (unless the current node is the root node).

        Parameters
        ----------
        indent_char : str, optional
            The characters to use to indent each level of the tree.
        """
        def leaf_summary(node: "RecordNode", indent_char: str) -> List[str]:
            """Summarize the leaves at the current level."""
            # Examples:
            #   IMAGE: 15 SOP Instances (10 initial, 9 additions, 4 removals)
            #   RTDOSE: 1 SOP Instance
            out = []
            if not node.children:
                indent = indent_char * node.depth
                sibs = [ii for ii in node.parent if ii.has_instance]
                # Split into record types
                rtypes = {ii.record_type for ii in sibs}
                for record_type in sorted(rtypes):
                    # nr = initial + additions
                    nr = [ii for ii in sibs if ii.record_type == record_type]
                    # All leaves should have a corresponding FileInstance
                    add = len(
                        [
                            ii for ii in nr
                            if cast(FileInstance, ii.instance).for_addition
                        ]
                    )
                    rm = len(
                        [
                            ii for ii in nr
                            if cast(FileInstance, ii.instance).for_removal
                        ]
                    )
                    initial = len(nr) - add
                    result = len(nr) - rm

                    changes = []
                    if (add or rm) and initial > 0:
                        changes.append(f"{initial} initial")
                    if add:
                        plural = 's' if add > 1 else ''
                        changes.append(f"{add} addition{plural}")
                    if rm:
                        plural = 's' if rm > 1 else ''
                        changes.append(f"{rm} removal{plural}")

                    summary = (
                        f"{indent}{record_type}: {result} "
                        f"SOP Instance{'' if result == 1 else 's'}"
                    )
                    if changes:
                        summary += f" ({', '.join(changes)})"

                    out.append(summary)

            return out

        s = []
        for node in self:
            indent = indent_char * node.depth
            if node.children:
                s.append(f"{indent}{str(node)}")
                # Summarise any leaves at the next level
                for child in node.children:
                    if child.has_instance:
                        s.extend(leaf_summary(child, indent_char))
                        break
            elif node.depth == 0 and node.has_instance:
                node.instance = cast(FileInstance, node.instance)
                # Single-level records
                line = f"{indent}{node.record_type}: 1 SOP Instance"
                if node.instance.for_addition:
                    line += " (to be added)"
                elif node.instance.for_removal:
                    line += " (to be removed)"

                s.append(line)

        return s

    @property
    def previous(self) -> Optional["RecordNode"]:
        """Return the node before the current one (if any), or ``None``."""
        if not self.parent:
            return None

        if self.index == 0:
            return None

        return self.parent.children[self.index - 1]

    def _set_record(self, ds: Dataset) -> None:
        """Set the node's initial directory record dataset.

        The record is used as a starting point when filling the DICOMDIR's
        *Directory Record Sequence* and is modified as required during
        encoding.

        Parameters
        ----------
        ds : pydicom.dataset.Dataset
            Set the node's initial directory record dataset, must be conformant
            to :dcm:`Part 3, Annex F of the DICOM Standard
            <part03/chapter_F.html>`.
        """
        offset = getattr(ds, "seq_item_tell", None)
        rtype = ds.get("DirectoryRecordType", None)
        rtype = f"{rtype} " if rtype else ""
        msg = f"The {rtype}directory record is missing"
        if offset:
            msg = f"The {rtype}directory record at offset {offset} is missing"

        keywords = ["DirectoryRecordType"]
        missing = [kw for kw in keywords if kw not in ds]
        if missing:
            msg = (
                f"{msg} one or more required elements: {', '.join(missing)}"
            )
            raise ValueError(msg)

        if _NEXT_OFFSET not in ds:
            setattr(ds, _NEXT_OFFSET, 0)
        if _LOWER_OFFSET not in ds:
            setattr(ds, _LOWER_OFFSET, 0)
        ds.RecordInUseFlag = 0xFFFF
        self._record = ds

        try:
            self.key
        except (AttributeError, ValueError) as exc:
            raise ValueError(f"{msg} a required element") from exc

    @property
    def record_type(self) -> str:
        """Return the record's *Directory Record Type* as :class:`str`."""
        return cast(str, self._record.DirectoryRecordType)

    def remove(self, node: "RecordNode") -> None:
        """Remove a leaf from the tree

        Parameters
        ----------
        node : pydicom.fileset.RecordNode
            The leaf node (i.e. one with a
            :class:`~pydicom.fileset.FileInstance`) to remove.
        """
        if not node.has_instance:
            raise ValueError("Only leaf nodes can be removed")

        del node.parent[node]

    def reverse(self) -> Iterable["RecordNode"]:
        """Yield nodes up to the level below the tree's root node."""
        node = self
        while node.parent:
            yield node
            node = node.parent

        if not node.is_root:
            yield node

    @property
    def root(self) -> "RecordNode":
        """Return the tree's root node."""
        if self.parent:
            return self.parent.root

        return self

    def __str__(self) -> str:
        """Return a string representation of the node."""
        if self.is_root:
            return "ROOT"

        ds = self._record
        record_type = f"{self.record_type}"

        s = []
        if self.record_type == "PATIENT":
            s += [
                f"PatientID='{ds.PatientID}'",
                f"PatientName='{ds.PatientName}'"
            ]
        elif self.record_type == "STUDY":
            s += [f"StudyDate={ds.StudyDate}", f"StudyTime={ds.StudyTime}"]
            if getattr(ds, "StudyDescription", None):
                s.append(f"StudyDescription='{ds.StudyDescription}'")
        elif self.record_type == "SERIES":
            s += [f"Modality={ds.Modality}", f"SeriesNumber={ds.SeriesNumber}"]
        elif self.record_type == "IMAGE":
            s.append(f"InstanceNumber={ds.InstanceNumber}")
        else:
            s.append(f"{self.key}")

        return f"{record_type}: {', '.join(s)}"

    def _update_record_offsets(self) -> None:
        """Update the record's offset elements.

        Updates the values for *Offset of the Next Directory Record* and
        *Offset of Referenced Lower Level Directory Entity*, provided all of
        the nodes have had their *_offset* attribute set correctly.
        """
        next_elem = self._record[_NEXT_OFFSET]
        next_elem.value = 0
        if self.next:
            next_elem.value = self.next._offset

        lower_elem = self._record[_LOWER_OFFSET]
        lower_elem.value = 0
        if self.children:
            self._record[_LOWER_OFFSET].value = self.children[0]._offset


class RootNode(RecordNode):
    """The root node for the File-set's record tree."""
    def __init__(self, fs: "FileSet") -> None:
        """Create a new root node.

        Parameters
        ----------
        fs : pydicom.fileset.FileSet
            The File-set the record tree belongs to.
        """
        super().__init__()

        self._fs = fs

    @property
    def file_set(self) -> "FileSet":
        """Return the tree's :class:`~pydicom.fileset.FileSet`."""
        return self._fs

    @property
    def is_root(self) -> bool:
        """Return ``True`` if the current node is the tree's root node."""
        return True


class FileInstance:
    """Representation of a File in the File-set.

    Attributes
    ----------
    node : pydicom.fileset.RecordNode
        The leaf record that references this instance.
    """
    def __init__(self, node: RecordNode) -> None:
        """Create a new FileInstance.

        Parameters
        ----------
        node : pydicom.fileset.RecordNode
            The record that references this instance.
        """
        class Flags:
            add: bool
            remove: bool

        self._flags = Flags()
        self._apply_stage('x')
        self._stage_path: Optional[Path] = None
        self.node = node

    def _apply_stage(self, flag: str) -> None:
        """Apply staging to the instance.

        Parameters
        ----------
        flag : str
            The staging to apply, one of ``'+'``, ``'-'`` or ``'x'``.
            This will flag the instance for addition to or removal from the
            File-set, or to reset the staging, respectively.
        """
        # Clear flags
        if flag == 'x':
            self._flags.add = False
            self._flags.remove = False
            self._stage_path = None
        elif flag == '+':
            # remove + add = no change
            if self._flags.remove:
                self._flags.remove = False
                self._stage_path = None
            else:
                self._flags.add = True
                self._stage_path = (
                    self.file_set._stage['path'] / self.SOPInstanceUID
                )

        elif flag == '-':
            # add + remove = no change
            if self._flags.add:
                self._flags.add = False
                self._stage_path = None
            else:
                self._flags.remove = True
                self._stage_path = None

    def __contains__(self, name: Union[str, int]) -> bool:
        """Return ``True`` if the element with keyword or tag `name` is
        in one of the corresponding directory records.

        Parameters
        ----------
        name : str or int
            The element keyword or tag to search for.

        Returns
        -------
        bool
            ``True`` if the corresponding element is present, ``False``
            otherwise.
        """
        try:
            self[name]
        except KeyError:
            return False

        return True

    @property
    def FileID(self) -> str:
        """Return the File ID of the referenced instance."""
        root = self.node.root
        components = [
            ii.component for ii in self.node.reverse() if ii is not root
        ]
        return os.fspath(Path(*components[::-1]))

    @property
    def file_set(self) -> "FileSet":
        """Return the :class:`~pydicom.fileset.FileSet` this instance belongs
        to.
        """
        return self.node.file_set

    @property
    def for_addition(self) -> bool:
        """Return ``True`` if the instance has been staged for addition to
        the File-set.
        """
        return self._flags.add

    @property
    def for_moving(self) -> bool:
        """Return ``True`` if the instance will be moved to a new location
        within the File-set.
        """
        if self.for_addition:
            return False

        if self["ReferencedFileID"].VM == 1:
            file_id = self.FileID.split(os.path.sep)
            return [self.ReferencedFileID] != file_id

        return cast(
            bool, self.ReferencedFileID != self.FileID.split(os.path.sep)
        )

    @property
    def for_removal(self) -> bool:
        """Return ``True`` if the instance has been staged for removal from
        the File-set.
        """
        return self._flags.remove

    def __getattribute__(self, name: str) -> Any:
        """Return the class attribute value for `name`.

        Parameters
        ----------
        name : str
            An element keyword or a class attribute name.

        Returns
        -------
        object
            If `name` matches a DICOM keyword and the element is
            present in one of the directory records then returns the
            corresponding element's value. Otherwise returns the class
            attribute's value (if present). Directory records are searched
            from the lowest (i.e. an IMAGE or similar record type) to the
            highest (PATIENT or similar).
        """
        tag = tag_for_keyword(name)
        if tag is not None:
            tag = Tag(tag)
            for node in self.node.reverse():
                if tag in node._record:
                    return node._record[tag].value

        return super().__getattribute__(name)

    def __getitem__(self, key: Union[str, int]) -> DataElement:
        """Return the DataElement with keyword or tag `key`.

        Parameters
        ----------
        key : str or int
            An element keyword or tag.

        Returns
        -------
        pydicom.dataelem.DataElement
            The DataElement corresponding to `key`, if present in one of the
            directory records. Directory records are searched
            from the lowest (i.e. an IMAGE or similar record type) to the
            highest (PATIENT or similar).
        """

        if isinstance(key, BaseTag):
            tag = key
        else:
            tag = Tag(key)

        if tag == 0x00080018:
            # SOP Instance UID
            tag = Tag(0x00041511)
        elif tag == 0x00080016:
            # SOP Class UID
            tag = Tag(0x00041510)
        elif tag == 0x00020010:
            # Transfer Syntax UID
            tag = Tag(0x00041512)

        for node in self.node.reverse():
            if tag in node._record:
                return node._record[tag]

        raise KeyError(tag)

    @property
    def is_private(self) -> bool:
        """Return ``True`` if the instance is privately defined."""
        return self.node.record_type == "PRIVATE"

    @property
    def is_staged(self) -> bool:
        """Return ``True`` if the instance is staged for moving, addition or
        removal
        """
        return self.for_addition or self.for_moving or self.for_removal

    def load(self) -> Dataset:
        """Return the referenced instance as a
        :class:`~pydicom.dataset.Dataset`.
        """
        if self.for_addition:
            return dcmread(cast(Path, self._stage_path))

        return dcmread(self.path)

    @property
    def path(self) -> str:
        """Return the path to the corresponding instance as :class:`str`.

        Returns
        -------
        str
            The absolute path to the corresponding instance. If the instance is
            staged for addition to the File-set this will be a path to the
            staged file in the temporary staging directory.
        """
        if self.for_addition:
            return os.fspath(cast(Path, self._stage_path))

        # If not staged for addition then File Set must exist on file system
        return os.fspath(
            cast(Path, self.file_set.path) / cast(Path, self.node._file_id)
        )

    @property
    def SOPClassUID(self) -> UID:
        """Return the *SOP Class UID* of the referenced instance."""
        return cast(UID, self.ReferencedSOPClassUIDInFile)

    @property
    def SOPInstanceUID(self) -> UID:
        """Return the *SOP Instance UID* of the referenced instance."""
        return cast(UID, self.ReferencedSOPInstanceUIDInFile)

    @property
    def TransferSyntaxUID(self) -> UID:
        """Return the *Transfer Syntax UID* of the referenced instance."""
        return cast(UID, self.ReferencedTransferSyntaxUIDInFile)


DSPathType = Union[Dataset, str, os.PathLike]


class FileSet:
    """Representation of a DICOM File-set."""
    def __init__(self, ds: Optional[DSPathType] = None) -> None:
        """Create or load a File-set.

        Parameters
        ----------
        ds : pydicom.dataset.Dataset, str or PathLike, optional
            If loading a File-set, the DICOMDIR dataset or the path
            to the DICOMDIR file.
        """
        # The nominal path to the root of the File-set
        self._path: Optional[Path] = None
        # The root node of the record tree used to fill out the DICOMDIR's
        #   *Directory Record Sequence*.
        # The tree for instances currently in the File-set
        self._tree = RootNode(self)

        # For tracking changes to the File-set
        self._stage: Dict[str, Any] = {
            't': TemporaryDirectory(),
            '+': {},  # instances staged for addition
            '-': {},  # instances staged for removal
            '~': False,  # instances staged for moving
            '^': False,  # a File-set Identification module element has changed
        }
        self._stage["path"] = Path(self._stage['t'].name)

        # The DICOMDIR instance, not guaranteed to be up-to-date
        self._ds = Dataset()
        # The File-set's managed SOP Instances as list of FileInstance
        self._instances: List[FileInstance] = []
        # Use alphanumeric or numeric File IDs
        self._use_alphanumeric = False

        # The File-set ID
        self._id: Optional[str] = None
        # The File-set UID
        self._uid: Optional[UID] = None
        # The File-set Descriptor File ID
        self._descriptor: Optional[str] = None
        # The Specific Character Set of File-set Descriptor File
        self._charset: Optional[str] = None

        # Check the DICOMDIR dataset and create the record tree
        if ds:
            self.load(ds)
        else:
            # New File-set
            self.UID = generate_uid()

    def add(self, ds_or_path: DSPathType) -> FileInstance:
        """Stage an instance for addition to the File-set.

        If the instance has been staged for removal then calling
        :meth:`~pydicom.fileset.FileSet.add` will cancel the staging
        and the instance will not be removed.

        Parameters
        ----------
        ds_or_path : pydicom.dataset.Dataset, str or PathLike
            The instance to add to the File-set, either as a
            :class:`~pydicom.dataset.Dataset` or the path to the instance.

        Returns
        -------
        FileInstance
            The :class:`~pydicom.fileset.FileInstance` that was added.

        See Also
        --------
        :meth:`~pydicom.fileset.FileSet.add_custom`
        """
        ds: Union[Dataset, FileDataset]
        if isinstance(ds_or_path, (str, os.PathLike)):
            ds = dcmread(ds_or_path)
        else:
            ds = ds_or_path

        key = ds.SOPInstanceUID
        have_instance = [ii for ii in self if ii.SOPInstanceUID == key]

        # If staged for removal, keep instead - check this now because
        #   `have_instance` is False when instance staged for removal
        if key in self._stage['-']:
            instance = self._stage['-'][key]
            del self._stage['-'][key]
            self._instances.append(instance)
            instance._apply_stage('+')

            return cast(FileInstance, instance)

        # The instance is already in the File-set (and not staged for removal)
        #   May or may not be staged for addition/movement
        if have_instance:
            return have_instance[0]

        # If not already in the File-set, stage for addition
        # Create the directory records and tree nodes for the dataset
        # For instances that won't contain PRIVATE records we shouldn't have
        #   to worry about exceeding the maximum component depth of 8
        record_gen = self._recordify(ds)
        record = next(record_gen)
        parent = RecordNode(record)
        node = parent  # Maybe only be a single record
        for record in record_gen:
            node = RecordNode(record)
            node.parent = parent
            parent = node

        instance = FileInstance(node)
        node.instance = instance
        self._tree.add(node)

        # Save the dataset to the stage
        self._stage['+'][instance.SOPInstanceUID] = instance
        self._instances.append(instance)
        instance._apply_stage('+')
        ds.save_as(instance.path, write_like_original=False)

        return cast(FileInstance, instance)

    def add_custom(
        self, ds_or_path: DSPathType, leaf: RecordNode
    ) -> FileInstance:
        """Stage an instance for addition to the File-set using custom records.

        This method allows you to add a SOP instance and customize the
        directory records that will be used when writing the DICOMDIR file. It
        must be used when you require PRIVATE records and may be used instead
        of modifying :attr:`~pydicom.fileset.DIRECTORY_RECORDERS` with your
        own record definition functions when the default functions aren't
        suitable.

        The following elements will be added automatically to the supplied
        directory records if required and not present:

        * (0004,1400) *Offset of the Next Directory Record*
        * (0004,1410) *Record In-use Flag*
        * (0004,1420) *Offset of Referenced Lower-Level Directory Entity*
        * (0004,1500) *Referenced File ID*
        * (0004,1510) *Referenced SOP Class UID in File*
        * (0004,1511) *Referenced SOP Instance UID in File*
        * (0004,1512) *Referenced Transfer Syntax UID in File*

        If the instance has been staged for removal then calling
        :meth:`~pydicom.fileset.FileSet.add_custom` will cancel the staging
        and the instance will not be removed.

        Examples
        --------

        Add a SOP Instance using a two record hierarchy of PATIENT -> PRIVATE

        .. code-block:: python

            from pydicom import dcmread, Dataset
            from pydicom.data import get_testdata_file
            from pydicom.fileset import FileSet, RecordNode
            from pydicom.uid import generate_uid

            # The instance to be added
            ds = dcmread(get_testdata_file("CT_small.dcm"))

            # Define the leaf node (the PRIVATE record)
            record = Dataset()
            record.DirectoryRecordType = "PRIVATE"
            record.PrivateRecordUID = generate_uid()
            leaf_node = RecordNode(record)

            # Define the top node (the PATIENT record)
            record = Dataset()
            record.DirectoryRecordType = "PATIENT"
            record.PatientID = ds.PatientID
            record.PatientName = ds.PatientName
            top_node = RecordNode(record)

            # Set the node relationship
            leaf_node.parent = top_node

            # Add the instance to the File-set
            fs = FileSet()
            instance = fs.add_custom(ds, leaf_node)

        Parameters
        ----------
        ds_or_path : pydicom.dataset.Dataset, str or PathLike
            The instance to add to the File-set, either as a
            :class:`~pydicom.dataset.Dataset` or the path to the instance.
        leaf : pydicom.fileset.RecordNode
            The leaf node for the instance, should have its ancestors nodes set
            correctly as well as their corresponding directory records. Should
            have no more than 7 ancestors due to the semantics used by
            :class:`~pydicom.fileset.FileSet` when creating the directory
            structure.

        Returns
        -------
        FileInstance
            The :class:`~pydicom.fileset.FileInstance` that was added.

        See Also
        --------
        :meth:`~pydicom.fileset.FileSet.add`
        """
        ds: Union[Dataset, FileDataset]
        if isinstance(ds_or_path, (str, os.PathLike)):
            ds = dcmread(ds_or_path)
        else:
            ds = ds_or_path

        # Check the supplied nodes
        if leaf.depth > 7:
            raise ValueError(
                "The 'leaf' node must not have more than 7 ancestors as "
                "'FileSet' supports a maximum directory structure depth of 8"
            )

        key = ds.SOPInstanceUID
        have_instance = [ii for ii in self if ii.SOPInstanceUID == key]

        # If staged for removal, keep instead - check this now because
        #   `have_instance` is False when instance staged for removal
        if key in self._stage['-']:
            instance = self._stage['-'][key]
            del self._stage['-'][key]
            self._instances.append(instance)
            instance._apply_stage('+')

            return cast(FileInstance, instance)

        if have_instance:
            return have_instance[0]

        # Ensure the leaf node's record contains the required elements
        leaf._record.ReferencedFileID = None
        leaf._record.ReferencedSOPClassUIDInFile = ds.SOPClassUID
        leaf._record.ReferencedSOPInstanceUIDInFile = key
        leaf._record.ReferencedTransferSyntaxUIDInFile = (
            ds.file_meta.TransferSyntaxUID
        )

        instance = FileInstance(leaf)
        leaf.instance = instance
        self._tree.add(leaf)

        # Save the dataset to the stage
        self._stage['+'][instance.SOPInstanceUID] = instance
        self._instances.append(instance)
        instance._apply_stage('+')
        ds.save_as(instance.path, write_like_original=False)

        return cast(FileInstance, instance)

    def clear(self) -> None:
        """Clear the File-set."""
        self._tree.children = []
        self._instances = []
        self._path = None
        self._ds = Dataset()
        self._id = None
        self._uid = generate_uid()
        self._descriptor = None
        self._charset = None

        # Clean and reset the stage
        self._stage['+'] = {}
        self._stage['-'] = {}
        self._stage['~'] = False
        self._stage['^'] = False
        self._stage['t'].cleanup()
        self._stage['t'] = TemporaryDirectory()
        self._stage['path'] = Path(self._stage['t'].name)

    def copy(
        self, path: Union[str, os.PathLike], force_implicit: bool = False
    ) -> "FileSet":
        """Copy the File-set to a new root directory and return the copied
        File-set.

        Changes staged to the original :class:`~pydicom.fileset.FileSet` will
        be applied to the new File-set. The original
        :class:`~pydicom.fileset.FileSet` will remain staged.

        Parameters
        ----------
        path : str or PathLike
            The root directory where the File-set is to be copied to.
        force_implicit : bool, optional
            If ``True`` force the DICOMDIR file to be encoded using *Implicit
            VR Little Endian* which is non-conformant to the DICOM Standard
            (default ``False``).

        Returns
        -------
        pydicom.fileset.FileSet
            The copied File-set as a :class:`~pydicom.fileset.FileSet`.
        """
        # !! We can't change anything public in the original FileSet !!

        path = Path(path)
        if self.path and Path(self.path) == path:
            raise ValueError(
                "Cannot copy the File-set as the 'path' is unchanged"
            )

        if len(self) > 10**6:
            self._use_alphanumeric = True
        if len(self) > 36**6:
            raise NotImplementedError(
                "pydicom doesn't support writing File-sets with more than "
                "2176782336 managed instances"
            )

        # Removals are detached from the tree
        detached_nodes = []
        for instance in self._stage['-'].values():
            detached_nodes.append(instance.node)
            self._tree.remove(instance.node)
            continue

        file_ids = []
        for instance in self:
            file_ids.append(instance.ReferencedFileID)
            dst = path / Path(instance.FileID)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(instance.path, dst)
            instance.node._record.ReferencedFileID = (
                instance.FileID.split(os.path.sep)
            )

        # Create the DICOMDIR file
        p = path / 'DICOMDIR'
        with open(p, 'wb') as fp:
            f = DicomFileLike(fp)
            self._write_dicomdir(
                f, copy_safe=True, force_implicit=force_implicit
            )

        # Reset the *Referenced File ID* values
        # The order here doesn't matter because removed instances aren't
        #   yielded by iter(self)
        for instance, file_id in zip(self, file_ids):
            instance.node._record.ReferencedFileID = file_id

        # Reattach the removed nodes
        for node in detached_nodes:
            self._tree.add(node)

        fs = FileSet()
        fs.load(p, raise_orphans=True)

        return fs

    def _create_dicomdir(self) -> Dataset:
        """Return a new minimal DICOMDIR dataset."""
        ds = Dataset()
        ds.filename = None

        ds.file_meta = FileMetaDataset()
        ds.file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
        ds.file_meta.MediaStorageSOPInstanceUID = self.UID
        ds.file_meta.MediaStorageSOPClassUID = MediaStorageDirectoryStorage

        ds.FileSetID = self.ID
        ds.OffsetOfTheFirstDirectoryRecordOfTheRootDirectoryEntity = 0
        ds.OffsetOfTheLastDirectoryRecordOfTheRootDirectoryEntity = 0
        ds.FileSetConsistencyFlag = 0
        ds.DirectoryRecordSequence = []

        if self.descriptor_file_id:
            ds.FileSetDescriptorFileID = self.descriptor_file_id
        if self.descriptor_character_set:
            ds.SpecificCharacterSetOfFileSetDescriptorFile = (
                self.descriptor_character_set
            )

        return ds

    @property
    def descriptor_character_set(self) -> Union[str, None]:
        """Return the *Specific Character Set of File-set Descriptor File*
        (if available) or ``None``.
        """
        return self._charset

    @descriptor_character_set.setter
    def descriptor_character_set(self, val: Union[str, None]) -> None:
        """Set the *Specific Character Set of File-set Descriptor File*.

        The descriptor file itself is used for user comments related to the
        File-set (e.g. a README file) and is up the user to create.

        Parameters
        ----------
        val : str or None
            The value to use for the DICOMDIR's (0004,1142) *Specific
            Character Set of File-set Descriptor File*. See :dcm:`C.12.1.1.2
            in Part 3 of the DICOM Standard
            <part03/sect_C.12.html#sect_C.12.1.1.2>` for defined terms.

        See Also
        --------
        :attr:`~pydicom.fileset.FileSet.descriptor_file_id` set the descriptor
        file ID for the file that uses the character set.
        """
        if val == self._charset:
            return

        self._charset = val
        if self._ds:
            self._ds.SpecificCharacterSetOfFileSetDescriptorFile = val
        self._stage['^'] = True

    @property
    def descriptor_file_id(self) -> Union[str, None]:
        """Return the *File-set Descriptor File ID* (if available) or ``None``.
        """
        return self._descriptor

    @descriptor_file_id.setter
    def descriptor_file_id(self, val: Union[str, None]) -> None:
        """Set the *File-set Descriptor File ID*.

        The descriptor file itself is used for user comments related to the
        File-set (e.g. a README file) and is up the user to create.

        Parameters
        ----------
        val : str, list of str or None
            The value to use for the DICOMDIR's (0004,1141) *File-set
            Descriptor File ID*. Should be the relative path to the descriptor
            file and has a maximum length of 8 components, with each component
            up to 16 characters long.

        Raises
        ------
        ValueError
            If `val` has more than 8 items or if each item is longer than 16
            characters.

        See Also
        --------
        :attr:`~pydicom.fileset.FileSet.descriptor_character_set` the
        character set used in the descriptor file, required if an expanded or
        replaced character set is used.
        """
        if val == self._descriptor:
            return

        if val is None:
            pass
        elif isinstance(val, list):
            try:
                assert len(val) <= 8
                for component in val:
                    assert isinstance(component, str)
                    assert 0 <= len(component) <= 16
            except AssertionError:
                raise ValueError(
                    "The 'File-set Descriptor File ID' has a maximum of 8 "
                    "components, each between 0 and 16 characters long"
                )

            # Push the value through Path to clean it up and check validity
            val = list(Path(*val).parts)
        elif isinstance(val, str):
            if not 0 <= len(val) <= 16:
                raise ValueError(
                    "Each 'File-set Descriptor File ID' component has a "
                    "maximum length of 16 characters"
                )
        else:
            raise TypeError(
                "The 'DescriptorFileID' must be a str, list of str, or None"
            )

        self._descriptor = val
        if self._ds:
            self._ds.FileSetDescriptorFileID = self._descriptor
        self._stage['^'] = True

    def find(self, load: bool = False, **kwargs: Any) -> List[FileInstance]:
        """Return matching instances in the File-set

        **Limitations**

        * Only single value matching is supported so neither
          ``PatientID=['1234567', '7654321']`` or ``PatientID='1234567',
          PatientID='7654321'`` will work (although the first example will
          work if the *Patient ID* is actually multi-valued).
        * Repeating group and private elements cannot be used when searching.

        Parameters
        ----------
        load : bool, optional
            If ``True``, then load the SOP Instances belonging to the
            File-set and perform the search against their available elements.
            Otherwise (default) search only the elements available in the
            corresponding directory records (more efficient, but only a limited
            number of elements are available).
        **kwargs
            Search parameters, as element keyword=value (i.e.
            ``PatientID='1234567', StudyDescription="My study"``.

        Returns
        -------
        list of pydicom.fileset.FileInstance
            A list of matching instances.
        """
        if not kwargs:
            return self._instances[:]

        # Flag whether or not the query elements are in the DICOMDIR records
        has_elements = False

        def match(ds: Union[Dataset, FileInstance], **kwargs: Any) -> bool:
            nonlocal has_elements
            if load:
                ds = ds.load()

            # Check that all query elements are present
            if all([kw in ds for kw in kwargs]):
                has_elements = True

            for kw, val in kwargs.items():
                try:
                    assert ds[kw].value == val
                except (AssertionError, KeyError):
                    return False

            return True

        matches = []
        for instance in self:
            if match(instance, **kwargs):
                matches.append(instance)

        if not load and not has_elements:
            warnings.warn(
                "None of the records in the DICOMDIR dataset contain all "
                "the query elements, consider using the 'load' parameter "
                "to expand the search to the corresponding SOP instances"
            )

        return matches

    def find_values(
        self,
        elements: Union[str, int, List[Union[str, int]]],
        instances: Optional[List[FileInstance]] = None,
        load: bool = False
    ) -> Union[List[Any], Dict[Union[str, int], List[Any]]]:
        """Return a list of unique values for given element(s).

        Parameters
        ----------
        elements : str, int or pydicom.tag.BaseTag, or list of these
            The keyword or tag of the element(s) to search for.
        instances : list of pydicom.fileset.FileInstance, optional
            Search within the given instances. If not used then all available
            instances will be searched.
        load : bool, optional
            If ``True``, then load the SOP Instances belonging to the
            File-set and perform the search against their available elements.
            Otherwise (default) search only the elements available in the
            corresponding directory records (more efficient, but only a limited
            number of elements are available).

        Returns
        -------
        list of object(s), or dict of lists of object(s)

            * If single element was queried: A list of value(s) for the element
              available in the instances.
            * If list of elements was queried: A dict of element value pairs
              with lists of value(s) for the elements available in the instances.
        """
        element_list = elements if isinstance(elements, list) else [elements]
        has_element = {element: False for element in element_list}
        results: Dict[Union[str, int], List[Any]] = {
            element: [] for element in element_list
        }
        iter_instances = instances or iter(self)
        instance: Union[Dataset, FileInstance]
        for instance in iter_instances:
            if load:
                instance = instance.load()

            for element in element_list:
                if element not in instance:
                    continue

                has_element[element] = True
                val = instance[element].value
                # Not very efficient, but we can't use set
                if val not in results[element]:
                    results[element].append(val)

        missing_elements = [
            element for element, v in has_element.items() if not v
        ]
        if not load and missing_elements:
            warnings.warn(
                "None of the records in the DICOMDIR dataset contain "
                f"{missing_elements}, consider using the 'load' parameter "
                "to expand the search to the corresponding SOP instances"
            )

        if not isinstance(elements, list):
            return results[element_list[0]]

        return results

    @property
    def ID(self) -> Union[str, None]:
        """Return the *File-set ID* (if available) or ``None``."""
        return self._id

    @ID.setter
    def ID(self, val: Union[str, None]) -> None:
        """Set the File-set ID.

        Parameters
        ----------
        val : str or None
            The value to use for the DICOMDIR's (0004,1130) *File-set ID*.

        Raises
        ------
        ValueError
            If `val` is greater than 16 characters long.
        """
        if val == self._id:
            return

        if val is None or 0 <= len(val) <= 16:
            self._id = val
            if self._ds:
                self._ds.FileSetID = val
            self._stage['^'] = True
        else:
            raise ValueError(
                "The maximum length of the 'File-set ID' is 16 characters"
            )

    @property
    def is_staged(self) -> bool:
        """Return ``True`` if the File-set is new or has changes staged."""
        return any(self._stage[c] for c in '+-^~')

    def __iter__(self) -> Iterator[FileInstance]:
        """Yield :class:`~pydicom.fileset.FileInstance` from the File-set."""
        yield from self._instances[:]

    def __len__(self) -> int:
        """Return the number of instances in the File-set."""
        return len(self._instances)

    def load(
        self,
        ds_or_path: DSPathType,
        include_orphans: bool = True,
        raise_orphans: bool = False,
    ) -> None:
        """Load an existing File-set.

        Existing File-sets that do not use the same directory structure as
        *pydicom* will be staged to be moved to a new structure. This is
        because the DICOM Standard attaches no semantics to *how* the files
        in a File-set are to be structured so it's impossible to determine what
        the layout will be when changes are to be made.

        Parameters
        ----------
        ds_or_path : pydicom.dataset.Dataset, str or PathLike
            An existing File-set's DICOMDIR, either as a
            :class:`~pydicom.dataset.Dataset` or the path to the DICOMDIR file
            as :class:`str` or pathlike.
        include_orphans : bool, optional
            If ``True`` (default) include instances referenced by orphaned
            directory records in the File-set.
        raise_orphans : bool, optional
            If ``True`` then raise an exception if orphaned directory records
            are found in the File-set (default ``False``).
        """
        if isinstance(ds_or_path, Dataset):
            ds = ds_or_path
        else:
            ds = dcmread(ds_or_path)

        sop_class = ds.file_meta.get("MediaStorageSOPClassUID", None)
        if sop_class != MediaStorageDirectoryStorage:
            raise ValueError(
                "Unable to load the File-set as the supplied dataset is "
                "not a 'Media Storage Directory' instance"
            )

        tsyntax = ds.file_meta.TransferSyntaxUID
        if tsyntax != ExplicitVRLittleEndian:
            warnings.warn(
                "The DICOMDIR dataset uses an invalid transfer syntax "
                f"'{tsyntax.name}' and will be updated to use 'Explicit VR "
                "Little Endian'"
            )

        try:
            path = Path(cast(str, ds.filename)).resolve(strict=True)
        except FileNotFoundError:
            raise FileNotFoundError(
                "Unable to load the File-set as the 'filename' attribute "
                "for the DICOMDIR dataset is not a valid path: "
                f"{ds.filename}"
            )
        except TypeError:
            # Custom message if DICOMDIR from bytes, etc
            raise TypeError(
                "Unable to load the File-set as the DICOMDIR dataset must "
                "have a 'filename' attribute set to the path of the "
                "DICOMDIR file"
            )

        self.clear()
        self._id = cast(Optional[str], ds.get("FileSetID", None))
        uid = cast(
            Optional[UID], ds.file_meta.get("MediaStorageSOPInstanceUID")
        )
        if not uid:
            uid = generate_uid()
            ds.file_meta.MediaStorageSOPInstanceUID = uid
        self._uid = uid
        self._descriptor = cast(
            Optional[str], ds.get("FileSetDescriptorFileID", None)
        )
        self._charset = cast(
            Optional[str],
            ds.get("SpecificCharacterSetOfFileSetDescriptorFile", None)
        )
        self._path = path.parent
        self._ds = ds

        # Create the record tree
        self._parse_records(ds, include_orphans, raise_orphans)

        bad_instances = []
        for instance in self:
            # Check that the referenced file exists
            file_id = instance.node._file_id
            if file_id is None:
                bad_instances.append(instance)
                continue

            try:
                # self.path is already set at this point
                (cast(Path, self.path) / file_id).resolve(strict=True)
            except FileNotFoundError:
                bad_instances.append(instance)
                warnings.warn(
                    "The referenced SOP Instance for the directory record at "
                    f"offset {instance.node._offset} does not exist: "
                    f"{cast(Path, self.path) / file_id}"
                )
                continue

            # If the instance's existing directory structure doesn't match
            #   the pydicom semantics then stage for movement
            if instance.for_moving:
                self._stage['~'] = True

        for instance in bad_instances:
            self._instances.remove(instance)

    def _parse_records(
        self,
        ds: Dataset,
        include_orphans: bool,
        raise_orphans: bool = False
    ) -> None:
        """Parse the records in an existing DICOMDIR.

        Parameters
        ----------
        ds : pydicom.dataset.Dataset
            The File-set's DICOMDIR dataset.
        include_orphans : bool
            If ``True`` then include within the File-set orphaned records that
            contain a valid (and unique) *Referenced File ID* element. Orphaned
            records are those that aren't placed within the *Directory Record
            Sequence* hierarchy.
        raise_orphans : bool, optional
            If ``True`` then raise an exception if orphaned directory records
            are found in the File-set (default ``False``).
        """
        # First pass: get the offsets for each record
        records = {}
        for record in cast(Iterable[Dataset], ds.DirectoryRecordSequence):
            offset = cast(int, record.seq_item_tell)
            node = RecordNode(record)
            node._offset = offset
            records[offset] = node

        # Define the top-level nodes
        if records:
            node = records[ds[_FIRST_OFFSET].value]
            node.parent = self._tree
            while getattr(node._record, _NEXT_OFFSET, None):
                node = records[node._record[_NEXT_OFFSET].value]
                node.parent = self._tree

        # Second pass: build the record hierarchy
        #   Records not in the hierarchy will be ignored
        #   Branches without a valid leaf node File ID will be removed
        def recurse_node(node: RecordNode) -> None:
            child_offset = getattr(node._record, _LOWER_OFFSET, None)
            if child_offset:
                child = records[child_offset]
                child.parent = node

                next_offset = getattr(child._record, _NEXT_OFFSET, None)
                while next_offset:
                    child = records[next_offset]
                    child.parent = node
                    next_offset = getattr(child._record, _NEXT_OFFSET, None)
            elif "ReferencedFileID" not in node._record:
                # No children = leaf node, leaf nodes must reference a File ID
                del node.parent[node]

            # The leaf node references the FileInstance
            if "ReferencedFileID" in node._record:
                node.instance = FileInstance(node)
                self._instances.append(node.instance)

            for child in node.children:
                recurse_node(child)

        for node in self._tree.children:
            recurse_node(node)

        if len(records) == len(list(iter(self._tree))):
            return

        if raise_orphans:
            raise ValueError(
                "The DICOMDIR contains orphaned directory records"
            )

        # DICOMDIR contains orphaned records
        # Determine which nodes are both orphaned and reference an instance
        missing_set = set(records.keys()) - {ii._offset for ii in self._tree}
        missing = [records[o] for o in missing_set]
        missing = [r for r in missing if "ReferencedFileID" in r._record]

        if missing and not include_orphans:
            warnings.warn(
                f"The DICOMDIR has {len(missing)} orphaned directory records "
                "that reference an instance that will not be included in the "
                "File-set"
            )
            return

        for node in missing:
            # Get the path to the orphaned instance
            original_value = node._record.ReferencedFileID
            file_id = node._file_id
            if file_id is None:
                continue

            # self.path is set for an existing File Set
            path = cast(Path, self.path) / file_id
            if node.record_type == "PRIVATE":
                instance = self.add_custom(path, node)
            else:
                instance = self.add(path)

            # Because the record is new the Referenced File ID isn't set
            instance.node._record.ReferencedFileID = original_value

    @property
    def path(self) -> Optional[str]:
        """Return the absolute path to the File-set root directory as
        :class:`str` (if set) or ``None`` otherwise.
        """
        if self._path is not None:
            return os.fspath(self._path)

        return self._path

    def _recordify(self, ds: Dataset) -> Iterator[Dataset]:
        """Yield directory records for a SOP Instance.

        Parameters
        ----------
        ds : pydicom.dataset.Dataset
            The SOP Instance to create DICOMDIR directory records for.

        Yields
        ------
        ds : pydicom.dataset.Dataset
            A directory record for the instance, ordered from highest to
            lowest level.

        Raises
        ------
        ValueError
            If unable to create the required directory records because of
            a missing required element or element value.
        """
        # Single-level records: leaf
        record_type = _single_level_record_type(ds)
        if record_type != "PATIENT":
            try:
                record = DIRECTORY_RECORDERS[record_type](ds)
            except ValueError as exc:
                raise ValueError(
                    f"Unable to use the default '{record_type}' "
                    "record creator as the instance is missing a "
                    "required element or value. Either update the instance, "
                    "define your own record creation function or use "
                    "'FileSet.add_custom()' instead"
                ) from exc

            record.OffsetOfTheNextDirectoryRecord = 0
            record.RecordInUseFlag = 0xFFFF
            record.OffsetOfReferencedLowerLevelDirectoryEntity = 0
            record.DirectoryRecordType = record_type
            record.ReferencedFileID = None
            record.ReferencedSOPClassUIDInFile = ds.SOPClassUID
            record.ReferencedSOPInstanceUIDInFile = ds.SOPInstanceUID
            record.ReferencedTransferSyntaxUIDInFile = (
                ds.file_meta.TransferSyntaxUID
            )

            yield record
            return

        # Four-level records: PATIENT -> STUDY -> SERIES -> leaf
        records = []
        leaf_type = _four_level_record_type(ds)
        for record_type in ["PATIENT", "STUDY", "SERIES", leaf_type]:
            try:
                record = DIRECTORY_RECORDERS[record_type](ds)
            except ValueError as exc:
                raise ValueError(
                    f"Unable to use the default '{record_type}' "
                    "record creator as the instance is missing a "
                    "required element or value. Either update the instance, "
                    "define your own record creation function or use "
                    "'FileSet.add_custom()' instead"
                ) from exc

            record.OffsetOfTheNextDirectoryRecord = 0
            record.RecordInUseFlag = 0xFFFF
            record.OffsetOfReferencedLowerLevelDirectoryEntity = 0
            record.DirectoryRecordType = record_type
            if "SpecificCharacterSet" in ds:
                record.SpecificCharacterSet = ds.SpecificCharacterSet

            records.append(record)

        # Add the instance referencing elements to the leaf
        leaf = records[3]
        leaf.ReferencedFileID = None
        leaf.ReferencedSOPClassUIDInFile = ds.SOPClassUID
        leaf.ReferencedSOPInstanceUIDInFile = ds.SOPInstanceUID
        leaf.ReferencedTransferSyntaxUIDInFile = (
            ds.file_meta.TransferSyntaxUID
        )

        yield from records

    def remove(
        self, instance: Union[FileInstance, List[FileInstance]]
    ) -> None:
        """Stage instance(s) for removal from the File-set.

        If the instance has been staged for addition to the File-set, calling
        :meth:`~pydicom.fileset.FileSet.remove` will cancel the staging and
        the instance will not be added.

        Parameters
        ----------
        instance : pydicom.fileset.FileInstance or a list of FileInstance
            The instance(s) to remove from the File-set.
        """
        if isinstance(instance, list):
            for item in instance:
                self.remove(item)
            return

        if instance not in self._instances:
            raise ValueError("No such instance in the File-set")

        # If staged for addition, no longer add
        if instance.SOPInstanceUID in self._stage['+']:
            leaf = instance.node
            del leaf.parent[leaf]
            del self._stage['+'][instance.SOPInstanceUID]
            # Delete file from stage
            try:
                Path(instance.path).unlink()
            except FileNotFoundError:
                pass
            instance._apply_stage('-')
            self._instances.remove(instance)

        # Stage for removal if not already done
        elif instance.SOPInstanceUID not in self._stage['-']:
            instance._apply_stage('-')
            self._stage['-'][instance.SOPInstanceUID] = instance
            self._instances.remove(instance)

    def __str__(self) -> str:
        """Return a string representation of the FileSet."""
        s = [
            "DICOM File-set",
            f"  Root directory: {self.path or '(no value available)'}",
            f"  File-set ID: {self.ID or '(no value available)'}",
            f"  File-set UID: {self.UID}",
            (
                f"  Descriptor file ID: "
                f"{self.descriptor_file_id or '(no value available)'}"
            ),
            (
                f"  Descriptor file character set: "
                f"{self.descriptor_character_set or '(no value available)'}"
            ),
        ]
        if self.is_staged:
            changes = []
            if not self._ds:
                changes.append("DICOMDIR creation")
            else:
                changes.append("DICOMDIR update")

            if self._stage['~']:
                changes.append("directory structure update")

            if self._stage['+']:
                suffix = 's' if len(self._stage['+']) > 1 else ''
                changes.append(f"{len(self._stage['+'])} addition{suffix}")
            if self._stage['-']:
                suffix = 's' if len(self._stage['-']) > 1 else ''
                changes.append(f"{len(self._stage['-'])} removal{suffix}")

            s.append(f"  Changes staged for write(): {', '.join(changes)}")

        if not self._tree.children:
            return '\n'.join(s)

        s.append("\n  Managed instances:")
        s.extend([f"    {ii}" for ii in self._tree.prettify()])

        return '\n'.join(s)

    @property
    def UID(self) -> UID:
        """Return the File-set's UID."""
        return cast(UID, self._uid)

    @UID.setter
    def UID(self, uid: UID) -> None:
        """Set the File-set UID.

        Parameters
        ----------
        uid : pydicom.uid.UID
            The UID to use as the new File-set UID.
        """
        if uid == self._uid:
            return

        uid = UID(uid)
        assert uid.is_valid
        self._uid = uid
        if self._ds:
            self._ds.file_meta.MediaStorageSOPInstanceUID = uid

        self._stage['^'] = True

    def write(
        self,
        path: Optional[Union[str, os.PathLike]] = None,
        use_existing: bool = False,
        force_implicit: bool = False
    ) -> None:
        """Write the File-set, or changes to the File-set, to the file system.

        .. warning::

            If modifying an existing File-set it's **strongly recommended**
            that you follow standard data management practices and ensure that
            you have an up-to-date backup of the original data.

        By default, for both new or existing File-sets, *pydicom* uses the
        following directory structure semantics when writing out changes:

        * For instances defined using the standard four-levels of directory
          records (i.e. PATIENT/STUDY/SERIES + one of the record types
          such as IMAGE or RT DOSE): ``PTxxxxxx/STxxxxxx/SExxxxxx/`` with a
          filename such as ``IMxxxxxx`` (for IMAGE), where the first two
          characters are dependent on the record type and ``xxxxxx`` is a
          numeric or alphanumeric index.
        * For instances defined using the standard one-level directory record
          (i.e. PALETTE, IMPLANT): a filename such as ``PAxxxxxx`` (for
          PALETTE).
        * For instances defined using PRIVATE directory records then the
          structure will be along the lines of ``P0xxxxxx/P1xxxxxx/P2xxxxxx``
          for PRIVATE/PRIVATE/PRIVATE, ``PTxxxxxx/STxxxxxx/P2xxxxxx`` for
          PATIENT/STUDY/PRIVATE.

        When only changes to the DICOMDIR file are required or instances have
        only been removed from an existing File-set you can use the
        `use_existing` keyword parameter to keep the existing directory
        structure and only update the DICOMDIR file.

        Parameters
        ----------
        path : str or PathLike, optional
            For new File-sets, the absolute path to the root directory where
            the File-set will be written. Using `path` with an existing
            File-set will raise :class:`ValueError`.
        use_existing : bool, optional
            If ``True`` and no instances have been added to the File-set
            (removals are OK), then only update the DICOMDIR file, keeping
            the current directory structure rather than converting everything
            to the semantics used by *pydicom* for File-sets (default
            ``False``).
        force_implicit : bool, optional
            If ``True`` force the DICOMDIR file to be encoded using *Implicit
            VR Little Endian* which is non-conformant to the DICOM Standard
            (default ``False``).

        Raises
        ------
        ValueError
            If `use_existing` is ``True`` but instances have been staged
            for addition to the File-set.
        """
        if not path and self.path is None:
            raise ValueError(
                "The path to the root directory is required for a "
                "new File-set"
            )

        if path and self.path:
            raise ValueError(
                "The path for an existing File-set cannot be changed, use "
                "'FileSet.copy()' to write the File-set to a new location"
            )

        if path:
            self._path = Path(path)

        # Don't write unless changed or new
        if not self.is_staged:
            return

        # Path to the DICOMDIR file
        p = cast(Path, self._path) / 'DICOMDIR'

        # Re-use the existing directory structure if only moves or removals
        #   are required and `use_existing` is True
        major_change = bool(self._stage['+'])
        if use_existing and major_change:
            raise ValueError(
                "'Fileset.write()' called with 'use_existing' but additions "
                "to the File-set's managed instances are staged"
            )

        if not use_existing:
            major_change |= self._stage['~']

        # Worst case scenario if all instances in one directory
        if len(self) > 10**6:
            self._use_alphanumeric = True
        if len(self) > 36**6:
            raise NotImplementedError(
                "pydicom doesn't support writing File-sets with more than "
                "2176782336 managed instances"
            )

        # Remove the removals - must be first because the File IDs will be
        #   incorrect with the removals still in the tree
        for instance in self._stage['-'].values():
            try:
                Path(instance.path).unlink()
            except FileNotFoundError:
                pass
            self._tree.remove(instance.node)

        if use_existing and not major_change:
            with open(p, 'wb') as fp:
                f = DicomFileLike(fp)
                self._write_dicomdir(f, force_implicit=force_implicit)

            self.load(p, raise_orphans=True)

            return

        # We need to be careful not to overwrite the source file
        #   for a different (later) instance
        # Check for collisions between the new and old File IDs
        #   and copy any to the stage
        fout = {Path(ii.FileID) for ii in self}
        fin = {
            ii.node._file_id for ii in self
            if ii.SOPInstanceUID not in self._stage['+']
        }
        collisions = fout & fin
        for instance in [ii for ii in self if ii.node._file_id in collisions]:
            self._stage['+'][instance.SOPInstanceUID] = instance
            instance._apply_stage('+')
            shutil.copyfile(
                self._path / instance.node._file_id, instance.path
            )

        for instance in self:
            dst = self._path / instance.FileID
            dst.parent.mkdir(parents=True, exist_ok=True)
            fn: Callable
            if instance.SOPInstanceUID in self._stage['+']:
                src = instance.path
                fn = shutil.copyfile
            else:
                src = self._path / instance.node._file_id
                fn = shutil.move

            fn(os.fspath(src), os.fspath(dst))
            instance.node._record.ReferencedFileID = (
                instance.FileID.split(os.path.sep)
            )

        # Create the DICOMDIR file
        with open(p, 'wb') as fp:
            f = DicomFileLike(fp)
            self._write_dicomdir(f, force_implicit=force_implicit)

        # Reload the File-set
        #   We're doing things wrong if we have orphans so raise
        self.load(p, raise_orphans=True)

    def _write_dicomdir(
        self,
        fp: DicomFileLike,
        copy_safe: bool = False,
        force_implicit: bool = False
    ) -> None:
        """Encode and write the File-set's DICOMDIR dataset.

        Parameters
        ----------
        fp : file-like
            The file-like to write the encoded DICOMDIR dataset to. Must
            have ``write()``, ``tell()`` and ``seek()`` methods.
        copy_safe : bool, optional
            If ``True`` then the function doesn't make any changes to the
            public parts of the current :class:`~pydicom.fileset.FileSet`
            instance.
        force_implicit : bool, optional
            Force encoding the DICOMDIR with 'Implicit VR Little Endian' which
            is non-conformant to the DICOM Standard (default ``False``).
        """
        ds = self._ds
        if copy_safe or not ds:
            ds = self._create_dicomdir()

        # By default, always convert to the correct syntax
        ds.file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
        seq_offset = 12
        if force_implicit:
            ds.file_meta.TransferSyntaxUID = ImplicitVRLittleEndian
            seq_offset = 8

        fp.is_implicit_VR = ds.file_meta.TransferSyntaxUID.is_implicit_VR
        fp.is_little_endian = ds.file_meta.TransferSyntaxUID.is_little_endian

        # Reset the offsets
        first_elem = ds[_FIRST_OFFSET]
        first_elem.value = 0
        last_elem = ds[_LAST_OFFSET]
        last_elem.value = 0

        # Write the preamble, DICM marker and File Meta
        fp.write(b'\x00' * 128 + b'DICM')
        write_file_meta_info(fp, ds.file_meta, enforce_standard=True)

        # Write the dataset
        # Write up to the *Offset of the First Directory Record...* element
        write_dataset(fp, ds[:0x00041200])
        tell_offset_first = fp.tell()  # Start of *Offset of the First...*
        # Write up to (but not including) the *Directory Record Sequence*
        write_dataset(fp, ds[0x00041200:0x00041220])

        # Rebuild and encode the *Directory Record Sequence*
        # Step 1: Determine the offsets for all the records
        offset = fp.tell() + seq_offset  # Start of the first seq. item tag
        for node in self._tree:
            # RecordNode._offset is the start of each record's seq. item tag
            node._offset = offset
            offset += 8  # a sequence item's (tag + length)
            # Copy safe - only modifies RecordNode._offset
            offset += node._encode_record(force_implicit)
            # If the sequence item has undefined length then it uses a
            #   sequence item delimiter item
            if node._record.is_undefined_length_sequence_item:
                offset += 8

        # Step 2: Update the records and add to *Directory Record Sequence*
        ds.DirectoryRecordSequence = []
        for node in self._tree:
            record = node._record
            if not copy_safe:
                node._update_record_offsets()
            else:
                record = copy.deepcopy(record)
                next_elem = record[_NEXT_OFFSET]
                next_elem.value = 0
                if node.next:
                    next_elem.value = node.next._offset

                lower_elem = record[_LOWER_OFFSET]
                lower_elem.value = 0
                if node.children:
                    record[_LOWER_OFFSET].value = node.children[0]._offset

            cast(List[Dataset], ds.DirectoryRecordSequence).append(record)

        # Step 3: Encode *Directory Record Sequence* and the rest
        write_dataset(fp, ds[0x00041220:])

        # Update the first and last record offsets
        if self._tree.children:
            first_elem.value = self._tree.children[0]._offset
            last_elem.value = self._tree.children[-1]._offset
            # Re-write the record offset pointer elements
            fp.seek(tell_offset_first)
            write_data_element(fp, first_elem)
            write_data_element(fp, last_elem)
            # Go to the end
            fp.seek(0, 2)


# Functions for creating Directory Records
def _check_dataset(ds: Dataset, keywords: List[str]) -> None:
    """Check the dataset module for the Type 1 `keywords`.

    Parameters
    ----------
    ds : pydicom.dataset.Dataset
        The dataset to check.
    keywords : list of str
        The DICOM keywords for Type 1 elements that are to be checked.

    Raises
    ------
    KeyError
        If an element is not in the dataset.
    ValueError
        If the element is present but has no value.
    """
    for kw in keywords:
        tag = Tag(cast(int, tag_for_keyword(kw)))
        name = dictionary_description(tag)
        if kw not in ds:
            raise ValueError(
                f"The instance's {tag} '{name}' element is missing"
            )

        if ds[kw].VM != 0:
            continue

        raise ValueError(
            f"The instance's {tag} '{name}' element cannot be empty"
        )


def _define_patient(ds: Dataset) -> Dataset:
    """Return a PATIENT directory record from `ds`."""
    _check_dataset(ds, ["PatientID"])

    record = Dataset()
    record.PatientName = ds.get("PatientName")
    record.PatientID = ds.PatientID

    return record


def _define_study(ds: Dataset) -> Dataset:
    """Return a STUDY directory record from `ds`."""
    _check_dataset(ds, ["StudyDate", "StudyTime", "StudyID"])

    record = Dataset()
    record.StudyDate = ds.StudyDate
    record.StudyTime = ds.StudyTime
    record.StudyDescription = ds.get("StudyDescription")
    if "StudyInstanceUID" in ds:
        _check_dataset(ds, ["StudyInstanceUID"])
        record.StudyInstanceUID = ds.StudyInstanceUID
    record.StudyID = ds.StudyID
    record.AccessionNumber = ds.get("AccessionNumber")

    return record


def _define_series(ds: Dataset) -> Dataset:
    """Return a SERIES directory record from `ds`."""
    _check_dataset(ds, ["Modality", "SeriesInstanceUID", "SeriesNumber"])

    record = Dataset()
    record.Modality = ds.Modality
    record.SeriesInstanceUID = ds.SeriesInstanceUID
    record.SeriesNumber = ds.SeriesNumber

    return record


def _define_image(ds: Dataset) -> Dataset:
    """Return an IMAGE directory record from `ds`."""
    _check_dataset(ds, ["InstanceNumber"])

    record = Dataset()
    record.InstanceNumber = ds.InstanceNumber

    return record


def _define_rt_dose(ds: Dataset) -> Dataset:
    """Return an RT DOSE directory record from `ds`."""
    _check_dataset(ds, ["InstanceNumber", "DoseSummationType"])

    record = Dataset()
    record.InstanceNumber = ds.InstanceNumber
    record.DoseSummationType = ds.DoseSummationType

    return record


def _define_rt_structure_set(ds: Dataset) -> Dataset:
    """Return an RT STRUCTURE SET directory record from `ds`."""
    _check_dataset(ds, ["InstanceNumber", "StructureSetLabel"])

    record = Dataset()
    record.InstanceNumber = ds.InstanceNumber
    record.StructureSetLabel = ds.StructureSetLabel
    record.StructureSetDate = ds.get("StructureSetDate")
    record.StructureSetTime = ds.get("StructureSetTime")

    return record


def _define_rt_plan(ds: Dataset) -> Dataset:
    """Return an RT PLAN directory record from `ds`."""
    _check_dataset(ds, ["InstanceNumber", "RTPlanLabel"])

    record = Dataset()
    record.InstanceNumber = ds.InstanceNumber
    record.RTPlanLabel = ds.RTPlanLabel
    record.RTPlanDate = ds.get("RTPlanDate")
    record.RTPlanTime = ds.get("RTPlanTime")

    return record


def _define_rt_treatment_record(ds: Dataset) -> Dataset:
    """Return an RT TREAT RECORD directory record from `ds`."""
    _check_dataset(ds, ["InstanceNumber"])

    record = Dataset()
    record.InstanceNumber = ds.InstanceNumber
    record.TreatmentDate = ds.get("TreatmentDate")
    record.TreatmentTime = ds.get("TreatmentTime")

    return record


def _define_presentation(ds: Dataset) -> Dataset:
    """Return a PRESENTATION directory record from `ds`."""
    _check_dataset(
        ds,
        [
            "PresentationCreationDate", "PresentationCreationTime",
            "InstanceNumber", "ContentLabel"
        ]
    )

    record = Dataset()
    record.PresentationCreationDate = ds.PresentationCreationDate
    record.PresentationCreationTime = ds.PresentationCreationTime
    # Content Identification Macro
    record.InstanceNumber = ds.InstanceNumber
    record.ContentLabel = ds.ContentLabel
    record.ContentDescription = ds.get("ContentDescription")
    record.ContentCreatorName = ds.get("ContentCreatorName")
    if "ReferencedSeriesSequence" in ds:
        _check_dataset(ds, ["ReferencedSeriesSequence"])
        record.ReferencedSeriesSequence = ds.ReferencedSeriesSequence
    if "BlendingSequence" in ds:
        _check_dataset(ds, ["BlendingSequence"])
        record.BlendingSequence = ds.BlendingSequence

    return record


def _define_sr_document(ds: Dataset) -> Dataset:
    """Return a SR DOCUMENT directory record from `ds`."""
    _check_dataset(
        ds,
        [
            "InstanceNumber", "CompletionFlag", "VerificationFlag",
            "ContentDate", "ContentTime", "ConceptNameCodeSequence",
        ]
    )

    record = Dataset()
    record.InstanceNumber = ds.InstanceNumber
    record.CompletionFlag = ds.CompletionFlag
    record.VerificationFlag = ds.VerificationFlag
    record.ContentDate = ds.ContentDate
    record.ContentTime = ds.ContentTime
    if "VerificationDateTime" in ds:
        _check_dataset(ds, ["VerificationDateTime"])
        record.VerificationDateTime = ds.VerificationDateTime
    record.ConceptNameCodeSequence = ds.ConceptNameCodeSequence
    if "ContentSequence" in ds:
        _check_dataset(ds, ["ContentSequence"])
        record.ContentSequence = ds.ContentSequence

    return record


def _define_key_object_doc(ds: Dataset) -> Dataset:
    """Return a KEY OBJECT DOC directory record from `ds`."""
    _check_dataset(
        ds,
        [
            "InstanceNumber", "ContentDate", "ContentTime",
            "ConceptNameCodeSequence",
        ]
    )

    record = Dataset()
    record.ContentDate = ds.ContentDate
    record.ContentTime = ds.ContentTime
    record.InstanceNumber = ds.InstanceNumber
    record.ConceptNameCodeSequence = ds.ConceptNameCodeSequence
    if "ContentSequence" in ds:
        _check_dataset(ds, ["ContentSequence"])
        record.ContentSequence = ds.ContentSequence

    return record


def _define_spectroscopy(ds: Dataset) -> Dataset:
    """Return an SPECTROSCOPY directory record from `ds`."""
    _check_dataset(
        ds,
        [
            "ImageType", "ContentDate", "ContentTime", "InstanceNumber",
            "NumberOfFrames", "Rows", "Columns", "DataPointRows",
            "DataPointColumns"
        ]
    )

    record = Dataset()
    record.ImageType = ds.ImageType
    record.ContentDate = ds.ContentDate
    record.ContentTime = ds.ContentTime
    record.InstanceNumber = ds.InstanceNumber
    if "ReferencedImageEvidenceSequence" in ds:
        _check_dataset(ds, ["ReferencedImageEvidenceSequence"])

        record.ReferencedImageEvidenceSequence = (
            ds.ReferencedImageEvidenceSequence
        )

    record.NumberOfFrames = ds.NumberOfFrames
    record.Rows = ds.Rows
    record.Columns = ds.Columns
    record.DataPointRows = ds.DataPointRows
    record.DataPointColumns = ds.DataPointColumns

    return record


def _define_hanging_protocol(ds: Dataset) -> Dataset:
    """Return a HANGING PROTOCOL directory record from `ds`."""
    _check_dataset(
        ds,
        [
            "HangingProtocolCreator", "HangingProtocolCreationDateTime",
            "HangingProtocolDefinitionSequence", "NumberOfPriorsReferenced",
        ]
    )

    record = Dataset()
    record.HangingProtocolCreator = ds.HangingProtocolCreator
    record.HangingProtocolCreationDateTime = ds.HangingProtocolCreationDateTime
    record.HangingProtocolDefinitionSequence = (
        ds.HangingProtocolDefinitionSequence
    )
    record.NumberOfPriorsReferenced = ds.NumberOfPriorsReferenced
    record.HangingProtocolUserIdentificationCodeSequence = (
        ds.get("HangingProtocolUserIdentificationCodeSequence", [])
    )

    return record


def _define_encap_doc(ds: Dataset) -> Dataset:
    """Return an ENCAP DOC directory record from `ds`."""
    _check_dataset(ds, ["InstanceNumber", "MIMETypeOfEncapsulatedDocument"])

    record = Dataset()
    record.ContentDate = ds.get("ContentDate")
    record.ContentTime = ds.get("ContentTime")
    record.InstanceNumber = ds.InstanceNumber
    record.DocumentTitle = ds.get("DocumentTitle")
    if "HL7InstanceIdentifier" in ds:
        _check_dataset(ds, ["HL7InstanceIdentifier"])
        record.HL7InstanceIdentifier = ds.HL7InstanceIdentifier
    record.ConceptNameCodeSequence = ds.get("ConceptNameCodeSequence")

    record.MIMETypeOfEncapsulatedDocument = ds.MIMETypeOfEncapsulatedDocument

    return record


def _define_palette(ds: Dataset) -> Dataset:
    """Return a PALETTE directory record from `ds`."""
    _check_dataset(ds, ["ContentLabel"])

    record = Dataset()
    record.ContentLabel = ds.ContentLabel
    record.ContentDescription = ds.get("ContentDescription")

    return record


def _define_implant(ds: Dataset) -> Dataset:
    """Return a IMPLANT directory record from `ds`."""
    _check_dataset(ds, ["Manufacturer", "ImplantName", "ImplantPartNumber"])

    record = Dataset()
    record.Manufacturer = ds.Manufacturer
    record.ImplantName = ds.ImplantName
    if "ImplantSize" in ds:
        _check_dataset(ds, ["ImplantSize"])
        record.ImplantSize = ds.ImplantSize
    record.ImplantPartNumber = ds.ImplantPartNumber

    return record


def _define_implant_assy(ds: Dataset) -> Dataset:
    """Return a IMPLANT ASSY directory record from `ds`."""
    _check_dataset(
        ds,
        [
            "ImplantAssemblyTemplateName", "Manufacturer",
            "ProcedureTypeCodeSequence"
        ]
    )

    record = Dataset()
    record.ImplantAssemblyTemplateName = ds.ImplantAssemblyTemplateName
    record.Manufacturer = ds.Manufacturer
    record.ProcedureTypeCodeSequence = ds.ProcedureTypeCodeSequence

    return record


def _define_implant_group(ds: Dataset) -> Dataset:
    """Return a IMPLANT GROUP directory record from `ds`."""
    _check_dataset(
        ds,
        ["ImplantTemplateGroupName", "ImplantTemplateGroupIssuer"]
    )

    record = Dataset()
    record.ImplantTemplateGroupName = ds.ImplantTemplateGroupName
    record.ImplantTemplateGroupIssuer = ds.ImplantTemplateGroupIssuer

    return record


def _define_surface_scan(ds: Dataset) -> Dataset:
    """Return a SURFACE SCAN directory record from `ds`."""
    _check_dataset(ds, ["ContentDate", "ContentTime"])

    record = Dataset()
    record.ContentDate = ds.ContentDate
    record.ContentTime = ds.ContentTime

    return record


def _define_assessment(ds: Dataset) -> Dataset:
    """Return a ASSESSMENT directory record from `ds`."""
    _check_dataset(ds, ["InstanceNumber", "InstanceCreationDate"])

    record = Dataset()
    record.InstanceNumber = ds.InstanceNumber
    record.InstanceCreationDate = ds.InstanceCreationDate
    record.InstanceCreationTime = ds.get("InstanceCreationTime")

    return record


def _define_radiotherapy(ds: Dataset) -> Dataset:
    """Return a RADIOTHERAPY directory record from `ds`."""
    _check_dataset(ds, ["InstanceNumber"])

    record = Dataset()
    record.InstanceNumber = ds.InstanceNumber
    if "UserContentLabel" in ds:
        _check_dataset(ds, ["UserContentLabel"])
        record.UserContentLabel = ds.UserContentLabel
    if "UserContentLongLabel" in ds:
        _check_dataset(ds, ["UserContentLongLabel"])
        record.UserContentLongLabel = ds.UserContentLongLabel

    record.ContentDescription = ds.get("ContentDescription")
    record.ContentCreatorName = ds.get("ContentCreatorName")

    return record


def _define_generic_content(ds: Dataset) -> Dataset:
    """Return a WAVEFORM/RAW DATA directory record from `ds`."""
    _check_dataset(ds, ["InstanceNumber", "ContentDate", "ContentTime"])

    record = Dataset()
    record.InstanceNumber = ds.InstanceNumber
    record.ContentDate = ds.ContentDate
    record.ContentTime = ds.ContentTime

    return record


def _define_generic_content_id(ds: Dataset) -> Dataset:
    """Return a generic content identification directory record from `ds`."""
    _check_dataset(
        ds,
        ["InstanceNumber", "ContentDate", "ContentTime", "ContentLabel"]
    )

    # Content Identification Macro
    record = Dataset()
    record.InstanceNumber = ds.InstanceNumber
    record.ContentDate = ds.ContentDate
    record.ContentTime = ds.ContentTime
    record.ContentLabel = ds.ContentLabel
    record.ContentDescription = ds.get("ContentDescription")
    record.ContentCreatorName = ds.get("ContentCreatorName")

    return record


def _define_empty(ds: Dataset) -> Dataset:
    """Return an empty directory record from `ds`."""
    return Dataset()


DIRECTORY_RECORDERS = {
    "PATIENT": _define_patient,  # TOP LEVEL
    "STUDY": _define_study,  # INTERMEDIATE or LEAF
    "SERIES": _define_series,  # INTERMEDIATE
    "IMAGE": _define_image,  # LEAF
    "RT DOSE": _define_rt_dose,  # LEAF
    "RT STRUCTURE SET": _define_rt_structure_set,  # LEAF
    "RT PLAN": _define_rt_plan,  # LEAF
    "RT TREAT RECORD": _define_rt_treatment_record,  # LEAF
    "PRESENTATION": _define_presentation,  # LEAF
    "WAVEFORM": _define_generic_content,  # LEAF
    "SR DOCUMENT": _define_sr_document,  # LEAF
    "KEY OBJECT DOC": _define_key_object_doc,  # LEAF
    "SPECTROSCOPY": _define_spectroscopy,  # LEAF
    "RAW DATA": _define_generic_content,  # LEAF
    "REGISTRATION": _define_generic_content_id,  # LEAF
    "FIDUCIAL": _define_generic_content_id,  # LEAF
    "HANGING PROTOCOL": _define_hanging_protocol,  # TOP LEVEL and LEAF
    "ENCAP DOC": _define_encap_doc,  # LEAF
    "VALUE MAP": _define_generic_content_id,  # LEAF
    "STEREOMETRIC": _define_empty,  # LEAF
    "PALETTE": _define_palette,  # TOP LEVEL and LEAF
    "IMPLANT": _define_implant,  # TOP LEVEL and LEAF
    "IMPLANT ASSY": _define_implant_assy,  # TOP LEVEL and LEAF
    "IMPLANT GROUP": _define_implant_group,  # TOP LEVEL and LEAF
    "PLAN": _define_empty,  # LEAF
    "MEASUREMENT": _define_generic_content_id,  # LEAF
    "SURFACE": _define_generic_content_id,  # LEAF
    "SURFACE SCAN": _define_surface_scan,  # LEAF
    "TRACT": _define_generic_content_id,  # LEAF
    "ASSESSMENT": _define_assessment,  # LEAF
    "RADIOTHERAPY": _define_radiotherapy,  # LEAF
}
"""A :class:`dict` containing the directory record creation functions.

The functions are used to create non-PRIVATE records for a given SOP Instance
as ``{"RECORD TYPE": callable}``, where ``"RECORD TYPE"`` should match one of
the allowable values - except PRIVATE - for (0004,1430) *Directory Record
Type*. By overriding the function for a given record type you can customize
the directory records that will be included in the DICOMDIR file.

Example
-------

.. code-block:: python

    from pydicom.fileset import DIRECTORY_RECORDERS, FileSet

    def my_recorder(ds: Dataset) -> Dataset:
        record = Dataset()
        record.OffsetOfTheNextDirectoryRecord = 0
        record.RecordInUseFlag = 0xFFFF
        record.OffsetOfReferencedLowerLevelDirectoryEntity = 0
        record.DirectoryRecordType = "PATIENT"
        if "SpecificCharacterSet" in ds:
            record.SpecificCharacterSet = ds.SpecificCharacterSet

        record.PatientName = ds.get("PatientName")
        record.PatientID = ds.PatientID

        return record

    DIRECTORY_RECORDERS["PATIENT"] = my_recorder

    # Use the updated directory recorder
    fs = FileSet()
    fs.add('my_instance.dcm')

The function should take a single parameter which is the SOP Instance to be
added to the File-set as a :class:`~pydicom.dataset.Dataset` and return a
:class:`~pydicom.dataset.Dataset` with a single directory record matching the
directory record type. See :dcm:`Annex F.3.2.2<chtml/part03/sect_F.3.2.2.html>`
for possible record types.

For PRIVATE records you must use the
:meth:`~pydicom.fileset.FileSet.add_custom` method instead.
"""
_SINGLE_LEVEL_SOP_CLASSES = {
    sop.HangingProtocolStorage: "HANGING PROTOCOL",
    sop.ColorPaletteStorage: "PALETTE",
    sop.GenericImplantTemplateStorage: "IMPLANT",
    sop.ImplantAssemblyTemplateStorage: "IMPLANT ASSY",
    sop.ImplantTemplateGroupStorage: "IMPLANT GROUP",
}
_FOUR_LEVEL_SOP_CLASSES = {
    sop.RTDoseStorage: "RT DOSE",
    sop.RTStructureSetStorage: "RT STRUCTURE SET",
    sop.RTBeamsTreatmentRecordStorage: "RT TREAT RECORD",
    sop.RTBrachyTreatmentRecordStorage: "RT TREAT RECORD",
    sop.RTTreatmentSummaryRecordStorage: "RT TREAT RECORD",
    sop.RTIonBeamsTreatmentRecordStorage: "RT TREAT RECORD",
    sop.GrayscaleSoftcopyPresentationStateStorage: "PRESENTATION",
    sop.ColorSoftcopyPresentationStateStorage: "PRESENTATION",
    sop.PseudoColorSoftcopyPresentationStateStorage: "PRESENTATION",
    sop.BlendingSoftcopyPresentationStateStorage: "PRESENTATION",
    sop.XAXRFGrayscaleSoftcopyPresentationStateStorage: "PRESENTATION",
    sop.BasicStructuredDisplayStorage: "PRESENTATION",
    sop.BasicVoiceAudioWaveformStorage: "WAVEFORM",
    sop.TwelveLeadECGWaveformStorage: "WAVEFORM",
    sop.GeneralECGWaveformStorage: "WAVEFORM",
    sop.AmbulatoryECGWaveformStorage: "WAVEFORM",
    sop.HemodynamicWaveformStorage: "WAVEFORM",
    sop.CardiacElectrophysiologyWaveformStorage: "WAVEFORM",
    sop.ArterialPulseWaveformStorage: "WAVEFORM",
    sop.RespiratoryWaveformStorage: "WAVEFORM",
    sop.GeneralAudioWaveformStorage: "WAVEFORM",
    sop.RoutineScalpElectroencephalogramWaveformStorage: "WAVEFORM",
    sop.ElectromyogramWaveformStorage: "WAVEFORM",
    sop.ElectrooculogramWaveformStorage: "WAVEFORM",
    sop.SleepElectroencephalogramWaveformStorage: "WAVEFORM",
    sop.MultichannelRespiratoryWaveformStorage: "WAVEFORM",
    sop.BodyPositionWaveformStorage: "WAVEFORM",
    sop.BasicTextSRStorage: "SR DOCUMENT",
    sop.EnhancedSRStorage: "SR DOCUMENT",
    sop.ComprehensiveSRStorage: "SR DOCUMENT",
    sop.MammographyCADSRStorage: "SR DOCUMENT",
    sop.ChestCADSRStorage: "SR DOCUMENT",
    sop.ProcedureLogStorage: "SR DOCUMENT",
    sop.XRayRadiationDoseSRStorage: "SR DOCUMENT",
    sop.SpectaclePrescriptionReportStorage: "SR DOCUMENT",
    sop.ColonCADSRStorage: "SR DOCUMENT",
    sop.MacularGridThicknessAndVolumeReportStorage: "SR DOCUMENT",
    sop.ImplantationPlanSRStorage: "SR DOCUMENT",
    sop.Comprehensive3DSRStorage: "SR DOCUMENT",
    sop.RadiopharmaceuticalRadiationDoseSRStorage: "SR DOCUMENT",
    sop.ExtensibleSRStorage: "SR DOCUMENT",
    sop.AcquisitionContextSRStorage: "SR DOCUMENT",
    sop.SimplifiedAdultEchoSRStorage: "SR DOCUMENT",
    sop.PatientRadiationDoseSRStorage: "SR DOCUMENT",
    sop.PlannedImagingAgentAdministrationSRStorage: "SR DOCUMENT",
    sop.PerformedImagingAgentAdministrationSRStorage: "SR DOCUMENT",
    sop.KeyObjectSelectionDocumentStorage: "KEY OBJECT DOC",
    sop.MRSpectroscopyStorage: "SPECTROSCOPY",
    sop.RawDataStorage: "RAW DATA",
    sop.SpatialRegistrationStorage: "REGISTRATION",
    sop.DeformableSpatialRegistrationStorage: "REGISTRATION",
    sop.SpatialFiducialsStorage: "FIDUCIAL",
    sop.RealWorldValueMappingStorage: "VALUE MAP",
    sop.StereometricRelationshipStorage: "STEREOMETRIC",
    sop.LensometryMeasurementsStorage: "MEASUREMENT",
    sop.AutorefractionMeasurementsStorage: "MEASUREMENT",
    sop.KeratometryMeasurementsStorage: "MEASUREMENT",
    sop.SubjectiveRefractionMeasurementsStorage: "MEASUREMENT",
    sop.VisualAcuityMeasurementsStorage: "MEASUREMENT",
    sop.OphthalmicAxialMeasurementsStorage: "MEASUREMENT",
    sop.OphthalmicVisualFieldStaticPerimetryMeasurementsStorage: "MEASUREMENT",
    sop.SurfaceSegmentationStorage: "SURFACE",
    sop.SurfaceScanMeshStorage: "SURFACE SCAN",
    sop.SurfaceScanPointCloudStorage: "SURFACE SCAN",
    sop.TractographyResultsStorage: "TRACT",
    sop.ContentAssessmentResultsStorage: "ASSESSMENT",
}


def _single_level_record_type(ds: Dataset) -> str:
    """Return a single-level *Directory Record Type* for `ds`."""
    sop_class = cast(Optional[UID], getattr(ds, "SOPClassUID", None))

    try:
        return _SINGLE_LEVEL_SOP_CLASSES[sop_class]  # type: ignore[index]
    except KeyError:
        return "PATIENT"


def _four_level_record_type(ds: Dataset) -> str:
    """Return the fourth-level *Directory Record Type* for `ds`."""
    modality = getattr(ds, "Modality", None)
    if modality in ["RTINTENT", "RTSEGANN", "RTRAD"]:
        return "RADIOTHERAPY"

    if modality == "PLAN":
        return "PLAN"

    if "EncapsulatedDocument" in ds:
        return "ENCAP DOC"

    if "RTPlanLabel" in ds:
        return "RT PLAN"

    sop_class = cast(Optional[UID], getattr(ds, "SOPClassUID", None))

    try:
        return _FOUR_LEVEL_SOP_CLASSES[sop_class]  # type: ignore[index]
    except KeyError:
        return "IMAGE"
