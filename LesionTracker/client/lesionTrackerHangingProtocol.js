//------------------------------------------------------------------------------
// Define Baseline protocol
var proto = new HP.Protocol('LT_Baseline');
proto.locked = true;

var isBaseline = new HP.ProtocolMatchingRule();
isBaseline.required = true;
isBaseline.weight = 1;
isBaseline.attribute = 'timepointType';
isBaseline.constraint = {
    equals: {
        value: 'baseline'
    }
};

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

single.studyMatchingRules.push(baseline);

var first = new HP.Stage(oneByOne, 'oneByOne');
first.viewports.push(single);

proto.addStage(first);

HP.lesionTrackerBaselineProtocol = proto;
HP.lesionTrackerBaselineProtocol.id = 'lesionTrackerBaselineProtocol';

//------------------------------------------------------------------------------
// Define Followup Protocol
var proto = new HP.Protocol('LT_BaselineFollowup');
proto.locked = true;

var isFollowup = new HP.ProtocolMatchingRule();
isFollowup.required = true;
isFollowup.weight = 2;
isFollowup.attribute = 'timepointType';
isFollowup.constraint = {
    equals: {
        value: 'followup'
    }
};

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

left.studyMatchingRules.push(followup);
right.studyMatchingRules.push(baseline);

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