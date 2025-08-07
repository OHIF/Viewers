import { Typography } from '@ohif/ui';
import React, { useEffect, useState } from 'react';

const CustomPanel = ({ servicesManager }) => {
  const [studyInstanceUID, setStudyInstanceUID] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const { studyMetadataService } = servicesManager.services;
    const studies = studyMetadataService?.getStudies?.() || [];

    if (studies.length > 0) {
      setStudyInstanceUID(studies[0].StudyInstanceUID);
    }
  }, [servicesManager]);

  const handlePrediction = async () => {
    if (!studyInstanceUID) {
      alert('StudyInstanceUID not found');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studyInstanceUID }),
      });

      if (!response.ok) throw new Error('Prediction failed');

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert('Prediction failed. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <Typography variant="h5">Predict Panel</Typography>
      <Typography variant="body1" paragraph>
        This panel will be used to trigger AI predictions.
      </Typography>

      <button
        style={{
          padding: '10px 16px',
          backgroundColor: '#3f51b5',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '1rem',
        }}
        onClick={handlePrediction}
        disabled={loading}
      >
        {loading ? 'Running Prediction...' : 'Run Prediction'}
      </button>

      {result && (
        <div>
          <Typography variant="body2">
            Prediction result: {JSON.stringify(result)}
          </Typography>
        </div>
      )}
    </div>
  );
};

export default CustomPanel;
