import type { InferenceResponse } from '../services/inferenceClient';

export const STATIC_DEMO_DATA: InferenceResponse = {
  study_uid: 'demo',
  model_version: 'demo-v0.1',
  findings: [
    {
      label: 'Pneumonia',
      confidence: 0.87,
      bounding_box: { x: 120, y: 80, width: 180, height: 200 },
      severity: 'moderate',
    },
  ],
  report_draft: {
    tecnica: 'Radiografia de tórax em PA. Técnica adequada.',
    achados:
      'Opacidade em vidro fosco no lobo inferior direito, sugestiva de processo pneumônico. Seios costofrênicos livres. Área cardíaca nos limites da normalidade.',
    impressao:
      'Pneumonia bacteriana provável no lobo inferior direito. Correlacionar com dados clínicos e laboratoriais. Recomenda-se controle radiográfico após tratamento.',
  },
  inference_time_ms: 0,
  is_mock: true,
};
