import React from 'react';
import { Icon } from '@ohif/ui';
import { Tooltip } from '@ohif/ui-next';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { Svg } from '@ohif/ui';
import { Button } from '@ohif/ui';
import { useXylexaAppContext } from './../../context';
import { BiPrinter } from 'react-icons/bi';
import useGetQueryParams from '../../hooks/useGetQueryParams';

const Appbar = ({
  handleBack,
  handleSubmit,
  handleUpdate,
  isAIReportPreview,
  setIsAIReportPreview,
  ViewReportPreviewMode,
  isEditable,
  handlePrint,
  changeInReportDetected,
}) => {
  const { isNewReport } = useXylexaAppContext();

  const [modalityParams, studyInstanceIdParams] = useGetQueryParams(window.location.search, [
    'modality',
    'studyInstanceId',
  ]);

  return (
    <div
      style={{ height: '4rem' }}
      className="bg-secondary-dark fixed top-0 z-50 flex w-full items-center justify-between px-4 text-white sm:px-0 md:px-4"
    >
      <div
        className={classNames('mr-3 inline-flex cursor-pointer items-center')}
        onClick={handleBack}
      >
        <Icon
          name="chevron-left"
          className="text-secondary-main w-8"
        />
        <div className="ml-6">
          <Svg
            name="logo-xylexa"
            className="md:w-30 w-36"
          />
        </div>
      </div>
      <div className="flex place-items-center">
        <div className="flex gap-3">
          <Button
            className={
              ['CT', 'CT\\SEG'].includes(modalityParams) && ViewReportPreviewMode ? '' : 'hidden'
            }
            onClick={() => setIsAIReportPreview(!isAIReportPreview)}
          >
            {isAIReportPreview ? 'Generic Report' : 'AI Report'}
          </Button>

          <Tooltip
            content={'Make changes in file to enable update button.'}
            isDisabled={changeInReportDetected}
            position={'bottom-right'}
          >
            <Button
              className={
                !isNewReport && !ViewReportPreviewMode && modalityParams !== 'MG'
                  ? ` ${!changeInReportDetected ? 'cursor-not-allowed' : 'cursor-auto'}`
                  : 'hidden'
              }
              onClick={handleUpdate}
              disabled={!changeInReportDetected}
            >
              Update
            </Button>
          </Tooltip>

          <Button
            className={isNewReport && !ViewReportPreviewMode ? '' : 'hidden'}
            onClick={handleSubmit}
          >
            Submit
          </Button>

          <Link
            to={`/report/edit-report/?modality=${modalityParams}&studyInstanceId=${studyInstanceIdParams}`}
          >
            <div
              className={
                ViewReportPreviewMode && !isAIReportPreview && isEditable
                  ? 'justify center bg-primary-main hover:bg-customblue-80 active:bg-customblue-40 box-content inline-flex h-[32px] min-w-[32px] flex-row items-center justify-center gap-[5px] whitespace-nowrap rounded px-[10px] text-center font-sans text-[14px] font-semibold leading-[1.2] text-white outline-none transition duration-300 ease-in-out focus:outline-none'
                  : 'hidden'
              }
            >
              Edit
            </div>
          </Link>

          <Button
            className={ViewReportPreviewMode ? '' : 'hidden'}
            onClick={() => handlePrint()}
          >
            <BiPrinter size={'20'} />
            <span>{'Print'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Appbar;
