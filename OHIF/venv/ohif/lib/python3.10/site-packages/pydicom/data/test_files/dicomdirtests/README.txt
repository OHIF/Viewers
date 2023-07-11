In this directory are different variant of a DICOMDIR file representing the 3 patient directories.

DICOMDIR: 
created using dcmmkdir from DCMTK

DICOMDIR-bigEnd: 
created from DICOMDIR using dcmodify by changing the transfer syntax to Explicit Big Endian

DICOMDIR-implicit: 
Created from DICOMDIR using pydicom's `FileSet.write(force_implicit=True)`

DICOMDIR-nooffset:
created from DICOMDIR by removing some of the 0-offset tags

DICOMDIR-reordered:
created from DICOMDIR by reordering the first 4 entries (IMAGE - SERIES - STUDY - PATIENT
instead of PATIENT - STUDY - SERIES - IMAGE) and adapting the offsets

DICOMDIR-nopatient:
created from DICOMDIR by changing the type of the patient records to an invalid type
