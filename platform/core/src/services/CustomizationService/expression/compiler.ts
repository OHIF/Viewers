import { ExpressionNode, FORBIDDEN_PROPERTIES, parseExpressionSource } from './parser';
import { ExpressionSyntaxError } from './tokenizer';

/**
 * The runtime scope of a compiled expression: the named parameters (bound to
 * the call arguments positionally) and the implicit scope object (the first
 * argument), whose fields resolve as bare identifiers.
 */
type EvaluationScope = {
  params: Record<string, unknown>;
  implicit: unknown[];
};

type NodeEvaluator = (scope: EvaluationScope) => unknown;

export type CompiledExpression = ((...args: unknown[]) => unknown) & {
  /** The source the expression was compiled from. */
  expressionSource: string;
};

export type CompileExpressionOptions = {
  /**
   * Names for the positional arguments of the compiled function.  Defaults
   * to `['instance', 'context']`.  Bare identifiers resolve parameter names
   * first, then fields of the first argument (the implicit scope).
   */
  params?: string[];
};

/** Reads a property while refusing prototype-chain escape hatches. */
function safeGet(object: unknown, key: unknown): unknown {
  if (object == null) {
    return undefined;
  }
  if (typeof key !== 'string' && typeof key !== 'number') {
    return undefined;
  }
  if (typeof key === 'string' && FORBIDDEN_PROPERTIES.has(key)) {
    return undefined;
  }
  return object[key];
}

/**
 * Loose equality restricted to the useful cases: strict equality, plus
 * `null`/`undefined` equivalence and number/string coercion — without the
 * rest of the JS `==` coercion table.
 */
function looseEquals(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }
  if (left == null && right == null) {
    return true;
  }
  if (
    (typeof left === 'number' && typeof right === 'string') ||
    (typeof left === 'string' && typeof right === 'number')
  ) {
    return Number(left) === Number(right);
  }
  return false;
}

function contains(needle: unknown, haystack: unknown): boolean {
  if (Array.isArray(haystack)) {
    return haystack.some(item => looseEquals(item, needle));
  }
  if (typeof haystack === 'string') {
    return haystack.includes(String(needle));
  }
  return false;
}

/** Whitelisted helper functions callable by bare name. */
const HELPERS: Record<string, (...args: unknown[]) => unknown> = {
  defined: value => value !== undefined && value !== null,
  includes: (haystack, needle) => contains(needle, haystack),
  startsWith: (value, prefix) => typeof value === 'string' && value.startsWith(String(prefix)),
  endsWith: (value, suffix) => typeof value === 'string' && value.endsWith(String(suffix)),
  abs: value => Math.abs(Number(value)),
  min: (...values) => Math.min(...values.map(Number)),
  max: (...values) => Math.max(...values.map(Number)),
  round: value => Math.round(Number(value)),
  floor: value => Math.floor(Number(value)),
  ceil: value => Math.ceil(Number(value)),
  Number: value => Number(value),
  String: value => (value == null ? '' : String(value)),
};

/**
 * Aggregate special forms: `some(list, expr)`, `every(list, expr)`,
 * `count(list, expr)`, `minOf(list, expr)`, `maxOf(list, expr)` and
 * `sumOf(list, expr)`.  The second argument is evaluated once per element
 * with the element pushed as the innermost implicit scope, so
 * `some(instances, DiffusionBValue != undefined)` reads each instance's tag
 * and `minOf(instances, InstanceNumber)` returns the smallest instance
 * number of a series.
 */
const AGGREGATES = new Set(['some', 'every', 'count', 'minOf', 'maxOf', 'sumOf']);

function resolveIdentifier(name: string, scope: EvaluationScope): unknown {
  if (Object.prototype.hasOwnProperty.call(scope.params, name)) {
    return scope.params[name];
  }
  // Innermost implicit scope first (aggregate elements shadow the first arg).
  for (let i = scope.implicit.length - 1; i >= 0; i--) {
    const implicitScope = scope.implicit[i];
    if (implicitScope != null && typeof implicitScope === 'object' && name in implicitScope) {
      return safeGet(implicitScope, name);
    }
  }
  return undefined;
}

