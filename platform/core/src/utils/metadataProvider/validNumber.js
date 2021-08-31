const validNumber = val => {
  if (Array.isArray(val)) {
    return val.map(v => (v !== undefined ? Number(v) : v));
  } else {
    return val !== undefined ? Number(val) : val;
  }
};

export default validNumber;
