import pdfmake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { getItem } from './localStorageUtils';
pdfmake.vfs = pdfFonts.pdfMake.vfs;

function getMalignantScore(data) {
  const knnLength = data.knn.length;
  const malignantCount = data.knn.filter(item => item.malignant).length;
  return malignantCount + '/' + knnLength;
}

const PdfMaker = (SimilarScans, ohif_image, chart, morphologyBase64) => {
  const contents = [];
  const images = {};

  const patientData = getItem('selectedStudy');
  const score = getMalignantScore(SimilarScans);

  contents.push(
    {
      stack: [
        {
          text: 'RadCard Report Summary',
          style: 'header',
        },
      ],
      style: 'header',
      background: 'lightgray',
    },
    {
      alignment: 'left',
      columns: ['Patient Id : ', patientData.PatientID],
    },
    {
      alignment: 'left',
      columns: ['Patient Name : ', patientData.PatientName],
    },
    {
      alignment: 'left',
      columns: ['Classifier : ', 'ResNet -18'],
    },
    {
      alignment: 'left',
      columns: ['Malignant Score : ', score],
    }
  );

  if (ohif_image)
    contents.push(
      {
        text: 'Collage Radiomics',
        style: 'header',
      },
      {
        image: ohif_image,
        width: 520,
        height: 500,
      }
    );

  contents.push({
    text: 'Similar looking Scans',
    style: 'header',
    pageBreak: 'before',
  });
  images['query'] = SimilarScans.query;

  SimilarScans.knn.forEach((data, index) => {
    const imageIndex = 'img' + index;
    images[imageIndex + 'thumb'] = data.region_thumbnail_url;
    images[imageIndex] = data.image_url;
    const malignant = data.malignant ? ' Yes' : 'No';
    // if (index == 0)
    contents.push({
      // margin: [0, 10],
      // stack: [
      //   {
      //     image: 'query',
      //     fit: [150, 150],
      //   },
      //   {
      //     text: 'Original Query',
      //     fontsize: 14,
      //   },
      // ],

      alignment: 'right',
      // pageBreak: 'before',
      columns: [
        {
          alignment: 'left',
          fontSize: 14,
          stack: [
            {
              image: 'query',
              fit: [150, 150],
            },
            {
              text: 'Original Query',
              fontsize: 14,
            },
          ],
        },
        {
          width: 400,
          stack: [
            'Number :' + (index + 1),
            'Similarity:' + data.similarity_score,
            'Dataset:' + data.dataset,
            'Dataset Id:' + data.data_id,
            'Malignant: ' + malignant,
          ],
        },
      ],
    });

    contents.push({
      alignment: 'right',
      // pageBreak: 'before',
      columns: [
        {
          alignment: 'left',
          fontSize: 14,
          stack: [
            {
              image: imageIndex + 'thumb',
              fit: [150, 150],
              margin: [0, 10],
            },
            'Similarity:' + data.similarity_score,
            'Dataset:' + data.dataset,
            'Dataset Id:' + data.data_id,
            'Malignant: ' + malignant,
          ],
        },
        {
          width: 400,
          stack: [
            // {
            //   image: imageIndex,
            //   fit: [300, 300],
            // },
            {
              image: chart[index],
              fit: [300, 300],
              margin: [0, 10],
              // relativePosition: {
              //   y: -355,
              //   x: -15,
              // },
              // opacity: 0.2,
            },
          ],
        },
      ],
    });
    // contents.push({ text: '', margin: [0, 10] });
    if (index !== SimilarScans.knn.length - 1)
      contents.push({ text: '', pageBreak: 'before' });
  });

  if (morphologyBase64)
    contents.push(
      {
        text: 'Morphology',
        style: 'header',
        pageBreak: 'before',
      },
      {
        image: morphologyBase64,
        fit: [518, 500],
      }
    );

  return {
    content: contents,
    defaultStyle: {
      fontSize: 14,
    },
    styles: {
      header: {
        background: 'lightgray',
        fontSize: 28,
        bold: true,
        margin: [0, 20],
      },
      normal: {
        fontSize: 22,
      },
    },
    images,
  };
};

export default PdfMaker;
