import jsPDF from 'jspdf';
import { _ } from 'meteor/underscore';

export class BaseReport {
    constructor(options) {
        const defaultOptions = {
            width: 595.28,
            height: 841.89,
            marginTop: 30,
            marginLeft: 40,
            marginRight: 40,
            marginBottom: 30,
            showPageNumber: true
        };

        this.options = _.extend(defaultOptions, options);
        this.init();
    }

    init() {
        this.doc = new jsPDF('portrait', 'pt', [this.options.width, this.options.height]);
        this.options.width = Math.floor(this.options.width);
        this.options.height = Math.floor(this.options.height);
        this.currentPage = 1;
        this.printStatic();
    }

    printStatic() {
        this.x = this.options.marginLeft;
        this.y = this.options.marginTop;
        this.printHeader();
        if (this.options.showPageNumber) {
            this.printPageNumber();
        }
    }

    newPage() {
        this.doc.addPage();
        this.currentPage++;
        this.printStatic();
    }

    printHeader() {
        const { marginLeft, marginRight, width } = this.options;
        const doc = this.doc;
        let y = this.y;

        // Print the logo strokes
        doc.setDrawColor(0).setLineWidth(1);
        doc.roundedRect(marginLeft + 0.5, y + 0.5, 8, 8, 0.5, 0.5, 'D');
        doc.roundedRect(marginLeft + 11, y + 0.5, 8, 8, 0.5, 0.5, 'D');
        doc.roundedRect(marginLeft + 0.5, y + 11, 8, 8, 0.5, 0.5, 'D');
        doc.roundedRect(marginLeft + 11, y + 11, 8, 8, 0.5, 0.5, 'D');

        // Print the logo text
        doc.setFont('Serif').setFontSize(16).setFontStyle('normal').setTextColor(0);
        doc.text('Open Health Imaging Foundation', 66, y + 14);
        y += 24;

        // Print header horizontal line
        doc.setDrawColor(0).setLineWidth(0.5);
        doc.line(marginLeft, y, width - marginRight, y);
        y += 1;

        this.y = y;
    }

    printPageNumber() {
        const doc = this.doc;
        const { marginBottom, marginRight, width, height } = this.options;
        doc.setFont('Verdana');
        doc.setFontSize(8);
        doc.setFontStyle('normal');
        doc.setTextColor(0);
        const text = `PAGE ${this.currentPage}`;
        const size = doc.getTextDimensions(text);
        doc.text(text, width - marginRight - size.w, height - marginBottom + (size.h / 2));
    }

    save(fileName) {
        this.doc.save(fileName || 'report.pdf');
    }
}
