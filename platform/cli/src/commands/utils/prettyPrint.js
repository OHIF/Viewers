import chalk from 'chalk';
import { colors } from '../enums/index.js';

function getStyle({ color, bold }) {
  return bold ? chalk.hex(color).bold : chalk.hex(color);
}

function levelOnePrint(items) {
  let output = '';
  if (Array.isArray(items)) {
    items.forEach(item => {
      output += ` |- ${item}\n`;
    });
    return output;
  }

  return ` |- ${items}\n`;
}

function levelTwoPrint(items) {
  let output = '';
  items.forEach(item => {
    output += ` |    |- ${item}\n`;
  });
  return output;
}

/**
 *
 * @param {string} title Title of the section
 * @param {object} titleOptions Options for the title includes color and bold
 * @param { [] | [][] } items Array of items to display, OR a list of lists
 * @param {object} itemOptions Options for the items includes color and bold
 *
 *
 * items= ['Mode-A', 'Mode-B', 'Mode-C']
 *
 * |- Mode-A
 * |- Mode-B
 * |- Mode-C
 *
 * items = [['Mode-A', ['Description-A', 'Authors-A', 'Repository-A]], ['Mode-B', ['Description-B', 'Authors-B', 'Repository-B]], ['Mode-C', ['Description-C', 'Authors-C', 'Repository-C]]]
 *
 * |- Mode-A
 * |    |- Description-A
 * |    |- Authors-A
 * |    |- Repository-A
 * |
 * |- Mode-B
 * |    |- Description-B
 * |    |- Authors-B
 * |    |- Repository-B
 *
 *
 */
function prettyPrint(
  title,
  titleOptions = { color: colors.MAIN, bold: true },
  itemsArray = [[]],
  itemOptions = {}
) {
  console.log('');
  console.log(getStyle(titleOptions)(title));

  let output = '';
  itemsArray.forEach(items => {
    if (!Array.isArray(items)) {
      output += levelOnePrint(items);
    } else {
      output += levelOnePrint(items[0]);
      output += levelTwoPrint(items[1]);
    }
  });

  const itmeStyle = itemOptions.color ? getStyle(itemOptions)(output) : output;
  console.log(itmeStyle);
}

export default prettyPrint;
