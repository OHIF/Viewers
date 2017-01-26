import { BaseReport } from './base';

export class MeasurementReport extends BaseReport {
    constructor(options) {
        super(options);
    }

    printHeader() {
        super.printHeader();

        const { marginLeft, marginRight, width, header } = this.options;
        const doc = this.doc;
        let y = this.y;

        // don't print the header if not given
        if (!header) return;

        // Print trial label
        y += 10;
        doc.setFont('verdana');
        doc.setFontSize(8);
        doc.setFontStyle('bold');
        doc.setTextColor(255);
        doc.setFillColor(16);
        const trialLabel = header.trial;
        const trialLabelWidth = doc.getTextWidth(trialLabel) + 8;
        doc.roundedRect(marginLeft, y, trialLabelWidth, 15, 3, 3, 'F');
        doc.text(trialLabel, marginLeft + 4, y + 10.5);

        // Print patient information
        doc.setFont('verdana');
        doc.setFontSize(10);
        doc.setFontStyle('normal');
        doc.setTextColor(0);
        doc.text(`${header.patientName}\t${header.mrn}`, marginLeft + trialLabelWidth + 10, y + 11);
        y += 25;

        // Print timepoint header
        doc.setFillColor(229);
        doc.rect(marginLeft, y, width - marginLeft - marginRight, 18, 'F');
        doc.setFont('verdana');
        doc.setFontSize(9);
        doc.setFontStyle('normal');
        doc.setTextColor(0);
        doc.text(header.timepoint.toUpperCase(), marginLeft + 4, y + 12.5);
        y += 18;

        this.y = y;
    }

    printMeasurement(measurementData) {
        const { marginLeft, marginRight, marginBottom, width, height } = this.options;
        const infoHeight = 28;
        const rectSize = Math.round((width - marginLeft - marginRight - 3) / 2);
        const doc = this.doc;
        let { x, y } = this;
        const { image, location, info } = measurementData;
        const type = measurementData.type.toUpperCase();
        const number = measurementData.number.toString();

        if (y + rectSize + infoHeight > height - marginBottom) {
            this.newPage();
            x = this.x;
            y = this.y;
        }

        // Print the image
        doc.setFillColor(0);
        doc.rect(x, y, rectSize, rectSize, 'F');
        doc.addImage(image, 'JPEG', x + 1, y + 1, rectSize - 2, rectSize - 2);
        y += rectSize;

        // Print the measurement type
        doc.setFont('verdana').setFontSize(10).setFontStyle('bold').setTextColor(255);
        const typeWidth = Math.round(doc.getTextWidth(type));
        const typeX = x + rectSize - typeWidth;
        doc.setFillColor(64);
        doc.rect(typeX - 8, y - 16, typeWidth + 8, 16, 'F');
        doc.text(type, typeX - 4, y - 5);

        // Print the measurement number
        doc.setFillColor(224);
        doc.circle(x + 9, y - 10, 7, 'F');
        doc.setFont('courier').setTextColor(0);
        const numberHalfWidth = doc.getTextWidth(number) / 2;
        doc.text(number, x + 9 - numberHalfWidth, y - 7);

        // Print the measurement location and info
        doc.setFillColor(240);
        doc.rect(x, y, rectSize, infoHeight, 'F');
        doc.setFont('verdana').setFontSize(9);
        doc.text(location, x + 4, y + 11);
        doc.setFontStyle('normal');
        doc.text(info, x + 4, y + 24);
        y += infoHeight;

        if (x === marginLeft) {
            this.x = width - marginRight - rectSize;
        } else {
            this.x = marginLeft;
            this.y = y;
        }
    }
}
