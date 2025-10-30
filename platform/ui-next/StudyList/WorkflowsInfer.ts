export const DEFAULT_WORKFLOW_OPTIONS = ['Basic Viewer', 'Segmentation'] as const;
export const EXTENDED_WORKFLOW_OPTIONS = ['TMTV Workflow', 'US Workflow', 'Preclinical 4D'] as const;

/** All workflow options that the UI supports. */
export const ALL_WORKFLOW_OPTIONS = [
  ...DEFAULT_WORKFLOW_OPTIONS,
  ...EXTENDED_WORKFLOW_OPTIONS,
] as const;

/** Union type of valid workflow identifiers. */
export type WorkflowId = (typeof ALL_WORKFLOW_OPTIONS)[number];

/**
 * Infers available workflows from row data (explicit list or modality heuristics).
 * Only returns values that are part of ALL_WORKFLOW_OPTIONS to avoid drift.
 */
export function getAvailableWorkflows(
  input: { workflows?: readonly (string | WorkflowId)[]; modalities?: string } | null
): WorkflowId[] {
  const all = new Set<string>(ALL_WORKFLOW_OPTIONS as readonly string[]);

  if (!input) {
    return [...DEFAULT_WORKFLOW_OPTIONS] as WorkflowId[];
  }

  const { workflows, modalities } = input;

  // If row specifies workflows, filter them to the known set
  if (Array.isArray(workflows) && workflows.length > 0) {
    const filtered = workflows.map(String).filter(w => all.has(w));
    return Array.from(new Set(filtered)) as WorkflowId[];
  }

  // Otherwise, infer from modalities
  const mod = String(modalities ?? '').toUpperCase();
  const flows: string[] = [...DEFAULT_WORKFLOW_OPTIONS];

  if (mod.includes('US')) flows.push('US Workflow');
  if (mod.includes('PET/CT') || (mod.includes('PET') && mod.includes('CT'))) {
    flows.push('TMTV Workflow');
  }

  const filtered = flows.filter(w => all.has(w));
  return Array.from(new Set(filtered)) as WorkflowId[];
}