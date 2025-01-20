import React, { useEffect, useState, useRef } from 'react';
import uploadPDF from './pdfUploader';
import { convertBMDReportToPDF } from './BMDreport';

const ReportModal = ({
  dataSource,
  instance,
  processedMeasurements,
  patientInfo,
  hospitalInfo,
}) => {
  const [pdf, setPdf] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const iframeRef = useRef(null);

  useEffect(() => {
    const generatePDF = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!processedMeasurements || !patientInfo || !hospitalInfo) {
          throw new Error('Missing required data for PDF generation');
        }

        const generatedPDF = await convertBMDReportToPDF(
          processedMeasurements,
          patientInfo,
          hospitalInfo,
          {}
        );

        setPdf(generatedPDF);
        const blob = new Blob([generatedPDF.output('blob')], {
          type: 'application/pdf',
        });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error('Error generating PDF:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    generatePDF();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [processedMeasurements, patientInfo, hospitalInfo]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-black bg-opacity-50">
        <div className="flex flex-col items-center">
          {/* 旋转加载动画 */}
          <div className="loader-container">
            <div className="loader"></div>
          </div>
          {/* 文字描述 */}
          <div className="mt-2 text-xl text-white">正在生成报告，请稍候...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-black bg-opacity-50">
        <div className="rounded-lg bg-white p-6 text-xl text-red-500 shadow-lg">错误: {error}</div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col overflow-hidden bg-[#090c29]"
      style={{ height: '800px' }}
    >
      {/* 顶部工具栏 - 固定高度 */}
      <div className="flex h-14 items-center justify-end px-1 py-1">
        <button
          onClick={() => uploadPDF(pdf, dataSource, instance)}
          className="rounded bg-[#0944b3] px-6 py-2.5 text-sm text-white transition-colors duration-200 hover:bg-[#0837a3]"
        >
          上传报告
        </button>
      </div>

      {/* PDF显示区域 - 自适应高度 */}
      <div className="flex flex-1 justify-center overflow-auto bg-[#090c29] p-4">
        <div className="relative min-h-full w-full max-w-5xl bg-white shadow-lg">
          {pdfUrl && (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              className="absolute h-full w-full border-0 p-4"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
              }}
              title="BMD Report"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0944b3;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

export default ReportModal;
