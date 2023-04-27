import ContextMenuItemsBuilder from "./ContextMenuItemsBuilder";

const menus = [
  {
    id: 'one',
    selector: ({ value }) => value === 'one',
    items: [],
  },
  {
    id: 'two',
    selector: ({ value }) => value === 'two',
    items: [],
  },
  {
    id: 'default',
    items: [],
  },
];

const menuBuilder = new ContextMenuItemsBuilder();

describe('ContextMenuItemsBuilder', () => {
  test('findMenuDefault', () => {
    expect(menuBuilder.findMenuDefault(menus, {})).toBe(menus[2]);
    expect(menuBuilder.findMenuDefault(menus, { value: 'two' })).toBe(menus[1]);
    expect(menuBuilder.findMenuDefault([], {})).toBeUndefined();
    expect(menuBuilder.findMenuDefault(undefined, undefined)).toBeNull();
  });
});
