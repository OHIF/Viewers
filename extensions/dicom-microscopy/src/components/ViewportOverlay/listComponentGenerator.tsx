const listComponentGenerator = props => {
  const { list, itemGenerator } = props;
  if (!list) {
    return;
  }
  return list.map(item => {
    if (!item) {
      return;
    }
    const generator = item.generator || itemGenerator;
    if (!generator) {
      throw new Error(`No generator for ${item}`);
    }
    return generator({ ...props, item });
  });
};

export default listComponentGenerator;
