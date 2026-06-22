import React, { useState, useCallback } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

const FINAL_ICONS = [
  'Actions',
  'ActionsBidirectional',
  'ActionsCombine',
  'ActionsCombineIntersect',
  'ActionsCombineMerge',
  'ActionsCombineSubtract',
  'ActionsInterpolate',
  'ActionsSetting',
  'ActionsSimplify',
  'ActionsSmooth',
  'Add',
  'ColorChange',
  'Copy',
  'Delete',
  'DicomTagBrowser',
  'Download',
  'Export',
  'ExternalLink',
  'FeedbackComplete',
  'Hide',
  'IconColorLUT',
  'Info',
  'JumpToSlice',
  'LayerForeground',
  'LayerSegmentation',
  'ListView',
  'LoadingSpinner',
  'More',
  'MultiplePatients',
  'Opacity',
  'OrientationSwitch',
  'OrientationSwitchA',
  'OrientationSwitchC',
  'OrientationSwitchR',
  'OrientationSwitchS',
  'Patient',
  'Pause',
  'Pin',
  'PinFill',
  'Play',
  'Rename',
  'Series',
  'Show',
  'SocialGithub',
  'StatusError',
  'StatusSuccess',
  'StatusWarning',
  'Threshold',
  'ThumbnailView',
  'Tool3DRotate',
  'ToolAngle',
  'ToolAnnotate',
  'ToolBidirectional',
  'ToolBidirectionalSegment',
  'ToolBrush',
  'ToolCalibrate',
  'ToolCapture',
  'ToolCine',
  'ToolCircle',
  'ToolCobbAngle',
  'ToolContract',
  'ToolCrosshair',
  'ToolDicomTagBrowser',
  'ToolEraser',
  'ToolExpand',
  'ToolFlipHorizontal',
  'ToolFreehandRoi',
  'ToolInterpolation',
  'ToolInvert',
  'ToolLabelmapAssist',
  'ToolLayout',
  'ToolLength',
  'ToolMagneticRoi',
  'ToolPETSegment',
  'ToolSegBrush',
  'ToolSegEraser',
  'ToolSegShape',
  'ToolSegmentAnything',
  'ToolShape',
  'ToolThreshold',
  'ToolWindowRegion',
  'ViewportViews',
  'ViewportWindowLevel',
  'WindowLevelAdvanced',
  'tool-crosshair-checked',
];

const SIZE_OPTIONS = [16, 20, 24, 32];

function IconsPageContent() {
  const { Icons } = require('../../../../ui-next/src/components/Icons');
  const {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } = require('../../../../ui-next/src/components/Tooltip');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;

  const [searchQuery, setSearchQuery] = useState('');
  const [iconSize, setIconSize] = useState(24);
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

  const handleCopyIcon = useCallback((name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedIcon(name);
    setTimeout(() => setCopiedIcon(null), 1500);
  }, []);

  const filteredIcons = searchQuery.trim()
    ? FINAL_ICONS.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
    : FINAL_ICONS;

  function IconTile({ name }: { name: string }) {
    const IconComponent = (Icons as any)[name];
    if (!IconComponent || typeof IconComponent !== 'function') return null;

    const isCopied = copiedIcon === name;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => handleCopyIcon(name)}
            className={`group flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
              isCopied
                ? 'border-primary bg-primary/10'
                : 'border-transparent hover:border-input/50 hover:bg-muted/30'
            }`}
          >
            <div
              className="flex items-center justify-center text-foreground"
              style={{ minHeight: iconSize + 8, minWidth: iconSize + 8 }}
            >
              <IconComponent width={iconSize} height={iconSize} />
            </div>
            <span
              className={`max-w-full truncate text-center text-xs leading-tight ${
                isCopied
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground group-hover:text-foreground'
              }`}
            >
              {isCopied ? 'Copied!' : name}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <ComponentLayout
      title="Iconography"
      description="Icons for tools and actions in the viewer"
    >
      <PageHeader
        title="Iconography"
        description="Icons for tools and actions in the viewer"
      />

      <div className="mb-8">
        <p className="text-secondary-foreground text-lg leading-relaxed">
          Click any icon to copy its name. Use the search to filter by name, and
          the size controls to preview at different dimensions.
        </p>
      </div>

      {/* Controls: search + size toggles */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search icons..."
            className="w-full rounded-lg border border-input/50 bg-muted/30 px-4 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              &times;
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Size</span>
          <div className="flex items-center gap-1 rounded-lg border border-input/50 p-1">
            {SIZE_OPTIONS.map(size => (
              <button
                key={size}
                onClick={() => setIconSize(size)}
                className={`rounded-md px-2.5 py-1 text-sm transition-colors ${
                  iconSize === size
                    ? 'bg-primary/15 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Icon count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filteredIcons.length === FINAL_ICONS.length
          ? `${FINAL_ICONS.length} icons`
          : `${filteredIcons.length} of ${FINAL_ICONS.length} icons`}
      </p>

      {/* Icon grid */}
      <TooltipProvider delayDuration={300}>
        {filteredIcons.length > 0 ? (
          <div className="mb-10 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
            {filteredIcons.map(name => (
              <IconTile key={name} name={name} />
            ))}
          </div>
        ) : (
          <div className="mb-10 flex h-48 items-center justify-center text-muted-foreground">
            No icons found matching &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </TooltipProvider>

      <Section title="Usage">
        <CodeBlock
          code={`import { Icons } from '@ohif/ui-next';

// Use as a React component
<Icons.ToolLength />
<Icons.Add className="h-4 w-4" />

// Dynamic lookup by name
<Icons.ByName name="ToolLength" />

// With custom size
<Icons.ToolCapture width={32} height={32} />`}
        />
      </Section>
    </ComponentLayout>
  );
}

export default function IconsPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <IconsPageContent />}</BrowserOnly>
  );
}
