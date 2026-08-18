import React, { useState } from 'react';
import { Button } from '@ohif/ui-next';
import NIfTIConverterDialog from './NIfTIConverterDialog';

export default function NIfTIConverterButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async (ctFolderPath: string, niftiPath: string) => {
    setIsConverting(true);
    setIsDialogOpen(false);

    try {
      // 调用Python后端API
      const response = await fetch('http://localhost:5002/api/convert-nifti-to-seg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ct_folder_path: ctFolderPath,
          nifti_path: niftiPath,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('转换成功:', result);
        // 可以在这里添加下载或加载转换后的SEG文件的逻辑
        alert('转换成功！DICOM SEG文件已生成。');
      } else {
        console.error('转换失败:', result.error);
        alert(`转换失败: ${result.error}`);
      }
    } catch (error) {
      console.error('API调用错误:', error);
      alert('转换失败: 无法连接到转换服务');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        disabled={isConverting}
        variant="secondary"
      >
        {isConverting ? '转换中...' : 'NIfTI转SEG'}
      </Button>

      <NIfTIConverterDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConvert={handleConvert}
        isConverting={isConverting}
      />
    </>
  );
}
