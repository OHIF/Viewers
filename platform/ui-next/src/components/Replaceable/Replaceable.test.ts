import { createElement as h } from 'react';
import { render } from '@testing-library/react';
import { Replaceable } from './Replaceable';

const mockEntries: Record<string, unknown> = {};
jest.mock('@ohif/core', () => ({ useCustomization: (id: string) => mockEntries[id] }), {
  virtual: true,
});

const Default = (props: { label?: string }) => h('span', { 'data-label': props.label }, 'default');
const html = (element: React.ReactElement) => render(element).container.innerHTML;

function replaceable(id: string, props = {}) {
  return h(Replaceable, { id, props }, h(Default, { label: 'a' }));
}

describe('Replaceable', () => {
  beforeEach(() => Object.keys(mockEntries).forEach(key => delete mockEntries[key]));

  it('renders the default with no entry', () => {
    expect(html(replaceable('x'))).toBe('<span data-label="a">default</span>');
  });

  it('replaces the default and gives the props', () => {
    mockEntries['components.x'] = { component: (p: { n: number }) => h('b', null, `n=${p.n}`) };
    expect(html(replaceable('x', { n: 3 }))).toBe('<b>n=3</b>');
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

  it('merges the props of two nested levels', () => {
    mockEntries['components.inner'] = {
      component: (p: { a: number; b: number }) => h('i', null, `${p.a},${p.b}`),
    };
    const tree = h(Replaceable, { id: 'outer', props: { a: 1, b: 1 } }, replaceable('inner', { b: 2 }));
    expect(html(tree)).toBe('<i>1,2</i>');
  });
});
