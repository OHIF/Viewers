import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, ButtonEnums } from '@ohif/ui';
import axios from 'axios';
import apiClient from '../../../../../platform/ui/src/apis/apiClient';

function ActionButtons({
  onExportClick = () => alert('Export'),
  onCreateReportClick = () => alert('Create Report'),
  disabled = false,
  data = null,
  orthancId = null,
}) {
  const defaultValues = {
    demographicDetails: {
      age: '',
      gender: '',
      ethnicity: '',
      familyHistoryOfCancer: '',
    },
    clinicalDetails: {
      abdominalPain: false,
      vomiting: false,
      fever: false,
      lossOfWeight: false,
      lossOfAppetite: false,
      jaundice: false,
      previousGallbladderAdmission: false,
    },
    ultrasoundFindings: {
      appearance: '',
      distension: '',
      stones: false,
      numberOfStones: '',
      largestStoneSize: '',
      gallbladderMorphology: '',
      siteOfLesion: '',
      sizeOfLesion: '',
      liverLesions: false,
      lymphNodes: false,
      ascites: false,

      muralLayering: false,
      intramuralEchogenicFoci: false,
      intramuralCysts: false,
      interfaceWithLiver: '',
      involvementOfBileDucts: false,
      involvementOfVessels: false,
      extramuralMass: false,
    },
    annotations: [{ gbRadScore: '' }],
  };
  const { t } = useTranslation('MeasurementTable');
  const [formData, setFormData] = useState(defaultValues);

  const searchParams = new URLSearchParams(window.location.search);
  const studyInstanceUid = searchParams.get('StudyInstanceUIDs');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.getGroundTruth(studyInstanceUid);
        if (response.success) {
          const attachment = response.result.attachment;
          console.log(response.result.attachment);
          setFormData({
            demographicDetails: {
              age: attachment.age || '',
              gender: attachment.gender || '',
              ethnicity: attachment.ethnicity || '',
              familyHistoryOfCancer: attachment.familyHistoryOfCancer || '',
            },
            clinicalDetails: {
              abdominalPain: attachment.abdominalPain || false,
              vomiting: attachment.vomiting || false,
              fever: attachment.fever || false,
              lossOfWeight: attachment.lossOfWeight || false,
              lossOfAppetite: attachment.lossOfAppetite || false,
              jaundice: attachment.jaundice || false,
              previousGallbladderAdmission: attachment.previousGallbladderAdmission || false,
            },
            ultrasoundFindings: {
              appearance: attachment.appearance || '',
              distension: attachment.distension || '',
              stones: attachment.stones || false,
              numberOfStones: attachment.numberOfStones || '',
              largestStoneSize: attachment.largestStoneSize || '',
              gallbladderMorphology: attachment.gallbladderMorphology || '',
              siteOfLesion: attachment.siteOfLesion || '',
              sizeOfLesion: attachment.sizeOfLesion || '',
              liverLesions: attachment.liverLesions || false,
              lymphNodes: attachment.lymphNodes || false,
              ascites: attachment.ascites || false,
              muralLayering: attachment.muralLayering || false,
              intramuralEchogenicFoci: attachment.intramuralEchogenicFoci || false,
              intramuralCysts: attachment.intramuralCysts || false,
              interfaceWithLiver: attachment.interfaceWithLiver || '',
              involvementOfBileDucts: attachment.involvementOfBileDucts || false,
              involvementOfVessels: attachment.involvementOfVessels || false,
              extramuralMass: attachment.extramuralMass || false,
            },
            annotations: [{ gbRadScore: attachment.gbRadScore || '' }],
          });
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
  }, [studyInstanceUid]);

  const handleChange = e => {
    const { name, value, type, dataset } = e.target;
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
          annotations: updatedAnnotations, // Return updated state
        };
      });
    } else {
      setFormData(prevState => {
        const newValue = type === 'checkbox' ? e.target.checked : value;
        if (name in prevState.clinicalDetails) {
          const updatedAnnotations = prevState.clinicalDetails;

          updatedAnnotations[name] = newValue;
          return {
            ...prevState,
            clinicalDetails: updatedAnnotations,
          };
        }
        if (name in prevState.demographicDetails) {
          const updatedAnnotations = prevState.demographicDetails;

          updatedAnnotations[name] = newValue;
          return {
            ...prevState,
            demographicDetails: updatedAnnotations,
          };
        }
        const updatedAnnotations = prevState.ultrasoundFindings;

        updatedAnnotations[name] = newValue;
        return {
          ...prevState,
          ultrasoundFindings: updatedAnnotations,
        };
      });
    }
  };

  async function updateLabels(instanceId, newLabel) {
    try {
      const response = await axios.put('http://localhost:8000/update_labels', {
        instance_id: instanceId,
        new_label: newLabel,
      });
      // console.log(instanceId, response.data, 'tushita response data data');
      return response.data;
    } catch (error) {
      console.error('Error updating labels:', error);
      throw error;
    }
  }

  const handleSubmit = async e => {
    e.preventDefault();
    const groundTruthData = {
      ...formData.demographicDetails,
      ...formData.clinicalDetails,
      ...formData.ultrasoundFindings,
      annotations: formData.annotations.map((annotation, index) => ({
        topLeft: data[index].baseDisplayText,
        bottomRight: data[index].baseLabel,
        gbRadScore: annotation.gbRadScore,
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
    } catch (error) {
      console.error('Failed to submit ground truth data:', error);
      alert('Failed to submit ground truth data');
    }
  };

  const handleRunModelsClick = async () => {
    const response = await apiClient.handleGBCModel(studyInstanceUid, setToastMessage);
    console.log('GBC model processing started:', response);
    // alert(response.result.message);
    // } catch (error) {
    //   console.error('Failed to start mammo model processing:', error);
    //   alert('Failed to start mammo model processing.');
    // }
  };
  const [modelResult, setModelResult] = useState(null);
  const removeModel = obj => {
    const { 'LQ Adapter': _, 'Focus MAE': __, ...newObj } = obj; // Destructure to remove both properties
    return newObj;
  };
  const isObjectEmpty = obj => {
    return Object.keys(obj).length === 0;
  };
  const getModelResult = async () => {
    try {
      const response = await apiClient.getClassificationOutput(studyInstanceUid);
      if (response && response.result) {
        const attachment = response.result.attachment;

        if (
          typeof attachment === 'object' &&
          !Array.isArray(attachment) &&
          isObjectEmpty(attachment)
        ) {
          setModelResult(null);
        } else {
          const arrayFromEntries = Object.entries(attachment);
          setModelResult(removeModel(arrayFromEntries[0][1]));
        }
      } else {
        console.log('Model has not been run yet');
        setModelResult(null);
      }
    } catch (error) {
      console.error('Failed to get Classification results', error);
      alert('Failed to get Classification results');
      console.log('Failed to get Classification results');
      setModelResult(null);
    }
  };

  useEffect(() => {
    getModelResult();
  }, []);

  const isSubmitDisabled = false;

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

    setTimeout(() => {
      setToastMessage('');
    }, 2500);

    try {
      for (let index = 0; index < annotations.length; index++) {
        const annotation = annotations[index];
        if (!annotation.gbRadScore) {
          console.warn(`Skipping annotation ${index + 1} due to missing data.`);
          continue;
        }

        const submissionData = {
          topLeft: data[index].baseDisplayText,
          bottomRight: data[index].baseLabel,
          gbRadScore: annotation.gbRadScore,
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
  const [visibleSection, setVisibleSection] = useState('');

  const toggleSection = section => {
    setVisibleSection(prev => (prev === section ? '' : section));
  };

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
                  <span className="text-blue-300">Top Left:</span> [
                  {item?.baseDisplayText?.[0] ?? 'N/A'}, {item?.baseDisplayText?.[1] ?? 'N/A'}]
                  <br />
                  <span className="text-blue-300">Bottom Right:</span> [
                  {item?.baseLabel?.[0] ?? 'N/A'}, {item?.baseLabel?.[1] ?? 'N/A'}]
                </p>

                <div className="form-group">
                  <div className="mb-2 items-center">
                    <div className="mr-4 flex flex-col">
                      <p className="text-sm font-medium text-yellow-300">GBRads Score:</p>
                      {[1, 2, 3, 4, 5, 6].map(score => (
                        <label
                          key={score}
                          className="flex items-center"
                        >
                          <input
                            type="radio"
                            name={`gbRadScore_${index}`}
                            value={score}
                            className="mr-1"
                            data-index={index}
                            onChange={handleChange}
                          />
                          <span className="text-sm text-white">{score}</span>
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
                      <p className="text-sm font-medium text-yellow-300">GB-Rads Score:</p>
                      {[1, 2, 3, 4, 5, 6].map(score => (
                        <label
                          key={score}
                          className="flex items-center"
                        >
                          <input
                            type="radio"
                            name={`gbRadScore_${index}`}
                            value={score}
                            className="mr-1"
                            data-index={index}
                            onChange={handleChange}
                          />
                          <span className="text-sm text-white">{score}</span>
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

          {/*Demographic Details */}
          <div className="mb-4">
            <h2
              className="mb-4 cursor-pointer text-white"
              onClick={() => toggleSection('demographic')}
            >
              Demographic Details
            </h2>
            {visibleSection === 'demographic' && (
              <div>
                <div className="mb-4">
                  <label className="mb-1 block text-white">Age:</label>
                  <input
                    className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    name="age"
                    value={formData.demographicDetails.age} // Reflecting current state
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-white">Gender:</label>
                  <input
                    className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    name="gender"
                    value={formData.demographicDetails.gender} // Reflecting current state
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-white">Ethnicity:</label>
                  <input
                    className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    name="ethnicity"
                    value={formData.demographicDetails.ethnicity} // Reflecting current state
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-white">Family History of Cancer:</label>
                  <input
                    className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    name="familyHistoryOfCancer"
                    value={formData.demographicDetails.familyHistoryOfCancer} // Reflecting current state
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Clinical Details Dropdown */}
          <div className="mb-4">
            <h2
              className="mb-4 cursor-pointer text-white"
              onClick={() => toggleSection('clinical')}
            >
              Clinical Details
            </h2>
            {visibleSection === 'clinical' && (
              <div>
                {Object.keys(formData.clinicalDetails).map((field, index) => (
                  <div
                    className="mb-2 flex items-center"
                    key={index}
                  >
                    <input
                      className="mr-2"
                      type="checkbox"
                      name={field}
                      id={field}
                      checked={formData.clinicalDetails[field] || false}
                      onChange={handleChange}
                      aria-label={field}
                    />
                    <label
                      className="block capitalize text-white"
                      htmlFor={field}
                    >
                      {field.replace(/([A-Z])/g, ' $1')}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <h2
              className="mb-4 cursor-pointer text-white"
              onClick={() => toggleSection('ultrasound')}
            >
              Ultrasound Findings
            </h2>
            {visibleSection === 'ultrasound' && (
              <div>
                <div className="mb-2 flex items-center">
                  <input
                    className="mr-2"
                    type="checkbox"
                    name="stones"
                    id="stones" // Unique ID for the checkbox
                    checked={formData.ultrasoundFindings.stones || false} // Manage checked state from formData
                    onChange={handleChange}
                    aria-label="Stones"
                  />
                  <label className="mb-1 block text-white">Stones</label>
                </div>

                <div className="mb-2 flex items-center">
                  <input
                    className="mr-2"
                    type="checkbox"
                    name="liverLesions"
                    id="liverLesions" // Unique ID for the checkbox
                    checked={formData.ultrasoundFindings.liverLesions || false} // Manage checked state from formData
                    onChange={handleChange}
                    aria-label="Liver Lesions"
                  />
                  <label className="mb-1 block text-white">Liver Lesions</label>
                </div>

                <div className="mb-2 flex items-center">
                  <input
                    className="mr-2"
                    type="checkbox"
                    name="lymphNodes"
                    id="lymphNodes" // Unique ID for the checkbox
                    checked={formData.ultrasoundFindings.lymphNodes || false} // Manage checked state from formData
                    onChange={handleChange}
                    aria-label="Lymph Nodes"
                  />
                  <label className="mb-1 block text-white">Lymph Nodes</label>
                </div>

                <div className="mb-2 flex items-center">
                  <input
                    className="mr-2"
                    type="checkbox"
                    name="ascites"
                    id="ascites" // Unique ID for the checkbox
                    checked={formData.ultrasoundFindings.ascites || false} // Manage checked state from formData
                    onChange={handleChange}
                    aria-label="Ascites"
                  />
                  <label className="mb-1 block text-white">Ascites</label>
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-white">Appearance:</label>
                  <input
                    className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    name="appearance"
                    value={formData.ultrasoundFindings.appearance || ''} // Bind value to formData
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-white">Distension:</label>
                  <input
                    className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    name="distension"
                    value={formData.ultrasoundFindings.distension || ''} // Bind value to formData
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-white">Number of Stones:</label>
                  <input
                    className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    name="numberOfStones"
                    value={formData.ultrasoundFindings.numberOfStones || ''} // Bind value to formData
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-white">Largest Stone Size:</label>
                  <input
                    className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    name="largestStoneSize"
                    value={formData.ultrasoundFindings.largestStoneSize || ''} // Bind value to formData
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-white">Gallbladder Morphology:</label>
                  <input
                    className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    name="gallbladderMorphology"
                    value={formData.ultrasoundFindings.gallbladderMorphology || ''} // Bind value to formData
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-white">Site of Lesion:</label>
                  <input
                    className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    name="siteOfLesion"
                    value={formData.ultrasoundFindings.siteOfLesion || ''} // Bind value to formData
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-white">Size of Lesion:</label>
                  <input
                    className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    name="sizeOfLesion"
                    value={formData.ultrasoundFindings.sizeOfLesion || ''} // Bind value to formData
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-white">Wall Thickening:</label>
                  <div className="ml-4">
                    <div className="mb-2 flex items-center">
                      <input
                        className="mr-2"
                        type="checkbox"
                        name="muralLayering"
                        id="muralLayering"
                        checked={formData.ultrasoundFindings.muralLayering || false} // Manage checked state from formData
                        onChange={handleChange}
                        aria-label="Mural Layering"
                      />
                      <label
                        className="block text-white"
                        htmlFor="muralLayering"
                      >
                        Mural Layering
                      </label>
                    </div>

                    <div className="mb-2 flex items-center">
                      <input
                        className="mr-2"
                        type="checkbox"
                        name="intramuralEchogenicFoci"
                        id="intramuralEchogenicFoci"
                        checked={formData.ultrasoundFindings.intramuralEchogenicFoci || false} // Manage checked state from formData
                        onChange={handleChange}
                        aria-label="Intramural Echogenic Foci"
                      />
                      <label
                        className="block text-white"
                        htmlFor="intramuralEchogenicFoci"
                      >
                        Intramural Echogenic Foci
                      </label>
                    </div>

                    <div className="mb-2 flex items-center">
                      <input
                        className="mr-2"
                        type="checkbox"
                        name="intramuralCysts"
                        id="intramuralCysts"
                        checked={formData.ultrasoundFindings.intramuralCysts || false} // Manage checked state from formData
                        onChange={handleChange}
                        aria-label="Intramural Cysts"
                      />
                      <label
                        className="block text-white"
                        htmlFor="intramuralCysts"
                      >
                        Intramural Cysts
                      </label>
                    </div>

                    <div className="mb-2 flex items-center">
                      <input
                        className="mr-2"
                        type="checkbox"
                        name="involvementOfBileDucts"
                        id="involvementOfBileDucts"
                        checked={formData.ultrasoundFindings.involvementOfBileDucts || false} // Manage checked state from formData
                        onChange={handleChange}
                        aria-label="Involvement of Bile Ducts"
                      />
                      <label
                        className="block text-white"
                        htmlFor="involvementOfBileDucts"
                      >
                        Involvement of Bile Ducts
                      </label>
                    </div>

                    <div className="mb-4">
                      <label className="mb-1 block text-white">Interface with Liver:</label>
                      <input
                        className="w-full rounded-md border border-gray-400 p-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="text"
                        name="interfaceWithLiver"
                        value={formData.ultrasoundFindings.interfaceWithLiver || ''} // Bind value to formData
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
          <ul className="list-disc pl-5">
            {Object.entries(modelResult).map(([key, value]) => (
              <li
                key={key}
                className="text-white"
              >
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-red-400">Model not run yet</p>
        )}
      </div>
      <Button
        className="m-2 ml-0"
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
