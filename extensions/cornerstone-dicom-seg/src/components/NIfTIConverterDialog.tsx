import React, { useState } from 'react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@ohif/ui-next';

// 扩展Window接口以支持Electron API
declare global {
  interface Window {
    electron?: {
      selectFolder?: () => Promise<string>;
      selectFile?: (filters: Array<{ name: string; extensions: string[] }>) => Promise<string>;
    };
  }
}

interface NIfTIConverterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (ctFolderPath: string, niftiPath: string) => void;
  isConverting: boolean;
}

export default function NIfTIConverterDialog({
  isOpen,
  onClose,
  onConvert,
  isConverting
}: NIfTIConverterDialogProps) {
  const [ctFolderPath, setCtFolderPath] = useState('');
  const [niftiPath, setNiftiPath] = useState('');

  const handleSelectCTFolder = () => {
    // 使用Electron的文件选择对话框
    if (window.electron && window.electron.selectFolder) {
      window.electron.selectFolder().then((path: string) => {
        setCtFolderPath(path);
      });
    } else {
      // 浏览器环境下的fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        if (files && files.length > 0) {
          // 获取第一个文件的路径作为文件夹路径
          const firstFile = files[0];
          const path = firstFile.webkitRelativePath?.split('/')[0] || '';
          setCtFolderPath(path);
        }
      };
      input.click();
    }
  };

  const handleSelectNIfTIFile = () => {
    if (window.electron && window.electron.selectFile) {
      window.electron.selectFile([
        { name: 'NIfTI Files', extensions: ['nii', 'nii.gz'] }
      ]).then((path: string) => {
        setNiftiPath(path);
      });
    } else {
      // 浏览器环境下的fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.nii,.nii.gz';
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        if (files && files.length > 0) {
          setNiftiPath(files[0].name);
        }
      };
      input.click();
    }
  };

  const handleConvert = () => {
    if (ctFolderPath && niftiPath) {
      onConvert(ctFolderPath, niftiPath);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>NIfTI 转 DICOM SEG 转换</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">CT DICOM 文件夹</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ctFolderPath}
                onChange={(e) => setCtFolderPath(e.target.value)}
                placeholder="选择包含CT DICOM文件的文件夹"
                className="flex-1 px-3 py-2 border rounded-md"
                disabled={isConverting}
              />
              <Button 
                onClick={handleSelectCTFolder}
                disabled={isConverting}
                variant="secondary"
              >
                选择文件夹
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">NIfTI 掩膜文件</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={niftiPath}
                onChange={(e) => setNiftiPath(e.target.value)}
                placeholder="选择 .nii 或 .nii.gz 文件"
                className="flex-1 px-3 py-2 border rounded-md"
                disabled={isConverting}
              />
              <Button 
                onClick={handleSelectNIfTIFile}
                disabled={isConverting}
                variant="secondary"
              >
                选择文件
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p>转换说明：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>选择原始CT DICOM文件的文件夹</li>
              <li>选择要转换的NIfTI掩膜文件</li>
              <li>系统将自动进行空间对齐并生成DICOM SEG文件</li>
              <li>生成的SEG文件将与原始CT完美匹配</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={onClose} 
            disabled={isConverting}
            variant="secondary"
          >
            取消
          </Button>
          <Button 
            onClick={handleConvert}
            disabled={!ctFolderPath || !niftiPath || isConverting}
          >
            {isConverting ? '转换中...' : '开始转换'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
