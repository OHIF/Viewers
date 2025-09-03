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
  const [templates, setTemplates] = useState<
    Array<{ id: string; name: string; htmlContent: string }>
  >([]);
  const [content, setContent] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [isDictationMode, setIsDictationMode] = useState(false);
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

  const handleTemplateClick = (template: { id: string; name: string; htmlContent: string }) => {
    console.log('HTML Content:', template.htmlContent);
    setContent(template.htmlContent);
    setTemplateName(template.name);
  };

  const handleDictateToAI = () => {
    setIsDictationMode(true);
  };

  const handleCloseDictation = () => {
    setIsDictationMode(false);
    setDictationText('');
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
                <div className="flex items-center">
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
                onDictationTextChange={setDictationText}
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
  const editorRef = useRef<{ getContent: () => string } | null>(null);

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
  onDictationTextChange,
  onSubmit,
}: {
  onDictationTextChange: (text: string) => void;
  onSubmit: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [dictationText, setDictationText] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const shouldProcessAudioRef = useRef<boolean>(false);

  const cleanupAudioResources = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/audio');
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log(' WebSocket connected successfully');
      };

      ws.onmessage = event => {
        console.log('Received message from backend:', event.data);
        try {
          const response = JSON.parse(event.data);
          console.log('Parsed transcription response:', response);

          if (response.text) {
            setDictationText(prev => {
              const newText = prev + ' ' + response.text;
              onDictationTextChange(newText);
              return newText;
            });
          }
        } catch (e) {
          console.log(' Received plain text:', event.data);
          setDictationText(prev => {
            const newText = prev + ' ' + event.data;
            onDictationTextChange(newText);
            return newText;
          });
        }
      };

      ws.onerror = error => {
        console.error(' WebSocket error:', error);
      };

      ws.onclose = event => {
        console.log(' WebSocket disconnected:', event.code, event.reason);
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1 },
      });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioCtx;
      console.log(' AudioContext created with sample rate:', audioCtx.sampleRate);

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      let audioChunkCount = 0;

      processor.onaudioprocess = event => {
        if (
          shouldProcessAudioRef.current &&
          websocketRef.current &&
          websocketRef.current.readyState === WebSocket.OPEN
        ) {
          const inputData = event.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);

          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }

          audioChunkCount++;
          console.log(`Sending audio chunk #${audioChunkCount} to backend:`, {
            samples: pcmData.length,
            bytes: pcmData.buffer.byteLength,
            websocketState: websocketRef.current.readyState,
          });

          try {
            websocketRef.current.send(pcmData.buffer);
          } catch (error) {
            console.error(' Error sending audio data:', error);
          }
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsRecording(true);
      setIsPaused(false);
      setDictationText('');
      onDictationTextChange('');
      shouldProcessAudioRef.current = true;
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handlePauseRecording = () => {
    if (!isRecording) {
      return;
    }
    setIsPaused(prev => {
      const newPausedState = !prev;
      console.log(newPausedState ? ' Recording paused' : 'Recording resumed');
      return newPausedState;
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    shouldProcessAudioRef.current = false;
    cleanupAudioResources();
  };

  const handleSubmit = () => {
    onSubmit();
    setDictationText('');
    onDictationTextChange('');
  };

  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Dictation</CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col space-y-4">
        <div className="muted-foreground space-y-1 text-sm">
          <p>Dictate clinical findings and describe what you observe.</p>
          <p>Voice punctuation: say &quot;period&quot;, &quot;comma&quot;, etc...</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isRecording && !isPaused ? 'default' : 'secondary'}
            size="sm"
            onClick={handleStartRecording}
            disabled={isRecording && !isPaused}
            className="flex-1"
          >
            {isRecording && !isPaused ? 'Recording...' : 'Start'}
          </Button>
          <Button
            variant={isPaused ? 'default' : 'secondary'}
            size="sm"
            onClick={handlePauseRecording}
            disabled={!isRecording}
            className="flex-1"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleStopRecording}
            disabled={!isRecording}
            className="flex-1"
          >
            Stop
          </Button>
        </div>

        <div className="min-h-0 flex-1">
          <div className="h-full overflow-y-auto rounded bg-black p-4 text-white">
            {dictationText ? (
              <p className="whitespace-pre-wrap text-white">{dictationText}</p>
            ) : (
              <p className="muted-foreground text-center">
                {isRecording
                  ? isPaused
                    ? 'Recording paused. Click Resume to continue...'
                    : 'Listening... Speak now.'
                  : 'Click Start to begin dictation...'}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={!dictationText || dictationText.trim() === ''}
          >
            Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
