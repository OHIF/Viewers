import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useViewportGrid, ActionButtons, useModal } from '@ohif/ui';
import { DicomMetadataStore, utils } from '@ohif/core';
import { useAppConfig } from '@state';
import { useTrackedMeasurements } from '../../getContextModule';
import { useTranslation } from 'react-i18next';
import { Separator } from '@ohif/ui-next';
import ReportModal from './ReportModal';

const { downloadCSVReport } = utils;
const { formatDate } = utils;

interface ScanParameters {
  kvp: string;
  bedHeight: string;
  thickness: string;
  scanField: string;
  ma: string;
  bedRotation: string;
  collimation: string;
  kernel: string;
}

interface BMDResultsProps {
  results: {
    hu_values?: {
      bone: number;
      fat: number;
      muscle: number;
    };
    bmd: number;
    tScore?: number;
    zScore?: number;
    diagnosis?: string;
  } | null;
}

const calculateBMDMetrics = (bmd: number, age: string, gender: string = 'F') => {
  const SD = 29;

  const getChinaReference = (calculationAge: number): number => {
    if (gender === 'M') {
      return -1.5063 * calculationAge + 208.24;
    }
    return (
      3.67378408e-8 * Math.pow(calculationAge, 6) -
      1.30224967e-5 * Math.pow(calculationAge, 5) +
      1.82172603e-3 * Math.pow(calculationAge, 4) -
      1.2671986e-1 * Math.pow(calculationAge, 3) +
      4.510479 * Math.pow(calculationAge, 2) -
      77.2835444 * calculationAge +
      673.453445
    );
  };

  const youngAdultReference = getChinaReference(30);
  const tScore = (bmd - youngAdultReference) / SD;

  const ageNumber = parseInt(age) || 50;
  const ageMatchedReference = getChinaReference(ageNumber);
  const zScore = (bmd - ageMatchedReference) / SD;

  let diagnosis = '';
  let severity = 0;
  if (bmd > 120) {
    diagnosis = '正常';
    severity = 0;
  } else if (bmd < 80) {
    diagnosis = '骨质疏松';
    severity = 2;
  } else {
    diagnosis = '低骨量';
    severity = 1;
  }

  return {
    bmd,
    tScore,
    zScore,
    diagnosis,
    severity,
  };
};

