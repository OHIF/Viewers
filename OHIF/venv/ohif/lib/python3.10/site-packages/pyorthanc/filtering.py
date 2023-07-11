import asyncio
import os
import warnings
from typing import List, Dict, Callable, Optional, Union

from pyorthanc.study import Study
from pyorthanc.series import Series
from pyorthanc.instance import Instance
from pyorthanc.async_client import AsyncOrthanc
from pyorthanc.client import Orthanc
from pyorthanc.patient import Patient
from pyorthanc.util import async_to_sync


def build_patient_forest(
        orthanc: Orthanc,
        patient_filter: Optional[Callable] = None,
        study_filter: Optional[Callable] = None,
        series_filter: Optional[Callable] = None) -> List[Patient]:
    warnings.warn(
        'Function "build_patient_forest" is deprecated and will be removed in a future release. '
        'Please use "find" instead',
        DeprecationWarning,
        stacklevel=2
    )
    return find(orthanc, patient_filter, study_filter, series_filter)


def find(orthanc: Union[Orthanc, AsyncOrthanc],
         patient_filter: Optional[Callable] = None,
         study_filter: Optional[Callable] = None,
         series_filter: Optional[Callable] = None,
         instance_filter: Optional[Callable] = None) -> List[Patient]:
    """Find desired patients/Study/Series/Instance in an Orthanc server

    This function builds a series of tree structure.
    Each tree correspond to a patient. The layers in the
    tree correspond to:

    `Patient -> Studies -> Series -> Instances`

    Parameters
    ----------
    orthanc
        Orthanc and AsyncOrthanc object.
    patient_filter
        Patient filter (e.g. lambda patient: patient.id_ == '03HDQ99*')
    study_filter
        Study filter (e.g. lambda study: study.study_id == '*pros*')
    series_filter
        Series filter (e.g. lambda series: series.modality == 'SR')
    instance_filter
        Instance filter (e.g. lambda instance: instance.SOPInstance == '...')

    Returns
    -------
    List[Patient]
        List of patient.
    """
    if isinstance(orthanc, AsyncOrthanc):
        patients = asyncio.run(
            _async_find(
                orthanc,
                patient_filter,
                study_filter,
                series_filter,
                instance_filter
            )
        )

        return trim_patient(patients)

    patient_identifiers = orthanc.get_patients()
    patients = []

    for patient_id in patient_identifiers:  # This ID is the Orthanc's ID, and not the PatientID
        patients.append(_build_patient(
            patient_id,
            orthanc,
            patient_filter,
            study_filter,
            series_filter,
            instance_filter
        ))

    return trim_patient(patients)


async def _async_find(
        async_orthanc: AsyncOrthanc,
        patient_filter: Optional[Callable] = None,
        study_filter: Optional[Callable] = None,
        series_filter: Optional[Callable] = None,
        instance_filter: Optional[Callable] = None) -> List[Patient]:
    patient_identifiers = await async_orthanc.get_patients()
    tasks = []

    for patient_id in patient_identifiers:  # This ID is the Orthanc's ID, and not the PatientID
        task = asyncio.create_task(
            _async_build_patient(
                patient_id,
                async_orthanc,
                patient_filter,
                study_filter,
                series_filter,
                instance_filter
            )
        )
        tasks.append(task)

    patients = await asyncio.gather(*tasks)
    patients = list(patients)

    return trim_patient(patients)


def _build_patient(
        patient_identifier: str,
        orthanc: Orthanc,
        patient_filter: Optional[Callable],
        study_filter: Optional[Callable],
        series_filter: Optional[Callable],
        instance_filter: Optional[Callable]) -> Patient:
    patient = Patient(patient_identifier, orthanc)

    if patient_filter is not None:
        if not patient_filter(patient):
            return patient

    study_information = orthanc.get_patients_id_studies(patient_identifier)
    patient._studies = [_build_study(i, orthanc, study_filter, series_filter, instance_filter) for i in study_information]

    return patient


async def _async_build_patient(
        patient_identifier: str,
        async_orthanc: AsyncOrthanc,
        patient_filter: Optional[Callable],
        study_filter: Optional[Callable],
        series_filter: Optional[Callable],
        instance_filter: Optional[Callable]) -> Patient:
    patient = Patient(patient_identifier, async_to_sync(async_orthanc))

    if patient_filter is not None:
        if not patient_filter(patient):
            return patient

    study_information = await async_orthanc.get_patients_id_studies(patient_identifier)

    tasks = []
    for info in study_information:
        task = asyncio.create_task(_async_build_study(info, async_orthanc, study_filter, series_filter, instance_filter))
        tasks.append(task)

    patient._studies = await asyncio.gather(*tasks)

    return patient


def _build_study(
        study_information: Dict,
        orthanc: Orthanc,
        study_filter: Optional[Callable],
        series_filter: Optional[Callable],
        instance_filter: Optional[Callable]) -> Study:
    study = Study(study_information['ID'], orthanc, study_information)

    if study_filter is not None:
        if not study_filter(study):
            return study

    series_information = orthanc.get_studies_id_series(study_information['ID'])
    study._series = [_build_series(i, orthanc, series_filter, instance_filter) for i in series_information]

    return study


