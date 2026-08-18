export const ANATOMY_REGIONS = ['头部', '胸腹', '四肢'] as const;

export const ANOMALY_TYPES: Record<string, string[]> = {
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

export const LATERALITY = ['左侧', '右侧', '双侧', '无'] as const;

export const VITAL_REACTION = ['有', '无'] as const;

export interface AnomalyInfo {
  anatomyRegion: string;
  anomalyType: string;
  laterality: string;
  vitalReaction: string;
}

export function formatAnomalyDescription(info: AnomalyInfo): string {
  return `${info.anatomyRegion}|${info.anomalyType}|${info.laterality}|${info.vitalReaction}`;
}
