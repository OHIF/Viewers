function Grid(points, cellSize) {
  this._cells = [];
  this._cellSize = cellSize;
  this._reverseCellSize = 1 / cellSize;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const x = this.coordToCellNum(point[0]);
    const y = this.coordToCellNum(point[1]);
    if (!this._cells[x]) {
      const array = [];
      array[y] = [point];
      this._cells[x] = array;
    } else if (!this._cells[x][y]) {
      this._cells[x][y] = [point];
    } else {
      this._cells[x][y].push(point);
    }
  }
}

Grid.prototype = {
  cellPoints: function (x, y) {
    // (Number, Number) -> Array
    return this._cells[x] !== undefined && this._cells[x][y] !== undefined
      ? this._cells[x][y]
      : [];
  },

  rangePoints: function (bbox) {
    // (Array) -> Array
    const tlCellX = this.coordToCellNum(bbox[0]);
    const tlCellY = this.coordToCellNum(bbox[1]);
    const brCellX = this.coordToCellNum(bbox[2]);
    const brCellY = this.coordToCellNum(bbox[3]);
    const points = [];

    for (let x = tlCellX; x <= brCellX; x++) {
      for (let y = tlCellY; y <= brCellY; y++) {
        Array.prototype.push.apply(points, this.cellPoints(x, y));
      }
    }

    return points;
  },

  removePoint: function (point) {
    // (Array) -> Array
    const cellX = this.coordToCellNum(point[0]);
    const cellY = this.coordToCellNum(point[1]);
    const cell = this._cells[cellX][cellY];
    let pointIdxInCell;

    for (let i = 0; i < cell.length; i++) {
      if (cell[i][0] === point[0] && cell[i][1] === point[1]) {
        pointIdxInCell = i;
        break;
      }
    }

    cell.splice(pointIdxInCell, 1);

    return cell;
  },

  trunc:
    Math.trunc ||
    function (val) {
      // (number) -> number
      return val - (val % 1);
    },

  coordToCellNum: function (x) {
    // (number) -> number
    return this.trunc(x * this._reverseCellSize);
  },

  extendBbox: function (bbox, scaleFactor) {
    // (Array, Number) -> Array
    return [
      bbox[0] - scaleFactor * this._cellSize,
      bbox[1] - scaleFactor * this._cellSize,
      bbox[2] + scaleFactor * this._cellSize,
      bbox[3] + scaleFactor * this._cellSize,
    ];
  },
};

function grid(points, cellSize) {
  return new Grid(points, cellSize);
}

module.exports = grid;
