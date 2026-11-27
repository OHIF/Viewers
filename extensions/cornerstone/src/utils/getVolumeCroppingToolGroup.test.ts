import getVolumeCroppingToolGroup, {
  getVolumeCroppingState,
  setDisjointSegmentationMode,
} from './getVolumeCroppingToolGroup';

jest.mock('@cornerstonejs/tools', () => ({
  Enums: { ToolModes: { Active: 'Active', Passive: 'Passive', Disabled: 'Disabled' } },
}));
jest.mock('../initCornerstoneTools', () => ({
  toolNames: { VolumeCropping: 'VolumeCropping' },
}));

const makeGroup = ({
  mode = undefined,
  primary = 'TrackballRotate',
  viewportIds = ['v3d'],
} = {}) => ({
  hasTool: name => name === 'VolumeCropping',
  getToolOptions: () => (mode ? { mode } : undefined),
  getActivePrimaryMouseButtonTool: () => primary,
  getViewportIds: () => viewportIds,
});

describe('getVolumeCroppingState', () => {
  it('reports the state that the user sees', () => {
    expect(getVolumeCroppingState(makeGroup())).toBe('Disabled');
    expect(getVolumeCroppingState(makeGroup({ mode: 'Disabled' }))).toBe('Disabled');
    expect(getVolumeCroppingState(makeGroup({ mode: 'Active', primary: 'VolumeCropping' }))).toBe(
      'Active'
    );
    // CS3D keeps Active mode while a SHIFT binding remains; another primary tool means Passive.
    expect(getVolumeCroppingState(makeGroup({ mode: 'Active' }))).toBe('Passive');
  });
});

describe('getVolumeCroppingToolGroup', () => {
  it('uses the viewport group, else the first populated group with the tool', () => {
    const empty = makeGroup({ viewportIds: [] });
    const populated = makeGroup();
    const service = {
      getToolGroupForViewport: id => (id === 'v3d' ? populated : undefined),
      getToolGroupIds: () => ['empty', 'populated'],
      getToolGroup: id => (id === 'empty' ? empty : populated),
    };
    expect(getVolumeCroppingToolGroup(service as never, 'v3d')).toBe(populated);
    expect(getVolumeCroppingToolGroup(service as never, 'mpr')).toBe(populated);
  });
});

describe('setDisjointSegmentationMode', () => {
  it('sets the mode on the crop tool of the tool group, and toggles it without a value', () => {
    let disjoint = false;
    const tool = {
      getDisjointSegmentation: () => disjoint,
      setDisjointSegmentation: jest.fn(value => (disjoint = value)),
    };
    const toolGroup = { getToolInstance: name => (name === 'VolumeCropping' ? tool : undefined) };
    expect(setDisjointSegmentationMode(toolGroup, true)).toBe(true);
    expect(tool.setDisjointSegmentation).toHaveBeenLastCalledWith(true);
    expect(setDisjointSegmentationMode(toolGroup)).toBe(false);
    expect(disjoint).toBe(false);
  });
});
