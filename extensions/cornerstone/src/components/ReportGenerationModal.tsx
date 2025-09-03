import React, { useRef, useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@ohif/ui-next';

declare global {
  interface Window {
    fetchModality: () => Promise<string | undefined>;
  }
}

interface ReportGenerationModalProps {
  hide: () => void;
}

export default function ReportGenerationModal({ hide }: ReportGenerationModalProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [isDictationMode, setIsDictationMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [dictationText, setDictationText] = useState('');

  const fetchModality = async () => {
    try {
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

  const handleTemplateClick = (template: any) => {
    console.log('HTML Content:', template.htmlContent);
    setContent(template.htmlContent);
    setTemplateName(template.name);
  };

  const handleDictateToAI = () => {
    setIsDictationMode(true);
  };

  const handleCloseDictation = () => {
    setIsDictationMode(false);
    setIsRecording(false);
    setIsPaused(false);
    setDictationText('');
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setDictationText('Start dictating.....');
    // TODO: Implement actual speech recognition
    console.log('Starting dictation...');
  };

  const handlePauseRecording = () => {
    setIsPaused(true);
    // TODO: Implement pause functionality
    console.log('Pausing dictation...');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    // TODO: Implement stop functionality
    console.log('Stopping dictation...');
  };

  const handleSubmitDictation = () => {
    // TODO: Process dictation text and add to report
    console.log('Submitting dictation:', dictationText);
    setContent(prevContent => prevContent + '\n\n' + dictationText);
    handleCloseDictation();
  };

  const handleSubmitReport = async (htmlContent: string) => {
    const studyInstanceUID = getStudyInstanceUID();

    if (!htmlContent || htmlContent.trim() === '' || htmlContent === '<p>&nbsp;</p>') {
      console.error('Error: Content is empty or contains only whitespace');
      return;
    }

    try {
      const report = await axios.post('http://localhost:4000/report', {
        studyInstanceUID: studyInstanceUID,
        htmlContent: htmlContent,
      });
      console.log('Report submitted successfully:', report.data);
      hide();
    } catch (error) {
      console.error('Error submitting report:', error.response?.data || error.message);
    }
  };

  const getStudyInstanceUID = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('StudyInstanceUIDs') || '';
  };

  useEffect(() => {
    if (isDropdownOpen && templates.length === 0) {
      fetchTemplates();
    }
  }, [isDropdownOpen, templates.length]);

  return (
    <div className="container-report flex h-full flex-col p-4">
      {/* Template Selection Row */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1">
          <DropdownMenu
            open={isDropdownOpen}
            onOpenChange={async open => {
              setIsDropdownOpen(open);
              if (open) {
                const modality = await fetchModality();
                await fetchTemplates(modality);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <button className="bg-background border-input hover:bg-accent text-foreground hover:text-accent-foreground flex w-full items-center justify-between gap-2 rounded border px-4 py-3 text-base transition-colors">
                <div className="flex items-center gap-2">
                  <span>{templateName || 'Select Template'}</span>
                </div>
                <Icons.ChevronDown className="h-4 w-4" />
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

        {!isDictationMode ? (
          <Button
            variant="default"
            size="lg"
            onClick={handleDictateToAI}
            className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap px-6 py-3 text-lg"
          >
            Dictate to AI
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="lg"
            onClick={handleCloseDictation}
            className="whitespace-nowrap px-6 py-3 text-lg"
          >
            Close Dictation
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="h-full min-h-0 flex-1">
        {isDictationMode ? (
          <div className="flex h-full gap-4">
            {/* Left Panel - Report Template */}
            <div className="flex-1">
              <TinyMCEEditor
                content={content}
                onSubmit={handleSubmitReport}
              />
            </div>

            {/* Right Panel - Dictation */}
            <div className="w-1/2">
              <DictationPanel
                isRecording={isRecording}
                isPaused={isPaused}
                dictationText={dictationText}
                onStart={handleStartRecording}
                onPause={handlePauseRecording}
                onStop={handleStopRecording}
                onSubmit={handleSubmitDictation}
              />
            </div>
          </div>
        ) : (
          <TinyMCEEditor
            content={content}
            onSubmit={handleSubmitReport}
          />
        )}
      </div>
    </div>
  );
}

function TinyMCEEditor({
  content,
  onSubmit,
}: {
  content: string;
  onSubmit: (htmlContent: string) => void;
}) {
  const editorRef = useRef<any>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="h-full min-h-0 flex-1">
        <div className="h-full min-h-0 flex-1 [&_.tox-tinymce]:bg-[#1a1a1a] [&_.tox-edit-area]:bg-[#1a1a1a] [&_.tox-edit-area__iframe]:bg-[#1a1a1a]">
          <Editor
            apiKey="b0ggc7dfi30js013j5ardxxnumm26dhq5duxeqb15qt369l5"
            onInit={(_evt, editor) => (editorRef.current = editor)}
            initialValue={content}
            init={{
              height: '100%',
              min_height: 600,
              menubar: false,
              skin: 'oxide-dark',
              content_css: 'dark',
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
              content_style: `
                body {
                  font-family: 'Inter', sans-serif;
                  font-size: 14px;
                  background-color: #1a1a1a !important;
                  color: #ffffff !important;
                  margin: 0;
                  padding: 16px;
                }
                p { margin: 0 0 16px 0; color: #ffffff !important; }
                h1, h2, h3, h4, h5, h6 { color: #ffffff !important; }
                ul, ol { color: #ffffff !important; }
                li { color: #ffffff !important; }
                blockquote {
                  border-left: 4px solid #3b82f6;
                  margin: 16px 0;
                  padding-left: 16px;
                  color: #d1d5db !important;
                }
                .mce-content-body {
                  background-color: #1a1a1a !important;
                  color: #ffffff !important;
                }
                .tox-edit-area {
                  background-color: #1a1a1a !important;
                }
                .tox-edit-area__iframe {
                  background-color: #1a1a1a !important;
                }
              `,
              toolbar_mode: 'wrap',
              toolbar_sticky: true,
              toolbar_sticky_offset: 0,
              branding: false,
              elementpath: false,
              resize: false,
              statusbar: false,
              setup: editor => {
                editor.on('init', () => {
                  // Force dark mode after initialization
                  const iframe = editor.getContainer().querySelector('iframe');
                  if (iframe && iframe.contentDocument) {
                    const style = iframe.contentDocument.createElement('style');
                    style.textContent = `
                      body {
                        background-color: #1a1a1a !important;
                        color: #ffffff !important;
                      }
                      * {
                        color: #ffffff !important;
                      }
                      p, div, span, h1, h2, h3, h4, h5, h6, ul, ol, li {
                        color: #ffffff !important;
                      }
                    `;
                    iframe.contentDocument.head.appendChild(style);
                  }

                  // Additional dark mode enforcement
                  setTimeout(() => {
                    const container = editor.getContainer();
                    if (container) {
                      container.style.backgroundColor = '#1a1a1a';
                      const editArea = container.querySelector('.tox-edit-area');
                      if (editArea) {
                        editArea.style.backgroundColor = '#1a1a1a';
                      }
                    }
                  }, 100);
                });
              },
            }}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6 flex justify-center">
        <Button
          variant="default"
          size="lg"
          onClick={() => {
            const htmlContent = editorRef.current?.getContent();
            onSubmit(htmlContent);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-3 text-lg"
        >
          Submit Report
        </Button>
      </div>
    </div>
  );
}

function DictationPanel({
  isRecording,
  isPaused,
  dictationText,
  onStart,
  onPause,
  onStop,
  onSubmit,
}: {
  isRecording: boolean;
  isPaused: boolean;
  dictationText: string;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onSubmit: () => void;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Dictation</CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col space-y-4">
        {/* Instructions */}
        <div className="muted-foreground space-y-1 text-sm">
          <p>Dictate clinical findings and describe what you observe.</p>
          <p>Voice punctuation: say &quot;period&quot;, &quot;comma&quot;, etc...</p>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            variant={isRecording && !isPaused ? 'default' : 'secondary'}
            size="sm"
            onClick={onStart}
            disabled={isRecording && !isPaused}
            className="flex-1"
          >
            Start
          </Button>
          <Button
            variant={isPaused ? 'default' : 'secondary'}
            size="sm"
            onClick={onPause}
            disabled={!isRecording || isPaused}
            className="flex-1"
          >
            Pause
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onStop}
            disabled={!isRecording}
            className="flex-1"
          >
            Stop
          </Button>
        </div>

        {/* Dictation Output Area */}
        <div className="min-h-0 flex-1">
          <div className="h-full overflow-y-auto rounded bg-black p-4 text-white">
            <p className="muted-foreground text-center">
              {dictationText || 'Start dictating.....'}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={onSubmit}
            disabled={!dictationText || dictationText === 'Start dictating.....'}
          >
            Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
