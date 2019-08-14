const range = (start, end) => {
  return new Array(end - start).fill().map((d, i) => i + start);
};

export const disallowedCombinations = {
  '': [],
  ALT: ['SPACE'],
  SHIFT: [],
  CTRL: [
    'F4',
    'F5',
    'F11',
    'W',
    'R',
    'T',
    'O',
    'P',
    'A',
    'D',
    'F',
    'G',
    'H',
    'J',
    'L',
    'Z',
    'X',
    'C',
    'V',
    'B',
    'N',
    'PAGEDOWN',
    'PAGEUP',
  ],
  'CTRL+SHIFT': ['Q', 'W', 'R', 'T', 'P', 'A', 'H', 'V', 'B', 'N'],
};

export const allowedKeys = [
  ...[8, 13, 27, 32, 46], // BACKSPACE, ENTER, ESCAPE, SPACE, DELETE
  ...[12, 106, 107, 109, 110, 111], // Numpad keys
  ...range(218, 220), // [\]
  ...range(185, 190), // ;=,-./
  ...range(111, 131), // F1-F19
  ...range(32, 41), // arrow keys, home/end, pg dn/up
  ...range(47, 58), // 0-9
  ...range(64, 91), // A-Z
];

export const specialKeys = {
  8: 'backspace',
  9: 'tab',
  13: 'return',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  19: 'pause',
  20: 'capslock',
  27: 'esc',
  32: 'space',
  33: 'pageup',
  34: 'pagedown',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  45: 'insert',
  46: 'del',
  96: '0',
  97: '1',
  98: '2',
  99: '3',
  100: '4',
  101: '5',
  102: '6',
  103: '7',
  104: '8',
  105: '9',
  106: '*',
  107: '+',
  109: '-',
  110: '.',
  111: '/',
  112: 'f1',
  113: 'f2',
  114: 'f3',
  115: 'f4',
  116: 'f5',
  117: 'f6',
  118: 'f7',
  119: 'f8',
  120: 'f9',
  121: 'f10',
  122: 'f11',
  123: 'f12',
  144: 'numlock',
  145: 'scroll',
  191: '/',
  224: 'meta',
};
