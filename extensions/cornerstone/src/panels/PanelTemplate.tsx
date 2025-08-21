// extensions/cornerstone/src/panels/PanelTemplate.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';

// import './App.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
} from '@ohif/ui-next';
// import { useSystem } from '@ohif/core/src';
declare global {
  interface Window {
    fetchModality: () => Promise<string | undefined>;
  }
}

export default function PanelTemplate() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [content, setContent] = useState('');
  const [templateName, setTemplateName] = useState('');
  const fetchModality = async () => {
    try {
      // Get studyInstanceUuid from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const studyInstanceUuid = urlParams.get('StudyInstanceUIDs');

      if (!studyInstanceUuid) {
        console.log('No StudyInstanceUIDs found in URL');
        return undefined;
      }

      const response = await axios.get(
        `http://localhost:4000/dicom/study-by-study-instance-uuid/${studyInstanceUuid}`
      );
      console.log('Study data:', response.data);
      const studyData = response.data;
      const modality = studyData?.patient?.modality;
      console.log('Modality:', modality);
      return modality;
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
      return undefined;
    }
  };
  window.fetchModality = fetchModality;

  // Fetch templates (unfiltered)
  const fetchTemplates = async (modality?: string) => {
    try {
      const response = await axios.get('http://localhost:4000/template', {
        params: modality ? { modality } : undefined,
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const handleTemplateClick = template => {
    console.log('HTML Content:', template.htmlContent);
    setContent(template.htmlContent);
    setTemplateName(template.name);
  };

  // Removed custom event listener - now handled directly in dropdown onOpenChange

  useEffect(() => {
    if (isDropdownOpen && templates.length === 0) {
      fetchTemplates();
    }
  }, [isDropdownOpen, templates.length]);
  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="mb-3 text-lg text-white">Report Templates</h3>
        <DropdownMenu
          open={isDropdownOpen}
          onOpenChange={async open => {
            setIsDropdownOpen(open);
            if (open) {
              // Run fetchModality directly when dropdown opens
              const modality = await fetchModality();
              await fetchTemplates(modality);
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <button className="bg-primary-dark hover:bg-primary-light flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-white">
              <div className="flex items-center gap-2">
                <span>{templateName || 'Select Template'}</span>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="z-50 w-56"
          >
            {templates.length > 0 ? (
              templates.map(template => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                >
                  <Icons.Export className="mr-2 h-4 w-4" />
                  {template.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem>
                <Icons.Export className="mr-2 h-4 w-4" />
                Loading templates... (Count: {templates.length})
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-sm text-gray-400">Click to generate a comprehensive report.</div>

      {/* TinyMCE Editor Section */}
      <div className="mt-4">
        <TinyMCEEditor content={content} />
      </div>
    </div>
  );
}

function TinyMCEEditor({ content }: { content: string }) {
  const editorRef = useRef(null);

  // Get studyInstanceUID from URL parameters
  const getStudyInstanceUID = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('StudyInstanceUIDs') || '';
  };

  const log = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

  const handleSubmitReport = async (studyInstanceUID: string, htmlContent: string) => {
    console.log('Submitting report...');

    // Validate content before sending
    if (!htmlContent || htmlContent.trim() === '' || htmlContent === '<p>&nbsp;</p>') {
      console.error('Error: Content is empty or contains only whitespace');
      return;
    }

    try {
      const report = await axios.post('http://localhost:4000/report', {
        studyInstanceUID: studyInstanceUID,
        htmlContent: htmlContent, // Changed from 'content' to 'htmlContent' to match server expectation
      });
      console.log('Report submitted successfully:', report.data);
    } catch (error) {
      console.error('Error submitting report:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
    }
  };

  return (
    <>
      <Editor
        apiKey="b0ggc7dfi30js013j5ardxxnumm26dhq5duxeqb15qt369l5"
        onInit={(_evt, editor) => (editorRef.current = editor)}
        initialValue={content}
        init={{
          height: 500,
          menubar: false,
          plugins: [
            'advlist',
            'autolink',
            'lists',
            'link',
            'image',
            'charmap',
            'preview',
            'anchor',
            'searchreplace',
            'visualblocks',
            'code',
            'fullscreen',
            'insertdatetime',
            'media',
            'table',
            'code',
            'help',
            'wordcount',
          ],
          toolbar:
            'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        }}
      />
      <button onClick={log}>Log editor content</button>
      <div className="mt-4">
        <button
          type="button"
          className="rounded bg-blue-500 py-2 px-4 font-bold text-white hover:bg-blue-700"
          onClick={() => {
            const studyInstanceUID = getStudyInstanceUID();
            const htmlContent = editorRef.current.getContent();
            console.log('Sending report with studyInstanceUID:', studyInstanceUID);
            console.log('Content length:', htmlContent.length);
            handleSubmitReport(studyInstanceUID, htmlContent);
          }}
        >
          Submit Report
        </button>
      </div>
    </>
  );
}
