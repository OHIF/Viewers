// extensions/cornerstone/src/panels/PanelTemplate.tsx
import { useRef } from 'react';
import React, { useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
// import './App.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
} from '@ohif/ui-next';
import { useSystem } from '@ohif/core/src';

export default function PanelTemplate() {
  const { commandsManager } = useSystem();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleGenerateReport = (reportType: string) => {
    commandsManager.run('generateReport', { reportType });
  };
  //listen for the custom event to open the editor
  useEffect(() => {
    const handleOpenEditor = () => {
      console.log('PanelTemplate: Received openEditor event');
      setIsEditorOpen(true);
    };
    window.addEventListener('openEditor', handleOpenEditor);
  }, []);

  // Listen for the custom event to open dropdown
  useEffect(() => {
    const handleOpenDropdown = () => {
      console.log('PanelTemplate: Received openTemplateDropdown event');
      setIsDropdownOpen(true);
    };

    console.log('PanelTemplate: Adding event listener for openTemplateDropdown');
    window.addEventListener('openTemplateDropdown', handleOpenDropdown);

    return () => {
      console.log('PanelTemplate: Removing event listener for openTemplateDropdown');
      window.removeEventListener('openTemplateDropdown', handleOpenDropdown);
    };
  }, []);
  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="mb-3 text-lg text-white">Report Templates</h3>
        <DropdownMenu
          open={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <button className="bg-primary-dark hover:bg-primary-light flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-white">
              <div className="flex items-center gap-2">
                <span>Templates</span>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="z-50 w-56"
          >
            <DropdownMenuItem onClick={() => handleGenerateReport('complete')}>
              <Icons.Export className="mr-2 h-4 w-4" />
              Template 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGenerateReport('complete')}>
              <Icons.Export className="mr-2 h-4 w-4" />
              Template 2
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-sm text-gray-400">Click to generate a comprehensive report.</div>

      {/* TinyMCE Editor Section */}
      <div className="mt-4">
        <TinyMCEEditor />
      </div>
    </div>
  );
}

function TinyMCEEditor() {
  const editorRef = useRef(null);
  const log = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

  return (
    <>
      <Editor
        apiKey="b0ggc7dfi30js013j5ardxxnumm26dhq5duxeqb15qt369l5"
        onInit={(_evt, editor) => (editorRef.current = editor)}
        initialValue="<p>This is the initial content of the editor.</p>"
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
    </>
  );
}
