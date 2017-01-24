import { OHIF } from 'meteor/ohif:core';
// import { $ } from 'meteor/jquery';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

window.jsPDF = jsPDF;
window.html2canvas = html2canvas;

OHIF.measurements.exportPdf = measurementGroups => {
    console.warn('>>>>Adding canvas to body', measurementGroups);

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
    measurements.targets.forEach(target => {
        setTimeout(() => {
            cornerstone.loadImage(target.imageId).then(image => {
                cornerstone.displayImage(element, image);
            });
        }, i * 1000);
        i++;
    });

    setTimeout(() => $element.remove(), i * 1000);
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
