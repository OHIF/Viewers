import { ExpressionSyntaxError, tokenize, Token } from './tokenizer';

/**
 * AST for the safe customization expression language.  Deliberately small:
 * no assignment, no arbitrary function values, no `new`, no property calls.
 */
export type ExpressionNode =
  | { type: 'literal'; value: unknown }
  | { type: 'identifier'; name: string }
  | { type: 'member'; object: ExpressionNode; property: string }
  | { type: 'index'; object: ExpressionNode; index: ExpressionNode }
  | { type: 'call'; callee: string; args: ExpressionNode[] }
  | { type: 'unary'; operator: '!' | '-' | '+'; argument: ExpressionNode }
  | { type: 'binary'; operator: string; left: ExpressionNode; right: ExpressionNode }
  | { type: 'logical'; operator: '&&' | '||'; left: ExpressionNode; right: ExpressionNode }
  | {
      type: 'conditional';
      test: ExpressionNode;
      consequent: ExpressionNode;
      alternate: ExpressionNode;
    }
  | { type: 'array'; elements: ExpressionNode[] }
  | {
      type: 'template';
      parts: Array<{ kind: 'text'; text: string } | { kind: 'expr'; node: ExpressionNode }>;
    };

/**
 * Property names that may never be accessed — they walk the prototype chain
 * and would break out of the data sandbox.
 */
export const FORBIDDEN_PROPERTIES = new Set(['__proto__', 'prototype', 'constructor']);

const KEYWORD_LITERALS = new Map<string, unknown>([
  ['true', true],
  ['false', false],
  ['null', null],
  ['undefined', undefined],
]);

/** Binary operator precedence (higher binds tighter). */
const BINARY_PRECEDENCE: Record<string, number> = {
  '||': 1,
  '&&': 2,
  '==': 3,
  '!=': 3,
  '===': 3,
  '!==': 3,
  '<': 4,
  '<=': 4,
  '>': 4,
  '>=': 4,
  in: 4,
  '+': 5,
  '-': 5,
  '*': 6,
  '/': 6,
  '%': 6,
};

class Parser {
  private tokens: Token[];
  private position = 0;
  private expression: string;

  constructor(source: string, expression: string) {
    this.expression = expression;
    this.tokens = tokenize(source, expression);
  }

  private peek(): Token {
    return this.tokens[this.position];
  }

  private next(): Token {
    return this.tokens[this.position++];
  }

  private isPunct(value: string): boolean {
    const token = this.peek();
    return token.kind === 'punct' && token.value === value;
  }

  private isIdent(name: string): boolean {
    const token = this.peek();
    return token.kind === 'ident' && token.name === name;
  }

  private expectPunct(value: string): void {
    if (!this.isPunct(value)) {
      throw new ExpressionSyntaxError(`Expected '${value}'`, this.expression);
    }
    this.next();
  }

  private fail(message: string): never {
    throw new ExpressionSyntaxError(message, this.expression);
  }

  parse(): ExpressionNode {
    const node = this.parseConditional();
    if (this.peek().kind !== 'end') {
      this.fail('Unexpected trailing input');
    }
    return node;
  }

  /** Also used for template interpolations and call arguments. */
  parseSubExpression(): ExpressionNode {
    return this.parseConditional();
  }

  private parseConditional(): ExpressionNode {
    const test = this.parseBinary(0);
    if (!this.isPunct('?')) {
      return test;
    }
    this.next();
    const consequent = this.parseConditional();
    this.expectPunct(':');
    const alternate = this.parseConditional();
    return { type: 'conditional', test, consequent, alternate };
  }

  private parseBinary(minPrecedence: number): ExpressionNode {
    let left = this.parseUnary();

    for (;;) {
      const token = this.peek();
      let operator: string | undefined;
      if (token.kind === 'punct' && BINARY_PRECEDENCE[token.value]) {
        operator = token.value;
      } else if (token.kind === 'ident' && token.name === 'in') {
        operator = 'in';
      }
      if (!operator) {
        return left;
      }
      const precedence = BINARY_PRECEDENCE[operator];
      if (precedence <= minPrecedence) {
        return left;
      }
      this.next();
      const right = this.parseBinary(precedence);
      left =
        operator === '&&' || operator === '||'
          ? { type: 'logical', operator, left, right }
          : { type: 'binary', operator, left, right };
    }
  }

  private parseUnary(): ExpressionNode {
    const token = this.peek();
    if (
      token.kind === 'punct' &&
      (token.value === '!' || token.value === '-' || token.value === '+')
    ) {
      this.next();
      return { type: 'unary', operator: token.value, argument: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): ExpressionNode {
    let node = this.parsePrimary();

    for (;;) {
      if (this.isPunct('.')) {
        this.next();
        const property = this.next();
        if (property.kind !== 'ident') {
          this.fail("Expected a property name after '.'");
        }
        if (FORBIDDEN_PROPERTIES.has(property.name)) {
          this.fail(`Access to '${property.name}' is not allowed`);
        }
        node = { type: 'member', object: node, property: property.name };
        continue;
      }
      if (this.isPunct('[')) {
        this.next();
        const index = this.parseSubExpression();
        this.expectPunct(']');
        node = { type: 'index', object: node, index };
        continue;
      }
      if (this.isPunct('(')) {
        if (node.type !== 'identifier') {
          this.fail('Only whitelisted helper functions may be called');
        }
        this.next();
        const args: ExpressionNode[] = [];
        if (!this.isPunct(')')) {
          for (;;) {
            args.push(this.parseSubExpression());
            if (this.isPunct(',')) {
              this.next();
              continue;
            }
            break;
          }
        }
        this.expectPunct(')');
        node = { type: 'call', callee: node.name, args };
        continue;
      }
      return node;
    }
  }

  private parsePrimary(): ExpressionNode {
    const token = this.next();

    if (token.kind === 'number') {
      return { type: 'literal', value: token.value };
    }
    if (token.kind === 'string') {
      return { type: 'literal', value: token.value };
    }
    if (token.kind === 'template') {
      return {
        type: 'template',
        parts: token.parts.map(part =>
          part.kind === 'text'
            ? part
            : { kind: 'expr' as const, node: parseExpressionSource(part.source, this.expression) }
        ),
      };
    }
    if (token.kind === 'ident') {
      if (KEYWORD_LITERALS.has(token.name)) {
        return { type: 'literal', value: KEYWORD_LITERALS.get(token.name) };
      }
      if (token.name === 'in') {
        this.fail("Unexpected 'in'");
      }
      if (FORBIDDEN_PROPERTIES.has(token.name)) {
        this.fail(`Access to '${token.name}' is not allowed`);
      }
      return { type: 'identifier', name: token.name };
    }
    if (token.kind === 'punct') {
      if (token.value === '(') {
        const node = this.parseSubExpression();
        this.expectPunct(')');
        return node;
      }
      if (token.value === '[') {
        const elements: ExpressionNode[] = [];
        if (!this.isPunct(']')) {
          for (;;) {
            elements.push(this.parseSubExpression());
            if (this.isPunct(',')) {
              this.next();
              continue;
            }
            break;
          }
        }
        this.expectPunct(']');
        return { type: 'array', elements };
      }
    }
    this.fail('Unexpected token');
  }
}

/** Parses a raw expression source string into an AST. */
export function parseExpressionSource(source: string, expression = source): ExpressionNode {
  return new Parser(source, expression).parse();
}
