import React from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
export type ExitConfirmationModalProps = {
  setShowModal: (boolean) => void;
  discardChanges: () => void;
  header: string;
  body: string;
};

export function ExitConfirmationModal({
  setShowModal,
  discardChanges,
  header,
  body,
}: ExitConfirmationModalProps) {
  // Closing the modal on clicking outside
  const { modalRef: createReportModalRef } = useClickOutside(() => {
    setShowModal(false);
  });

  return (
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
            <h4 className="text-2xl font-semibold text-white">{header}</h4>
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
            <p className="text-white">{body}</p>
          </div>
          {/*footer*/}
          <div className="border-blueGray-200 flex items-center justify-end border-solid p-6">
            <button
              className="background-transparent mr-1 mb-1 rounded px-6 py-2 text-sm font-bold uppercase text-white outline-none transition-all duration-150 ease-linear hover:bg-black focus:outline-none"
              type="button"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              className="background-transparent mr-1 mb-1 rounded px-6 py-2 text-sm font-bold uppercase text-red-500 outline-none transition-all duration-150 ease-linear hover:bg-black focus:outline-none"
              type="button"
              onClick={discardChanges}
            >
              Discard Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExitConfirmationModal;
