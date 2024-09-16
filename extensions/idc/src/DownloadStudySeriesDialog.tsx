import { Icon } from '@ohif/ui';
import React, { useCallback, useState } from 'react';
import { useAppConfig } from '@state';

const getConfig = appConfig => {
  const defaultConfig = {
    description: 'Follow the instructions below to download the study or series:',
    instructions: [
      { command: 'pip install idc-index --upgrade', label: 'First, install the idc cli:' },
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
  const [message, setMessage] = useState('');
  const { command, label } = instruction;

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setMessage('Copied');
    } catch (err) {
      console.error('Failed to copy: ', err);
      setMessage('Failed');
    } finally {
      setTimeout(() => {
        resetState();
      }, 500);
    }
  }, [command]);

  const resetState = () => {
    setMessage(null);
  };

  return (
    <div>
      {label ? <section>{label}</section> : <></>}
      <section className="bg-secondary-dark my-4 flex flex-row justify-between py-1 px-2">
        {command}
        <div className="relative flex h-8 items-center rounded border px-2 py-2 text-base text-white">
          {message || (
            <>
              <div className="cursor-pointer" onClick={copyToClipboard}>
                <Icon name="clipboard" className="w-4 text-white" />
              </div>
            </>
          )}
        </div>
      </section>
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
    <div>
      <h1>{config.description}</h1>
      <div className="mt-2 p-2">
        {instructions.map(instruction => (
          <DialogInstruction instruction={instruction} key={instruction.command} />
        ))}
      </div>
    </div>
  );
};

export default DownloadStudySeriesDialog;
