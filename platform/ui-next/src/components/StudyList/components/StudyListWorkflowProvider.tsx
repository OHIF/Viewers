import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import type { StudyRow } from '../types/StudyListTypes';
import { useDefaultWorkflow } from '../hooks/useDefaultWorkflow';

/**
 * Represents a workflow that can be launched from the study list.
 * Each workflow corresponds to a mode from appConfig.loadedModes.
 */
export interface StudyListWorkflow {
  /** Unique identifier for the workflow (from mode.id) */
  readonly id: string;
  /** Display name of the workflow (from mode.displayName) */
  readonly displayName: string;
  /** Launches the study using this workflow's route */
  launchWithStudy: (studyRow: StudyRow) => void;
  /** Determines if this workflow is applicable to the given study */
  isApplicableToStudy: (studyRow: StudyRow) => boolean;
  /** Whether this workflow is the default workflow */
  readonly isDefault: boolean;
}

export type StudyListWorkflowContextValue = {
  /** All available workflows */
  workflows: readonly StudyListWorkflow[];
  /** Get workflows that are applicable to a specific study */
  getWorkflowsForStudy: (studyRow: StudyRow) => StudyListWorkflow[];
  /** Get the default workflow for a study (only if it's applicable) */
  getDefaultWorkflowForStudy: (studyRow: StudyRow) => StudyListWorkflow | undefined;
  /** The current default workflow mode ID */
  defaultWorkflowId: string | undefined;
  /** Set the default workflow ID */
  setDefaultWorkflowId: (workflowId?: string) => void;
};

const StudyListWorkflowContext = React.createContext<StudyListWorkflowContextValue | undefined>(
  undefined
);

type Mode = {
  id: string;
  routeName: string;
  displayName: string;
  hide?: boolean;
  isValidMode?: (args: { modalities: string; study: unknown }) => {
    valid: boolean | null;
    description?: string;
  };
};

type StudyListWorkflowProviderProps = {
  /** Array of loaded modes from appConfig */
  loadedModes: Mode[];
  /** Optional data path prefix for routes (e.g., '/dicomweb') */
  dataPath?: string;
  /** Function to preserve query parameters when launching workflows */
  preserveQueryParameters: (query: URLSearchParams) => void;
  children: React.ReactNode;
};

/**
 * Provider that creates workflows from loaded modes and provides them via context.
 * Each workflow can launch studies and determine applicability based on mode validation.
 */
export function StudyListWorkflowProvider({
  loadedModes,
  dataPath,
  preserveQueryParameters,
  children,
}: StudyListWorkflowProviderProps) {
  const navigate = useNavigate();

  // Get valid workflow IDs from loaded modes (for validation)
  const validWorkflowIds = React.useMemo(() => {
    return loadedModes.filter(m => !m.hide && m.displayName).map(m => m.id);
  }, [loadedModes]);

  // Use localStorage-backed hook for persistence
  const [storedDefaultWorkflowId, setStoredDefaultWorkflowId] = useDefaultWorkflow(
    'studylist.defaultWorkflow',
    validWorkflowIds
  );

  // Convert null to undefined for consistency with context type
  const defaultWorkflowId = storedDefaultWorkflowId ?? undefined;

  // Wrapper that persists to localStorage
  const setDefaultWorkflowId = React.useCallback(
    (workflowId?: string) => {
      setStoredDefaultWorkflowId(workflowId ?? null);
    },
    [setStoredDefaultWorkflowId]
  );

  const workflows = React.useMemo(() => {
    const workflowList: StudyListWorkflow[] = [];

    for (const mode of loadedModes) {
      // Filter out hidden modes
      if (mode.hide) {
        continue;
      }

      // Skip modes without displayName
      if (!mode.displayName) {
        continue;
      }

      const isDefault = mode.id === defaultWorkflowId;

      const workflow: StudyListWorkflow = {
        get id() {
          return mode.id;
        },
        get displayName() {
          return mode.displayName;
        },
        launchWithStudy: (studyRow: StudyRow) => {
          if (!studyRow.studyInstanceUid) {
            console.warn('Cannot launch workflow: study has no studyInstanceUid');
            return;
          }

          const query = new URLSearchParams();
          query.append('StudyInstanceUIDs', studyRow.studyInstanceUid);
          preserveQueryParameters(query);

          const route = `${mode.routeName}${dataPath || ''}?${query.toString()}`;
          navigate(route);
        },
        isApplicableToStudy: (studyRow: StudyRow) => {
          if (!mode.isValidMode) {
            // If no validation function, assume applicable
            return true;
          }

          const modalitiesToCheck = String(studyRow.modalities ?? '').replaceAll('/', '\\');
          const result = mode.isValidMode({
            modalities: modalitiesToCheck,
            study: studyRow,
          });

          // Return true only if valid is explicitly true
          // null means hide (not applicable), false means disabled but visible
          return result.valid === true;
        },
        get isDefault() {
          return isDefault;
        },
      };

      workflowList.push(workflow);
    }

    return workflowList;
  }, [loadedModes, defaultWorkflowId, dataPath, navigate, preserveQueryParameters]);

  const getWorkflowsForStudy = React.useCallback(
    (studyRow: StudyRow): StudyListWorkflow[] => {
      return workflows.filter(workflow => workflow.isApplicableToStudy(studyRow));
    },
    [workflows]
  );

  const getDefaultWorkflowForStudy = React.useCallback(
    (studyRow: StudyRow): StudyListWorkflow | undefined => {
      const applicableWorkflows = getWorkflowsForStudy(studyRow);
      return applicableWorkflows.find(workflow => workflow.isDefault);
    },
    [getWorkflowsForStudy]
  );

  const value: StudyListWorkflowContextValue = React.useMemo(
    () => ({
      workflows,
      getWorkflowsForStudy,
      getDefaultWorkflowForStudy,
      defaultWorkflowId,
      setDefaultWorkflowId,
    }),
    [
      workflows,
      getWorkflowsForStudy,
      getDefaultWorkflowForStudy,
      defaultWorkflowId,
      setDefaultWorkflowId,
    ]
  );

  return (
    <StudyListWorkflowContext.Provider value={value}>{children}</StudyListWorkflowContext.Provider>
  );
}

/**
 * Hook to access the study list workflow context.
 * Must be used within a StudyListWorkflowProvider.
 */
export function useStudyListWorkflows(): StudyListWorkflowContextValue {
  const ctx = React.useContext(StudyListWorkflowContext);
  if (!ctx) {
    throw new Error('useStudyListWorkflows must be used within <StudyListWorkflowProvider>');
  }
  return ctx;
}
