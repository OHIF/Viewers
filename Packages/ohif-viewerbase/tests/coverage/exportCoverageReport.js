import { Meteor } from 'meteor/meteor';
import { chai } from 'meteor/practicalmeteor:chai';
import ReportService from 'meteor/lmieulet:meteor-coverage'

chai.should();

describe('Exporting coverage report', function() {
    it('Generating coverage report', function() { });

    after(function() {
        const reportService = new ReportService.ReportService();
        const mockRes = { end: () => { }, writeHead: () => { } };

        // The possible reports
        // Check https://github.com/serut/meteor-coverage
        reportService.generateReport(mockRes, 'text-summary', {});
        reportService.generateReport(mockRes, 'html', {});
        reportService.generateReport(mockRes, 'json-summary', {});
        reportService.generateReport(mockRes, 'lcovonly', {});
    });
});