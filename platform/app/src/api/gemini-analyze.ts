import axios from 'axios';

// --- Gemini API Key ---
const GEMINI_API_KEY = '';
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable not set');
}

// --- Prompt ---
const prompt = `You are a highly skilled medical imaging expert. Analyze this medical image and provide a detailed report in a consistent JSON format with the following structure:

{
    "summary": "Brief overview of key findings as a single string",
    "anatomical_analysis": {
        "structures": [
            {
                "name": "Name of structure",
                "description": "Detailed description",
                "quality": "Good/Moderate/Poor",
                "spatial_relationship": "Description of position relative to other structures"
            }
        ],
        "quality": "Overall image quality assessment as a string",
        "spatial_relationships": "Overall description of spatial relationships"
    },
    "abnormalities": [
        {
            "finding": "Name of abnormality",
            "characteristics": "Detailed description",
            "location": "Anatomical location",
            "size": "Size description",
            "density": "Density description if applicable",
            "confidence": "High/Medium/Low"
        }
    ],
    "clinical_implications": {
        "potential_diagnoses": [
            "Diagnosis 1",
            "Diagnosis 2"
        ],
        "critical_findings": "Description of urgent/critical findings",
        "further_examination": "Recommendations for additional tests/imaging"
    },
    "technical_quality": {
        "assessment": "Overall technical assessment",
        "limitations": "Description of technical limitations"
    }
}

Important formatting rules:
1. Always return arrays for: structures, abnormalities, and potential_diagnoses
2. Use consistent confidence levels: High, Medium, or Low
3. Use consistent quality levels: Good, Moderate, or Poor
4. All other fields should be descriptive strings
5. Maintain professional medical terminology while ensuring clarity
6. Include specific measurements and locations when visible
7. Note any limitations in assessment due to image quality

Analyze the image comprehensively, considering:
- Visible anatomical structures and their relationships
- Any abnormalities or pathological changes
- Technical quality and limitations
- Clinical significance and recommendations
`;

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { image_base64 } = req.body;
    if (!image_base64) {
      res.status(400).json({ error: 'Missing image_base64' });
      return;
    }

    // Prepare Gemini REST API payload
    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/png',
                data: image_base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    // Call Gemini REST API
    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    // Extract and parse the model's response
    const candidates = response.data?.candidates;
    const text = candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      res.status(500).json({ error: 'No response from Gemini' });
      return;
    }
    let json;
    try {
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();
      json = JSON.parse(cleaned);
    } catch (e) {
      res
        .status(500)
        .json({ error: 'Invalid JSON from Gemini', details: e instanceof Error ? e.message : e });
      return;
    }
    // Minimal structure check
    if (
      !json.summary ||
      !json.anatomical_analysis ||
      !json.abnormalities ||
      !json.clinical_implications ||
      !json.technical_quality
    ) {
      res.status(500).json({ error: 'Response missing required fields', json });
      return;
    }
    res.status(200).json(json);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
}
