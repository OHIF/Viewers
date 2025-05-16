import React, { useRef, useState } from 'react';

const MIN_WIDTH_PERCENT = 5;
const MAX_WIDTH_PERCENT = 50;
const DEFAULT_WIDTH_PERCENT = 35;

const theme = {
  panelBg: '#11214c', // dark blue
  panelBorder: '#1a2a5a', // slightly lighter blue
  panelShadow: '0 2px 16px rgba(0,0,0,0.18)',
  heading: '#fff',
  text: '#e0e6f0',
  subText: '#8bb6e6',
  accent: '#3fa9f5', // light blue accent
  buttonBg: '#3fa9f5',
  buttonBorder: 'transparent',
  buttonShadow: '0 2px 8px rgba(0,0,0,0.18)',
  buttonHover: '#63c1ff',
  icon: '#fff',
  dragHandle: '#3fa9f5',
  aiButtonBg: '#3fa9f5',
  aiButtonText: '#fff',
  aiButtonHover: '#63c1ff',
};

const SplitViewLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aiPanelWidth, setAiPanelWidth] = useState<number>(DEFAULT_WIDTH_PERCENT);
  const [isClosed, setIsClosed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Handle mouse drag for resizing
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) {
      return;
    }
    const x = e.clientX;
    const windowWidth = window.innerWidth;
    let newWidth = ((windowWidth - x) / windowWidth) * 100;
    newWidth = Math.max(0, Math.min(newWidth, MAX_WIDTH_PERCENT));
    if (newWidth < MIN_WIDTH_PERCENT) {
      setIsClosed(true);
      setAiPanelWidth(DEFAULT_WIDTH_PERCENT); // Reset for next open
    } else {
      setAiPanelWidth(newWidth);
      setIsClosed(false);
    }
  };

  const onMouseUp = () => {
    setDragging(false);
    document.body.style.cursor = '';
  };

  React.useEffect(() => {
    if (!dragging) {
      return;
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging]);

  // Floating button to reopen
  const floatingButton = (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 32,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 32,
          height: 2,
          background: theme.panelBorder,
          marginBottom: 8,
          borderRadius: 1,
        }}
      />
      <button
        style={{
          background: theme.buttonBg,
          border: `1px solid ${theme.buttonBorder}`,
          borderRadius: '16px',
          boxShadow: theme.buttonShadow,
          padding: '10px 12px 10px 10px',
          cursor: 'pointer',
          fontSize: 22,
          color: theme.icon,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        title="Show AI Summary"
        onClick={() => setIsClosed(false)}
        onMouseOver={e => (e.currentTarget.style.background = theme.buttonHover)}
        onMouseOut={e => (e.currentTarget.style.background = theme.buttonBg)}
      >
        {/* Left-pointing chevron, white */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.5 19L9.5 12L15.5 5"
            stroke={theme.icon}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );

  // Types for the FastAPI response
  type FastAPIResponse = {
    status: 'complete' | 'processing' | 'error';
    analysis?: {
      summary: string;
      anatomical_analysis: {
        structures: Array<{
          name: string;
          description: string;
          quality: string;
          spatial_relationship: string;
        }>;
        quality: string;
        spatial_relationships: string;
      };
      abnormalities: Array<{
        finding: string;
        characteristics: string;
        location: string;
        size: string;
        density: string;
        confidence: string;
      }>;
      clinical_implications: {
        potential_diagnoses: string[];
        critical_findings: string;
        further_examination: string;
      };
      technical_quality: {
        assessment: string;
        limitations: string;
      };
      metadata?: {
        modality?: string;
        image_type?: string;
        original_filename?: string;
        [key: string]: string | undefined;
      };
    };
    metadata?: {
      modality?: string;
      image_type?: string;
      original_filename?: string;
      [key: string]: string | undefined;
    };
    error?: string;
  };

  // --- AI Summary Button Logic ---
  const handleAnalyzeViewport = async () => {
    setLoading(true);
    setAiResponse(null);
    try {
      // Find the active Cornerstone viewport element
      const viewportEl = document.querySelector('.cornerstone-viewport-element');
      if (!viewportEl) {
        throw new Error('No active Cornerstone viewport found.');
      }
      // Try to find a canvas inside it
      const canvas = viewportEl.querySelector('canvas');
      if (!canvas) {
        throw new Error('No canvas found in Cornerstone viewport.');
      }
      // Get image data
      const dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/png');

      // Convert base64 to blob
      const base64Data = dataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      const blob = new Blob(byteArrays, { type: 'image/png' });

      // Create form data
      const formData = new FormData();
      formData.append('file', blob, 'screenshot.png');

      // Upload to FastAPI backend
      const uploadResponse = await fetch('http://localhost:8002/api/v1/dicom/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const { file_id } = await uploadResponse.json();

      // Poll for analysis results
      let analysisResult: FastAPIResponse | null = null;
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max wait time

      while (attempts < maxAttempts) {
        const analysisResponse = await fetch(
          `http://localhost:8002/api/v1/dicom/analysis/${file_id}`
        );
        if (!analysisResponse.ok) {
          throw new Error(`Analysis failed: ${analysisResponse.statusText}`);
        }

        const result = await analysisResponse.json();
        if (result.status === 'complete') {
          analysisResult = result;
          break;
        } else if (result.status === 'error') {
          throw new Error(result.error || 'Analysis failed');
        }

        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      if (!analysisResult) {
        throw new Error('Analysis timed out');
      }

      setAiResponse(JSON.stringify(analysisResult));
      setLoading(false);
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      setAiResponse(JSON.stringify({ error: message }));
      setLoading(false);
    }
  };

  // Helper to parse and render JSON response (with code block stripping)
  let parsedJson: unknown = null;
  if (aiResponse) {
    let cleaned = aiResponse.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
    try {
      parsedJson = JSON.parse(cleaned);
    } catch (e) {
      parsedJson = null;
    }
  }

  // Add waveform animation component
  const WaveformAnimation: React.FC = () => (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        margin: '0 0 24px 0',
        height: 32,
        pointerEvents: 'none',
      }}
    >
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <div
          key={i}
          style={{
            width: 6,
            height: 18,
            margin: '0 3px',
            borderRadius: 4,
            background: 'linear-gradient(180deg, #3fa9f5 60%, #11214c 100%)',
            animation: `waveformBar 1.2s ${i * 0.12}s infinite cubic-bezier(.4,0,.2,1)`,
          }}
        />
      ))}
      <style>{`
        @keyframes waveformBar {
          0%, 100% { height: 18px; opacity: 0.7; }
          20% { height: 32px; opacity: 1; }
          40% { height: 12px; opacity: 0.6; }
          60% { height: 28px; opacity: 0.9; }
          80% { height: 10px; opacity: 0.5; }
        }
      `}</style>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        position: 'relative',
        background: theme.panelBg,
      }}
    >
      <div
        style={{
          flex: isClosed ? '1 1 100%' : `0 0 calc(${100 - aiPanelWidth}% )`,
          height: '100%',
          overflow: 'hidden',
          transition: 'flex-basis 0.2s',
        }}
      >
        {children}
      </div>
      {!isClosed && (
        <>
          {/* Draggable Divider */}
          <div
            ref={dragHandleRef}
            style={{
              position: 'relative',
              width: 0,
              zIndex: 20,
            }}
          >
            <div
              onMouseDown={onMouseDown}
              style={{
                position: 'absolute',
                left: -6,
                top: 0,
                width: 12,
                height: '100vh',
                cursor: 'col-resize',
                background: dragging ? theme.panelBorder : 'transparent',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => {
                if (!dragging) {
                  e.currentTarget.style.background = theme.buttonHover;
                }
              }}
              onMouseLeave={e => {
                if (!dragging) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              title="Resize AI Summary Panel"
            >
              <div
                style={{
                  width: 2,
                  height: '40px',
                  background: theme.dragHandle,
                  borderRadius: 1,
                }}
              />
            </div>
          </div>
          {/* AI Panel */}
          <div
            style={{
              flex: `0 0 ${aiPanelWidth}%`,
              height: '100%',
              borderLeft: `1px solid ${theme.panelBorder}`,
              background: theme.panelBg,
              boxShadow: theme.panelShadow,
              padding: '24px 18px 18px 18px',
              boxSizing: 'border-box',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              minWidth: 0,
              transition: 'flex-basis 0.2s',
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
              margin: '12px 12px 12px 0',
            }}
          >
            {/* Analyze Button - top left */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: 18 }}>
              <button
                style={{
                  marginTop: 0,
                  marginBottom: 0,
                  alignSelf: 'flex-start',
                  background: theme.aiButtonBg,
                  color: theme.aiButtonText,
                  border: 'none',
                  borderRadius: 7,
                  padding: '7px 14px',
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: loading
                    ? '0 0 0 0 #3fa9f5, 0 0 8px 2px #3fa9f5bb, 0 0 16px 4px #3fa9f555'
                    : theme.buttonShadow,
                  transition: 'box-shadow 0.4s, background 0.2s',
                  letterSpacing: 0.2,
                  position: 'relative',
                  zIndex: 2,
                  animation: loading ? 'pulsateAura 1.2s infinite cubic-bezier(.4,0,.2,1)' : 'none',
                  marginRight: 12,
                  minWidth: 90,
                  outline: 'none',
                }}
                onClick={handleAnalyzeViewport}
                disabled={loading}
                onMouseOver={e => (e.currentTarget.style.background = theme.aiButtonHover)}
                onMouseOut={e => (e.currentTarget.style.background = theme.aiButtonBg)}
              >
                {loading ? '...' : 'Analyze'}
                <style>{`
                  @keyframes pulsateAura {
                    0% { box-shadow: 0 0 0 0 #3fa9f5, 0 0 8px 2px #3fa9f5bb, 0 0 16px 4px #3fa9f555; }
                    50% { box-shadow: 0 0 0 0 #3fa9f5, 0 0 16px 6px #3fa9f555, 0 0 32px 12px #3fa9f522; }
                    100% { box-shadow: 0 0 0 0 #3fa9f5, 0 0 8px 2px #3fa9f5bb, 0 0 16px 4px #3fa9f555; }
                  }
                `}</style>
              </button>
              {loading && <WaveformAnimation />}
            </div>
            {/* Only render the summary/analysis/error if present */}
            {aiResponse && (
              <div
                style={{
                  marginTop: loading ? 0 : 24,
                  color: theme.text,
                  background: 'rgba(0,0,0,0.18)',
                  padding: 24,
                  borderRadius: 12,
                  width: '100%',
                  boxShadow: theme.panelShadow,
                  minHeight: 120,
                }}
              >
                {parsedJson && typeof parsedJson === 'object' && 'analysis' in parsedJson ? (
                  <>
                    {/* Summary Card */}
                    <div
                      style={{
                        background: 'rgba(63, 169, 245, 0.10)',
                        borderLeft: `4px solid ${theme.accent}`,
                        borderRadius: 8,
                        padding: '16px 20px',
                        marginBottom: 28,
                        fontSize: 18,
                        fontWeight: 600,
                        color: theme.heading,
                        boxShadow: '0 1px 4px rgba(63,169,245,0.08)',
                      }}
                    >
                      <span style={{ marginRight: 8, fontSize: 22, verticalAlign: 'middle' }}>
                        🩺
                      </span>
                      {(parsedJson as FastAPIResponse).analysis?.summary}
                    </div>

                    {/* Anatomical Analysis */}
                    {(parsedJson as FastAPIResponse).analysis?.anatomical_analysis && (
                      <div style={{ marginBottom: 28 }}>
                        <h3 style={{ color: theme.heading, marginBottom: 16 }}>
                          Anatomical Analysis
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {(
                            parsedJson as FastAPIResponse
                          ).analysis?.anatomical_analysis.structures.map((structure, index) => (
                            <div
                              key={index}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 8,
                                padding: 16,
                              }}
                            >
                              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                                {structure.name}
                              </div>
                              <div style={{ color: theme.subText, fontSize: 14 }}>
                                {structure.description}
                              </div>
                              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 14 }}>
                                <span style={{ color: theme.accent }}>
                                  Quality: {structure.quality}
                                </span>
                                <span style={{ color: theme.subText }}>
                                  {structure.spatial_relationship}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Abnormalities */}
                    {(parsedJson as FastAPIResponse).analysis?.abnormalities && (
                      <div style={{ marginBottom: 28 }}>
                        <h3 style={{ color: theme.heading, marginBottom: 16 }}>Abnormalities</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {(parsedJson as FastAPIResponse).analysis?.abnormalities.map(
                            (abnormality, index) => (
                              <div
                                key={index}
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  borderRadius: 8,
                                  padding: 16,
                                }}
                              >
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                                  {abnormality.finding}
                                </div>
                                <div style={{ color: theme.subText, fontSize: 14 }}>
                                  {abnormality.characteristics}
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 8,
                                    marginTop: 8,
                                    fontSize: 14,
                                  }}
                                >
                                  <span style={{ color: theme.accent }}>
                                    Location: {abnormality.location}
                                  </span>
                                  <span style={{ color: theme.accent }}>
                                    Size: {abnormality.size}
                                  </span>
                                  <span style={{ color: theme.accent }}>
                                    Density: {abnormality.density}
                                  </span>
                                  <span style={{ color: theme.accent }}>
                                    Confidence: {abnormality.confidence}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Clinical Implications */}
                    {(parsedJson as FastAPIResponse).analysis?.clinical_implications && (
                      <div style={{ marginBottom: 28 }}>
                        <h3 style={{ color: theme.heading, marginBottom: 16 }}>
                          Clinical Implications
                        </h3>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            padding: 16,
                          }}
                        >
                          {(parsedJson as FastAPIResponse).analysis?.clinical_implications
                            .potential_diagnoses.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                                Potential Diagnoses:
                              </div>
                              <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {(
                                  parsedJson as FastAPIResponse
                                ).analysis?.clinical_implications.potential_diagnoses.map(
                                  (diagnosis, index) => (
                                    <li
                                      key={index}
                                      style={{ color: theme.subText }}
                                    >
                                      {diagnosis}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>
                              Critical Findings:
                            </div>
                            <div style={{ color: theme.subText }}>
                              {
                                (parsedJson as FastAPIResponse).analysis?.clinical_implications
                                  .critical_findings
                              }
                            </div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>
                              Further Examination:
                            </div>
                            <div style={{ color: theme.subText }}>
                              {
                                (parsedJson as FastAPIResponse).analysis?.clinical_implications
                                  .further_examination
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Technical Quality */}
                    {(parsedJson as FastAPIResponse).analysis?.technical_quality && (
                      <div>
                        <h3 style={{ color: theme.heading, marginBottom: 16 }}>
                          Technical Quality
                        </h3>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            padding: 16,
                          }}
                        >
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>Assessment:</div>
                            <div style={{ color: theme.subText }}>
                              {
                                (parsedJson as FastAPIResponse).analysis?.technical_quality
                                  .assessment
                              }
                            </div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>Limitations:</div>
                            <div style={{ color: theme.subText }}>
                              {
                                (parsedJson as FastAPIResponse).analysis?.technical_quality
                                  .limitations
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : parsedJson && typeof parsedJson === 'object' && 'error' in parsedJson ? (
                  <div
                    style={{
                      color: '#ff4d4f',
                      background: 'rgba(255,77,79,0.1)',
                      padding: 16,
                      borderRadius: 8,
                      border: '1px solid rgba(255,77,79,0.2)',
                    }}
                  >
                    Error: {(parsedJson as { error: string }).error}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </>
      )}
      {isClosed && floatingButton}
    </div>
  );
};

export default SplitViewLayout;
