import pdfmake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfmake.vfs = pdfFonts.pdfMake.vfs;

const PdfMaker = (SimilarScans, ohif_image, chart, morphologyBase64) => {
  const contents = [];
  const images = {};
  // add radcad

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
      columns: ['Patient Id : ', 'ab123'],
    },
    {
      alignment: 'left',
      columns: ['Classifier : ', 'ResNet -18'],
    },
    {
      alignment: 'left',
      columns: ['Prediction : ', 'Nescrosis'],
    },
    {
      alignment: 'left',
      columns: ['Confidence : ', '81%'],
    }
  );

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
    if (index == 0)
      contents.push({
        margin: [0, 10],
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
    contents.push({ text: '', margin: [0, 10] });
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
