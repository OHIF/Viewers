function getDefaultProtocol() {
    var protocol = new HP.Protocol('Default');
    protocol.id = 'defaultProtocol';
    protocol.locked = true;

    var oneByOne = new HP.ViewportStructure('grid', {
        rows: 1,
        columns: 1
    });

    var viewport = new HP.Viewport();
    var first = new HP.Stage(oneByOne, 'oneByOne');
    first.viewports.push(viewport);

    protocol.stages.push(first);

    HP.defaultProtocol = protocol;
    return HP.defaultProtocol;
}

function getMRTwoByTwoTest() {
    var proto = new HP.Protocol('MR_TwoByTwo');
    proto.locked = true;
    // Use http://localhost:3000/viewer/1.2.840.113619.2.5.1762583153.215519.978957063.78

    var studyInstanceUid = new HP.ProtocolMatchingRule('studyInstanceUid', {
        equals: {
            value: '1.2.840.113619.2.5.1762583153.215519.978957063.78'
        }
    }, true);

    proto.addProtocolMatchingRule(studyInstanceUid);

    var oneByTwo = new HP.ViewportStructure('grid', {
        rows: 1,
        columns: 2
    });

    // Stage 1
    var left = new HP.Viewport();
    var right = new HP.Viewport();

    var firstSeries = new HP.SeriesMatchingRule('seriesNumber', {
        equals: {
            value: 1
        }
    });

    var secondSeries = new HP.SeriesMatchingRule('seriesNumber', {
        equals: {
            value: 2
        }
    });

    var thirdImage = new HP.ImageMatchingRule('instanceNumber', {
        equals: {
            value: 3
        }
    });

    left.seriesMatchingRules.push(firstSeries);
    left.imageMatchingRules.push(thirdImage);

    right.seriesMatchingRules.push(secondSeries);
    right.imageMatchingRules.push(thirdImage);

    var first = new HP.Stage(oneByTwo, 'oneByTwo');
    first.viewports.push(left);
    first.viewports.push(right);

    proto.stages.push(first);

    // Stage 2
    var twoByOne = new HP.ViewportStructure('grid', {
        rows: 2,
        columns: 1
    });
    var left2 = new HP.Viewport();
    var right2 = new HP.Viewport();

    var fourthSeries = new HP.SeriesMatchingRule('seriesNumber', {
        equals: {
            value: 4
        }
    });

    var fifthSeries = new HP.SeriesMatchingRule('seriesNumber', {
        equals: {
            value: 5
        }
    });

    left2.seriesMatchingRules.push(fourthSeries);
    left2.imageMatchingRules.push(thirdImage);
    right2.seriesMatchingRules.push(fifthSeries);
    right2.imageMatchingRules.push(thirdImage);

    var second = new HP.Stage(twoByOne, 'twoByOne');
    second.viewports.push(left2);
    second.viewports.push(right2);

    proto.stages.push(second);

    HP.testProtocol = proto;
    return HP.testProtocol;
}

getDefaultProtocol();
getMRTwoByTwoTest();
