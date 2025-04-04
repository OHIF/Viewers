import * as ContextMenuItemsBuilder from './ContextMenuItemsBuilder';

const menus = [
  {
    id: 'one',
    selector: ({ value } = {}) => value === 'one',
    items: [],
  },
  {
    id: 'two',
    selector: ({ value } = {}) => value === 'two',
    items: [],
  },
  {
    id: 'default',
    items: [],
  },
];

describe('ContextMenuItemsBuilder', () => {
  test('findMenuDefault', () => {
    expect(ContextMenuItemsBuilder.findMenuDefault(menus, {})).toBe(menus[2]);
    expect(
      ContextMenuItemsBuilder.findMenuDefault(menus, { selectorProps: { value: 'two' } })
    ).toBe(menus[1]);
    expect(ContextMenuItemsBuilder.findMenuDefault([], {})).toBeUndefined();
    expect(ContextMenuItemsBuilder.findMenuDefault(undefined, undefined)).toBeNull();
  });
});