const BMDResults: React.FC<BMDResultsProps> = ({ results }) => {
  if (!results) {
    return null;
  }

  const { hu_values, bmd, tScore = 0, zScore = 0, diagnosis = '未知' } = results;

  return (
    <div className="bg-primary-dark rounded p-4">
      <div className="text-primary-active mb-2 text-[14px] font-semibold">BMD 计算结果</div>
      <div className="space-y-2 text-[13px]">
        {hu_values && (
          <>
            <div className="flex justify-between">
              <span className="text-primary-light">骨骼 HU:</span>
              <span className="text-white">{hu_values.bone.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-light">脂肪 HU:</span>
              <span className="text-white">{hu_values.fat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-light">肌肉 HU:</span>
              <span className="text-white">{hu_values.muscle.toFixed(2)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between">
          <span className="text-primary-light">BMD值:</span>
          <span className="text-white">{bmd.toFixed(1)} mg/cc</span>
        </div>
        <div className="flex justify-between">
          <span className="text-primary-light">T值:</span>
          <span className="text-white">{tScore.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-primary-light">Z值:</span>
          <span className="text-white">{zScore.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex justify-between font-semibold">
          <span className="text-primary-light">诊断结果:</span>
          <span className="text-white">{diagnosis}</span>
        </div>
      </div>
    </div>
  );
};

const VERTEBRAE_OPTIONS = ['T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'];

function PanelMeasurementTableTracking({
  servicesManager,
  extensionManager,
  renderHeader,
  getCloseIcon,
  tab,
}: withAppTypes) {
  const { t } = useTranslation('MeasurementTable');
  const { measurementService, customizationService, displaySetService, uiDialogService } =
    servicesManager.services;
  const [trackedMeasurements] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const [bmdResults, setBmdResults] = useState(null);
  const [bmdError, setBmdError] = useState(null);
  const [selectedVertebraLocation, setSelectedVertebraLocation] = useState('');
  const [isVertebraConfirmed, setIsVertebraConfirmed] = useState(false);
  const [appConfig] = useAppConfig();

  const { show } = useModal();

  // 检查是否有有效的测量数据
  const hasMeasurements = () => {
    const measurements = measurementService.getMeasurements();
    return measurements && measurements.length > 0;
  };

  const VertebraConfirmDialog = ({ id, vertebra }: { id: string; vertebra: string }) => {
    const handleConfirm = () => {
      setSelectedVertebraLocation(vertebra);
      setIsVertebraConfirmed(true);
      uiDialogService.dismiss({ id });
    };

    const handleCancel = () => {
      setSelectedVertebraLocation('');
      setIsVertebraConfirmed(false);
      uiDialogService.dismiss({ id });
    };

    return (
      <div className="bg-primary-dark rounded-lg p-6">
        <h3 className="mb-4 text-lg font-medium text-white">确认节段</h3>
        <p className="text-primary-light mb-6">您确定选择 {vertebra} 作为当前测量的椎体节段吗？</p>
        <div className="flex justify-end space-x-3">
          <button
            className="rounded bg-blue-500/10 px-4 py-2 text-white transition-colors hover:bg-blue-500/20"
            onClick={handleCancel}
          >
            取消
          </button>
          <button
            className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            onClick={handleConfirm}
          >
            确认
          </button>
        </div>
      </div>
    );
  };

  const handleVertebraSelection = (vertebra: string) => {
    const dialogId = 'vertebra-confirm-dialog';
    uiDialogService.create({
      id: dialogId,
      content: VertebraConfirmDialog,
      contentProps: {
        id: dialogId,
        vertebra,
      },
      defaultPosition: {
        x: 0,
        y: 0,
      },
      centralize: true,
      showOverlay: true,
      isDraggable: false,
      preservePosition: false,
      onStart: () => {},
      onDrag: () => {},
      onStop: () => {},
    });
  };

  const calculateBMD = () => {
    try {
      if (!selectedVertebraLocation) {
        throw new Error('请先选择测量节段');
      }

      const measurements = measurementService.getMeasurements();
      const trackedMeasurements = measurements.filter(
        m => trackedStudy === m.referenceStudyUID && trackedSeries.includes(m.referenceSeriesUID)
      );

      const results = downloadCSVReport(trackedMeasurements, measurementService);

      const studyMeta = DicomMetadataStore.getStudy(trackedStudy);
      const instanceMeta = studyMeta?.series?.[0]?.instances?.[0];
      const patientAge = instanceMeta?.PatientAge || '50';
      const patientGender = instanceMeta?.PatientSex || 'F';

      const bmdMetrics = calculateBMDMetrics(results.bmd, patientAge, patientGender);

      setBmdResults({
        hu_values: results.hu_values,
        ...bmdMetrics,
      });
      setBmdError(null);
    } catch (err) {
      setBmdError(err.message);
      setBmdResults(null);
      console.error('Error calculating BMD:', err);
    }
  };

  const handleCreateReport = async () => {
    try {
      if (!bmdResults) {
        throw new Error('请先计算BMD值');
      }

      if (!selectedVertebraLocation) {
        throw new Error('请选择测量节段');
      }

      const StudyInstanceUID = trackedStudy;
      const studyMeta = DicomMetadataStore.getStudy(StudyInstanceUID);
      const instanceMeta = studyMeta?.series?.[0]?.instances?.[0];

      if (!studyMeta || !instanceMeta) {
        throw new Error('无法获取研究元数据');
      }

      const patientInfo = {
        id: instanceMeta.PatientID || '',
        name: instanceMeta.PatientName || '',
        gender: instanceMeta.PatientSex || '',
        age: instanceMeta.PatientAge || '',
        height: instanceMeta.PatientSize ? (instanceMeta.PatientSize * 100).toFixed(1) : '0',
        weight: instanceMeta.PatientWeight ? instanceMeta.PatientWeight.toFixed(1) : '0',
        examDate: instanceMeta.StudyDate ? formatDate(instanceMeta.StudyDate) : '',
        examLocation: selectedVertebraLocation,
        printDate: formatDate(new Date().toISOString()),
      };

      const hospitalInfo = {
        Title: customizationService?.get('hospitalName') || '福建省南平市第一医院',
        Address: customizationService?.get('hospitalAddress') || '福建省南平市延平区中山路317号',
        Doctor:
          instanceMeta.PerformingPhysicianName || customizationService?.get('defaultDoctor') || '',
        Department: customizationService?.get('department') || '放射科',
      };

      const scanParams: ScanParameters = {
        kvp: '120',
        bedHeight: '169.5',
        thickness: '1.25',
        scanField: '500.0',
        ma: '2',
        bedRotation: '61.25',
        collimation: '40',
        kernel: 'STANDARD',
      };

      const processedMeasurements = {
        averageBMD: bmdResults.bmd || 0,
        averageTScore: bmdResults.tScore || 0,
        averageZScore: bmdResults.zScore || 0,
        vertebrae: [
          {
            label: selectedVertebraLocation,
            bmd: bmdResults.bmd || 0,
            tScore: bmdResults.tScore || 0,
            zScore: bmdResults.zScore || 0,
          },
        ],
      };

      if (!processedMeasurements.averageBMD || !patientInfo.id || !hospitalInfo.Title) {
        throw new Error('缺少生成报告所需的必要数据');
      }

      show({
        title: t('Report'),
        content: ReportModal,
        containerDimensions: 'w-[50%] h-[100%]',
        contentProps: {
          dataSource: extensionManager.getActiveDataSource()[0],
          instance: displaySetService.getActiveDisplaySets()[0].instance,
          processedMeasurements,
          patientInfo,
          hospitalInfo,
          scanParams,
        },
      });
    } catch (error) {
      console.error('报告生成错误:', error);
      throw error;
    }
  };

  return (
    <>
      {renderHeader && (
        <>
          <div className="bg-primary-dark flex select-none rounded-t pt-1.5 pb-[2px]">
            <div className="flex h-[24px] w-full cursor-pointer select-none justify-center self-center text-[14px]">
              <div className="text-primary-active flex grow cursor-pointer select-none justify-center self-center text-[13px]">
                <span>{tab.label}</span>
              </div>
            </div>
            {getCloseIcon()}
          </div>
          <Separator
            orientation="horizontal"
            className="bg-black"
            thickness="2px"
          />
        </>
      )}

      <div className="flex h-full flex-col space-y-4 p-4">
        {/* Selected Vertebra Display - Always at the top when confirmed */}
        {isVertebraConfirmed && selectedVertebraLocation && (
          <div className="bg-primary-dark rounded p-4">
            <div className="flex items-center justify-between">
              <div className="text-primary-light text-[14px]">
                当前选择的椎体节段：
                <span className="ml-2 font-medium text-white">{selectedVertebraLocation}</span>
              </div>
              <button
                className="text-sm text-blue-400 hover:text-blue-300"
                onClick={() => {
                  setSelectedVertebraLocation('');
                  setIsVertebraConfirmed(false);
                }}
              >
                重新选择
              </button>
            </div>
          </div>
        )}

        {/* BMD Results Section - Below selected vertebra with spacing */}
        {bmdError ? (
          <div className="rounded bg-red-500/10 p-4 text-red-600">
            <div className="text-[13px]">{bmdError}</div>
          </div>
        ) : (
          bmdResults && <BMDResults results={bmdResults} />
        )}

        {/* Vertebrae Selection Section - Show only when there are measurements and no confirmation */}
        {hasMeasurements() && !isVertebraConfirmed && (
          <div className="bg-primary-dark rounded p-4">
            <div className="text-primary-active mb-3 text-[14px] font-semibold">
              请选择当前测量的椎体节段
            </div>
            <div className="flex flex-col space-y-2">
              {VERTEBRAE_OPTIONS.map(vertebra => (
                <button
                  key={vertebra}
                  className={`rounded p-2 text-left transition-all duration-200 ${
                    selectedVertebraLocation === vertebra
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-500/10 text-white/80 hover:bg-blue-500/20'
                  }`}
                  onClick={() => handleVertebraSelection(vertebra)}
                >
                  {vertebra}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No measurements message - Only show when there are no measurements */}
        {!hasMeasurements() && (
          <div className="bg-primary-dark rounded p-4">
            <div className="text-primary-light text-[13px]">请先在图像上进行测量标注</div>
          </div>
        )}

        {/* Action Buttons */}
        {!appConfig?.disableEditing && (
          <div className="mt-auto flex justify-center">
            <ActionButtons
              t={t}
              actions={[
                {
                  label: '骨密度计算',
                  onClick: calculateBMD,
                  disabled: !isVertebraConfirmed || !selectedVertebraLocation,
                },
                {
                  label: '生成报告',
                  onClick: handleCreateReport,
                  disabled: !bmdResults,
                },
              ]}
            />
          </div>
        )}
      </div>
    </>
  );
}

PanelMeasurementTableTracking.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      measurementService: PropTypes.shape({
        getMeasurements: PropTypes.func.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
      uiDialogService: PropTypes.shape({
        dismiss: PropTypes.func.isRequired,
        create: PropTypes.func.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

export default PanelMeasurementTableTracking;
