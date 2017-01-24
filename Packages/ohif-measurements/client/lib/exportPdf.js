import { OHIF } from 'meteor/ohif:core';
// import * as jsPDF from 'jspdf';
import jsPDF from 'jspdf';
import * as pdfDebug from 'jspdf';
// import html2canvas from 'html2canvas';

window.jsPDF = jsPDF;
window.pdfDebug = pdfDebug;
// window.html2canvas = html2canvas;

// console.log('>>>>>>>>>>> html2canvas: ', html2canvas);

window.exportCanvasToPdf = canvas => {
    // only jpeg is supported by jsPDF
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF();

    pdf.addImage(imgData, 'JPEG', 0, 0);
    pdf.save('download.pdf');
};

window.exportActiveViewportToPdf = () => {
    const activeViewportElement = getActiveViewportElement();
    if (!activeViewportElement) {
        console.log('>>>>> No active viewport element');
        return;
    }

    console.log('>>>>> activeViewportElement: ', activeViewportElement);
    const canvas = $(activeViewportElement).find('canvas').get(0);

    if (!canvas) {
        console.log('>>>>> canvas is not available');
        return;
    }

    exportCanvasToPdf(canvas);
};

window.exportPdf = (options) => {
    const parentElement = document.createElement('div');
    const template = Template[options.templateName];
    const data = options.data;
    const pdf = new jsPDF();
    const page = options.page;
    const width = page.width - page.margins.left - page.margins.right; // A4 = 210 × 297;

    // const html = Blaze.toHTMLWithData(Template['measurementsReport'], data);
    // console.log('>>>>> html: ', html);

    const parentNode = document.createElement('div');
    document.body.appendChild(parentNode);

    parentNode.style.position = 'absolute';
    parentNode.style.top = 0;
    parentNode.style.right = 0;
    parentNode.style.bottom = 0;
    parentNode.style.left = 0;
    parentNode.style.backgroundColor = '#F00';
    // parentNode.style.transform = 'translate(-100%, -100%)';

    Blaze.renderWithData(Template['measurementsReport'], data, parentNode);
    console.log('>>>>> parentNode: ', parentNode);

    pdf.fromHTML(parentNode, page.margins.left, page.margins.right, { width }, () => {
        pdf.save('pdfFromHtml.pdf');
    });

    window.parentNode = parentNode;
    window.pdf = pdf;
};

window.testExportPdf = () => {
    const options = {
        templateName: 'measurementsReport',
        page: {
            format: 'a4',
            orientation: 'portrait',
            width: 595.28,
            margins: {
                left: 10,
                right: 10
            }
        },
        data: {
            items: []
        }
    };

    for (let i = 0; i < 30; i++) {
        options.data.items.push('Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium possimus sit alias. Repellendus minus placeat mollitia voluptas quod repellat vero quasi similique dolores minima excepturi, adipisci iusto optio, omnis accusamus. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum repudiandae alias praesentium possimus minima sunt velit voluptates maxime labore sequi, quasi cum eos perferendis tempora dolorem obcaecati ut commodi qui.');
    }

    exportPdf(options);
};