function compileNode(node: ExpressionNode, expression: string): NodeEvaluator {
  switch (node.type) {
    case 'literal': {
      const { value } = node;
      return () => value;
    }
    case 'identifier': {
      const { name } = node;
      return scope => resolveIdentifier(name, scope);
    }
    case 'member': {
      const object = compileNode(node.object, expression);
      const { property } = node;
      return scope => safeGet(object(scope), property);
    }
    case 'index': {
      const object = compileNode(node.object, expression);
      const index = compileNode(node.index, expression);
      return scope => safeGet(object(scope), index(scope));
    }
    case 'array': {
      const elements = node.elements.map(element => compileNode(element, expression));
      return scope => elements.map(element => element(scope));
    }
    case 'template': {
      const parts: NodeEvaluator[] = node.parts.map(part =>
        part.kind === 'text' ? () => part.text : compileNode(part.node, expression)
      );
      return scope =>
        parts
          .map(part => {
            const value = part(scope);
            return value == null ? '' : String(value);
          })
          .join('');
    }
    case 'unary': {
      const argument = compileNode(node.argument, expression);
      switch (node.operator) {
        case '!':
          return scope => !argument(scope);
        case '-':
          return scope => -Number(argument(scope));
        case '+':
          return scope => +Number(argument(scope));
      }
      break;
    }
    case 'logical': {
      const left = compileNode(node.left, expression);
      const right = compileNode(node.right, expression);
      return node.operator === '&&'
        ? scope => left(scope) && right(scope)
        : scope => left(scope) || right(scope);
    }
    case 'binary': {
      const left = compileNode(node.left, expression);
      const right = compileNode(node.right, expression);
      switch (node.operator) {
        case '==':
          return scope => looseEquals(left(scope), right(scope));
        case '!=':
          return scope => !looseEquals(left(scope), right(scope));
        case '===':
          return scope => left(scope) === right(scope);
        case '!==':
          return scope => left(scope) !== right(scope);
        case '<':
          return scope => (left(scope) as number) < (right(scope) as number);
        case '<=':
          return scope => (left(scope) as number) <= (right(scope) as number);
        case '>':
          return scope => (left(scope) as number) > (right(scope) as number);
        case '>=':
          return scope => (left(scope) as number) >= (right(scope) as number);
        case '+':
          return scope => (left(scope) as number) + (right(scope) as number);
        case '-':
          return scope => (left(scope) as number) - (right(scope) as number);
        case '*':
          return scope => (left(scope) as number) * (right(scope) as number);
        case '/':
          return scope => (left(scope) as number) / (right(scope) as number);
        case '%':
          return scope => (left(scope) as number) % (right(scope) as number);
        case 'in':
          return scope => contains(left(scope), right(scope));
        default:
          throw new ExpressionSyntaxError(`Unknown operator '${node.operator}'`, expression);
      }
    }
    case 'conditional': {
      const test = compileNode(node.test, expression);
      const consequent = compileNode(node.consequent, expression);
      const alternate = compileNode(node.alternate, expression);
      return scope => (test(scope) ? consequent(scope) : alternate(scope));
    }
    case 'call': {
      const { callee } = node;
      if (AGGREGATES.has(callee)) {
        if (node.args.length !== 2) {
          throw new ExpressionSyntaxError(
            `${callee}() expects (list, expression) arguments`,
            expression
          );
        }
        const list = compileNode(node.args[0], expression);
        const element = compileNode(node.args[1], expression);
        return scope => {
          const values = list(scope);
          if (!Array.isArray(values)) {
            if (callee === 'some' || callee === 'every') {
              return false;
            }
            return callee === 'minOf' || callee === 'maxOf' ? undefined : 0;
          }
          const evaluate = (item: unknown) => {
            scope.implicit.push(item);
            try {
              return element(scope);
            } finally {
              scope.implicit.pop();
            }
          };
          switch (callee) {
            case 'some':
              return values.some(item => !!evaluate(item));
            case 'every':
              return values.every(item => !!evaluate(item));
            case 'count':
              return values.reduce((total: number, item) => total + (evaluate(item) ? 1 : 0), 0);
            case 'sumOf':
              return values.reduce((total: number, item) => {
                const value = Number(evaluate(item));
                return total + (Number.isNaN(value) ? 0 : value);
              }, 0);
            case 'minOf':
            case 'maxOf': {
              const numbers = values
                .map(item => Number(evaluate(item)))
                .filter(value => !Number.isNaN(value));
              if (!numbers.length) {
                return undefined;
              }
              return callee === 'minOf' ? Math.min(...numbers) : Math.max(...numbers);
            }
          }
        };
      }
      const helper = Object.prototype.hasOwnProperty.call(HELPERS, callee)
        ? HELPERS[callee]
        : undefined;
      if (!helper) {
        throw new ExpressionSyntaxError(
          `'${callee}' is not a whitelisted helper function`,
          expression
        );
      }
      const args = node.args.map(argument => compileNode(argument, expression));
      return scope => helper(...args.map(argument => argument(scope)));
    }
  }
  throw new ExpressionSyntaxError('Unsupported expression node', expression);
}

/**
 * Compiles a customization expression into a plain closure.
 *
 * The expression grammar is a small, safe subset of JavaScript expressions:
 * literals (numbers, quoted strings, template literals, arrays,
 * true/false/null/undefined), identifiers with guarded member/index access
 * (`__proto__`/`prototype`/`constructor` are rejected), comparison, logical
 * and arithmetic operators, `in` (membership), ternaries, whitelisted helper
 * functions (`defined`, `includes`, `startsWith`, `endsWith`, `abs`, `min`,
 * `max`, `round`, `floor`, `ceil`, `Number`, `String`) and the aggregate
 * forms `some(list, expr)`, `every(list, expr)`, `count(list, expr)`,
 * `minOf(list, expr)`, `maxOf(list, expr)` and `sumOf(list, expr)`.
 *
 * Compilation happens once (CSP-safe — no eval / new Function); evaluation is
 * a closure-tree walk.  Parse errors throw an {@link ExpressionSyntaxError}
 * at compile time; runtime errors warn once and return `undefined`.
 *
 * Calling convention: the compiled function's positional arguments bind to
 * `options.params` (default `['instance', 'context']`).  Bare identifiers
 * resolve parameter names first, then fields of the first argument.
 */
export function compileExpression(
  source: string,
  options: CompileExpressionOptions = {}
): CompiledExpression {
  const paramNames = options.params ?? ['instance', 'context'];
  const ast = parseExpressionSource(source);
  const evaluator = compileNode(ast, source);
  let warned = false;

  const compiled = ((...args: unknown[]) => {
    const params: Record<string, unknown> = Object.create(null);
    paramNames.forEach((name, index) => {
      params[name] = args[index];
    });
    const scope: EvaluationScope = { params, implicit: [args[0]] };
    try {
      return evaluator(scope);
    } catch (error) {
      if (!warned) {
        warned = true;
        console.warn(`Customization expression failed at runtime: ${source}`, error);
      }
      return undefined;
    }
  }) as CompiledExpression;
  compiled.expressionSource = source;
  return compiled;
}

export { ExpressionSyntaxError };
