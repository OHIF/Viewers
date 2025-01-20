import { data } from 'dcmjs';
import DicomFileUploader, {
  UploadRejection,
} from '../../../../cornerstone/src/utils/DicomFileUploader';
import { DicomMetadataStore } from '@ohif/core';
import jsPDF from 'jspdf';

const { DicomMetaDictionary, DicomDict } = data;

const EncapsulatedPdfSopClassUid = '1.2.840.10008.5.1.4.1.1.104.1';
const ExplicitVrLittleEndianTransferSyntaxUid = '1.2.840.10008.1.2.1';
const ImplementationUid = '1.3.6.1.4.1.30071.8';

function _getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return {
    date: `${year}${month}${day}`,
    time: `${hours}${minutes}${seconds}`,
  };
}

function getDICOMFromJSONDataset(dataset) {
  console.log('getDICOMFromJSONDataset - Input dataset:', dataset);
  try {
    // 验证 EncapsulatedDocument 是否是有效的 ArrayBuffer
    if (!(dataset.EncapsulatedDocument instanceof ArrayBuffer)) {
      throw new Error('EncapsulatedDocument must be an ArrayBuffer');
    }

    const denaturalizedMetaHeader = DicomMetaDictionary.denaturalizeDataset(dataset._meta);
    const dicomDict = new DicomDict(denaturalizedMetaHeader);
    dicomDict.dict = DicomMetaDictionary.denaturalizeDataset(dataset);

    const dicomBuffer = dicomDict.write({ fragmentMultiframe: false });
    console.log('Generated DICOM buffer size:', dicomBuffer.byteLength);

    // 创建 DICOM 文件并保存
    const dicomBlob = new Blob([dicomBuffer], { type: 'application/dicom' });
    const url = window.URL.createObjectURL(dicomBlob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().getTime();
    a.download = `encapsulated_pdf_${timestamp}.dcm`; //
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return dicomBlob;
  } catch (error) {
    console.error('getDICOMFromJSONDataset - Error:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

function getJSONDatasetOfEncapsulatedPDF(pdfArrayBuffer: ArrayBuffer, instance) {
  // 打印传入的PDF ArrayBuffer信息，查看是否正确传入
  console.log('getJSONDatasetOfEncapsulatedPDF - Input pdfArrayBuffer:', pdfArrayBuffer);
  // Generate Buffer
  const pdfBinary = new Uint8Array(pdfArrayBuffer);

  // 打印生成的pdfBinary信息，查看转换是否正确
  console.log('getJSONDatasetOfEncapsulatedPDF - Generated pdfBinary:', pdfBinary);
  // Create dataset dates and times
  const dateTime = _getCurrentDateTime();

  // Generate UIDs
  const seriesInstanceUid = DicomMetaDictionary.uid();
  const sopInstanceUid = DicomMetaDictionary.uid();

  // Pad PDF buffer
  let pdfBuffer = pdfBinary;
  if (pdfBuffer.length & 1) {
    const paddedBuffer = new Uint8Array(pdfBuffer.length + 1);
    paddedBuffer.set(pdfBuffer);
    paddedBuffer[pdfBuffer.length] = 0x00;
    pdfBuffer = paddedBuffer;
  }

  // 打印处理后的pdfBuffer信息，查看填充等操作后是否符合预期
  console.log('getJSONDatasetOfEncapsulatedPDF - Processed pdfBuffer:', pdfBuffer);
  // 打印处理后的pdfBuffer大小（字节数）
  console.log(
    'getJSONDatasetOfEncapsulatedPDF - Processed pdfBuffer size (bytes):',
    pdfBuffer.byteLength
  );

  // Extract necessary information from previous instance
  const dataset = {
    _vrMap: {
      EncapsulatedDocument: 'OB',
    },
    _meta: {
      _vrMap: {},
      FileMetaInformationVersion: new Uint8Array([0, 1]).buffer,
      MediaStorageSOPClassUID: EncapsulatedPdfSopClassUid,
      MediaStorageSOPInstanceUID: sopInstanceUid,
      TransferSyntaxUID: ExplicitVrLittleEndianTransferSyntaxUid,
      ImplementationClassUID: ImplementationUid,
    },

    // Patient
    PatientID: instance.PatientID,
    PatientName: instance.PatientName,
    PatientBirthDate: instance.PatientBirthDate,
    PatientSex: instance.PatientSex,

    // Study
    StudyInstanceUID: instance.StudyInstanceUID,
    StudyDate: dateTime.date,
    StudyTime: dateTime.time,
    StudyID: instance.StudyID,
    ReferringPhysicianName: instance.ReferringPhysicianName,

    // Encapsulated Document
    Modality: 'DOC',
    SeriesInstanceUID: seriesInstanceUid,

    ContentDate: dateTime.date,
    ContentTime: dateTime.time,
    // DocumentTitle: '',
    MIMETypeOfEncapsulatedDocument: 'application/pdf',
    EncapsulatedDocument: pdfBuffer.buffer,

    SOPClassUID: EncapsulatedPdfSopClassUid,
    SOPInstanceUID: sopInstanceUid,
    SpecificCharacterSet: 'ISO_IR 100',
  };

  // 打印生成的数据集信息，查看构造是否正确
  console.log('getJSONDatasetOfEncapsulatedPDF - Generated dataset:', dataset);
  // 打印生成的数据集的大小（字节数，这里简单估算，将各字段序列化后的长度总和，实际可能更复杂，仅供参考大致大小）
  let datasetSize = 0;
  for (const key in dataset) {
    if (typeof dataset[key] === 'string') {
      datasetSize += dataset[key].length;
    } else if (Array.isArray(dataset[key])) {
      for (const element of dataset[key]) {
        if (typeof element === 'string') {
          datasetSize += element.length;
        } else if (element instanceof Uint8Array) {
          datasetSize += element.byteLength;
        }
      }
    } else if (dataset[key] instanceof Uint8Array) {
      datasetSize += dataset[key].byteLength;
    }
  }
  console.log('getJSONDatasetOfEncapsulatedPDF - Generated dataset size (bytes):', datasetSize);

  return dataset;
}

function uploadPDF(pdf: jsPDF, dataSource, instance): void {
  try {
    // 获取 PDF 的 ArrayBuffer
    const pdfArrayBuffer = pdf.output('arraybuffer');
    console.log('PDF ArrayBuffer size:', pdfArrayBuffer.byteLength);

    // 保存 PDF 文件
    pdf.save('report.pdf');

    // 转换为 DICOM dataset
    const dataset = getJSONDatasetOfEncapsulatedPDF(pdfArrayBuffer, instance);
    console.log(
      'Generated dataset EncapsulatedDocument type:',
      dataset.EncapsulatedDocument.constructor.name
    );

    // 转换为 DICOM 文件
    const file = getDICOMFromJSONDataset(dataset);

    // 上传文件
    const fileUploader = new DicomFileUploader(file, dataSource);
    fileUploader
      .load()
      .then(() => {
        console.log('Upload completed successfully');
        alert('Upload completed');
        DicomMetadataStore.addInstances([dataset], true);
      })
      .catch((rejection: UploadRejection) => {
        console.error('Upload failed:', rejection);
        alert(`Upload failed: ${JSON.stringify(rejection)}`);
      });
  } catch (error) {
    console.error('Error in uploadPDF:', error);
    alert(`Error processing PDF: ${error.message}`);
  }
}

export default uploadPDF;
