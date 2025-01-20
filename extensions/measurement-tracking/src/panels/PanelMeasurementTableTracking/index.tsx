import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { StudySummary, MeasurementTable, useViewportGrid, ActionButtons, useModal } from '@ohif/ui';
import { DicomMetadataStore, utils } from '@ohif/core';
import { useDebounce } from '@hooks';
import { useAppConfig } from '@state';
import { useTrackedMeasurements } from '../../getContextModule';
import debounce from 'lodash.debounce';
import { useTranslation } from 'react-i18next';
import { Separator } from '@ohif/ui-next';
import ReportModal from './ReportModal';

const { downloadCSVReport } = utils;
const { formatDate } = utils;

interface MeasurementLabelValue {
  label?: string;
  finding?: {
    text?: string;
  };
  findingSites?: Array<{
    text?: string;
  }>;
}

interface UtilityModuleExports {
  showLabelAnnotationPopup: (
    measurement: any,
    uiDialogService: any,
    labelConfig: any
  ) => Promise<Map<string, MeasurementLabelValue>>;
}

interface UtilityModule {
  exports: UtilityModuleExports;
}

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
  // 标准差值
  const SD = 29; // 使用中国数据库的标准差

  // 计算年龄匹配的参考值
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

  // 计算T值（与30岁年轻人的比较）
  const youngAdultReference = getChinaReference(30);
  const tScore = (bmd - youngAdultReference) / SD;

  // 计算Z值（与同年龄段的比较）
  const ageNumber = parseInt(age) || 50;
  const ageMatchedReference = getChinaReference(ageNumber);
  const zScore = (bmd - ageMatchedReference) / SD;

  // 获取诊断类别
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
    <div className="bg-primary-dark mt-2 rounded p-4">
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

const DISPLAY_STUDY_SUMMARY_INITIAL_VALUE = {
  key: undefined,
  date: '',
  modality: '',
  description: '',
};

