import { compileExpression, ExpressionSyntaxError } from './index';

describe('compileExpression', () => {
  describe('literals and operators', () => {
    it('evaluates arithmetic and precedence', () => {
      expect(compileExpression('1 + 2 * 3')()).toBe(7);
      expect(compileExpression('(1 + 2) * 3')()).toBe(9);
      expect(compileExpression('10 % 3')()).toBe(1);
      expect(compileExpression('-4 + 1')()).toBe(-3);
    });

    it('evaluates comparisons and logic', () => {
      expect(compileExpression('1 < 2 && 3 >= 3')()).toBe(true);
      expect(compileExpression('1 === 1 || false')()).toBe(true);
      expect(compileExpression('!true')()).toBe(false);
      expect(compileExpression("'a' !== 'b'")()).toBe(true);
    });

    it('treats null and undefined as loosely equal', () => {
      expect(compileExpression('undefined == null')()).toBe(true);
      expect(compileExpression('0 == undefined')()).toBe(false);
      expect(compileExpression("'2' == 2")()).toBe(true);
    });

    it('evaluates ternaries', () => {
      expect(compileExpression('1 < 2 ? "yes" : "no"')()).toBe('yes');
    });

    it('evaluates membership with in', () => {
      const fn = compileExpression("Modality in ['CR', 'DX', 'MG']");
      expect(fn({ Modality: 'MG' })).toBe(true);
      expect(fn({ Modality: 'CT' })).toBe(false);
    });
  });

  describe('scope resolution', () => {
    it('resolves bare identifiers against the first argument', () => {
      const fn = compileExpression("Modality === 'CT' && Rows > 0");
      expect(fn({ Modality: 'CT', Rows: 512 })).toBe(true);
      expect(fn({ Modality: 'MR', Rows: 512 })).toBe(false);
    });

    it('resolves named parameters', () => {
      const fn = compileExpression('context.series.mixedBValue');
      expect(fn({}, { series: { mixedBValue: true } })).toBe(true);
    });

    it('supports custom parameter names', () => {
      const fn = compileExpression('items.length', { params: ['items'] });
      expect(fn([1, 2, 3])).toBe(3);
      const fn2 = compileExpression('instances.length');
      expect(fn2({ instances: [1, 2, 3] })).toBe(3);
    });

    it('returns undefined for unknown identifiers (sparse tags)', () => {
      const fn = compileExpression('DiffusionBValue != undefined');
      expect(fn({})).toBe(false);
      expect(fn({ DiffusionBValue: 800 })).toBe(true);
    });
  });

  describe('template literals', () => {
    it('builds strings with interpolations', () => {
      const fn = compileExpression('`${SeriesDescription} #${InstanceNumber}`');
      expect(fn({ SeriesDescription: 'AX T1', InstanceNumber: 3 })).toBe('AX T1 #3');
    });

    it('renders null/undefined interpolations as empty strings', () => {
      const fn = compileExpression('`SCOUT ${SeriesDescription}`');
      expect(fn({})).toBe('SCOUT ');
    });
  });

  describe('helpers and aggregates', () => {
    it('supports defined/includes/startsWith', () => {
      expect(compileExpression('defined(Rows)')({ Rows: 512 })).toBe(true);
      expect(compileExpression('defined(Rows)')({})).toBe(false);
      expect(
        compileExpression("includes(SeriesDescription, 'T1')")({ SeriesDescription: 'AX T1' })
      ).toBe(true);
      expect(
        compileExpression("startsWith(SeriesDescription, 'AX')")({ SeriesDescription: 'AX T1' })
      ).toBe(true);
    });

    it('evaluates aggregates with per-element scope', () => {
      const context = {
        instances: [
          { DiffusionBValue: 800, InstanceNumber: 2, NumberOfFrames: undefined },
          { InstanceNumber: 1 },
          { DiffusionBValue: 0, InstanceNumber: 3, NumberOfFrames: 4 },
        ],
      };
      expect(compileExpression('some(instances, DiffusionBValue != undefined)')(context)).toBe(
        true
      );
      expect(compileExpression('every(instances, DiffusionBValue != undefined)')(context)).toBe(
        false
      );
      expect(compileExpression('count(instances, DiffusionBValue != undefined)')(context)).toBe(2);
      expect(compileExpression('minOf(instances, InstanceNumber)')(context)).toBe(1);
      expect(compileExpression('maxOf(instances, InstanceNumber)')(context)).toBe(3);
      expect(
        compileExpression('sumOf(instances, defined(NumberOfFrames) ? NumberOfFrames : 1)')(context)
      ).toBe(6);
    });

    it('restores the outer scope after aggregates', () => {
      const fn = compileExpression('some(instances, InstanceNumber > 1) && InstanceNumber === 0');
      expect(fn({ instances: [{ InstanceNumber: 5 }], InstanceNumber: 0 })).toBe(true);
    });
  });

  describe('safety', () => {
    it('rejects prototype-chain access at parse time', () => {
      expect(() => compileExpression('a.__proto__')).toThrow(ExpressionSyntaxError);
      expect(() => compileExpression('a.constructor')).toThrow(ExpressionSyntaxError);
      expect(() => compileExpression('a.prototype.x')).toThrow(ExpressionSyntaxError);
      expect(() => compileExpression('__proto__')).toThrow(ExpressionSyntaxError);
    });

    it('blocks computed prototype access at runtime', () => {
      const fn = compileExpression("a['const' + 'ructor']");
      expect(fn({ a: {} })).toBeUndefined();
    });

    it('rejects non-whitelisted calls at compile time', () => {
      expect(() => compileExpression('alert(1)')).toThrow(ExpressionSyntaxError);
      expect(() => compileExpression('a.toString()')).toThrow(ExpressionSyntaxError);
    });

    it('rejects malformed expressions with the source in the message', () => {
      expect(() => compileExpression('1 +')).toThrow(/1 \+/);
      expect(() => compileExpression('`unterminated')).toThrow(ExpressionSyntaxError);
    });

    it('resolves null/undefined property access in templates to an empty string without throwing', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      try {
        // Accessing `a.b.c` when `a` is undefined must NOT throw; `safeGet`
        // handles the null chain gracefully and the template renders as ''.
        const fn = compileExpression('`${a.b.c}`');
        expect(fn({})).toBe('');
      } finally {
        warn.mockRestore();
      }
    });
  });
});
