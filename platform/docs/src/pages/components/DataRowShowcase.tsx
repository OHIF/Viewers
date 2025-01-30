import React from 'react';
import DataRowExample from '../patterns/DataRowExample';
import ShowcaseRow from './ShowcaseRow';

/**
 * DataRowShowcase component displays DataRow variants and examples
 */
export default function DataRowShowcase() {
  return (
    <ShowcaseRow
      title="Data Row"
      description="A selectable row with action menu options and visibility toggle. Color, Secondary details, and Image Series are optional to display."
      code={`
Example code coming soon.
      `}
    >
      <DataRowExample />
    </ShowcaseRow>
  );
}
