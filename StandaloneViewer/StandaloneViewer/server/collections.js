import { Meteor } from 'meteor/meteor';

// Create a Collection to store data
RequestStudies = new Meteor.Collection('requestStudies');

// Remove all previous data
RequestStudies.remove({});

// Insert our test data
RequestStudies.insert({
    transactionId: 'testId',
    studies: [{
        studyInstanceUid: '23.23.21.3.32',
        patientName: 'Patient Name',
        seriesList: [{
            seriesInstanceUid: '1.23.2.32.1.2.1.3.2',
            seriesDescription: 'Wikipedia Samples',
            instances: [
                {
                    sopInstanceUid: '1.2.3.2.32.18.8',
                    rows: 1, // TODO: Remove all requirement for this
                    url: 'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
                }, {
                    sopInstanceUid: '1.2.3.2.32.18.9',
                    rows: 1,
                    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Sample_Floorplan.jpg/800px-Sample_Floorplan.jpg'
                }
            ]
        }, {
            seriesInstanceUid: '1.33.2.32.1.2.1.3.2',
            seriesDescription: 'JPS-sample',
            instances: [
                {
                    sopInstanceUid: '1.2.3.2.32.18.10',
                    rows: 1,
                    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/JPS-sample.jpg/800px-JPS-sample.jpg'
                }
            ]
        }]
    }]
});

// Insert our test data
RequestStudies.insert({
    transactionId: 'testDICOMs',
    studies: [{
        studyInstanceUid: '23.23.21.3.32',
        patientName: 'Patient Name',
        seriesList: [{
            seriesInstanceUid: '1.23.2.32.1.2.1.3.2',
            seriesDescription: 'T-1',
            instances: [
                {
                    sopInstanceUid: '1.2.3.2.32.18.8',
                    rows: 1, // TODO: Remove all requirement for this
                    url: 'dicomweb://rawgit.com/chafey/byozfwv/master/sampleData/1.2.840.113619.2.5.1762583153.215519.978957063.80.dcm'
                }, {
                    sopInstanceUid: '1.2.3.2.32.18.9',
                    rows: 1,
                    url: 'dicomweb://rawgit.com/chafey/byozfwv/master/sampleData/1.2.840.113619.2.5.1762583153.215519.978957063.81.dcm'
                }
            ]
        }, {
            seriesInstanceUid: '1.33.2.32.1.2.1.3.2',
            seriesDescription: 'COR T-1',
            instances: [
                {
                    sopInstanceUid: '1.2.3.2.32.18.10',
                    rows: 1,
                    url: 'dicomweb://rawgit.com/chafey/byozfwv/master/sampleData/1.2.840.113619.2.5.1762583153.215519.978957063.136.dcm'
                }
            ]
        }]
    }]
});
