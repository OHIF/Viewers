import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, ButtonEnums } from '@ohif/ui';
import axios from 'axios';
import apiClient from '../../../../../platform/ui/src/apis/apiClient';
import eventEmitter from '../../../../cornerstone/src/utils/eventEmitter';
import { Classification } from '../Classification';
function ActionButtons({ disabled = false, data = null, orthancId = null }) {
  const { t } = useTranslation('MeasurementTable');
  const [formData, setFormData] = useState({
    indications: '',
    findings: '',
    histopathology: '',
    annotations: data.map(() => ({
      biradScore: null,
      lesionType: null,
    })),
  });
  const [errors, setErrors] = useState({
    findings: false,
    indications: false,
  });

  const searchParams = new URLSearchParams(window.location.search);
  const studyInstanceUid = searchParams.get('StudyInstanceUIDs');
  const [toastMessage, setToastMessage] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.getGroundTruth(studyInstanceUid);
        if (response.success) {
          const { indications, findings, histopathology, annotations } = response.result.attachment;
          setFormData(prevState => ({
            ...prevState,
            indications: indications || prevState.indications,
            findings: findings || prevState.findings,
            histopathology: histopathology || prevState.histopathology,
            annotations: annotations || prevState.annotations,
          }));
        } else {
          console.error('API call to load data unsuccessful');
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (studyInstanceUid) {
      fetchData();
    }
  }, []);

  const handleChange = e => {
    const { name, value, dataset } = e.target;
    if (dataset.index !== undefined) {
      const index = dataset.index;
      const property = name.split('_')[0];
      setFormData(prevState => {
        const updatedAnnotations = [...prevState.annotations];
        updatedAnnotations[index] = {
          ...updatedAnnotations[index],
          [property]: value,
        };
        return {
          ...prevState,
          annotations: updatedAnnotations,
        };
      });
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  async function updateLabels(instanceId, newLabel) {
    try {
      const response = await axios.put('http://localhost:8000/update_labels', {
        instance_id: instanceId,
        new_label: newLabel,
      });
      console.log(instanceId, response.data, 'response data data');
      return response.data;
    } catch (error) {
      console.error('Error updating labels:', error);
      throw error;
    }
  }

  const handleSubmit = async e => {
    e.preventDefault();
    const { indications, findings, histopathology, annotations } = formData;

    // Basic validation
    let hasError = false;
    const newErrors = {
      findings: false,
      indications: false,
    };

    if (!indications) {
      newErrors.indications = true;
      hasError = true;
    }

    if (!findings) {
      newErrors.findings = true;
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      return;
    }
    const groundTruthData = {
      indications,
      findings,
      histopathology,
      annotations: annotations.map((annotation, index) => ({
        topLeft: data[index].baseDisplayText,
        bottomRight: data[index].baseLabel,
        biradScore: annotation.biradScore,
        lesionType: annotation.lesionType,
      })),
    };

    console.log('Ground Truth Data:', groundTruthData);

    try {
      // Use the apiClient to send the ground truth data
      const response = await apiClient.putGroundTruth(studyInstanceUid, groundTruthData);
      console.log('Response from API:', response);
      setToastMessage('Ground truth data submitted successfully');
      setTimeout(() => {
        setToastMessage('');
      }, 2500);
      // alert('Ground truth data submitted successfully');
    } catch (error) {
      console.error('Failed to submit ground truth data:', error);
      alert('Failed to submit ground truth data');
    }
  };
  const handleRunModelsClick = async () => {
    const response = await apiClient.handleMammoModel(studyInstanceUid, setToastMessage);
    console.log('Mammo model processing started:', response);
    // alert(response.result.message);
    // } catch (error) {
    //   console.error('Failed to start mammo model processing:', error);
    //   alert('Failed to start mammo model processing.');
    // }
  };

  //   console.log('Indications:', indications);
  //   console.log('Findings:', findings);
  //   console.log('Histopathology:', histopathology);
  //   console.log('Annotations:', submissionData);
  // };

  const isSubmitDisabled = formData.findings.trim() === '' || formData.indications.trim() === '';

  function cleanAndFormatJsonString(jsonArray) {
    let result = '';
    jsonArray.forEach(obj => {
      Object.keys(obj).forEach(key => {
        if (obj[key] !== null) {
          result += key + obj[key].toString().replace(/,/g, '');
        }
      });
    });
    return result;
  }
  let manualBoundingBoxCoordinates: any = localStorage.getItem('manualBoundingBoxCoordinates');
  if (manualBoundingBoxCoordinates?.length > 0) {
    manualBoundingBoxCoordinates = JSON.parse(manualBoundingBoxCoordinates);
  } else {
    manualBoundingBoxCoordinates = [];
  }
  const handleUpdateLabels = async e => {
    e.preventDefault();
    const { annotations } = formData;
    setToastMessage('Annotations submitted successfully');
    setTimeout(() => {
      setToastMessage('');
    }, 2500);

    try {
      for (let index = 0; index < annotations.length; index++) {
        const annotation = annotations[index];
        if (!annotation.biradScore || !annotation.lesionType) {
          console.warn(`Skipping annotation ${index + 1} due to missing data.`);
          continue;
        }

        const submissionData = {
          topLeft: data[index].baseDisplayText,
          bottomRight: data[index].baseLabel,
          biradScore: annotation.biradScore,
          lesionType: annotation.lesionType,
        };

        console.log(`Updating label for annotation ${index + 1}:`, submissionData);

        const formattedString = cleanAndFormatJsonString([submissionData]);
        console.log('Formatted string:', formattedString);

        // Make the API call to update label
        const response = await updateLabels(orthancId, formattedString);
        console.log(`Label updated successfully for annotation ${index + 1}:`, response);
      }

      // Optionally, add logic to update UI or show notifications after all updates
    } catch (error) {
      console.error('Failed to update labels:', error);
      // Optionally, show error messages or handle the error state
    }
  };
  const [modelResult, setModelResult] = useState(null);

  const isObjectEmpty = obj => {
    return Object.keys(obj).length === 0;
  };
  const getModelResult = async () => {
    try {
      const response = await apiClient.getClassificationOutput(studyInstanceUid);
      console.log(response);
      if (response && response.result) {
        const attachment = response.result.attachment;
        console.log('Model result gotten');
        console.log(response);
        if (
          typeof attachment === 'object' &&
          !Array.isArray(attachment) &&
          isObjectEmpty(attachment)
        ) {
          setModelResult(null);
        } else {
          console.log(attachment);
          const clinicalMap = new Map();
          delete attachment.indications;
          Object.keys(attachment).forEach(key => {
            clinicalMap.set(key, attachment[key].clinical.result);
          });
          // console.log(clinicalMap);
          setModelResult(clinicalMap);
        }
      } else {
        console.log('Model has not been run yet');
        setModelResult(null);
      }
    } catch (error) {
      console.error('Failed to get Classification results', error);
      alert('Failed to get Classification results');
      setModelResult(null);
    }
  };
  const [displaySets, setDisplaySets] = useState<any>(eventEmitter.getLastDisplaySets());
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    getModelResult();
    // console.log('Initial displaySets on load:', displaySets);
    if (displaySets) {
      setCurrentImage(displaySets[0]['SeriesInstanceUID']);
    }
    const handleViewportDataLoaded = (data: any) => {
      // console.log('Received displaySets:', data);
      if (data) {
        setCurrentImage(data[0]['SeriesInstanceUID']);
        setDisplaySets(data);
      }
    };

    // Subscribe to the viewportDataLoaded event
    eventEmitter.on('viewportDataLoaded', handleViewportDataLoaded);

    return () => {
      eventEmitter.off('viewportDataLoaded', handleViewportDataLoaded);
    };
  }, []);

  // useEffect(() => {
  //   console.log('Current image updated:', currentImage);
  // }, [currentImage]);

  return (
    <div className="m-2">
      {toastMessage.length > 0 && (
        <div className="fixed top-16 right-[35%] z-50 rounded bg-gray-800 px-4 py-2 text-xl text-white shadow-lg transition-opacity">
          {toastMessage}
        </div>
      )}
      <form>
        <div className="mb-6 flex flex-col space-y-4">
          <div className="text-white">
            {data.map((item, index) => (
              <div
                key={index}
                className="ohif-scrollbar max-h-112 mb-4 overflow-auto rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-md"
              >
                <p className="text-sm font-semibold text-green-400">Annotation No. {index + 1}</p>
                <p className="mb-2 text-sm">
                  <span className="text-blue-300">Top Left:</span> [{item?.baseDisplayText[0]},{' '}
                  {item?.baseDisplayText[1]}]
                  <br />
                  <span className="text-blue-300">Bottom Right:</span> [{item?.baseLabel[0]},{' '}
                  {item?.baseLabel[1]}]
                </p>

                <div className="form-group">
                  <div className="mb-2 items-center">
                    <div className="mr-4 flex flex-col">
                      <p className="text-sm font-medium text-yellow-300">Birad Score:</p>
                      {[1, 2, 3, 4, 5, 6].map(score => (
                        <label
                          key={score}
                          className="flex items-center"
                        >
                          <input
                            type="radio"
                            name={`biradScore_${index}`}
                            value={score}
                            className="mr-1"
                            data-index={index}
                            onChange={handleChange}
                          />
                          <span className="text-sm text-white">{score}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-yellow-300">Lesion Type:</p>
                      {['Mass', 'Calcification'].map(type => (
                        <label
                          key={type}
                          className="mr-4 flex items-center"
                        >
                          <input
                            type="radio"
                            name={`lesionType_${index}`}
                            value={type}
                            className="mr-1"
                            data-index={index}
                            onChange={handleChange}
                          />
                          <span className="text-sm text-white">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {manualBoundingBoxCoordinates?.map((item, index) => (
              <div
                key={index}
                className="ohif-scrollbar max-h-112 mb-4 overflow-auto rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-md"
              >
                <p className="text-sm font-semibold text-green-400">Annotation No. {index + 1}</p>
                <p className="mb-2 text-sm">
                  <span className="text-blue-300">Top Left:</span> [{item.baseDisplayText[0]},{' '}
                  {item.baseDisplayText[1]}]
                  <br />
                  <span className="text-blue-300">Bottom Right:</span> [{item.baseLabel[0]},{' '}
                  {item.baseLabel[1]}]
                </p>

                <div className="form-group">
                  <div className="mb-2 items-center">
                    <div className="mr-4 flex flex-col">
                      <p className="text-sm font-medium text-yellow-300">Birad Score:</p>
                      {[1, 2, 3, 4, 5, 6].map(score => (
                        <label
                          key={score}
                          className="flex items-center"
                        >
                          <input
                            type="radio"
                            name={`biradScore_${index}`}
                            value={score}
                            className="mr-1"
                            data-index={index}
                            onChange={handleChange}
                          />
                          <span className="text-sm text-white">{score}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-yellow-300">Lesion Type:</p>
                      {['Mass', 'Calcification'].map(type => (
                        <label
                          key={type}
                          className="mr-4 flex items-center"
                        >
                          <input
                            type="radio"
                            name={`lesionType_${index}`}
                            value={type}
                            className="mr-1"
                            data-index={index}
                            onChange={handleChange}
                          />
                          <span className="text-sm text-white">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              className="m-2 ml-0"
              // type={ButtonEnums.type.button}
              // size={ButtonEnums.size.small}
              // disabled={isSubmitDisabled}
              onClick={handleUpdateLabels}
            >
              Mark Label
            </Button>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-white">Add Indications*:</label>
            <input
              className={`w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.indications && 'border-red-500'}`}
              type="text"
              name="indications"
              value={formData.indications}
              onChange={handleChange}
              aria-label="Indications"
            />
            {errors.indications && (
              <p className="error-message mt-1 text-sm text-red-500">
                {t('Please enter your indications.')}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-white">Add Findings*:</label>
            <input
              className={`w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.findings && 'border-red-500'}`}
              type="text"
              name="findings"
              value={formData.findings}
              onChange={handleChange}
              aria-label="Findings"
            />
            {errors.findings && (
              <p className="error-message mt-1 text-sm text-red-500">
                {t('Please enter your findings.')}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-white">Histopathology(Biopsy Results):</label>
            <input
              className="p-2 text-black"
              type="text"
              name="histopathology"
              value={formData.histopathology}
              onChange={handleChange}
              // onChange={e => handleChange('histopathology', e.target.value)}
              aria-label="Histopathology (Biopsy Results)"
            />
          </div>
          <Button
            className="m-2 ml-0"
            type={ButtonEnums.type.secondary}
            size={ButtonEnums.size.small}
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
          >
            {t('Submit')}
          </Button>

          {/* <Button
            className="m-2 ml-0"
            type="button"
            // size={ButtonEnums.size.small}
            onClick={handleRunModelsClick}
          >
            Run Models
          </Button> */}
        </div>
      </form>
      {/* Model Result Display */}
      <h2 className="mb-4 text-xl font-semibold text-white">Classification Results</h2>
      <div className="mb-6 flex flex-col space-y-4">
        {modelResult ? (
          <>
            {modelResult.has(currentImage) ? (
              <div
                className={`p-2 font-bold text-white ${
                  modelResult.get(currentImage) === Classification.Malignant
                    ? 'bg-red-500' // Color for Malignant
                    : 'bg-green-500' // Color for NonMalignant
                }`}
              >
                {modelResult.get(currentImage)}
              </div>
            ) : (
              <p className="text-red-400">Model not run yet</p>
            )}
          </>
        ) : (
          <p className="text-red-400">Model not run yet</p>
        )}
      </div>

      <Button
        className="m-2 ml-0"
        // size={ButtonEnums.size.small}
        onClick={handleRunModelsClick}
      >
        Run Models
      </Button>
    </div>
  );
}

ActionButtons.propTypes = {
  onExportClick: PropTypes.func,
  onCreateReportClick: PropTypes.func,
  disabled: PropTypes.bool,
  studyUid: PropTypes.string,
  data: PropTypes.any,
  orthancId: PropTypes.string,
};

export default ActionButtons;
