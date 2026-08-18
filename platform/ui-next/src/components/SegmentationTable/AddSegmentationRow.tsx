import React, { useState } from 'react';
import { Icons } from '../Icons';
import { useTranslation } from 'react-i18next';
import { useSegmentationTableContext } from './contexts';

// Temporary inline definition until proper export is configured
interface AnomalyInfo {
  anatomyRegion: string;
  anomalyType: string;
  laterality: string;
  vitalReaction: string;
}

const AnomalyDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (info: AnomalyInfo) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [anatomyRegion, setAnatomyRegion] = useState('');
  const [anomalyType, setAnomalyType] = useState('');
  const [laterality, setLaterality] = useState('');
  const [vitalReaction, setVitalReaction] = useState('');

  const ANATOMY_REGIONS = ['头部', '胸腹', '四肢'];
  const ANOMALY_TYPES: Record<string, string[]> = {
    头部: [
      '颅骨局限性凹陷性骨折',
      '颅骨对称粉碎性/崩裂性骨折',
      '鼻骨骨折',
      '急性硬膜下血肿',
      '硬膜外血肿',
      '外伤性蛛网膜下腔出血',
      '上颌骨骨折（Le Fort I/II/III）',
      '眶壁爆裂性骨折',
      '对冲性脑挫伤',
      '舌骨骨折',
      '直接打击脑挫伤',
      '甲状软骨骨折',
      '慢性硬膜下血肿',
      '颅内积气（气脑症）',
      '脑干挫伤/出血（原发性）',
      '弥漫性轴索损伤（DAI）',
      '枪弹创（接触射击）',
      '颈部软组织肿胀/积气',
      '枪弹创（远距离射击）',
      '砍创（头部）',
      '霰弹枪头部伤',
      '爆炸破片伤（头部）',
      '基底节对称性低密度',
      '动脉瘤性蛛网膜下腔出血',
      '儿童虐待性头部损伤',
      '雷击头部损伤',
    ],
    胸腹: [
      '肋骨骨折（连枷胸）',
      '血气胸（大量）',
      '脾破裂',
      '肝破裂',
      '张力性气胸',
      '心包填塞',
      '肺挫伤',
      '肾破裂',
      '心脏破裂（钝性）',
      '主动脉峡部破裂',
      '膈肌破裂',
      '创伤性窒息',
      '胃肠道破裂',
      '脂肪栓塞综合征',
      '心脏挫伤',
      '气管破裂',
      '急性肾衰竭（挤压综合征）',
      '弥漫性腹膜炎',
      '主动脉夹层（Stanford B型）',
      '弥漫性血管内凝血（DIC）',
      '肺栓塞',
      '食管静脉曲张破裂出血',
      '多器官功能衰竭（MODS）',
      '应激性溃疡出血',
      '心源性休克',
      '脓毒症/感染性休克',
    ],
    四肢: [
      '股骨干粉碎性骨折',
      '骨盆骨折（垂直剪切型）',
      '胫腓骨双骨折',
      '跟骨粉碎性骨折',
      '踝关节骨折脱位',
      '下肢离断',
      '上肢离断',
      '腘动脉断裂',
      '锁骨下动脉断裂',
      '挤压综合征',
      '骨筋膜室综合征',
      '注射痕迹（静脉吸毒）',
      '桡动脉断裂（割腕）',
      '动物咬伤',
      '蛇咬伤（毒蛇）',
      '电击伤',
      '冻伤（四肢坏疽）',
      '气性坏疽',
      '慢性骨髓炎',
    ],
  };
  const LATERALITY = ['左侧', '右侧', '双侧', '无'];
  const VITAL_REACTION = ['有', '无'];

  const availableTypes = anatomyRegion ? ANOMALY_TYPES[anatomyRegion] || [] : [];

  const handleConfirm = () => {
    if (anatomyRegion && anomalyType && laterality && vitalReaction) {
      onConfirm({ anatomyRegion, anomalyType, laterality, vitalReaction });
      setAnatomyRegion('');
      setAnomalyType('');
      setLaterality('');
      setVitalReaction('');
    }
  };

  const isFormValid = anatomyRegion && anomalyType && laterality && vitalReaction;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[500px] rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">添加异常信息</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">解剖部位 *</label>
            <select
              className="w-full rounded border p-2"
              value={anatomyRegion}
              onChange={(e) => {
                setAnatomyRegion(e.target.value);
                setAnomalyType('');
              }}
            >
              <option value="">请选择解剖部位</option>
              {ANATOMY_REGIONS.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">异常类型 *</label>
            <select
              className="w-full rounded border p-2"
              value={anomalyType}
              onChange={(e) => setAnomalyType(e.target.value)}
              disabled={!anatomyRegion}
            >
              <option value="">
                {anatomyRegion ? '请选择异常类型' : '请先选择解剖部位'}
              </option>
              {availableTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">侧别 *</label>
            <select
              className="w-full rounded border p-2"
              value={laterality}
              onChange={(e) => setLaterality(e.target.value)}
            >
              <option value="">请选择侧别</option>
              {LATERALITY.map(lat => (
                <option key={lat} value={lat}>{lat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">生活反应 *</label>
            <select
              className="w-full rounded border p-2"
              value={vitalReaction}
              onChange={(e) => setVitalReaction(e.target.value)}
            >
              <option value="">请选择生活反应</option>
              {VITAL_REACTION.map(reaction => (
                <option key={reaction} value={reaction}>{reaction}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button
            className="rounded border px-4 py-2"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
            onClick={handleConfirm}
            disabled={!isFormValid}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export const AddSegmentationRow: React.FC<{ children?: React.ReactNode }> = ({
  children = null,
}) => {
  const { t } = useTranslation('SegmentationPanel');

  const {
    onSegmentationAdd,
    data,
    disableEditing,
    mode,
    disabled,
    segmentationRepresentationTypes,
  } = useSegmentationTableContext('AddSegmentationRow');

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if we have at least one segmentation of the representation type for the panel this component is contained in.
  const hasRepresentationType =
    (!segmentationRepresentationTypes && data.length > 0) ||
    data.some(info => segmentationRepresentationTypes?.includes(info.representation?.type));

  if (hasRepresentationType && mode === 'collapsed') {
    return null;
  }

  if (disableEditing) {
    return null;
  }

  const handleAddClick = () => {
    if (!disabled) {
      setIsDialogOpen(true);
    }
  };

  const handleDialogConfirm = (anomalyInfo: AnomalyInfo) => {
    setIsDialogOpen(false);
    onSegmentationAdd({
      segmentationId: '',
      segmentationRepresentationType: segmentationRepresentationTypes?.[0],
      anomalyInfo,
    });
  };

  return (
    <>
      <div
        data-cy="addSegmentation"
        className={`group ${disabled ? 'pointer-events-none cursor-not-allowed opacity-70' : ''}`}
        onClick={handleAddClick}
      >
        {children}
        <div className="text-primary group-hover:bg-popover flex items-center rounded-[4px] pl-1 group-hover:cursor-pointer">
          <div className="grid h-[28px] w-[28px] place-items-center">
            {disabled ? <Icons.Info /> : <Icons.Add />}
          </div>
          <span className="text-[13px]">
            {t(disabled ? 'Segmentation not supported' : 'Add segmentation')}
          </span>
        </div>
      </div>
      <AnomalyDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
};
