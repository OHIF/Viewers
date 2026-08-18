import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ohif/ui-next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ohif/ui-next';
import { Button } from '@ohif/ui-next';
import {
  ANATOMY_REGIONS,
  ANOMALY_TYPES,
  LATERALITY,
  VITAL_REACTION,
  type AnomalyInfo,
  formatAnomalyDescription,
} from './anomalyData';

interface AnomalyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (anomalyInfo: AnomalyInfo) => void;
}

export const AnomalyDialog: React.FC<AnomalyDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [anomalyInfo, setAnomalyInfo] = useState<AnomalyInfo>({
    anatomyRegion: '',
    anomalyType: '',
    laterality: '',
    vitalReaction: '',
  });

  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Update available anomaly types when anatomy region changes
  useEffect(() => {
    if (anomalyInfo.anatomyRegion) {
      setAvailableTypes(ANOMALY_TYPES[anomalyInfo.anatomyRegion] || []);
    } else {
      setAvailableTypes([]);
    }
    // Reset anomaly type when anatomy region changes
    setAnomalyInfo(prev => ({ ...prev, anomalyType: '' }));
  }, [anomalyInfo.anatomyRegion]);

  const handleConfirm = () => {
    if (
      anomalyInfo.anatomyRegion &&
      anomalyInfo.anomalyType &&
      anomalyInfo.laterality &&
      anomalyInfo.vitalReaction
    ) {
      onConfirm(anomalyInfo);
      // Reset form
      setAnomalyInfo({
        anatomyRegion: '',
        anomalyType: '',
        laterality: '',
        vitalReaction: '',
      });
    }
  };

  const isFormValid =
    anomalyInfo.anatomyRegion &&
    anomalyInfo.anomalyType &&
    anomalyInfo.laterality &&
    anomalyInfo.vitalReaction;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加异常信息</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 解剖部位 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">解剖部位 *</label>
            <Select
              value={anomalyInfo.anatomyRegion}
              onValueChange={(value) =>
                setAnomalyInfo(prev => ({ ...prev, anatomyRegion: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择解剖部位" />
              </SelectTrigger>
              <SelectContent>
                {ANATOMY_REGIONS.map(region => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 异常类型 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">异常类型 *</label>
            <Select
              value={anomalyInfo.anomalyType}
              onValueChange={(value) =>
                setAnomalyInfo(prev => ({ ...prev, anomalyType: value }))
              }
              disabled={!anomalyInfo.anatomyRegion}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    anomalyInfo.anatomyRegion
                      ? '请选择异常类型'
                      : '请先选择解剖部位'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 侧别 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">侧别 *</label>
            <Select
              value={anomalyInfo.laterality}
              onValueChange={(value) =>
                setAnomalyInfo(prev => ({ ...prev, laterality: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择侧别" />
              </SelectTrigger>
              <SelectContent>
                {LATERALITY.map(lat => (
                  <SelectItem key={lat} value={lat}>
                    {lat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 生活反应 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">生活反应 *</label>
            <Select
              value={anomalyInfo.vitalReaction}
              onValueChange={(value) =>
                setAnomalyInfo(prev => ({ ...prev, vitalReaction: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择生活反应" />
              </SelectTrigger>
              <SelectContent>
                {VITAL_REACTION.map(reaction => (
                  <SelectItem key={reaction} value={reaction}>
                    {reaction}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!isFormValid}>
            确认
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnomalyDialog;
