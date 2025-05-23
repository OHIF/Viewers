import React, { useState } from 'react';
import { TagInput } from '../../../../ui-next/src/components/TagInput';
import ShowcaseRow from './ShowcaseRow';

/**
 * TagInputShowcase demonstrates the TagInput component for input fields that
 * accept multiple tag values.
 */
export default function TagInputShowcase() {
  const [tags, setTags] = useState<string[]>(['CT', 'MR', 'PT']);
  const [technologies, setTechnologies] = useState<string[]>([]);

  return (
    <ShowcaseRow
      title="TagInput"
      description="Input field for multiple tags/values with badge display."
      code={`
// Basic usage with state
const [tags, setTags] = useState(['CT', 'MR', 'PT']);

<TagInput
  value={tags}
  onChange={setTags}
  placeholder="Enter modalities..."
/>

// Usage notes:
// - Type and press Enter or comma (,) to add a tag
// - Click X to remove a tag
// - Press Backspace when input is empty to remove the last tag
// - Paste comma-separated values to add multiple tags at once
      `}
    >
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <div>
          <p className="text-sm mb-1 text-gray-400">Modalities</p>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder="Enter modalities..."
          />
        </div>
        <div>
          <p className="text-sm mb-1 text-gray-400">Technologies (empty)</p>
          <TagInput
            value={technologies}
            onChange={setTechnologies}
            placeholder="Add technologies..."
          />
        </div>
      </div>
    </ShowcaseRow>
  );
}