async def _async_build_study(
        study_information: Dict,
        async_orthanc: AsyncOrthanc,
        study_filter: Optional[Callable],
        series_filter: Optional[Callable],
        instance_filter: Optional[Callable]) -> Study:
    study = Study(study_information['ID'], async_to_sync(async_orthanc), study_information)

    if study_filter is not None:
        if not study_filter(study):
            return study

    series_information = await async_orthanc.get_studies_id_series(study_information['ID'])

    tasks = []
    for info in series_information:
        task = asyncio.create_task(_async_build_series(info, async_orthanc, series_filter, instance_filter))
        tasks.append(task)

    study._series = await asyncio.gather(*tasks)

    return study


def _build_series(
        series_information: Dict,
        orthanc: Orthanc,
        series_filter: Optional[Callable],
        instance_filter: Optional[Callable]) -> Series:
    series = Series(series_information['ID'], orthanc, series_information)

    if series_filter is not None:
        if not series_filter(series):
            return series

    instance_information = orthanc.get_series_id_instances(series_information['ID'])
    series._instances = [_build_instance(i, orthanc, instance_filter) for i in instance_information]

    return series


async def _async_build_series(
        series_information: Dict,
        async_orthanc: AsyncOrthanc,
        series_filter: Optional[Callable],
        instance_filter: Optional[Callable]) -> Series:
    series = Series(series_information['ID'], async_to_sync(async_orthanc), series_information)

    if series_filter is not None:
        if not series_filter(series):
            return series

    instance_information = await async_orthanc.get_series_id_instances(series_information['ID'])
    series._instances = [_build_instance(i, async_to_sync(async_orthanc), instance_filter) for i in instance_information]

    return series


def _build_instance(
        instance_information: Dict,
        orthanc: Orthanc,
        instance_filter: Optional[Callable]) -> Optional[Instance]:
    instance = Instance(instance_information['ID'], orthanc, instance_information)

    if instance_filter is not None:
        if not instance_filter(instance):
            return  # Means that the instance did not pass the filter criteria.

    return instance


def trim_patient(patients: List[Patient]) -> List[Patient]:
    """Trim Patient forest (list of patients)

    Parameters
    ----------
    patients
        Patient forest.

    Returns
    -------
    List[Patient]
        Pruned patient forest.
    """
    for patient in patients:
        patient.remove_empty_studies()

    patients = [p for p in patients if p.studies != []]

    return patients


def retrieve_and_write_patients(patients: List[Patient], path: str) -> None:
    """Retrieve and write patients to given path

    Parameters
    ----------
    patients
        Patient forest.
    path
        Path where you want to write the files.
    """
    os.makedirs(path, exist_ok=True)
    for patient in patients:
        retrieve_patient(patient, path)


def retrieve_patient(patient: Patient, path: str) -> None:
    patient_path = _make_patient_path(path, patient.id_)
    os.makedirs(patient_path, exist_ok=True)

    for study in patient.studies:
        retrieve_study(study, patient_path)


def retrieve_study(study: Study, patient_path: str) -> None:
    study_path = _make_study_path(patient_path, study.id_)
    os.makedirs(study_path, exist_ok=True)

    for series in study.series:
        retrieve_series(series, study_path)


def retrieve_series(series: Series, study_path: str) -> None:
    series_path = _make_series_path(study_path, series.modality)
    os.makedirs(series_path, exist_ok=True)

    for instance in series.instances:
        retrieve_instance(instance, series_path)


def retrieve_instance(instance: Instance, series_path) -> None:
    path = os.path.join(series_path, instance.uid + '.dcm')

    dicom_file_bytes = instance.get_dicom_file_content()

    with open(path, 'wb') as file_handler:
        file_handler.write(dicom_file_bytes)


def _make_patient_path(path: str, patient_id: str) -> str:
    patient_directories = os.listdir(path)

    if patient_id.strip() == '':
        patient_id = 'anonymous-patient'
        return os.path.join(path, _make_path_name(patient_id, patient_directories))

    return os.path.join(path, patient_id)


def _make_study_path(patient_path: str, study_id: str) -> str:
    study_directories = os.listdir(patient_path)

    if study_id.strip() == '':
        study_id = 'anonymous-study'

    return os.path.join(patient_path, _make_path_name(study_id, study_directories))


def _make_series_path(study_path: str, modality: str) -> str:
    series_directories = os.listdir(study_path)

    return os.path.join(study_path, _make_path_name(modality, series_directories))


def _make_path_name(name: str, directories: List[str], increment: int = 1, has_increment: bool = False) -> str:
    if not has_increment:
        name = f'{name}-{increment}'
        has_increment = True
    else:
        name = '-'.join(name.split('-')[:-1])

    if name in directories:
        return _make_path_name(name, directories, increment + 1, has_increment)

    return name
