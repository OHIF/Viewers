/**
 * PreviewPatientSummary — compound component for patient header + workflow actions
 *
 * What it is
 * - A compact summary API composed under a root provider: Patient and Workflows.
 * - Subcomponents read the current study row from context.
 *
 * Minimal usage
 *   <PreviewPatientSummary data={row}>
 *     <PreviewPatientSummary.Patient />
 *     <PreviewPatientSummary.Workflows />
 *   </PreviewPatientSummary>
 *
 * Default workflow behavior
 * - Workflows uses WorkflowsProvider context for available workflows and the default selection.
 * - Shows the default workflow as a badge (with a clear-X) and the remaining applicable
 *   workflows as buttons below.
 *
 * Helpful references
 * - platform/ui-next/src/components/StudyList/components/PreviewContent.tsx (in-context example, including empty state handling)
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Cross2Icon } from '@radix-ui/react-icons';
import { cn } from '../../../lib/utils';
import { Icons } from '../../Icons/Icons';
import { Button } from '../../Button';
import type { StudyRow } from '../types/types';
import { useWorkflows } from './WorkflowsProvider';

type SummaryContextValue = {
  data: StudyRow | null;
};

const SummaryContext = React.createContext<SummaryContextValue | null>(null);

function useSummaryContext(): SummaryContextValue {
  const context = React.useContext(SummaryContext);
  if (!context) {
    throw new Error(
      'PreviewPatientSummary.* components must be used within <PreviewPatientSummary>'
    );
  }
  return context;
}

type RootProps = {
  data?: StudyRow | null;
  className?: string;
  children?: React.ReactNode;
};

function Root({ data: dataProp, className, children }: RootProps) {
  const data = dataProp ?? null;
  const value = React.useMemo<SummaryContextValue>(() => ({ data }), [data]);

  return (
    <SummaryContext.Provider value={value}>
      <div className={cn('flex w-full flex-col gap-1', className)}>{children}</div>
    </SummaryContext.Provider>
  );
}

function Patient({ className }: { className?: string } = {}) {
  const { t } = useTranslation('StudyList');
  const { data } = useSummaryContext();
  const patientName = data?.patientName;
  const mrn = data?.mrn;

  const nameContent = patientName ?? t('Select a study');
  const nameTitle =
    typeof patientName === 'string' || typeof patientName === 'number'
      ? String(patientName)
      : undefined;

  const showMrn = mrn !== null && mrn !== undefined && mrn !== '';
  const mrnTitle = typeof mrn === 'string' || typeof mrn === 'number' ? String(mrn) : undefined;

  return (
    <div className={cn('bg-muted flex items-center gap-3 rounded-lg px-4 py-3', className)}>
      <div
        className="text-primary shrink-0"
        aria-hidden
        style={{ width: 33, height: 33 }}
      >
        <Icons.PatientStudyList />
      </div>
      <div className="flex h-[38px] min-w-0 flex-col justify-center gap-px">
        <span
          className="text-foreground truncate text-lg font-medium leading-tight"
          title={nameTitle}
        >
          {nameContent}
        </span>
        {showMrn && (
          <span
            className="text-muted-foreground truncate text-lg leading-tight"
            title={mrnTitle}
          >
            {mrn}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Workflows panel.
 *
 * - Must be used inside `<PreviewPatientSummary>` to read the current study from context.
 * - Must be used inside `<WorkflowsProvider>` to access workflow context.
 * - Shows the default workflow badge (with a clear-X) when one is set, and renders the
 *   remaining applicable workflows as buttons below.
 */
function Workflows({ className }: { className?: string } = {}) {
  const { t } = useTranslation('StudyList');
  const { data: studyRow } = useSummaryContext();
  const { workflows, getWorkflowsForStudy, getDefaultWorkflowForStudy, setDefaultWorkflowId } =
    useWorkflows();

  const availableWorkflows = React.useMemo(() => {
    if (studyRow) {
      return getWorkflowsForStudy(studyRow);
    }
    return workflows;
  }, [studyRow, workflows, getWorkflowsForStudy]);

  const defaultWorkflow = React.useMemo(() => {
    if (studyRow) {
      return getDefaultWorkflowForStudy(studyRow);
    }
    return workflows.find(w => w.isDefault);
  }, [studyRow, workflows, getDefaultWorkflowForStudy]);

  const otherWorkflows = React.useMemo(() => {
    if (!defaultWorkflow) {
      return availableWorkflows;
    }
    return availableWorkflows.filter(w => w.displayName !== defaultWorkflow.displayName);
  }, [availableWorkflows, defaultWorkflow]);

  const handleLaunch = (displayName: string) => {
    if (!studyRow) {
      return;
    }
    const wf = availableWorkflows.find(w => w.displayName === displayName);
    wf?.launchWithStudy(studyRow);
  };

  const handleClearDefault = () => {
    setDefaultWorkflowId();
  };

  return (
    <div
      className={cn(
        'border-border/50 bg-muted w-full rounded-lg px-4 py-3 text-left transition',
        className
      )}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-foreground text-base font-medium leading-tight">
          {t('Launch workflow')}
        </span>
        <span
          className="text-primary shrink-0 -translate-y-0.5"
          aria-hidden
          style={{ width: 18, height: 18 }}
        >
          <Icons.Info />
        </span>
      </div>

      {defaultWorkflow && (
        <div
          className="mt-2 flex flex-wrap items-center gap-0"
          role="status"
          aria-live="polite"
        >
          <Button
            variant="ghost"
            size="sm"
            className="bg-primary/20 text-primary ring-primary ring-offset-background ml-1 mb-1 h-6 w-32 overflow-hidden ring-1 ring-offset-2"
            onClick={() => handleLaunch(defaultWorkflow.displayName)}
            title={defaultWorkflow.displayName}
          >
            <span className="truncate">{defaultWorkflow.displayName}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear default mode"
            className="text-primary focus-visible:ring-ring focus-visible:ring-offset-background ml-1.5 mb-1 opacity-70 transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2"
            onClick={handleClearDefault}
          >
            <Cross2Icon
              className="text-primary h-3.5 w-3.5"
              aria-hidden
            />
            <span className="sr-only">Clear default mode</span>
          </Button>
        </div>
      )}

      {defaultWorkflow && studyRow && otherWorkflows.length > 0 && (
        <div className="text-muted-foreground mt-2 text-sm">{t('Other Available Workflows')}</div>
      )}

      {studyRow && otherWorkflows.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-0">
          {otherWorkflows.map(wf => (
            <Button
              key={wf.displayName}
              variant="ghost"
              size="sm"
              className="bg-primary/20 ml-1 mb-1 h-6 w-32 overflow-hidden"
              onClick={() => handleLaunch(wf.displayName)}
              title={wf.displayName}
            >
              <span className="truncate">{wf.displayName}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

type PreviewPatientSummaryNamespace = typeof Root & {
  Patient: typeof Patient;
  Workflows: typeof Workflows;
};

export const PreviewPatientSummary: PreviewPatientSummaryNamespace = Object.assign(Root, {
  Patient,
  Workflows,
});
