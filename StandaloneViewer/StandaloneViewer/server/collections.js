import { Meteor } from 'meteor/meteor';

// Create a Collection to store data
RequestStudies = new Meteor.Collection('requestStudies');

// Remove all previous data
RequestStudies.remove({});

const testDataFiles = [
    'sample.json',
    'testDICOMs.json',
    'CRStudy.json',
    'CTStudy.json',
    'DXStudy.json',
    'MGStudy.json',
    'MRStudy.json',
    'PTCTStudy.json',
    'RFStudy.json'
];

testDataFiles.forEach(file => {
    if (file.indexOf('.json') === -1) {
        return;
    }

    // Read JSON files and save the content in the database
    const jsonData = Assets.getText(`testData/${file}`);
    const data = JSON.parse(jsonData);

    RequestStudies.insert(data);
});
