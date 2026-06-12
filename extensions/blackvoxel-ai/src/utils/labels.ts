/**
 * labels.ts
 *
 * EN → pt-BR display maps for the AI findings panel (MIMPS-10).
 *
 * The live proxy lane (torchxrayvision DenseNet-121, CXR14-style heads)
 * returns English pathology labels; the viewer is fully pt-BR (MIMPS-03/08),
 * so we translate the common ones and fall back to the raw label for
 * anything unmapped — never hide a finding because we lack a translation.
 */

const LABEL_PT: Record<string, string> = {
  pneumonia: 'Pneumonia',
  effusion: 'Derrame pleural',
  'pleural effusion': 'Derrame pleural',
  atelectasis: 'Atelectasia',
  cardiomegaly: 'Cardiomegalia',
  consolidation: 'Consolidação',
  edema: 'Edema',
  pneumothorax: 'Pneumotórax',
  infiltration: 'Infiltração',
  mass: 'Massa',
  nodule: 'Nódulo',
  'lung opacity': 'Opacidade pulmonar',
};

export function toPtLabel(label: string): string {
  return LABEL_PT[label.trim().toLowerCase()] ?? label;
}

export interface SeverityDisplay {
  /** pt-BR chip text */
  label: string;
  /** chip text color (brand-consistent on dark bg) */
  color: string;
  /** chip background (translucent on dark bg) */
  background: string;
}

const SEVERITY_PT: Record<string, SeverityDisplay> = {
  low: { label: 'Leve', color: '#10B981', background: 'rgba(16, 185, 129, 0.15)' },
  moderate: { label: 'Moderada', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.15)' },
  high: { label: 'Acentuada', color: '#EF4444', background: 'rgba(239, 68, 68, 0.15)' },
};

export function toSeverityDisplay(severity: string): SeverityDisplay {
  return (
    SEVERITY_PT[severity.trim().toLowerCase()] ?? {
      label: severity,
      color: '#A0ADB4',
      background: 'rgba(160, 173, 180, 0.15)',
    }
  );
}