function PanelMeasurementTableTracking({
  servicesManager,
  extensionManager,
  renderHeader,
  getCloseIcon,
  tab,
}: withAppTypes) {
  const [viewportGrid] = useViewportGrid();
  const { t } = useTranslation('MeasurementTable');
  const [measurementChangeTimestamp, setMeasurementsUpdated] = useState(Date.now().toString());
  const debouncedMeasurementChangeTimestamp = useDebounce(measurementChangeTimestamp, 200);
  const { measurementService, uiDialogService, displaySetService, customizationService } =
    servicesManager.services;
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const [displayStudySummary, setDisplayStudySummary] = useState(
    DISPLAY_STUDY_SUMMARY_INITIAL_VALUE
  );
  const [displayMeasurements, setDisplayMeasurements] = useState([]);
  const [bmdResults, setBmdResults] = useState(null);
  const [bmdError, setBmdError] = useState(null);
  const measurementsPanelRef = useRef(null);
  const [appConfig] = useAppConfig();

  const { show } = useModal();

  useEffect(() => {
    const measurements = measurementService.getMeasurements();
    const filteredMeasurements = measurements.filter(
      m => trackedStudy === m.referenceStudyUID && trackedSeries.includes(m.referenceSeriesUID)
    );

    const mappedMeasurements = filteredMeasurements.map(m =>
      _mapMeasurementToDisplay(m, measurementService.VALUE_TYPES, displaySetService)
    );
    setDisplayMeasurements(mappedMeasurements);
  }, [measurementService, trackedStudy, trackedSeries, debouncedMeasurementChangeTimestamp]);

  const updateDisplayStudySummary = async () => {
    if (trackedMeasurements.matches('tracking')) {
      const StudyInstanceUID = trackedStudy;
      const studyMeta = DicomMetadataStore.getStudy(StudyInstanceUID);
      const instanceMeta = studyMeta.series[0].instances[0];
      const { StudyDate, StudyDescription } = instanceMeta;

      const modalities = new Set();
      studyMeta.series.forEach(series => {
        if (trackedSeries.includes(series.SeriesInstanceUID)) {
          modalities.add(series.instances[0].Modality);
        }
      });
      const modality = Array.from(modalities).join('/');

      if (displayStudySummary.key !== StudyInstanceUID) {
        setDisplayStudySummary({
          key: StudyInstanceUID,
          date: StudyDate,
          modality,
          description: StudyDescription,
        });
      }
    } else if (trackedStudy === '' || trackedStudy === undefined) {
      setDisplayStudySummary(DISPLAY_STUDY_SUMMARY_INITIAL_VALUE);
    }
  };

  useEffect(() => {
    updateDisplayStudySummary();
  }, [displayStudySummary.key, trackedMeasurements, trackedStudy, updateDisplayStudySummary]);

  useEffect(() => {
    const added = measurementService.EVENTS.MEASUREMENT_ADDED;
    const addedRaw = measurementService.EVENTS.RAW_MEASUREMENT_ADDED;
    const updated = measurementService.EVENTS.MEASUREMENT_UPDATED;
    const removed = measurementService.EVENTS.MEASUREMENT_REMOVED;
    const cleared = measurementService.EVENTS.MEASUREMENTS_CLEARED;
    const subscriptions = [];

    [added, addedRaw, updated, removed, cleared].forEach(evt => {
      subscriptions.push(
        measurementService.subscribe(evt, () => {
          setMeasurementsUpdated(Date.now().toString());
          if (evt === added) {
            debounce(() => {
              measurementsPanelRef.current.scrollTop = measurementsPanelRef.current.scrollHeight;
            }, 300)();
          }
        }).unsubscribe
      );
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, [measurementService, sendTrackedMeasurementsEvent]);

  const calculateBMD = () => {
    try {
      const measurements = measurementService.getMeasurements();
      const trackedMeasurements = measurements.filter(
        m => trackedStudy === m.referenceStudyUID && trackedSeries.includes(m.referenceSeriesUID)
      );

      // Get base results from CSV
      const results = downloadCSVReport(trackedMeasurements, measurementService);

      // Get patient info from DICOM metadata
      const studyMeta = DicomMetadataStore.getStudy(trackedStudy);
      const instanceMeta = studyMeta?.series?.[0]?.instances?.[0];
      const patientAge = instanceMeta?.PatientAge || '50';
      const patientGender = instanceMeta?.PatientSex || 'F';

      // Calculate additional metrics using our imported function
      const bmdMetrics = calculateBMDMetrics(results.bmd, patientAge, patientGender);

      // Combine the results
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

  const jumpToImage = ({ uid, isActive }) => {
    measurementService.jumpToMeasurement(viewportGrid.activeViewportId, uid);
    onMeasurementItemClickHandler({ uid, isActive });
  };

  const VertebraSelectionDialog = ({
    onSubmit,
    onCancel,
  }: {
    onSubmit: (location: string) => void;
    onCancel: () => void;
  }) => {
    const [vertebraLocation, setVertebraLocation] = useState('L1');

    const handleSubmit = () => {
      onSubmit(vertebraLocation);
    };

    const commonVertebrae = ['T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'];

    return (
      <div className="w-[320px] rounded-xl bg-[#1a237e] p-5 shadow-lg">
        <h3 className="mb-4 text-center text-lg font-medium text-white">请选择当前测量节段</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {commonVertebrae.map(location => (
              <button
                key={location}
                className={`flex h-16 w-[130px] items-center justify-center text-lg font-medium transition-all duration-200 ${
                  vertebraLocation === location
                    ? 'border border-blue-400 bg-blue-500 text-white shadow-md'
                    : 'border border-blue-200/30 bg-blue-800/30 text-white hover:bg-blue-700/40 hover:shadow-sm'
                }`}
                style={{
                  borderRadius: '8px',
                }}
                onClick={() => setVertebraLocation(location)}
              >
                {location}
              </button>
            ))}
          </div>

          <div className="mt-5 flex justify-end space-x-3">
            <button
              className="h-10 w-20 rounded-lg bg-blue-800/30 text-sm font-medium text-white transition-all hover:bg-blue-700/40"
              onClick={onCancel}
            >
              取消
            </button>
            <button
              className="h-10 w-20 rounded-lg bg-blue-500 text-sm font-medium text-white transition-all hover:bg-blue-600"
              onClick={handleSubmit}
            >
              确定
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 添加自定义的深蓝色背景
  const style = document.createElement('style');
  style.textContent = `
    .bg-navy-900 {
      background-color:rgb(24, 30, 94);
    }
  `;
  document.head.appendChild(style);

  const createVertebraSelectionDialog = (
    resolve: (location: string) => void,
    reject: (reason: Error) => void
  ) => {
    uiDialogService.create({
      id: 'vertebra-selection-dialog',
      content: VertebraSelectionDialog,
      contentProps: {
        onSubmit: (location: string) => {
          uiDialogService.dismiss({ id: 'vertebra-selection-dialog' });
          resolve(location);
        },
        onCancel: () => {
          uiDialogService.dismiss({ id: 'vertebra-selection-dialog' });
          reject(new Error('User cancelled'));
        },
      },
      defaultPosition: {
        x: 0,
        y: 0,
      },
      centralize: true,
      showOverlay: true,
      isDraggable: true,
      onStart: () => {},
      onDrag: () => {},
      onStop: () => {},
    });
  };

  const handleCreateReport = async () => {
    try {
      // 1. 检查是否已有BMD计算结果
      if (!bmdResults) {
        throw new Error('请先计算BMD值');
      }

      // 2. 获取椎体位置选择
      const vertebraLocation = await new Promise<string>((resolve, reject) => {
        createVertebraSelectionDialog(resolve, reject);
      });

      // 3. 获取研究信息
      const StudyInstanceUID = trackedStudy;
      const studyMeta = DicomMetadataStore.getStudy(StudyInstanceUID);
      const instanceMeta = studyMeta?.series?.[0]?.instances?.[0];

      if (!studyMeta || !instanceMeta) {
        throw new Error('无法获取研究元数据');
      }

      // 4. 准备患者信息
      const patientInfo = {
        id: instanceMeta.PatientID || '',
        name: instanceMeta.PatientName || '',
        gender: instanceMeta.PatientSex || '',
        age: instanceMeta.PatientAge || '',
        height: instanceMeta.PatientSize ? (instanceMeta.PatientSize * 100).toFixed(1) : '0',
        weight: instanceMeta.PatientWeight ? instanceMeta.PatientWeight.toFixed(1) : '0',
        examDate: instanceMeta.StudyDate ? formatDate(instanceMeta.StudyDate) : '',
        examLocation: vertebraLocation,
        printDate: formatDate(new Date().toISOString()),
      };

      // 5. 准备医院信息
      const hospitalInfo = {
        Title: customizationService?.get('hospitalName') || '福建省南平市第一医院',
        Address: customizationService?.get('hospitalAddress') || '福建省南平市延平区中山路317号',
        Doctor:
          instanceMeta.PerformingPhysicianName || customizationService?.get('defaultDoctor') || '',
        Department: customizationService?.get('department') || '放射科',
      };

      // 6. 准备扫描参数
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

      // 7. 处理测量数据
      const processedMeasurements = {
        averageBMD: bmdResults.bmd || 0,
        averageTScore: bmdResults.tScore || 0,
        averageZScore: bmdResults.zScore || 0,
        vertebrae: [
          {
            label: vertebraLocation,
            bmd: bmdResults.bmd || 0,
            tScore: bmdResults.tScore || 0,
            zScore: bmdResults.zScore || 0,
          },
        ],
      };

      // 8. 数据验证
      if (!processedMeasurements.averageBMD || !patientInfo.id || !hospitalInfo.Title) {
        console.error('数据验证失败:', {
          measurements: processedMeasurements,
          patient: patientInfo,
          hospital: hospitalInfo,
        });
        throw new Error('缺少生成报告所需的必要数据');
      }

      // 9. 显示报告模态框
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

      // 10. 错误处理
      if (error.message === 'User cancelled') {
        console.log('用户取消了报告生成');
        return;
      }

      // 显示错误对话框
      uiDialogService.create({
        id: 'error-dialog',
        content: ({ close }) => (
          <div className="p-4">
            <h3 className="mb-4 text-lg font-medium text-red-600">错误</h3>
            <p className="mb-4 text-gray-700">{error.message}</p>
            <button
              onClick={close}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              确定
            </button>
          </div>
        ),
        contentProps: {},
        defaultPosition: {
          x: 0,
          y: 0,
        },
        centralize: true,
        showOverlay: true,
        isDraggable: true,
        onStart: () => {},
        onDrag: () => {},
        onStop: () => {},
      });
    }
  };

  const onMeasurementItemEditHandler = ({ uid, isActive }: { uid: string; isActive: boolean }) => {
    jumpToImage({ uid, isActive });
    const labelConfig = customizationService.get('measurementLabels');
    const measurement = measurementService.getMeasurement(uid);
    const utilityModule = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.utilityModule.common'
    ) as UtilityModule;

    const { showLabelAnnotationPopup } = utilityModule.exports;

    showLabelAnnotationPopup(measurement, uiDialogService, labelConfig).then(
      (val: Map<string, MeasurementLabelValue>) => {
        measurementService.update(
          uid,
          {
            ...val,
          },
          true
        );
      }
    );
  };

  const onMeasurementItemClickHandler = ({ uid, isActive }) => {
    if (!isActive) {
      const measurements = [...displayMeasurements];
      const measurement = measurements.find(m => m.uid === uid);

      measurements.forEach(m => (m.isActive = m.uid !== uid ? false : true));
      measurement.isActive = true;
      setDisplayMeasurements(measurements);
    }
  };

  const displayMeasurementsWithoutFindings = displayMeasurements.filter(
    dm => dm.measurementType !== measurementService.VALUE_TYPES.POINT && dm.referencedImageId
  );
  const additionalFindings = displayMeasurements.filter(
    dm => dm.measurementType === measurementService.VALUE_TYPES.POINT && dm.referencedImageId
  );

  const nonAcquisitionMeasurements = displayMeasurements.filter(dm => dm.referencedImageId == null);

  const disabled =
    additionalFindings.length === 0 &&
    displayMeasurementsWithoutFindings.length === 0 &&
    nonAcquisitionMeasurements.length === 0;

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
      <div
        className="invisible-scrollbar overflow-y-auto overflow-x-hidden"
        ref={measurementsPanelRef}
        data-cy={'trackedMeasurements-panel'}
      >
        {displayStudySummary.key && (
          <StudySummary
            date={formatDate(displayStudySummary.date)}
            modality={displayStudySummary.modality}
            description={displayStudySummary.description}
          />
        )}
        <MeasurementTable
          title="Measurements"
          data={displayMeasurementsWithoutFindings}
          servicesManager={servicesManager}
          onClick={jumpToImage}
          onEdit={onMeasurementItemEditHandler}
        />
        {additionalFindings.length !== 0 && (
          <MeasurementTable
            title="Additional Findings"
            data={additionalFindings}
            servicesManager={servicesManager}
            onClick={jumpToImage}
            onEdit={onMeasurementItemEditHandler}
          />
        )}
        {nonAcquisitionMeasurements.length !== 0 && (
          <MeasurementTable
            title="Non-tracked"
            data={nonAcquisitionMeasurements}
            servicesManager={servicesManager}
            onClick={jumpToImage}
            onEdit={onMeasurementItemEditHandler}
          />
        )}

        {bmdError ? (
          <div className="mt-2 rounded bg-red-500/10 p-4 text-red-600">
            <div className="text-[13px]">{bmdError}</div>
          </div>
        ) : (
          <BMDResults results={bmdResults} />
        )}
      </div>
      {!appConfig?.disableEditing && (
        <div className="flex justify-center p-4">
          <ActionButtons
            t={t}
            actions={[
              {
                label: '骨密度计算',
                onClick: calculateBMD,
                disabled: disabled,
              },
              {
                label: '生成报告',
                onClick: handleCreateReport,
                disabled: disabled,
              },
            ]}
          />
        </div>
      )}
    </>
  );
}

function _mapMeasurementToDisplay(measurement, types, displaySetService) {
  const { referenceStudyUID, referenceSeriesUID, SOPInstanceUID } = measurement;

  const instance = DicomMetadataStore.getInstance(
    referenceStudyUID,
    referenceSeriesUID,
    SOPInstanceUID
  );

  const displaySets = displaySetService.getDisplaySetsForSeries(referenceSeriesUID);

  if (!displaySets[0]?.instances) {
    throw new Error('The tracked measurements panel should only be tracking "stack" displaySets.');
  }

  const {
    displayText: baseDisplayText,
    uid,
    label: baseLabel,
    type,
    selected,
    findingSites,
    finding,
    referencedImageId,
    data,
  } = measurement;

  // 获取测量值
  const measurementText = [];

  if (data) {
    // 尝试从不同位置获取测量值
    const stats = data.cachedStats?.[Object.keys(data.cachedStats)[0]] || data.roiStats || data;

    if (stats) {
      // 面积显示
      if (stats.area || stats.areaMm2) {
        measurementText.push(`${(stats.area || stats.areaMm2).toFixed(2)} mm²`);
      }

      // 平均值显示
      if (typeof stats.mean === 'number' || typeof stats.meanHU === 'number') {
        const meanValue = stats.meanHU || stats.mean;
        measurementText.push(`Mean: ${meanValue.toFixed(2)} HU`);
      }

      // 体积显示（如果有）
      if (stats.volume || stats.volumeMm3) {
        measurementText.push(`Volume: ${(stats.volume || stats.volumeMm3).toFixed(2)} mm³`);
      }
    }
  }

  const firstSite = findingSites?.[0];
  const label = baseLabel || finding?.text || firstSite?.text || '(empty)';

  // 合并所有显示文本
  let displayText = measurementText.length > 0 ? measurementText : baseDisplayText || [];

  if (findingSites) {
    const siteText = [];
    findingSites.forEach(site => {
      if (site?.text !== label) {
        siteText.push(site.text);
      }
    });
    displayText = [...siteText, ...displayText];
  }

  if (finding && finding?.text !== label) {
    displayText = [finding.text, ...displayText];
  }

  return {
    uid,
    label,
    baseLabel,
    measurementType: type,
    displayText,
    baseDisplayText,
    isActive: selected,
    finding,
    findingSites,
    referencedImageId,
  };
}

PanelMeasurementTableTracking.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      measurementService: PropTypes.shape({
        getMeasurements: PropTypes.func.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

export default PanelMeasurementTableTracking;
