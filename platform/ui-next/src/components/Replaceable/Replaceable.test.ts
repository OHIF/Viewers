import { createElement as h } from 'react';
import { render } from '@testing-library/react';
import { Replaceable, useReplaceableProps } from './Replaceable';

const mockEntries: Record<string, unknown> = {};
jest.mock('@ohif/core', () => ({ useCustomization: (id: string) => mockEntries[id] }), {
  virtual: true,
});

const Default = (props: { label?: string }) => h('span', { 'data-label': props.label }, 'default');
const html = (element: React.ReactElement) => render(element).container.innerHTML;

function replaceable(id: string, given = {}) {
  return h(Replaceable, { id, ...given }, h(Default, { label: 'a' }));
}

describe('Replaceable', () => {
  beforeEach(() => Object.keys(mockEntries).forEach(key => delete mockEntries[key]));

  it('renders the default with no entry', () => {
    expect(html(replaceable('x'))).toBe('<span data-label="a">default</span>');
  });

  it('replaces the default, and keeps the part props apart from the computed values', () => {
    mockEntries['components.x'] = {
      component: (p: { n: number; props: { n: number } }) => h('b', null, `${p.props.n},${p.n}`),
    };
    expect(html(replaceable('x', { props: { n: 1 }, n: 3 }))).toBe('<b>1,3</b>');
  });

  it('wraps the default with a replacement that renders children', () => {
    mockEntries['components.x'] = { component: p => h('div', { className: 'wrap' }, p.children) };
    expect(html(replaceable('x'))).toBe(
      '<div class="wrap"><span data-label="a">default</span></div>'
    );
  });

  it('changes a default prop with a props-only entry', () => {
    mockEntries['components.x'] = { props: { label: 'b' } };
    expect(html(replaceable('x'))).toBe('<span data-label="b">default</span>');
  });

  it('removes the default with component null', () => {
    mockEntries['components.x'] = { component: null };
    expect(html(replaceable('x'))).toBe('');
  });

  it('gives the props of a level above by its id', () => {
    const Inner = () => {
      const outer = useReplaceableProps<{ b: number }>('outer');
      const inner = useReplaceableProps<{ b: number }>('inner');
      return h('i', null, `${outer?.b},${inner?.b}`);
    };
    mockEntries['components.inner'] = { component: Inner };
    const tree = h(Replaceable, { id: 'outer', b: 1 }, replaceable('inner', { b: 2 }));
    expect(html(tree)).toBe('<i>1,2</i>');
  });
});
