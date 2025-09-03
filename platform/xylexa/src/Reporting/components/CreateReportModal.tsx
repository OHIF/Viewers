import React from 'react';
import { Select } from '@ohif/ui';
import { SelectedTemplate, useXylexaAppContext } from '../../context';
import { templates } from './../../Reporting/templates/templates';
import { Link } from 'react-router-dom';
import { useClickOutside } from '../../hooks/useClickOutside';
export type CreateReportModalType = {
  setShowModal: (boolean) => void;
};
export function CreateReportModal({ setShowModal }: CreateReportModalType) {
  const { selectedTemplate, selectedModality, setSelectedTemplate, selectedStudy, setIsNewReport } =
    useXylexaAppContext();

  // Closing the modal on clicking outside
  const { modalRef: createReportModalRef } = useClickOutside(() => {
    setShowModal(false);
  });

  const handleTemplateChange = (newValue: SelectedTemplate) => {
    setSelectedTemplate(newValue);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:bg-transparent focus:outline-none"
        style={{ backdropFilter: 'blur(5px)' }}
      >
        <div className="relative my-6 mx-auto w-1/2 max-w-3xl">
          <div
            ref={createReportModalRef}
            className="bg-secondary-light relative flex w-full flex-col rounded-lg border-0 shadow-lg outline-none focus:outline-none"
          >
            <div className="border-blueGray-200 flex items-start justify-between rounded-t border-solid p-5">
              <h4 className="text-3xl font-semibold text-white">Create Report</h4>
              <button
                className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black opacity-5 outline-none focus:outline-none"
                onClick={() => setShowModal(false)}
              >
                <span className="block h-6 w-6 bg-transparent text-2xl text-white opacity-5 outline-none focus:outline-none">
                  ×
                </span>
              </button>
            </div>
            {/*body*/}
            <div className="relative flex-auto p-6">
              {templates[selectedModality] ? (
                <Select
                  id="select-template"
                  className={
                    'min-w-36 md:min-w-40 sm:min-w-10 relative mt-3 border-white bg-transparent text-white'
                  }
                  value={selectedTemplate}
                  isMulti={false}
                  isClearable={false}
                  isSearchable={true}
                  closeMenuOnSelect={true}
                  hideSelectedOptions={true}
                  options={templates[selectedModality]}
                  onChange={handleTemplateChange}
                  placeholder="Select Template"
                />
              ) : (
                <p className="text-white">
                  Currently, No template for {selectedModality} modality. Report will be created
                  with generic template.
                </p>
              )}
            </div>
            {/*footer*/}
            <div className="border-blueGray-200 flex items-center justify-end border-solid p-6">
              <button
                className="background-transparent mr-1 mb-1 rounded px-6 py-2 text-sm font-bold uppercase text-red-500 outline-none transition-all duration-150 ease-linear hover:bg-black focus:outline-none"
                type="button"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <Link
                to={`/report/write-report/?modality=${selectedModality}&studyInstanceId=${selectedStudy?.studyInstanceUid}`}
                className="background-transparent mr-1 mb-1 rounded px-6 py-2 text-sm font-bold uppercase text-white outline-none transition-all duration-150 ease-linear hover:bg-black focus:outline-none"
                type="button"
                onClick={() => {
                  setIsNewReport(true);
                  setShowModal(false);
                }}
              >
                Create Report
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateReportModal;
