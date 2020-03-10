import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './LayoutChooser.styl';

/**
 * Adds the 'hover' class to cells above and to the left of the current cell
 * This is used to "fill in" the grid that the user will change the layout to,
 * if they click on a specific table cell.
 **/

class LayoutChooser extends PureComponent {
  static propTypes = {
    Rows: PropTypes.number.isRequired,
    Columns: PropTypes.number.isRequired,
    visible: PropTypes.bool.isRequired,
    selectedCell: PropTypes.object,
    boxSize: PropTypes.number.isRequired,
    cellBorder: PropTypes.number.isRequired,
    onClick: PropTypes.func,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    Rows: 3,
    Columns: 3,
    visible: true,
    boxSize: 20,
    cellBorder: 1,
    selectedCell: {
      row: -1,
      col: -1,
    },
  };

  constructor(props) {
    super(props);
    this.emptyCell = {
      row: -1,
      column: -1,
    };
    this.state = {
      table: [[]],
      selectedCell: this.props.selectedCell,
    };
  }
  componentDidMount() {
    this.highlightCells(this.emptyCell);
  }
  onClick(currentCell) {
    this.setState({
      selectedCell: currentCell,
    });
    this.highlightCells(currentCell);
    if (this.props.onClick) {
      this.props.onClick(currentCell);
    }
    if (this.props.onChange) {
      this.props.onChange(currentCell);
    }
  }
  isRange = (cell, parentCell) => {
    return cell.row <= parentCell.row && cell.col <= parentCell.col;
  };
  highlightCells = currentCell => {
    let table = [];
    for (let row = 0; row < this.props.Rows; row++) {
      let newRow = [];
      for (let col = 0; col < this.props.Columns; col++) {
        let cell = { row: row, col: col };
        if (this.isRange(cell, currentCell)) {
          cell.className = 'hover';
        } else if (
          this.isRange(currentCell, this.emptyCell) &&
          this.isRange(cell, this.state.selectedCell)
        ) {
          cell.className = 'selectedBefore';
        }
        newRow.push(cell);
      }
      table.push(newRow);
    }
    this.setState({ table: table });
  };

  render() {
    let Columns = this.props.Columns;
    const style = {
      display: this.props.visible ? 'block' : 'none',
      minWidth:
        Columns * this.props.boxSize + (Columns + 5) * this.props.cellBorder,
    };
    return (
      <div
        className="layoutChooser layoutChooser-dropdown-menu"
        role="menu"
        style={style}
      >
        <table>
          <tbody>
            {this.state.table.map((row, i) => {
              return (
                <tr key={i}>
                  {row.map((cell, j) => {
                    return (
                      <td
                        className={cell.className}
                        style={{
                          width: this.props.boxSize,
                          height: this.props.boxSize,
                          border: 'solid 1px black',
                        }}
                        key={j}
                        onMouseEnter={() => this.highlightCells(cell)}
                        onMouseLeave={() => this.highlightCells(this.emptyCell)}
                        onClick={() => this.onClick(cell)}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

export { LayoutChooser };
