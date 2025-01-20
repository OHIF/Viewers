import React from 'react';
import { createRoot } from 'react-dom/client';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import hospitalInfo from './hospital_info.json';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BMDReport = ({ measurements, patientInfo, scanParams }) => {
  const safeNumberFormat = (value, decimals = 1) => {
    const number = parseFloat(value);
    return !isNaN(number) ? number.toFixed(decimals) : '0';
  };

  const patientName = (() => {
    if (!patientInfo.name) {
      return 'Anonymous';
    }
    if (typeof patientInfo.name === 'string') {
      return patientInfo.name;
    }
    if (Array.isArray(patientInfo.name)) {
      return patientInfo.name.join(' ');
    }
    return String(patientInfo.name);
  })();

  const generateChartData = () => {
    // 定义年龄范围：20-90岁，每10年一个点
    const ages = Array.from({ length: 8 }, (_, i) => 20 + i * 10);

    // 定义正常参考值曲线
    const normals = ages.map(age => {
      // 根据年龄计算正常参考值，使用更合理的曲线
      return 120 + Math.max(-0.5 * (age - 30), -40);
    });

    // 定义正常范围的上下界
    const normalLowerBounds = normals.map(n => Math.max(n - 15, 60));
    const normalUpperBounds = normals.map(n => n + 15);

    // 骨量减少阈值固定在 80 mg/cc
    const lowBmdThreshold = Array(ages.length).fill(80);

    const datasets = [
      {
        label: '正常参考值',
        data: normals,
        borderColor: '#4DB6AC',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      },
      {
        label: '正常范围',
        data: normalUpperBounds,
        borderColor: '#B2DFDB',
        backgroundColor: 'rgba(178, 223, 219, 0.2)',
        borderWidth: 1,
        tension: 0.4,
        fill: 1, // 填充到下一个数据集
      },
      {
        label: '',
        data: normalLowerBounds,
        borderColor: '#B2DFDB',
        backgroundColor: 'rgba(178, 223, 219, 0.2)',
        borderWidth: 1,
        tension: 0.4,
        fill: false,
      },
      {
        label: '骨量减少阈值',
        data: lowBmdThreshold,
        borderColor: '#FF9800',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
      },
    ];

    // 添加患者数据点
    if (patientInfo.age && measurements?.averageBMD) {
      const age = parseInt(patientInfo.age);
      const patientData = Array(ages.length).fill(null);
      const ageIndex = ages.findIndex(a => Math.abs(a - age) <= 5); // 找到最接近的年龄点
      if (ageIndex !== -1) {
        patientData[ageIndex] = measurements.averageBMD;
      }

      datasets.push({
        label: '患者数据',
        data: patientData,
        borderColor: '#000',
        backgroundColor: '#000',
        borderWidth: 0,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: false,
      });
    }

    return {
      labels: ages,
      datasets,
    };
  };

  // Generate table rows for vertebrae data
  const generateVertebraeRows = () => {
    return (measurements?.vertebrae || []).map((vertebra, index) =>
      React.createElement(
        'tr',
        {
          key: `${vertebra.label}-${index}`,
          className: index < measurements.vertebrae.length - 1 ? 'border-b border-gray-300' : '',
        },
        [
          React.createElement('td', { key: 'label', className: 'p-3' }, vertebra.label),
          React.createElement(
            'td',
            { key: 'bmd', className: 'p-3 text-right' },
            safeNumberFormat(vertebra.bmd)
          ),
          React.createElement(
            'td',
            { key: 'tscore', className: 'p-3 text-right' },
            safeNumberFormat(vertebra.tScore, 2)
          ),
          React.createElement(
            'td',
            { key: 'zscore', className: 'p-3 text-right' },
            safeNumberFormat(vertebra.zScore, 2)
          ),
        ]
      )
    );
  };

  // Generate diagnosis table rows
  const generateDiagnosisRows = () => {
    const diagnosisData = [
      { range: 'vBMD > 120 mg/cc', result: '正常' },
      { range: '80 mg/cc ≤ vBMD ≤ 120 mg/cc', result: '低骨量' },
      { range: 'vBMD < 80 mg/cc', result: '骨质疏松' },
      { range: 'vBMD < 80 mg/cc，伴附性骨折', result: '严重骨质疏松' },
    ];

    return diagnosisData.map((row, index) =>
      React.createElement(
        'tr',
        {
          key: `diagnosis-${index}`,
          className: index < diagnosisData.length - 1 ? 'border-b border-gray-300' : '',
        },
        [
          React.createElement('td', { key: 'range', className: 'p-3' }, row.range),
          React.createElement('td', { key: 'result', className: 'p-3' }, row.result),
        ]
      )
    );
  };

  return React.createElement(
    'div',
    { className: 'mx-auto w-full max-w-4xl border border-gray-300 bg-white p-6' },
    // Header Section
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 gap-2 border-b border-gray-300 pb-4' },
      React.createElement(
        'div',
        { className: 'flex items-start justify-between' },
        React.createElement('div', { className: 'text-xl text-teal-600' }, 'QCT骨密度检测报告'),
        React.createElement(
          'div',
          { className: 'text-center text-teal-600' },
          hospitalInfo.Title || '福建省南平市第一医院'
        )
      ),
      React.createElement(
        'div',
        { className: 'flex justify-between' },
        React.createElement(
          'div',
          { className: 'text-gray-600' },
          `打印日期: ${patientInfo.printDate || new Date().toLocaleDateString()}`
        ),
        React.createElement(
          'div',
          { className: 'text-center text-teal-600' },
          hospitalInfo.Address || '福建省南平市延平区中山路317号'
        )
      )
    ),

    // Patient Info Section
    React.createElement(
      'div',
      { className: 'mt-4 border-b border-gray-300 pb-4' },
      React.createElement('div', { className: 'mb-2 text-teal-600' }, '病人信息'),
      React.createElement(
        'div',
        { className: 'grid grid-cols-3 gap-x-8 gap-y-2 text-sm' },
        React.createElement('div', null, `病人ID: ${patientInfo.id || '--'}`),
        React.createElement('div', null, `年龄: ${patientInfo.age || '--'}`),
        React.createElement('div', null, `性别: ${patientInfo.gender || '--'}`),
        React.createElement('div', null, `姓名: ${patientName}`),
        React.createElement('div', null, `体重: ${patientInfo.weight || '0'} kg`),
        React.createElement('div', null, `身高: ${patientInfo.height || '0'} cm`)
      )
    ),

    // Exam Info Section
    React.createElement(
      'div',
      { className: 'mt-4 border-b border-gray-300 pb-4' },
      React.createElement('div', { className: 'mb-2 text-teal-600' }, '检测信息'),
      React.createElement(
        'div',
        { className: 'grid grid-cols-4 gap-x-8 gap-y-2 text-sm' },
        React.createElement('div', null, `检测日期: ${patientInfo.examDate || '20210215'}`),
        React.createElement('div', null, `检测部位: ${patientInfo.examLocation || '--'}`),
        React.createElement('div', null, `医生: ${hospitalInfo.Doctor || '--'}`),
        React.createElement('div', null, `所属科室: ${hospitalInfo.Department || '放射科'}`)
      )
    ),

    // Scan Parameters Section
    React.createElement(
      'div',
      { className: 'mt-4 border-b border-gray-300 pb-4' },
      React.createElement('div', { className: 'mb-2 text-teal-600' }, '扫描参数'),
      React.createElement(
        'div',
        { className: 'grid grid-cols-4 gap-x-8 gap-y-2 text-sm' },
        React.createElement('div', null, `kVp: ${scanParams.kvp || '120'}`),
        React.createElement('div', null, `床高: ${scanParams.bedHeight || '169.5'}`),
        React.createElement('div', null, `层厚: ${scanParams.thickness || '1.25'}`),
        React.createElement('div', null, `扫描野: ${scanParams.scanField || '500.0'}`),
        React.createElement('div', null, `mA: ${scanParams.ma || '2'}`),
        React.createElement('div', null, `床旋进比: ${scanParams.bedRotation || '61.25'}`),
        React.createElement('div', null, `准直窄度: ${scanParams.collimation || '40'}`),
        React.createElement('div', null, `卷积核: ${scanParams.kernel || 'STANDARD'}`)
      )
    ),

    // Results Section
    React.createElement(
      'div',
      { className: 'mt-6' },
      React.createElement(
        'div',
        { className: 'mb-4 text-lg font-medium text-teal-600' },
        '骨密度结果图表'
      ),
      React.createElement(
        'div',
        { className: 'grid grid-cols-12 gap-6' },
        // Left side - BMD Results
        React.createElement(
          'div',
          { className: 'col-span-5' },
          // Average BMD Results
          React.createElement(
            'div',
            { className: 'mb-4 rounded-lg border border-gray-300' },
            React.createElement(
              'table',
              { className: 'w-full text-sm' },
              React.createElement('tbody', null, [
                React.createElement('tr', { className: 'border-b border-gray-300 bg-gray-50' }, [
                  React.createElement(
                    'td',
                    { className: 'p-2 font-medium' },
                    '平均体积骨密度 (mg/cc)'
                  ),
                  React.createElement(
                    'td',
                    { className: 'p-3 text-right' },
                    safeNumberFormat(measurements?.averageBMD)
                  ),
                ]),
                React.createElement('tr', { className: 'border-b border-gray-300' }, [
                  React.createElement('td', { className: 'p-2' }, 'T值'),
                  React.createElement(
                    'td',
                    { className: 'p-3 text-right' },
                    safeNumberFormat(measurements?.averageTScore, 2)
                  ),
                ]),
                React.createElement('tr', null, [
                  React.createElement('td', { className: 'p-3' }, 'Z值'),
                  React.createElement(
                    'td',
                    { className: 'p-3 text-right' },
                    safeNumberFormat(measurements?.averageZScore, 2)
                  ),
                ]),
              ])
            )
          ),

          // Vertebrae Results
          React.createElement(
            'div',
            { className: 'rounded-lg border border-gray-300' },
            React.createElement(
              'table',
              { className: 'w-full text-sm' },
              React.createElement(
                'thead',
                null,
                React.createElement('tr', { className: 'border-b border-gray-300 bg-gray-50' }, [
                  React.createElement('th', { className: 'p-3 text-left font-medium' }, '椎体'),
                  React.createElement('th', { className: 'p-3 text-right font-medium' }, '骨密度'),
                  React.createElement('th', { className: 'p-3 text-right font-medium' }, 'T值'),
                  React.createElement('th', { className: 'p-3 text-right font-medium' }, 'Z值'),
                ])
              ),
              React.createElement('tbody', null, generateVertebraeRows())
            )
          )
        ),

        // Right side - Reference Table and Chart
        React.createElement(
          'div',
          { className: 'col-span-7' },
          // Diagnosis Standards Table
          React.createElement(
            'div',
            { className: 'mb-4 rounded-lg border border-gray-300' },
            React.createElement(
              'table',
              { className: 'w-full text-sm' },
              React.createElement(
                'thead',
                null,
                React.createElement('tr', { className: 'border-b border-gray-300 bg-gray-50' }, [
                  React.createElement(
                    'th',
                    { className: 'p-3 text-left font-medium' },
                    'QCT体积骨密度诊断标准'
                  ),
                  React.createElement('th', { className: 'p-3 text-left font-medium' }, '诊断结果'),
                ])
              ),
              React.createElement('tbody', null, generateDiagnosisRows())
            )
          ),

          // Chart
          React.createElement(
            'div',
            { className: 'chart-container rounded-lg border border-gray-300 p-4 overflow-hidden' },
            React.createElement(
              'div',
              { className: 'h-60 w-11/12' },
              React.createElement(Line, {
                data: generateChartData(),
                options: chartOptions || defaultChartOptions, // 使用传入的配置或默认配置
                redraw: true, // 强制重绘
              })
            ),
            React.createElement(
              'div',
              { className: 'mt-2 text-center text-xs text-gray-500' },
              '标准来源：中国人群正常值(QCT)骨性密度正常参考曲线与相对阈值'
            )
          )
        )
      )
    ),

    // Footer
    React.createElement(
      'div',
      { className: 'mt-8 text-center text-sm text-gray-500' },
      '此报告仅供参考'
    )
  );
};

