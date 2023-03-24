const defaultFill = {
  color: 'rgba(255,255,255,0.4)',
};

const emptyFill = {
  color: 'rgba(255,255,255,0.0)',
};

const defaultStroke = {
  color: 'rgb(0,255,0)',
  width: 1.5,
};

const activeStroke = {
  color: 'rgb(255,255,0)',
  width: 1.5,
};

const defaultStyle = {
  image: {
    circle: {
      fill: defaultFill,
      stroke: activeStroke,
      radius: 5,
    },
  },
  fill: defaultFill,
  stroke: activeStroke,
};

const emptyStyle = {
  image: {
    circle: {
      fill: emptyFill,
      stroke: defaultStroke,
      radius: 5,
    },
  },
  fill: emptyFill,
  stroke: defaultStroke,
};

const styles = {
  active: defaultStyle,
  default: emptyStyle,
};

export default styles;
