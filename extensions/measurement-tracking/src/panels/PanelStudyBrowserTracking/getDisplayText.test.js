import _getDisplayText from "./getDisplayText";

const types = {
  COBBANGLE: "cobbAngle",
  POINT: "point",
  ELLIPSE: "ellipse",
};

describe('_getDisplayText', () => {
  it('CobbAngle rendered', () => {
    const measurement = {
      type: types.COBBANGLE,
      rAngle: 37,
    };
    const v = _getDisplayText(measurement, null, '1', '2', types);
    expect(v[0]).toBe("37.00\xB0 (S:1, I:2)");
  })

  it('Point rendered', () => {
    const measurement = {
      type: types.POINT,
    };
    const v = _getDisplayText(measurement, null, '1', '2', types);
    expect(v[0]).toBe("(S:1, I:2)");
  })

  it('Ellipse rendered', () => {
    const measurement = {
      type: types.ELLIPSE,
      area: 37,
    };
    const v = _getDisplayText(measurement, null, '1', '2', types);
    expect(v[0]).toBe("37.00 px<sup>2</sup> (S:1, I:2)");
  })


  it('Unknown rendered', () => {
    const measurement = {
      type: "other",
    };
    const v = _getDisplayText(measurement, null, '1', '2', types);
    expect(v).toBe(undefined);
  })
});