BMDReport.propTypes = {
  measurements: PropTypes.shape({
    averageBMD: PropTypes.number,
    averageTScore: PropTypes.number,
    averageZScore: PropTypes.number,
    chartOptions: PropTypes.object,
    vertebrae: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        bmd: PropTypes.number,
        tScore: PropTypes.number,
        zScore: PropTypes.number,
      })
    ),
  }),
  patientInfo: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.any, // Temporarily accept any type and convert internally
    age: PropTypes.string,
    gender: PropTypes.string,
    weight: PropTypes.string,
    height: PropTypes.string,
    examDate: PropTypes.string,
    examLocation: PropTypes.string,
    printDate: PropTypes.string,
  }),
  scanParams: PropTypes.shape({
    kvp: PropTypes.string,
    bedHeight: PropTypes.string,
    thickness: PropTypes.string,
    scanField: PropTypes.string,
    ma: PropTypes.string,
    bedRotation: PropTypes.string,
    collimation: PropTypes.string,
    kernel: PropTypes.string,
  }),
  hospitalInfo: PropTypes.shape({
    Title: PropTypes.string,
    Address: PropTypes.string,
    Doctor: PropTypes.string,
    Department: PropTypes.string,
  }),
};

export const createBMDReport = (measurements, patientInfo, hospitalInfo) => {
  const container = document.createElement('div');
  container.style.display = 'none';

  const root = createRoot(container);
  root.render(
    React.createElement(BMDReport, {
      measurements,
      patientInfo,
      hospitalInfo,
      scanParams: {},
    })
  );

  return container;
};

