import React from 'react';
import TextMeta from '../../../../ui-next/src/components/TextMeta';
import ShowcaseRow from './ShowcaseRow';

/**
 * TextMetaShowcase component displays TextMeta variants and examples
 */
export default function TextMetaShowcase() {
  return (
    <div className="space-y-8">
      {/* Basic Label */}
      <ShowcaseRow
        title="TextMeta - Basic Label"
        description="Simple text label without any interaction"
        code={`
// Basic label
<TextMeta.Container>
  <TextMeta.Label label="Patient Name" />
</TextMeta.Container>
        `}
      >
        <div className="bg-popover flex w-[300px] rounded p-4">
          <TextMeta.Container>
            <TextMeta.Label label="Patient Name" />
          </TextMeta.Container>
        </div>
      </ShowcaseRow>

      {/* Sortable Label */}
      <ShowcaseRow
        title="TextMeta - Sortable Label"
        description="Label with sorting functionality"
        code={`
// Sortable label with different states
<TextMeta.Container
  isSortable={true}
  sortDirection="ascending"
  onLabelClick={() => console.debug('Label clicked')}
>
  <TextMeta.SortableLabel label="Study Date" />
</TextMeta.Container>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-4 rounded p-4">
          <TextMeta.Container
            isSortable={true}
            sortDirection="ascending"
            onLabelClick={() => console.debug('Label clicked - ascending')}
          >
            <TextMeta.SortableLabel label="Study Date" />
          </TextMeta.Container>

          <TextMeta.Container
            isSortable={true}
            sortDirection="descending"
            onLabelClick={() => console.debug('Label clicked - descending')}
          >
            <TextMeta.SortableLabel label="Patient ID" />
          </TextMeta.Container>

          <TextMeta.Container
            isSortable={true}
            sortDirection="none"
            onLabelClick={() => console.debug('Label clicked - none')}
          >
            <TextMeta.SortableLabel label="Modality" />
          </TextMeta.Container>
        </div>
      </ShowcaseRow>

      {/* Basic Text Input */}
      <ShowcaseRow
        title="TextMeta - Text Input"
        description="Basic text input with optional label"
        code={`
// Text input with and without label
<TextMeta.Container
  value="John Doe"
  onChange={val => console.debug('Value changed:', val)}
  placeholder="Enter patient name"
>
  <TextMeta.Input label="Patient Name" />
</TextMeta.Container>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-4 rounded p-4">
          <TextMeta.Container
            value="John Doe"
            onChange={val => console.debug('Value changed:', val)}
            placeholder="Enter patient name"
          >
            <TextMeta.Input label="Patient Name" />
          </TextMeta.Container>

          <TextMeta.Container placeholder="Search studies...">
            <TextMeta.Input />
          </TextMeta.Container>
        </div>
      </ShowcaseRow>

      {/* Labeled Input with Sorting */}
      <ShowcaseRow
        title="TextMeta - Labeled Input"
        description="Input with integrated label and optional sorting"
        code={`
// Labeled input with sorting
<TextMeta.Container
  isSortable={true}
  sortDirection="ascending"
  onLabelClick={() => console.debug('Sort clicked')}
  value="CT"
  onChange={val => console.debug('Value changed:', val)}
>
  <TextMeta.LabeledInput label="Modality" />
</TextMeta.Container>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-4 rounded p-4">
          <TextMeta.Container
            isSortable={true}
            sortDirection="ascending"
            onLabelClick={() => console.debug('Sort clicked')}
            value="CT"
          >
            <TextMeta.LabeledInput label="Modality" />
          </TextMeta.Container>

          <TextMeta.Container value="12345">
            <TextMeta.LabeledInput label="Accession Number" />
          </TextMeta.Container>
        </div>
      </ShowcaseRow>

      {/* Filter Input */}
      <ShowcaseRow
        title="TextMeta - Filter Input"
        description="Debounced filter input with search icon and clear button"
        code={`
// Filter input with debounce
<TextMeta.Container
  placeholder="Filter studies..."
  onChange={val => console.debug('Filter changed:', val)}
>
  <TextMeta.FilterInput debounceTime={300} />
</TextMeta.Container>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-4 rounded p-4">
          <TextMeta.Container
            placeholder="Filter studies..."
            onChange={val => console.debug('Filter changed:', val)}
          >
            <TextMeta.FilterInput debounceTime={300} />
          </TextMeta.Container>

          <TextMeta.Container
            value="John"
            placeholder="Search patients..."
            onChange={val => console.debug('Search changed:', val)}
          >
            <TextMeta.FilterInput />
          </TextMeta.Container>
        </div>
      </ShowcaseRow>

      {/* Combined Examples */}
      <ShowcaseRow
        title="TextMeta - Combined Examples"
        description="Different TextMeta components working together"
        code={`
// Multiple TextMeta components
<div className="space-y-4">
  <TextMeta.Container isSortable sortDirection="ascending">
    <TextMeta.SortableLabel label="Patient List" />
  </TextMeta.Container>

  <TextMeta.Container placeholder="Filter patients...">
    <TextMeta.FilterInput />
  </TextMeta.Container>

  <TextMeta.Container value="SMITH^JOHN">
    <TextMeta.LabeledInput label="Patient Name" />
  </TextMeta.Container>
</div>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-4 rounded p-4">
          <TextMeta.Container
            isSortable
            sortDirection="ascending"
            onLabelClick={() => console.debug('Sort patients')}
          >
            <TextMeta.SortableLabel label="Patient List" />
          </TextMeta.Container>

          <TextMeta.Container placeholder="Filter patients...">
            <TextMeta.FilterInput />
          </TextMeta.Container>

          <TextMeta.Container value="SMITH^JOHN">
            <TextMeta.LabeledInput label="Patient Name" />
          </TextMeta.Container>
        </div>
      </ShowcaseRow>
    </div>
  );
}
