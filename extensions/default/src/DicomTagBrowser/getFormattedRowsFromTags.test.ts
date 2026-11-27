import { getFormattedRowsFromTags } from './DicomTagBrowser';

jest.mock('@ohif/core', () => ({ classes: {}, Types: {} }));
jest.mock('@ohif/ui-next', () => ({}));
jest.mock('./DicomTagTable', () => () => null);
jest.mock('./DicomTagBrowser.css', () => ({}));

/**
 * ContentSequence
 *   Item #0
 *     RelationshipType
 *     ContentSequence (nested)
 *       Item #0
 *         CodeValue
 */
const tags = [
  {
    tag: '(0040,A730)',
    vr: 'SQ',
    keyword: 'ContentSequence',
    values: [
      [
        { tag: '(0040,A010)', vr: 'CS', keyword: 'RelationshipType', value: 'CONTAINS' },
        {
          tag: '(0040,A730)',
          vr: 'SQ',
          keyword: 'ContentSequence',
          values: [[{ tag: '(0008,0100)', vr: 'SH', keyword: 'CodeValue', value: '1' }]],
        },
      ],
    ],
  },
];

describe('getFormattedRowsFromTags', () => {
  it('lists every descendant in an item row children, so collapsing the item hides them', () => {
    const rows = getFormattedRowsFromTags({ tags, metadata: {} });
    const uidOf = (keyword: string, depth: number) =>
      rows.find(row => row.keyword === keyword && row.depth === depth)?.uid;

    const outerItem = rows.find(row => row.keyword === 'Item #0' && row.depth === 1);
    const innerItem = rows.find(row => row.keyword === 'Item #0' && row.depth === 3);

    expect(outerItem.children).toEqual(
      expect.arrayContaining([
        uidOf('RelationshipType', 2),
        uidOf('ContentSequence', 2),
        innerItem.uid,
        uidOf('CodeValue', 4),
      ])
    );
    expect(outerItem.children).toHaveLength(4);
    expect(innerItem.children).toEqual([uidOf('CodeValue', 4)]);
  });

  it('lists every descendant in a sequence row children', () => {
    const rows = getFormattedRowsFromTags({ tags, metadata: {} });
    const outerSequence = rows.find(row => row.keyword === 'ContentSequence' && row.depth === 0);

    expect(outerSequence.children).toHaveLength(rows.length - 1);
  });
});
