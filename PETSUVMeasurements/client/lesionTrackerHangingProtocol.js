// Define Baseline protocol
var proto = new HP.Protocol('LT_Baseline');
proto.locked = true;

var studyDescription = new HP.ProtocolMatchingRule();
studyDescription.required = true;
studyDescription.attribute = 'studyDescription';
studyDescription.constraint = {
    contains: {
        value: 'CT'
    }
};

var isBaseline = new HP.ProtocolMatchingRule();
isBaseline.required = true;
isBaseline.attribute = 'timepointType';
isBaseline.constraint = {
    equals: {
        value: 'baseline'
    }
};

proto.addProtocolMatchingRule(studyDescription);
proto.addProtocolMatchingRule(isBaseline);

var oneByOne = new HP.ViewportStructure('grid', {
    rows: 1,
    columns: 1
});

// Stage 1
var single = new HP.Viewport();

var baseline = new HP.StudyMatchingRule(true);
baseline.required = true;
baseline.attribute = 'timepointType';
baseline.constraint = {
    equals: {
        value: 'baseline'
    }
};

var body = new HP.SeriesMatchingRule();
body.attribute = 'seriesDescription';
body.weight = 5;
body.constraint = {
    contains: {
        value: 'Body'
    }
};

var chest = new HP.SeriesMatchingRule();
chest.attribute = 'seriesDescription';
chest.constraint = {
    contains: {
        value: 'CHEST'
    }
};

single.studyMatchingRules.push(baseline);
single.seriesMatchingRules.push(body);
single.seriesMatchingRules.push(chest);

var first = new HP.Stage(oneByOne, 'oneByOne');
first.viewports.push(single);

proto.addStage(first);

HP.lesionTrackerBaselineProtocol = proto;
HP.lesionTrackerBaselineProtocol.id = 'lesionTrackerBaselineProtocol';


// Define Followup Protocol
var proto = new HP.Protocol('LT_BaselineFollowup');
proto.locked = true;

var studyDescription = new HP.ProtocolMatchingRule();
studyDescription.required = true;
studyDescription.attribute = 'studyDescription';
studyDescription.constraint = {
    contains: {
        value: 'CT'
    }
};

var isFollowup = new HP.ProtocolMatchingRule();
isFollowup.required = true;
isFollowup.attribute = 'timepointType';
isFollowup.constraint = {
    equals: {
        value: 'followup'
    }
};

proto.addProtocolMatchingRule(studyDescription);
proto.addProtocolMatchingRule(isFollowup);

var oneByTwo = new HP.ViewportStructure('grid', {
    rows: 1,
    columns: 2
});

// Stage 1
var left = new HP.Viewport();
var right = new HP.Viewport();

var baseline = new HP.StudyMatchingRule(true);
baseline.required = true;
baseline.attribute = 'timepointType';
baseline.constraint = {
    equals: {
        value: 'baseline'
    }
};

var followup = new HP.StudyMatchingRule();
followup.required = true;
followup.attribute = 'timepointType';
followup.constraint = {
    equals: {
        value: 'followup'
    }
};

var body = new HP.SeriesMatchingRule();
body.attribute = 'seriesDescription';
body.weight = 5;
body.constraint = {
    contains: {
        value: 'Body'
    }
};

var chest = new HP.SeriesMatchingRule();
chest.attribute = 'seriesDescription';
chest.constraint = {
    contains: {
        value: 'CHEST'
    }
};

left.studyMatchingRules.push(baseline);
//left.seriesMatchingRules.push(body);
//left.seriesMatchingRules.push(chest);

right.studyMatchingRules.push(followup);
//right.seriesMatchingRules.push(body);
//right.seriesMatchingRules.push(chest);

var first = new HP.Stage(oneByTwo, 'oneByTwo');
first.viewports.push(left);
first.viewports.push(right);

proto.addStage(first);

HP.lesionTrackerFollowupProtocol = proto;
HP.lesionTrackerFollowupProtocol.id = 'lesionTrackerFollowupProtocol';

Meteor.call('removeHangingProtocolByID', HP.lesionTrackerBaselineProtocol.id, function() {
    HangingProtocols.insert(HP.lesionTrackerBaselineProtocol);
});

Meteor.call('removeHangingProtocolByID', HP.lesionTrackerFollowupProtocol.id, function() {
    HangingProtocols.insert(HP.lesionTrackerFollowupProtocol);
});

HangingProtocols.insert(HP.defaultProtocol);