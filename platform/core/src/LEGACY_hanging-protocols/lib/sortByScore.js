// Sorts an array by score
const sortByScore = arr => {
  arr.sort((a, b) => {
    return b.score - a.score;
  });
};

export { sortByScore };
