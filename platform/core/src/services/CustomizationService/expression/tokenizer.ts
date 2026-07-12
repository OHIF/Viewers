/**
 * Tokenizer for the safe customization expression language used by
 * `$function` customizations.  See `compileExpression` for the grammar.
 */

export type Token =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'template'; parts: TemplatePart[] }
  | { kind: 'ident'; name: string }
  | { kind: 'punct'; value: string }
  | { kind: 'end' };

export type TemplatePart = { kind: 'text'; text: string } | { kind: 'expr'; source: string };

const PUNCTUATORS = [
  // Longest first so multi-character operators win.
  '===',
  '!==',
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '<',
  '>',
  '+',
  '-',
  '*',
  '/',
  '%',
  '!',
  '(',
  ')',
  '[',
  ']',
  ',',
  '.',
  '?',
  ':',
];

const isIdentStart = (ch: string) => /[A-Za-z_$]/.test(ch);
const isIdentPart = (ch: string) => /[A-Za-z0-9_$]/.test(ch);
const isDigit = (ch: string) => ch >= '0' && ch <= '9';

export class ExpressionSyntaxError extends Error {
  constructor(message: string, expression: string) {
    super(`${message} in customization expression: ${expression}`);
    this.name = 'ExpressionSyntaxError';
  }
}

function readEscape(source: string, index: number): { ch: string; next: number } {
  const escaped = source[index];
  const map = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', '`': '`', $: '$' };
  return { ch: map[escaped] ?? escaped, next: index + 1 };
}

/**
 * Reads a template literal body starting after the opening backtick.
 * Returns the parts (literal text and raw `${...}` expression sources) and
 * the index just after the closing backtick.
 */
function readTemplate(
  source: string,
  start: number,
  expression: string
): { parts: TemplatePart[]; next: number } {
  const parts: TemplatePart[] = [];
  let text = '';
  let i = start;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '`') {
      if (text) {
        parts.push({ kind: 'text', text });
      }
      return { parts, next: i + 1 };
    }
    if (ch === '\\') {
      const { ch: escaped, next } = readEscape(source, i + 1);
      text += escaped;
      i = next;
      continue;
    }
    if (ch === '$' && source[i + 1] === '{') {
      if (text) {
        parts.push({ kind: 'text', text });
        text = '';
      }
      // Find the matching close brace, tracking nesting from strings.
      let depth = 1;
      let j = i + 2;
      let exprSource = '';
      while (j < source.length && depth > 0) {
        const c = source[j];
        if (c === '{') {
          depth++;
        } else if (c === '}') {
          depth--;
          if (depth === 0) {
            break;
          }
        } else if (c === "'" || c === '"') {
          // Skip string contents inside the interpolation.
          const quote = c;
          exprSource += c;
          j++;
          while (j < source.length && source[j] !== quote) {
            if (source[j] === '\\') {
              exprSource += source[j];
              j++;
            }
            exprSource += source[j];
            j++;
          }
        }
        exprSource += source[j];
        j++;
      }
      if (depth !== 0) {
        throw new ExpressionSyntaxError('Unterminated template interpolation', expression);
      }
      parts.push({ kind: 'expr', source: exprSource });
      i = j + 1;
      continue;
    }
    text += ch;
    i++;
  }
  throw new ExpressionSyntaxError('Unterminated template literal', expression);
}

/** Converts an expression source string into a token list. */
export function tokenize(source: string, expression = source): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  outer: while (i < source.length) {
    const ch = source[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (isDigit(ch) || (ch === '.' && isDigit(source[i + 1]))) {
      let j = i;
      while (j < source.length && /[0-9.]/.test(source[j])) {
        j++;
      }
      const raw = source.slice(i, j);
      const value = Number(raw);
      if (Number.isNaN(value)) {
        throw new ExpressionSyntaxError(`Invalid number '${raw}'`, expression);
      }
      tokens.push({ kind: 'number', value });
      i = j;
      continue;
    }

    if (ch === "'" || ch === '"') {
      let value = '';
      let j = i + 1;
      while (j < source.length && source[j] !== ch) {
        if (source[j] === '\\') {
          const { ch: escaped, next } = readEscape(source, j + 1);
          value += escaped;
          j = next;
        } else {
          value += source[j];
          j++;
        }
      }
      if (j >= source.length) {
        throw new ExpressionSyntaxError('Unterminated string literal', expression);
      }
      tokens.push({ kind: 'string', value });
      i = j + 1;
      continue;
    }

    if (ch === '`') {
      const { parts, next } = readTemplate(source, i + 1, expression);
      tokens.push({ kind: 'template', parts });
      i = next;
      continue;
    }

    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < source.length && isIdentPart(source[j])) {
        j++;
      }
      tokens.push({ kind: 'ident', name: source.slice(i, j) });
      i = j;
      continue;
    }

    for (const punct of PUNCTUATORS) {
      if (source.startsWith(punct, i)) {
        tokens.push({ kind: 'punct', value: punct });
        i += punct.length;
        continue outer;
      }
    }

    throw new ExpressionSyntaxError(`Unexpected character '${ch}'`, expression);
  }

  tokens.push({ kind: 'end' });
  return tokens;
}
