export function getAvailableWorkflows(input: { workflows?: string[]; modalities?: string } | null) {
  const defaults = ['Basic Viewer', 'Segmentation'];
  if (!input) return defaults;
  const { workflows, modalities } = input;
  if (Array.isArray(workflows) && workflows.length > 0) {
    return Array.from(new Set(workflows));
  }
  const mod = String(modalities ?? '').toUpperCase();
  const flows = [...defaults];
  if (mod.includes('US')) flows.push('US Workflow');
  if (mod.includes('PET/CT') || (mod.includes('PET') && mod.includes('CT'))) flows.push('TMTV Workflow');
  return Array.from(new Set(flows));
}