import { Icons, Button } from '@ohif/ui-next';
import Typography from '@ohif/ui/src/components/Typography';
import React, { useCallback, useState } from 'react';
import { useAppConfig } from '@state';

const getConfig = appConfig => {
  const defaultConfig = {
    description: 'Follow the instructions below to download the study or series:',
    instructions: [
      {
        command: 'pip install idc-index --upgrade',
        label: 'First, install the idc-index python package:',
      },
      {
        command: `idc download {{StudyInstanceUID}}`,
        label: 'Then, to download the whole study, run:',
      },
      {
        command: `idc download {{SeriesInstanceUID}}`,
        label: "Or, to download just the active viewport's series, run:",
      },
    ],
  };

  const config = appConfig?.idcDownloadCommandsDialog;

  if (!config) {
    return defaultConfig;
  }

  return {
    description: config.description ?? defaultConfig.description,
    instructions:
      config.instructions?.length > 0 ? config.instructions : defaultConfig.instructions,
  };
};

const DialogInstruction = ({
  instruction,
}: {
  instruction: { command: string; label: string };
}) => {
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');
  const { command, label } = instruction;

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopyState('success');
    } catch (err) {
      console.error('Failed to copy: ', err);
      setCopyState('error');
    } finally {
      setTimeout(() => {
        setCopyState('idle');
      }, 1500);
    }
  }, [command]);

  return (
    <div className="mb-6">
      <Typography variant="body" className="mb-2 text-white" component="p">
        {label}
      </Typography>
      <div className="bg-secondary-dark flex items-center justify-between rounded-md p-3">
        <code className="flex-1 break-all pr-3 text-sm text-white">{command}</code>
        <Button
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          className="hover:bg-primary/25 flex-shrink-0 text-white"
          title="Copy to clipboard"
        >
          {copyState === 'idle' && <Icons.Copy className="h-5 w-5" />}
          {copyState === 'success' && <Icons.FeedbackComplete className="h-5 w-5 text-green-400" />}
          {copyState === 'error' && <Icons.ByName name="Error" className="h-5 w-5 text-red-400" />}
        </Button>
      </div>
    </div>
  );
};

const DownloadStudySeriesDialog = ({
  StudyInstanceUID,
  SeriesInstanceUID,
}: {
  StudyInstanceUID: string;
  SeriesInstanceUID: string;
}) => {
  const [appConfig] = useAppConfig();
  const config = getConfig(appConfig);

  const replaceVariables = useCallback(
    text =>
      text
        .replace(/\{\{StudyInstanceUID\}\}/g, StudyInstanceUID)
        .replace(/\{\{SeriesInstanceUID\}\}/g, SeriesInstanceUID),
    [StudyInstanceUID, SeriesInstanceUID]
  );

  const instructions = config.instructions.map(instruction => {
    const { command, label } = instruction;
    return { command: replaceVariables(command), label: replaceVariables(label) };
  });

  return (
    <div className="bg-primary-dark rounded-lg p-6">
      <Typography variant="body" className="mb-6 text-white/80" component="p">
        {config.description}
      </Typography>
      <div className="space-y-4">
        {instructions.map((instruction, index) => (
          <DialogInstruction instruction={instruction} key={`${instruction.command}-${index}`} />
        ))}
      </div>
    </div>
  );
};

export default DownloadStudySeriesDialog;
