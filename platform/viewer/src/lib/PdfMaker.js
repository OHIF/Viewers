import pdfmake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { getItem } from './localStorageUtils';
pdfmake.vfs = pdfFonts.pdfMake.vfs;

function getMalignantScore(data) {
  const knnLength = data.knn.length;
  const malignantCount = data.knn.filter(item => item.malignant).length;
  return malignantCount + '/' + knnLength;
}

function createPdfStructure(
  similarity,
  dataset,
  datasetId,
  malignant,
  imageDataUrl3,
  imageDataUrl8
) {
  return {
    columns: [
      {
        width: 'auto',
        style: 'smallImg',
        margin: [0, 5, 0, 0],
        stack: [
          {
            stack: [
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 100,
                    h: 120,
                    lineWidth: 1,
                    lineColor: malignant ? 'red' : 'blue',
                  },
                ],
              },
              {
                image: imageDataUrl3,
                width: 98,
                height: 70,
                margin: [1, -119, 0, 20],
              },
              {
                margin: [10, -13, 0, 20],
                stack: [
                  {
                    columnGap: 0,
                    columns: [
                      { text: '01' },
                      {
                        margin: [-30, 0, 0, 0],
                        stack: [
                          {
                            columns: [
                              {
                                text: 'Similarity:',
                                bold: true,
                                fontSize: 8,
                              },
                              {
                                text: `${similarity}%`,
                                fontSize: 8,
                                margin: [0, 0, 0, 0],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Dataset:',
                                fontSize: 8,
                                bold: true,
                              },
                              {
                                text: `${dataset}`,
                                fontSize: 8,
                                margin: [0, 0, 0, 0],
                              },
                            ],
                          },
                          {
                            columnGap: 3,
                            columns: [
                              {
                                text: 'Dataset Id:',
                                fontSize: 8,
                                bold: true,
                                margin: [-1, 0, 0, 0],
                              },
                              {
                                text: `${datasetId}`,
                                fontSize: 8,
                                margin: [0, 0, 0, 0],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Malignant:',
                                bold: true,
                                fontSize: 8,
                              },
                              {
                                text: malignant ? 'Yes' : 'No',
                                color: malignant ? 'red' : 'blue',
                                fontSize: 8,
                                margin: [2, 0, 0, 0],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        stack: [
          {
            image: imageDataUrl8,
            width: 130,
            height: 120,
            margin: [-10, 5, 0, 0],
          },
        ],
        margin: [20, 0, 0, 0],
      },
    ],
  };
}

function createLeftColumns(
  percentage,
  dataset,
  datasetId,
  isMalignant,
  imageDataUrl9,
  imageDataUrl3
) {
  return {
    columns: [
      {
        width: 'auto',
        style: 'smallImg',
        stack: [
          {
            stack: [
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 100,
                    h: 122,
                    lineWidth: 1,
                    lineColor: 'blue',
                  },
                ],
              },
              {
                image: imageDataUrl3,
                width: 98,
                height: 72,
                margin: [1, -121, 0, 20],
              },
              {
                margin: [10, -13, 0, 20],
                stack: [
                  {
                    columnGap: 0,
                    columns: [
                      { text: '0' + dataset, bold: true },
                      {
                        margin: [-30, 0, 0, 0],
                        stack: [
                          {
                            columns: [
                              {
                                text: 'Similarity:',
                                bold: true,
                                fontSize: 8,
                              },
                              {
                                text: `${percentage}%`,
                                fontSize: 8,
                                margin: [0, 0, 0, 0],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Dataset:',
                                fontSize: 8,
                                bold: true,
                              },
                              {
                                text: dataset,
                                fontSize: 8,
                                margin: [0, 0, 0, 0],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Dataset Id:',
                                fontSize: 8,
                                bold: true,
                                margin: [-1, 0, 0, 0],
                              },
                              {
                                text: datasetId,
                                fontSize: 8,
                                margin: [3, 0, 0, 0],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Malignant:',
                                bold: true,
                                fontSize: 8,
                              },
                              {
                                text: isMalignant ? 'Yes' : 'No',
                                color: isMalignant ? 'red' : 'blue',
                                fontSize: 8,
                                margin: [2, 0, 0, 0],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        stack: [
          {
            image: imageDataUrl9,
            width: 130,
            height: 120,
          },
        ],
        margin: [5, 0, 5, 0],
      },
    ],
  };
}

function createRightColumns(
  similarity,
  dataset,
  datasetId,
  malignant,
  imageDataUrl3,
  imageDataUrl8
) {
  return {
    columns: [
      {
        width: 'auto',
        style: 'smallImg',
        stack: [
          {
            stack: [
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 100,
                    h: 120,
                    lineWidth: 1,
                    lineColor: malignant ? 'red' : 'blue',
                  },
                ],
              },
              {
                image: imageDataUrl3,
                width: 98,
                height: 72,
                margin: [1, -119, 0, 20],
              },
              {
                margin: [10, -13, 0, 20],
                stack: [
                  {
                    columnGap: 0,
                    columns: [
                      { text: '0' + dataset, bold: true },
                      {
                        margin: [-30, 0, 0, 0],
                        stack: [
                          {
                            columns: [
                              {
                                text: 'Similarity:',
                                bold: true,
                                fontSize: 8,
                              },
                              {
                                text: similarity,
                                fontSize: 8,
                                margin: [0, 0, 0, 0],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Dataset:',
                                fontSize: 8,
                                bold: true,
                              },
                              {
                                text: dataset,
                                fontSize: 8,
                                margin: [0, 0, 0, 0],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Dataset Id:',
                                fontSize: 8,
                                bold: true,
                                margin: [-1, 0, 0, 0],
                              },
                              {
                                text: datasetId,
                                fontSize: 8,
                                margin: [3, 0, 0, 0],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Malignant:',
                                bold: true,
                                fontSize: 8,
                              },
                              {
                                text: malignant ? 'Yes' : 'No',
                                color: malignant ? 'red' : 'blue',
                                fontSize: 8,
                                margin: [2, 0, 0, 0],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        stack: [
          {
            image: imageDataUrl8,
            width: 130,
            height: 120,
          },
        ],
        margin: [10, 0, 0, 0],
      },
    ],
  };
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
  return {};
}

function createReportSummaryTable(
  patientID,
  patientName,
  classifier,
  malignantScore
) {
  return {
    table: {
      widths: ['25%', '72%'], // specify widths for both columns
      body: [
        [
          {
            style: 'imagescol2',
            columns: [
              {
                columns: [
                  {
                    stack: [
                      {
                        text: 'Patient Name:',
                        bold: true,
                        fontSize: 9,
                      },
                      {
                        text: patientName,
                        color: '#3d3d49',
                        fontStyle: 'thin',
                        fontSize: 10,
                        margin: [0, 4, 0, 0],
                      },
                    ],
                  },
                  {
                    stack: [
                      {
                        text: 'Classifier:',
                        bold: true,
                        noWrap: true,
                        fontSize: 9,
                      },
                      {
                        text: classifier,
                        color: '#3d3d49',
                        fontStyle: 'thin',
                        fontSize: 10,
                        margin: [0, 4, 0, 0],
                      },
                    ],
                  },
                ],
              },
              {
                columns: [
                  {
                    stack: [
                      {
                        text: 'Patient ID:',
                        bold: true,
                        fontSize: 9,
                      },
                      {
                        text: patientID,
                        fontStyle: 'thin',
                        color: '#3d3d49',
                        fontSize: 10,
                        margin: [0, 4, 0, 0],
                      },
                    ],
                  },
                  {
                    stack: [
                      {
                        text: 'Malignant Score:',
                        bold: true,
                        noWrap: true,
                        fontSize: 9,
                      },
                      {
                        text: malignantScore,
                        fontStyle: 'thin',
                        color: '#3d3d49',
                        margin: [0, 4, 0, 0],
                      },
                    ],
                  },
                ],
              },
            ],
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
    }, // this layout has no borders and no padding
    style: 'jumbotron',
    margin: [0, 0, 0, 0],
  };
}

function createSimilarScansHeader() {
  return {
    table: {
      widths: ['25%', '72%'], // specify widths for both columns
      body: [
        [
          {
            text: 'ADDITIONAL SIMILAR SCANS',
            style: 'jumbotronHeader',
            colSpan: 2, // span across 2 columns
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
    }, // this layout has no borders and no padding
    style: 'jumbotronBlue',
    margin: [0, -5, 0, 8],
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
  let contents = [];
  let contents3 = null;
  let contents2 = [];
  const images = {};

  const patientData = getItem('selectedStudy');
  const score = getMalignantScore(SimilarScans);

  images['query'] = SimilarScans.query;
  images['logo_one'] =
    'https://afrogane-storage.s3.eu-central-1.amazonaws.com/logo_one.png';
  images['logo_two'] =
    'https://afrogane-storage.s3.eu-central-1.amazonaws.com/logo_two.png';

  SimilarScans.knn.forEach((data, index) => {
    const imageIndex = 'img' + index;
    images[imageIndex + 'thumb'] = data.region_thumbnail_url;
    images[imageIndex] = data.image_url;

    if (index === 0) {
      contents3 = createPdfStructure(
        data.similarity_score,
        index + 1,
        data.data_id,
        data.malignant,
        // 'query',
        imageIndex + 'thumb',
        chart[index]
      );
      // Skip the first iteration
      return;
    }
    // if (index > 4) return; // Break the loop once it reaches index 5

    const isEvenIndex = index % 2 === 0;
    if (isEvenIndex) {
      contents2.push(
        createRightColumns(
          data.similarity_score,
          index + 1,
          data.data_id,
          data.malignant,
          // 'query',
          imageIndex + 'thumb',
          chart[index]
        )
      );
    } else {
      contents2.push(
        createRightColumns(
          data.similarity_score,
          index + 1,
          data.data_id,
          data.malignant,
          // 'query',
          imageIndex + 'thumb',
          chart[index]
        )
      );
    }
    if (isEvenIndex) {
      contents.push({
        columns: contents2,
      });
      contents2 = [];
    }

    // if (!isEvenIndex && index !== SimilarScans.knn.length - 1 && index !== 0)
    //   contents.push({ text: '', pageBreak: 'after' });
  });

  const documentDefinition = {
    content: [
      {
        style: 'imagescol3',
        alignment: 'justify',
        columns: [
          {
            image: 'logo_one',
            width: 80,
            height: 80,
          },
          {
            text: 'Radcad Report Summary',
            style: 'jumbotronHeader',
            // colSpan: 2, // span across 2 columns
            margin: [25, 20, 0, 0],
            bold: true,
            color: '#243D4E',
            fontSize: 17,
          },
          {
            image: 'logo_two',
            width: 80,
            height: 80,
            margin: [12, 0, 0, 0],
          },
        ],
      },
      {
        table: {
          widths: ['25%', '72%'], // specify widths for both columns
          body: [
            [
              {
                text: 'PATIENT INFORMATION',
                style: 'jumbotronHeader',
                colSpan: 2, // span across 2 columns
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
        }, // this layout has no borders and no padding
        style: 'jumbotronLBlue',
        margin: [0, 0, 0, 0],
      },
      createReportSummaryTable(
        patientData.PatientID,
        patientData.PatientName,
        'ResNet -18',
        score
      ),
      {
        text: 'ANALYSIS DESCRIPTION',
        bold: true,
        fontSize: 9,
        margin: [0, 17, 0, 0],
      },
      {
        text:
          'The Nodify XL2 test is a blood-based lung nodule test designed to help identify low to moderate risk patients with an incidental lung nodule that is likely benign. The test integrates two circulating proteins measured by mass spectrometry with clinical risk factors associated with lung cancer into a proprietary algorithm that generates a numerical test result. The Nodify XL2 test is intended for patients at least 40 years of age with an incidental lung nodule between 8 and 30mm and a pre-test risk of malignancy of 50% or less calculated using the solitary pulmonary nodule calculator!. Nodify XL2 was developed and clinically validated in a population with a prevalence of cancer of 16%23. The Nodify XL2 test has not been evaluated outside of this population.',
        fontSize: 7,
        width: 200,
        margin: [0, 5, 0, 0],
      },
      {
        style: 'headercol',
        alignment: 'justify',
        columns: [
          {
            table: {
              widths: ['22%', '72%'], // specify widths for both columns
              body: [
                [
                  {
                    text: 'COLLAGE RADIOMICS',
                    style: 'jumbotronHeader',
                    colSpan: 2, // span across 2 columns
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
            }, // this layout has no borders and no padding
            style: 'jumbotronLBlue2',
            margin: [0, 30, -10, 10],
          },
          {
            table: {
              widths: ['25%', '70%'], // specify widths for both columns
              body: [
                [
                  {
                    text: 'MOST SIMILAR SCANS',
                    style: 'jumbotronHeader',
                    colSpan: 2, // span across 2 columns
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
            }, // this layout has no borders and no padding
            style: 'jumbotronBlue',
            margin: [-8, 30, 0, 20],
          },
        ],
      },
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
      header2: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 10],
      },
      header3: {
        fontSize: 14,
        bold: true,
        margin: [20, 140, 0, 5],
      },
      headercol: {
        columnGap: 0,
        width: 200,
        margin: [0, -20, 0, -19],
      },
      smallImg: {
        fontSize: 10,
        margin: [0, 0, 0, 5],
      },
      imagescol: {
        columnGap: 20,
        margin: [10, 50, 30, 10],
      },
      imagescol2: {
        columnGap: 60,
        margin: [10, 7, 30, 7],
      },
      imagescol3: {
        columnGap: 40,
        margin: [0, 7, 30, 7],
      },
      jumbotron: {
        fillColor: '#EFF0F5', // jumbotron background color
        padding: [10, 10, 10, 10], // add padding for the jumbotron
        border: 'grey',
      },
      jumbotronBlue: {
        fillColor: '#243D4E', // jumbotron background color
        padding: [10, 0, 10, 10], // add padding for the jumbotron
        border: 'grey',
        color: 'white',
      },
      jumbotronLBlue: {
        fillColor: '#A2B1BC', // jumbotron background color
        padding: [10, -10, 10, 0], // add padding for the jumbotron
        border: 'grey',
        color: 'white',
      },
      jumbotronLBlue2: {
        fillColor: '#A2B1BC', // jumbotron background color
        padding: [10, 0, 10, 10], // add padding for the jumbotron
        border: 'grey',
        color: 'white',
      },
      jumbotronDark: {
        fillColor: '#EFF0F5', // jumbotron background color
        padding: [10, 10, 10, 10], // add padding for the jumbotron
        border: 'grey',
      },
      jumbotronHeader: {
        fontSize: 12, // bigger, bolder font for jumbotron header
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
    },
    images,
  };

  if (ohif_image) {
    // documentDefinition.content.push(createCollageRadiomicsHeader());

    documentDefinition.content.push({
      columns: [
        {
          table: {
            widths: ['25%', '72%'], // specify widths for both columns
            body: [
              [
                {
                  image: ohif_image,
                  width: 140,
                  height: 120,
                  margin: [5, 5, 5, 5],
                },
                {
                  stack: [
                    {
                      columnGap: 0,
                      columns: [
                        {
                          text: 'Zoom:',
                          bold: true,
                          fontSize: 8,
                          margin: [87, 5, 0, 0],
                        },
                        {
                          text: '138%',
                          fontSize: 8,
                          margin: [3, 5, 0, 0],
                        },
                      ],
                    },
                    {
                      columns: [
                        {
                          text: 'W:',
                          bold: true,
                          fontSize: 8,
                          margin: [87, 0, 0, 0],
                        },
                        {
                          text: '1500',
                          fontSize: 8,
                          margin: [3, 0, 0, 0],
                        },
                      ],
                    },
                    {
                      // columns: [
                      // {
                      text: 'Loseless/',
                      // bold: true,
                      fontSize: 8,
                      margin: [87, 0, 0, 0],
                      // },

                      // ],
                    },
                    {
                      text: 'Uncompressed',
                      fontSize: 8,
                      margin: [87, 0, 0, 0],
                    },
                    {
                      text: 'May 21, 2010',
                      fontSize: 8,
                      margin: [87, 66, 0, 0],
                    },
                    {
                      text: '09: 12: 52',
                      fontSize: 8,
                      margin: [87, 0, 0, 0],
                    },
                  ],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
          }, // this layout has no borders and no padding
          style: 'jumbotronDark',
          margin: [0, 0, 0, 20],
        },
        {
          ...contents3,
        },
      ],
    });
  }

  if (contents.length > 0) {
    documentDefinition.content.push(createSimilarScansHeader());
    documentDefinition.content = documentDefinition.content.concat(contents);
  }

  // if (morphologyBase64) {
  //   documentDefinition.content.push(createMorphologyHeader());
  //   documentDefinition.content.push({
  //     image: morphologyBase64,
  //     fit: [518, 500],
  //   });
  // }

  return documentDefinition;
};

export default PdfMaker;
