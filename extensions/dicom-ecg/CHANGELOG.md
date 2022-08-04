# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.5](https://github.com/ArturRod/dicom-ecg) (2022-08-03)

**Note:** Updated to depend on the ecg-dicom-web-viewer library
(https://www.npmjs.com/package/ecg-dicom-web-viewer) So all the changes made
will simply have to update the version without making changes to the structure
of ohif. From now on all the changes that will be made will be on the library.

## [1.0.4](https://github.com/ArturRod/dicom-ecg) (2022-06-27)

**Note:** Code optimization and separation of methods for the organization and
generation of the ECG drawing. The structure is prepared to display user data
and view for tools.

## [1.0.3](https://github.com/ArturRod/dicom-ecg) (2022-06-27)

**Note:** It is now allowed in local files to change and update ECG elements if
you have more than one.

## [1.0.2](https://github.com/ArturRod/dicom-ecg) (2022-06-27)

**Note:** Bug fix, now arraybytes can be loaded without a get request, this
allows OHIF to open ecg locally from /local.

## [1.0.1](https://github.com/ArturRod/dicom-ecg) (2022-06-27)

**Note:** Add compatilibity for GeneralECGWaveformStorage:
'1.2.840.10008.5.1.4.1.1.9.1.2'

## [1.0.0](https://github.com/ArturRod/dicom-ecg) (2022-06-27)

**Note:** Create proyect in base of https://github.com/jap1968/dcm-waveform
