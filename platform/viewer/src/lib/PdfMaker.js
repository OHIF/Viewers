import pdfmake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { getItem } from './localStorageUtils';
pdfmake.vfs = pdfFonts.pdfMake.vfs;

function getMalignantScore(data) {
  const knnLength = data.knn.length;
  const malignantCount = data.knn.filter(item => item.malignant).length;
  return malignantCount + '/' + knnLength;
}

function createSimilarScansSection(
  similarity,
  dataset,
  datasetId,
  malignant,
  originalQueryImg,
  scanImg,
  scanLargeImg
) {
  return {
    style: 'imagescol',
    alignment: 'justify',
    columns: [
      {
        width: 'auto',
        style: 'smallImg',
        stack: [
          { bold: true, text: '0' + dataset, fontSize: 18 },
          {
            margin: [0, 10, 0, 40],
            stack: [{ image: originalQueryImg, width: 100, height: 80 }],
          },
          { margin: [0, -40, 0, 20], text: 'Original Query' },
          [
            {
              stack: [
                {
                  canvas: [
                    {
                      type: 'rect',
                      x: 0,
                      y: 0,
                      w: 100,
                      h: 147,
                      lineWidth: 1,
                      lineColor: malignant ? 'red' : 'blue',
                    },
                  ],
                },
                {
                  image: scanImg,
                  width: 100,
                  height: 80,
                  margin: [0, -147, 0, 20],
                },
                {
                  margin: [10, -9, 0, 10],
                  stack: [
                    {
                      columns: [
                        { text: 'Similarity:', bold: true },
                        { text: similarity, margin: [-18, 0, 0, 0] },
                      ],
                    },
                    {
                      columns: [
                        { text: 'Dataset:', bold: true },
                        { text: dataset, margin: [-18, 0, 0, 0] },
                      ],
                    },
                    {
                      columns: [
                        {
                          text: 'Dataset Id:',
                          bold: true,
                          margin: [-1, 0, 0, 0],
                        },
                        { text: datasetId, margin: [-18, 0, 0, 0] },
                      ],
                    },
                    {
                      columns: [
                        { text: 'Malignant:', bold: true },
                        {
                          text: malignant ? 'Yes' : 'No',
                          color: malignant ? 'red' : 'blue',
                          margin: [-18, 0, 0, 0],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        ],
      },
      {
        stack: [{ image: scanLargeImg, width: 290, height: 285 }],
        margin: [40, 0, 0, 0],
      },
    ],
  };
}

function createSimilarScansSection2(
  similarity,
  dataset,
  datasetId,
  malignant,
  originalQueryImg,
  scanImg,
  scanLargeImg
) {
  return {
    style: 'imagescol2',
    alignment: 'justify',
    columns: [
      {
        width: 'auto',
        style: 'smallImg',
        stack: [
          {
            bold: true,
            text: '0' + dataset,
            fontSize: 18, // bigger, bolder font for jumbotron header
            margin: [0, 20, 0, 0],
          },
          {
            margin: [0, 10, 0, 10],
            stack: [
              {
                image: originalQueryImg,
                width: 100,
                height: 80,
              },
              {
                margin: [0, 5, 0, 10],
                text: 'Original Query',
              },
            ],
          },
          [
            {
              stack: [
                {
                  canvas: [
                    {
                      type: 'rect',
                      x: 0,
                      y: 0,
                      w: 100,
                      h: 140,
                      lineWidth: 1,
                      lineColor: malignant ? 'red' : 'blue',
                    },
                  ],
                },
                {
                  image: scanImg,
                  width: 100,
                  height: 80,
                  margin: [0, -140, 0, 20],
                },
                {
                  margin: [10, -13, 0, 20],
                  // padding: [20, 10, 20, 10],
                  stack: [
                    // columns: [ ],
                    {
                      columns: [
                        {
                          text: 'Similarity:',
                          bold: true,
                        },
                        {
                          text: similarity,
                          margin: [-18, 0, 0, 0],
                        },
                      ],
                    },
                    {
                      columns: [
                        {
                          text: 'Dataset:',
                          bold: true,
                        },
                        {
                          text: dataset,
                          margin: [-18, 0, 0, 0],
                        },
                      ],
                    },
                    {
                      columns: [
                        {
                          text: 'Dataset Id:',
                          bold: true,
                          margin: [-1, 0, 0, 0],
                        },
                        {
                          text: datasetId,
                          margin: [-18, 0, 0, 0],
                        },
                      ],
                    },
                    {
                      columns: [
                        {
                          text: 'Malignant:',
                          bold: true,
                        },
                        {
                          text: malignant ? 'Yes' : 'No',
                          color: malignant ? 'red' : 'blue',
                          margin: [-18, 0, 0, 0],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        ],
      },
      {
        stack: [
          {
            image: scanLargeImg,
            width: 290,
            height: 285,
          },
        ],
        margin: [40, 0, 0, 0],
      },
    ],
  };
}

function createReportSummaryTable(
  patientID,
  patientName,
  classifier,
  malignantScore
) {
  return {
    table: {
      widths: ['30%', '70%'], // specify widths for both columns
      body: [
        [
          {
            text: 'RadCard Report Summary',
            style: 'jumbotronHeader',
            colSpan: 2,
          },
          {},
        ],
        [{ text: 'Patient ID : ', style: 'bold' }, patientID],
        [{ text: 'Patient Name : ', style: 'bold' }, patientName],
        [{ text: 'Classifier : ', style: 'bold' }, classifier],
        [{ text: 'Malignant Score : ', style: 'bold_margin' }, malignantScore],
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
    },
    style: 'jumbotron',
  };
}

function createSimilarScansHeader() {
  return {
    table: {
      widths: ['25%', '72%'],
      body: [
        [
          {
            text: 'Similar Looking Scans',
            colSpan: 2,
            margin: [20, 15, 0, 15],
            bold: true,
            fontSize: 18,
          },
          {},
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
    },
    style: 'jumbotron',
    pageBreak: 'before',
  };
}

function createMorphologyHeader() {
  return {
    table: {
      widths: ['25%', '72%'],
      body: [
        [
          {
            text: 'Morphology',
            colSpan: 2,
            margin: [20, 15, 0, 15],
            bold: true,
            fontSize: 18,
          },
          {},
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
    },
    style: 'jumbotron',
    pageBreak: 'before',
  };
}

function createCollageRadiomicsHeader() {
  return {
    table: {
      widths: ['25%', '72%'],
      body: [
        [
          {
            text: 'Collage Radiomics',
            style: 'jumbotronHeader',
            colSpan: 2,
          },
          {},
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
    },
    style: 'jumbotron',
    margin: [0, 30, 0, 20],
  };
}

const PdfMaker = (SimilarScans, ohif_image, chart, morphologyBase64) => {
  const contents = [];
  const images = {};

  const patientData = getItem('selectedStudy');
  const score = getMalignantScore(SimilarScans);

  images['query'] = SimilarScans.query;

  SimilarScans.knn.forEach((data, index) => {
    const imageIndex = 'img' + index;
    images[imageIndex + 'thumb'] = data.region_thumbnail_url;
    images[imageIndex] = data.image_url;
    const isEvenIndex = index % 2 === 0;

    contents.push(
      createSimilarScansSection(
        data.similarity_score,
        index + 1,
        data.data_id,
        data.malignant,
        'query',
        imageIndex + 'thumb',
        chart[index]
      )
    );
    if (!isEvenIndex && index !== SimilarScans.knn.length - 1 && index !== 0)
      contents.push({ text: '', pageBreak: 'after' });
  });

  const documentDefinition = {
    content: [
      createReportSummaryTable(
        patientData.PatientID,
        patientData.PatientName,
        'ResNet -18',
        score
      ),
    ],
    styles: {
      firstCanvas: {
        fillColor: '#f2f2f2',
      },
      header: {
        fontSize: 12,
        bold: true,
        background: '#f2f2f2',
        margin: [0, 0, 0, 10],
      },
      header2: { fontSize: 16, bold: true, margin: [0, 10, 0, 10] },
      header3: { fontSize: 14, bold: true, margin: [20, 140, 0, 5] },
      smallImg: { fontSize: 10, margin: [0, 0, 0, 5] },
      imagescol: { columnGap: 20, margin: [10, 50, 30, 10] },
      imagescol2: {
        columnGap: 20,
        margin: [10, 10, 30, 30],
      },
      jumbotron: {
        fillColor: '#F9FAFA', // jumbotron background color
        padding: [10, 10, 10, 10], // add padding for the jumbotron
        border: 'grey',
      },
      jumbotronHeader: {
        fontSize: 17, // bigger, bolder font for jumbotron header
        bold: true, // make the header bold
        margin: [12, 10, 10, 10], // add some margin to create space under the header
      },
      jumbotronBody: {
        fontSize: 14, // font size for the body text
        margin: [10, 10, 10, 10], // add some margin to create space under the body text
      },
      bold: {
        bold: true, // make the labels bold
        margin: [15, 0, 30, 0], // add some margin to create space under the body text
      },
      bold_margin: {
        bold: true, // make the labels bold
        margin: [15, 0, 30, 20], // add some margin to create space under the body text
      },
    },
    images,
  };

  if (ohif_image) {
    documentDefinition.content.push(createCollageRadiomicsHeader());
    documentDefinition.content.push({
      image: ohif_image,
      width: 500,
      height: 500,
    });
  }

  if (contents.length > 0) {
    documentDefinition.content.push(createSimilarScansHeader());
    documentDefinition.content = documentDefinition.content.concat(contents);
  }

  if (morphologyBase64) {
    documentDefinition.content.push(createMorphologyHeader());
    documentDefinition.content.push({
      image: morphologyBase64,
      fit: [518, 500],
    });
  }

  return documentDefinition;
};

export default PdfMaker;
