# Report Generation Modal

## Overview

The Report Generation Modal is a new feature that replaces the sidebar-based report generation with a modal interface. This provides a better user experience with a focused, dedicated space for report creation.

## Features

### Modal Interface
- **Template Selection**: Dropdown menu to select from available report templates
- **Text Editor**: Rich text editor powered by TinyMCE for report content creation
- **Dictate to AI**: Button for AI-powered dictation (placeholder for future implementation)
- **Submit Report**: Button to submit the completed report

### Layout
The modal follows the design shown in the reference image:
- Title: "Select Templates"
- Template dropdown on the left
- "Dictate to AI" button on the right
- Large text editor area below
- "Submit Report" button at the bottom

### Styling
- Uses OHIF brand colors and styling
- Consistent with existing UI components
- Responsive design that works on different screen sizes

## Usage

1. Click the "Generate Report" button in the toolbar
2. The modal will open with the template selection interface
3. Select a template from the dropdown (templates are filtered by modality)
4. Edit the report content in the rich text editor
5. Click "Submit Report" to save the report

## Technical Implementation

### Components
- `ReportGenerationModal.tsx`: Main modal component
- `TinyMCEEditor`: Rich text editor component

### Integration
- Modified `generateReport` command in `commandsModule.ts`
- Uses `UIModalService` to display the modal
- Maintains compatibility with existing template and report APIs

### API Endpoints
- Templates: `GET /template?modality={modality}`
- Report submission: `POST /report`
- Study data: `GET /dicom/study-by-study-instance-uuid/{studyInstanceUID}`

## Future Enhancements

- Implement AI dictation functionality
- Add template preview
- Support for custom templates
- Auto-save functionality
- Export options (PDF, Word, etc.)
