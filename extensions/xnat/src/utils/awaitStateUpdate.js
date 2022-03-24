const allowStateUpdate = () => {
  const ms = 1;
  return new Promise(resolve => setTimeout(resolve, ms));
};

export default allowStateUpdate;
