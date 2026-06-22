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

/**
 * MIMPS-28: anatomy (ChestX-Det segmentation) EN → pt-BR map.
 *
 * Unlike LABEL_PT (pathology, lowercased), these keys are the EXACT English
 * structure keys returned by the seg lane (= `seg_inference.TARGETS`,
 * byte-for-byte incl. spaces and the archaic 'Weasand'). Used by the
 * measurements override dropdown and report subsection (MIMPS-29/30). Raw-key
 * fallback so an unmapped/new structure is never hidden.
 */
export const ANATOMY_PT: Record<string, string> = {
  'Left Clavicle': 'Clavícula esquerda',
  'Right Clavicle': 'Clavícula direita',
  'Left Scapula': 'Escápula esquerda',
  'Right Scapula': 'Escápula direita',
  'Left Lung': 'Campo pulmonar esquerdo',
  'Right Lung': 'Campo pulmonar direito',
  'Left Hilus Pulmonis': 'Hilo pulmonar esquerdo',
  'Right Hilus Pulmonis': 'Hilo pulmonar direito',
  'Heart': 'Coração / silhueta cardíaca',
  'Aorta': 'Aorta',
  'Facies Diaphragmatica': 'Cúpula diafragmática',
  'Mediastinum': 'Mediastino',
  'Weasand': 'Esôfago',
  'Spine': 'Coluna vertebral',
};

export function anatomyToPt(key: string): string {
  return ANATOMY_PT[key] ?? key;
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