export const convertBMDReportToPDF = async (
  measurements,
  patientInfo,
  hospitalInfo,
  scanParams
) => {
  console.log('Starting PDF generation');

  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = '1000px';
  tempContainer.style.display = 'block';
  document.body.appendChild(tempContainer);

  return new Promise((resolve, reject) => {
    const root = createRoot(tempContainer);

    const staticChartOptions = {
      ...defaultChartOptions,
      animation: false,
      responsive: true,
      maintainAspectRatio: true,
    };

    console.log('Rendering component with static chart options');
    root.render(
      React.createElement(BMDReport, {
        measurements,
        patientInfo,
        hospitalInfo,
        scanParams,
        chartOptions: staticChartOptions,
      })
    );

    setTimeout(async () => {
      try {
        console.log('Converting to canvas...');
        const canvas = await html2canvas(tempContainer, {
          scale: 1.75, // 略微提高scale以提升清晰度
          useCORS: true,
          logging: true,
          height: tempContainer.scrollHeight,
          width: tempContainer.scrollWidth,
          backgroundColor: '#FFFFFF',
          imageTimeout: 15000,
          onclone: clonedDoc => {
            console.log('Document cloned');
            const chartElement = clonedDoc.querySelector('.chart-container canvas');
            console.log('Chart element found:', !!chartElement);
            if (!chartElement) {
              console.log(
                'Chart container structure:',
                clonedDoc.querySelector('.chart-container')?.innerHTML
              );
            }
          },
        });

        console.log('Creating PDF...');
        // 使用较高质量的JPEG格式，但仍保持合理的压缩率
        const imgData = canvas.toDataURL('image/jpeg', 0.85);

        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'pt',
          format: 'a4',
          compress: true,
          putOnlyUsedFonts: true,
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 30;

        // 使用MEDIUM压缩级别，在质量和大小之间取得平衡
        pdf.addImage(
          imgData,
          'JPEG',
          imgX,
          imgY,
          imgWidth * ratio,
          imgHeight * ratio,
          undefined,
          'MEDIUM'
        );

        // 验证文件大小
        const pdfBuffer = pdf.output('arraybuffer');
        const fileSizeInKB = pdfBuffer.byteLength / 1024;
        console.log('PDF size:', fileSizeInKB, 'KB');

        if (fileSizeInKB > 1024) {
          // 如果超过1MB
          console.warn('PDF size exceeds 1MB, applying additional compression');
          // 如果文件过大，进行二次压缩
          const imgDataCompressed = canvas.toDataURL('image/jpeg', 0.75);
          pdf.deletePage(1);
          pdf.addPage();
          pdf.addImage(
            imgDataCompressed,
            'JPEG',
            imgX,
            imgY,
            imgWidth * ratio,
            imgHeight * ratio,
            undefined,
            'FAST'
          );
        }

        console.log('PDF generation completed');
        document.body.removeChild(tempContainer);
        root.unmount();
        resolve(pdf);
      } catch (error) {
        console.error('PDF generation failed:', error);
        document.body.removeChild(tempContainer);
        root.unmount();
        reject(error);
      }
    }, 1500);
  });
};

