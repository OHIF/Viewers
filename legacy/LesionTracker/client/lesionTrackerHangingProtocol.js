import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
    console.log('Adding Lesion Tracker Hanging Protocols');

    //------------------------------------------------------------------------------
    // Define Baseline protocol
    const proto = new HP.Protocol('LT_Baseline');
    proto.locked = true;

    const isBaseline = new HP.ProtocolMatchingRule();
    isBaseline.required = true;
    isBaseline.weight = 1;
    isBaseline.attribute = 'timepointType';
    isBaseline.constraint = {
        equals: {
            value: 'baseline'
        }
    };

    proto.addProtocolMatchingRule(isBaseline);

    const oneByOne = new HP.ViewportStructure('grid', {
        rows: 1,
        columns: 1
    });

    // Stage 1
    const single = new HP.Viewport();

    const baseline = new HP.StudyMatchingRule(true);
    baseline.required = true;
    baseline.attribute = 'timepointType';
    baseline.constraint = {
        equals: {
            value: 'baseline'
        }
    };

    single.studyMatchingRules.push(baseline);

    const first = new HP.Stage(oneByOne, 'oneByOne');
    first.viewports.push(single);

    proto.addStage(first);

    HP.lesionTrackerBaselineProtocol = proto;
    HP.lesionTrackerBaselineProtocol.id = 'lesionTrackerBaselineProtocol';

    //------------------------------------------------------------------------------
    // Define Followup Protocol
    const protoFollowup = new HP.Protocol('LT_BaselineFollowup');
    protoFollowup.locked = true;

    const isFollowup = new HP.ProtocolMatchingRule();
    isFollowup.required = true;
    isFollowup.weight = 2;
    isFollowup.attribute = 'timepointType';
    isFollowup.constraint = {
        equals: {
            value: 'followup'
        }
    };

    protoFollowup.addProtocolMatchingRule(isFollowup);

    const oneByTwo = new HP.ViewportStructure('grid', {
        rows: 1,
        columns: 2
    });

    // Stage 1
    const left = new HP.Viewport();
    const right = new HP.Viewport();

    const baseline2 = new HP.StudyMatchingRule(true);
    baseline2.required = true;
    baseline2.attribute = 'timepointType';
    baseline2.constraint = {
        equals: {
            value: 'baseline'
        }
    };

    const followup = new HP.StudyMatchingRule();
    followup.required = true;
    followup.attribute = 'timepointType';
    followup.constraint = {
        equals: {
            value: 'followup'
        }
    };

    left.studyMatchingRules.push(followup);
    right.studyMatchingRules.push(baseline2);

    const first2 = new HP.Stage(oneByTwo, 'oneByTwo');
    first2.viewports.push(left);
    first2.viewports.push(right);

    protoFollowup.addStage(first2);

    HP.lesionTrackerFollowupProtocol = protoFollowup;
    HP.lesionTrackerFollowupProtocol.id = 'lesionTrackerFollowupProtocol';

    HP.ProtocolStore.onReady(() => {
        console.log('Inserting lesion tracker protocols');
        HP.ProtocolStore.addProtocol(HP.lesionTrackerBaselineProtocol);
        HP.ProtocolStore.addProtocol(HP.lesionTrackerFollowupProtocol);
    });
});