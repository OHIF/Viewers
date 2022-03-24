import AIAAClient from '../client/AIAAClient.js';
import AIAA_MODEL_TYPES from '../modelTypes.js';

const state = {
  points: new Map(),
  menuIsOpen: false,
};

const configuration = {
  annotationMinPoints: 6,
  annotationPointColors: ['yellow'],
  deepgrowPointColors: ['red', 'blue'],
};

const client = new AIAAClient();

function setPoint(segmentUid, pointData) {
  let points;
  if (!state.points.has(segmentUid)) {
    points = [];
    state.points.set(segmentUid, points);
  } else {
    points = state.points.get(segmentUid);
  }

  points.push(pointData);
}

function getSegmentPoints(segmentUid, toolType) {
  let segmentPoints = {
    fg: [],
    bg: [],
  };

  if (state.points.has(segmentUid)) {
    const points = state.points.get(segmentUid);
    const toolPoints = points.filter(p => {
      return p.toolType === toolType;
    });
    segmentPoints.fg = toolPoints.filter(p => {
      return !p.background;
    }).map(p => [p.x, p.y, p.z]);
    segmentPoints.bg = toolPoints.filter(p => {
      return p.background;
    }).map(p => [p.x, p.y, p.z]);
  }

  return segmentPoints;
}

function removePointsForSegment(segmentUid, toolType) {
  if (!state.points.has(segmentUid)) {
    return {};
  }

  let points = state.points.get(segmentUid);
  let imageIdsPoints = {};
  points = points.filter(p => {
    if (p.toolType === toolType) {
      let idPoints = imageIdsPoints[p.imageId];
      if (idPoints === undefined) {
        idPoints = imageIdsPoints[p.imageId] = [];
      }
      idPoints.push(p.uuid);
      return false;
    }
    return true;
  });

  if (points.length === 0) {
    state.points.delete(segmentUid);
  } else {
    state.points.set(segmentUid, points);
  }

  return imageIdsPoints;
}

function removePointsForAllSegments(segmentUids, toolType) {
  let imageIdsPoints = {};
  segmentUids.forEach(segUid => {
    const segPoints = removePointsForSegment(segUid, toolType);
    Object.keys(segPoints).forEach(id => {
      let idPoints = imageIdsPoints[id];
      if (idPoints === undefined) {
        idPoints = [];
      }
      imageIdsPoints[id] = [].concat(idPoints, segPoints[id]);
    });
  });

  return imageIdsPoints;
}

function removeAllPointsForSegment(segmentUid) {
  state.points.delete(segmentUid);
}

const getters = {
  segmentPoints: getSegmentPoints,
};

const setters = {
  point: setPoint,
  removePointsForSegment,
  removePointsForAllSegments,
  removeAllPointsForSegment,
};

export default {
  state,
  getters,
  setters,
  configuration,
  client,
};