const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 1.6,
  animation: false,
  layout: {
    padding: {
      left: 10,
      right: 20,
      top: 20,
      bottom: 10,
    },
  },
  plugins: {
    legend: {
      position: 'bottom',
      align: 'start',
      labels: {
        boxWidth: 12,
        padding: 15,
        font: {
          size: 12,
        },
        filter: item => item.text !== '',
      },
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      padding: 12,
      titleFont: {
        size: 14,
      },
      bodyFont: {
        size: 13,
      },
    },
  },
  scales: {
    y: {
      title: {
        display: true,
        text: '骨密度 (mg/cc)',
        font: {
          size: 12,
        },
        padding: { bottom: 10 },
      },
      min: 0,
      max: 200,
      grid: {
        color: '#E5E7EB',
        drawBorder: true,
      },
      ticks: {
        padding: 5,
        font: {
          size: 11,
        },
        stepSize: 50,
      },
    },
    x: {
      title: {
        display: true,
        text: '年龄',
        font: {
          size: 12,
        },
        padding: { top: 10 },
      },
      grid: {
        color: '#E5E7EB',
        drawBorder: true,
      },
      ticks: {
        padding: 5,
        font: {
          size: 11,
        },
      },
    },
  },
};

// 修改图表配置
const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 1.6,
  animation: false,
  layout: {
    padding: {
      left: 10,
      right: 20,
      top: 20,
      bottom: 10,
    },
  },
  plugins: {
    legend: {
      position: 'bottom',
      align: 'start',
      labels: {
        boxWidth: 12,
        padding: 15,
        font: {
          size: 12,
        },
        filter: item => item.text !== '',
      },
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      padding: 12,
      titleFont: {
        size: 14,
      },
      bodyFont: {
        size: 13,
      },
    },
  },
  scales: {
    y: {
      title: {
        display: true,
        text: '骨密度 (mg/cc)',
        font: {
          size: 12,
        },
        padding: { bottom: 10 },
      },
      min: 0,
      max: 200,
      grid: {
        color: '#E5E7EB',
        drawBorder: true,
      },
      ticks: {
        padding: 5,
        font: {
          size: 11,
        },
        stepSize: 50,
      },
    },
    x: {
      title: {
        display: true,
        text: '年龄',
        font: {
          size: 12,
        },
        padding: { top: 10 },
      },
      grid: {
        color: '#E5E7EB',
        drawBorder: true,
      },
      ticks: {
        padding: 5,
        font: {
          size: 11,
        },
      },
    },
  },
};

export default BMDReport;
