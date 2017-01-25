import { OHIF } from 'meteor/ohif:core';
// import { $ } from 'meteor/jquery';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import * as pdfMake from 'pdfmake';

// window.jsPDF = jsPDF;
// window.html2canvas = html2canvas;
// window.pdfMake = pdfMake;

OHIF.measurements.exportPdf = (measurementGroups, measurementApi, timepointApi) => {
    const pdf = new jsPDF('portrait', 'pt', 'a4');

    // Generate the logo
    const logoImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAABLZAAAS2QBQlK26QAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAoXSURBVHic7d1LkFTVHcfxbzcDFiAqxCQ8Fc2jFMljTIIaixjLlaAoEktTiYsssnRNUS6SXVwllSULNnERK9lEkUVSeZQxpoIlkGB4mFipRISRATEYGUh0hizOjNQwt2emL+fe29P/76fqX1R1T5/+X87p39y+t6dvi+ktBe4HHgJuA5YDH5vhMcrrNPA2cBjYDewB3m20o2Q18OB43QSsApY02lEsY8AwMATsB54Dfg2czzH4YmA7cBa4aPVUnQOeBq7tOHvVWgXsBD6YpkermTpFet0u6Dh7s/AV4K0e2Bhr+joObOgwh1V5FHg/Q+9WtbUPWNNhDqf1MDDSAxtgza7OA48UzmR+O0i7nU1vszW7GgIGC2eyg9tJu5dNN251V+eBOwvmM6cnemA7re7rBOktW0et8X+XAEdm+mH1rBPArcB7FYy9jnSQ6aoKxlb1XgLuIQXCFPPG/32KdDRXc9MS0u75bysYexcpBDQ33Qi8RvoFP0WLdKrvTeDqGptSfiOkAz9nMo65AdibcTw14zDpNP4UbeABfPH3g0XA5sxjPp55PDVjHbC+6I6JAFB/2JJ5PNdG/yhcG218f9dPcs7lAuDTGcdTswrXRhtYWXMjqk7OuVzOpbNEmvsK10abdBBQ/eE6Lp3ZuVLLMo2j3lD4NzwDlEv514EXr6gdzWQj6dx+t3L91i47zsvAoUw9qNhW4ONdPqbjfJb5hNGurltWt3ZSbm4GMj3/YMnnfzLT86uzV+h+Xg4WDdSuoVlJPcoAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswAkAIzAKTADAApMANACswA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';
    pdf.addImage(logoImage, 'PNG', 40, 40, 20, 20);
    pdf.setFont('Sanchez');
    pdf.setFontSize(14);
    pdf.text('Open Health Imaging Foundation', 66, 54);

    // Header horizontal line
    pdf.setLineWidth(0.5);
    pdf.line(30, 64, 565, 64);

    const $element = $('<div></div>').css({
        border: '1px solid red',
        height: 1000,
        left: 0,
        position: 'fixed',
        top: 0,
        width: 1000,
        'z-index': 100000
    });

    $element.appendTo(document.body);

    const element = $element[0];

    cornerstone.enable(element, { renderer: 'webgl' });

    const enabledElement = cornerstone.getEnabledElement(element);
    enabledElement.toolStateManager = cornerstoneTools.newImageIdSpecificToolStateManager();

    const measurements = {
        targets: [],
        nonTargets: []
    };
    measurementGroups.forEach(measurementGroup => {
        const { toolGroup, measurementRows } = measurementGroup;
        measurementRows.forEach(rowItem => {
            rowItem.entries.forEach(entry => measurements[toolGroup.id].push(entry));
        });
    });

    let i = 0;
    const readMeasurements = toolGroupId => {
        measurements[toolGroupId].forEach(measurement => {
            setTimeout(() => {
                cornerstone.loadImage(measurement.imageId).then(image => {
                    cornerstone.displayImage(element, image);
                    cornerstoneTools.addToolState(element, measurement.toolType, measurement);
                    cornerstoneTools[measurement.toolType].enable(element);
                    cornerstoneTools.clearToolState(element, measurement.toolType);
                });
            }, i * 1000);
            i++;
        });
    };

    readMeasurements('targets');
    readMeasurements('nonTargets');

    setTimeout(() => {
        $element.remove();
        pdf.save('measurements.pdf');
    }, i * 1000);
};

// window.exportCanvasToPdf = canvas => {
//     // only jpeg is supported by jsPDF
//     const imgData = canvas.toDataURL('image/jpeg', 1.0);
//     const pdf = new jsPDF();

//     pdf.addImage(imgData, 'JPEG', 0, 0);
//     pdf.save('download.pdf');
// };

// window.exportActiveViewportToPdf = () => {
//     const activeViewportElement = getActiveViewportElement();
//     if (!activeViewportElement) {
//         console.log('>>>>> No active viewport element');
//         return;
//     }

//     console.log('>>>>> activeViewportElement: ', activeViewportElement);
//     const canvas = $(activeViewportElement).find('canvas').get(0);

//     if (!canvas) {
//         console.log('>>>>> canvas is not available');
//         return;
//     }

//     exportCanvasToPdf(canvas);
// };

// Split the data into pages
// To make it easier we're going to work with a fixed grid (4R x 2C)
const getReportData = data => {
    const patient = data.patient;
    const pages = [];
    let page;

    // Working with ITEMS until we get real data (measurements)
    const itemsPerPage = 3;
    data.items.forEach(item => {
        if (!page || (page.items.length === itemsPerPage)) {
            page = {
                width: 595, // points
                height: 841, // points
                patient,
                items: []
            };

            pages.push(page);
        }

        page.items.push(item);
    });

    return pages;
};

window.exportPdf = (options) => {
    const pages = getReportData(options.data);
    const template = Template.measurementsReport;
    const pdf = new jsPDF('portrait', 'pt', 'a4');
    let renderedView;

    const parentNode = document.createElement('div');

    const onRendered = (template) => {
        const printableElement = template.find('.print');
        const renderOptions = {
            pagesplit: true
        };

        document.body.appendChild(parentNode);
        pdf.addHTML(printableElement, 0, 0, renderOptions, () => {
            // Blaze.remove(renderedView);
            // document.body.removeChild(parentNode);
            pdf.save('html2pdf.pdf');
            console.log('Done!');
        });
    };

    const viewModel = {
        pages,
        onRendered
    };

    renderedView = Blaze.renderWithData(Template['measurementsReport'], viewModel, parentNode);
    // const html = Blaze.toHTMLWithData(Template['measurementsReport'], pages);
};

window.testExportPdf = () => {
    const options = {
        data: {
            patient: {
                name: 'Patient name'
            },
            // study: {
            //     foo: 'bar'
            // },
            // timepoint: {
            //     date: '1/1/1900'
            // },
            // measurements: [ ],
            items: []
        }
    };

    for (let i = 0; i < 8; i++) {
        options.data.items.push('Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium possimus sit alias. Repellendus minus placeat mollitia voluptas quod repellat vero quasi similique dolores minima excepturi, adipisci iusto optio, omnis accusamus. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum repudiandae alias praesentium possimus minima sunt velit voluptates maxime labore sequi, quasi cum eos perferendis tempora dolorem obcaecati ut commodi qui.');
    }

    exportPdf(options);
};
