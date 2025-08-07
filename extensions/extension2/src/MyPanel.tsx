
// import React, { useState } from 'react';
import { Typography } from '@ohif/ui';
import React, { useEffect, useState } from 'react';
// import { Typography } from '@ohif/ui';

type Props = {
  servicesManager: any;
};

const SEGMENTATION_SCOPES = [
  'whole_body',
  'liver_segments',
  'liver_vessels',
  'kidney_cysts',
  'cerebral_bleed',
  'headneck_bones_vessels',
  'lung_vessels',
];

const ALL_LABELS = [
  'spleen', 'kidney_right', 'kidney_left', 'gallbladder', 'liver', 'stomach', 'pancreas',
  'adrenal_gland_right', 'adrenal_gland_left', 'lung_upper_lobe_left', 'lung_lower_lobe_left',
  'lung_upper_lobe_right', 'lung_middle_lobe_right', 'lung_lower_lobe_right', 'esophagus',
  'trachea', 'thyroid_gland', 'small_bowel', 'duodenum', 'colon', 'urinary_bladder',
  'prostate', 'kidney_cyst_left', 'kidney_cyst_right', 'sacrum', 'vertebrae_S1', 'vertebrae_L5',
  'vertebrae_L4', 'vertebrae_L3', 'vertebrae_L2', 'vertebrae_L1', 'vertebrae_T12', 'vertebrae_T11',
  'vertebrae_T10', 'vertebrae_T9', 'vertebrae_T8', 'vertebrae_T7', 'vertebrae_T6', 'vertebrae_T5',
  'vertebrae_T4', 'vertebrae_T3', 'vertebrae_T2', 'vertebrae_T1', 'vertebrae_C7', 'vertebrae_C6',
  'vertebrae_C5', 'vertebrae_C4', 'vertebrae_C3', 'vertebrae_C2', 'vertebrae_C1', 'heart', 'aorta',
  'pulmonary_vein', 'brachiocephalic_trunk', 'subclavian_artery_right', 'subclavian_artery_left',
  'common_carotid_artery_right', 'common_carotid_artery_left', 'brachiocephalic_vein_left',
  'brachiocephalic_vein_right', 'atrial_appendage_left', 'superior_vena_cava', 'inferior_vena_cava',
  'portal_vein_and_splenic_vein', 'iliac_artery_left', 'iliac_artery_right', 'iliac_vena_left',
  'iliac_vena_right', 'humerus_left', 'humerus_right', 'scapula_left', 'scapula_right',
  'clavicula_left', 'clavicula_right', 'femur_left', 'femur_right', 'hip_left', 'hip_right',
  'spinal_cord', 'gluteus_maximus_left', 'gluteus_maximus_right', 'gluteus_medius_left',
  'gluteus_medius_right', 'gluteus_minimus_left', 'gluteus_minimus_right', 'autochthon_left',
  'autochthon_right', 'iliopsoas_left', 'iliopsoas_right', 'brain', 'skull', 'rib_left_1',
  'rib_left_2', 'rib_left_3', 'rib_left_4', 'rib_left_5', 'rib_left_6', 'rib_left_7', 'rib_left_8',
  'rib_left_9', 'rib_left_10', 'rib_left_11', 'rib_left_12', 'rib_right_1', 'rib_right_2',
  'rib_right_3', 'rib_right_4', 'rib_right_5', 'rib_right_6', 'rib_right_7', 'rib_right_8',
  'rib_right_9', 'rib_right_10', 'rib_right_11', 'rib_right_12', 'sternum', 'costal_cartilages'
];

const LOCAL_API = 'http://localhost:8500';
const ORTHANC_API =`/pacs`;
;


const POLL_INTERVAL_MS = 10000;


const MyPanel = ({ servicesManager }) => {
  const [selectedScope, setScope] = useState('');
  const [organs, setOrgans] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [segmentationDone, setSegmentationDone] = useState(false);

  const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    servicesManager.services?.UINotificationService?.show({
      title: 'AI Segmentation',
      message,
      type,
    });
    console.log(`[${type.toUpperCase()}] ${message}`);
    setStatus(message);
    setTimeout(() => setStatus(''), 5000);
  };

  const displayOverlays = async () => {
    const { studiesManager, displaySetService, viewportGridService } = servicesManager.services;
    const activeStudyUID = displaySetService?.getActiveDisplaySets?.()?.[0]?.StudyInstanceUID;
    if (!activeStudyUID) return;

    await studiesManager?.reloadStudyMetadata(activeStudyUID);
    const allSets = studiesManager?.getDisplaySets(activeStudyUID) || [];
    const overlays = allSets.filter(ds => ['SEG', 'RTSTRUCT'].includes(ds.Modality));

    if (overlays.length) {
      const activeViewportIndex = viewportGridService.getState().activeViewportIndex;
      overlays.forEach((overlay, i) => {
        viewportGridService.setDisplaySetsForViewport({
          viewportIndex: activeViewportIndex + i + 1,
          displaySetInstanceUIDs: [overlay.displaySetInstanceUID],
        });
      });
      showMessage('🩻 Overlays automatically displayed.', 'success');
    }
  };

  const handleSegment = async () => {
    if (!selectedScope || (selectedScope === 'whole_body' && organs.length === 0)) {
      alert('Please select a scope and at least one organ.');
      return;
    }

    const displaySets = servicesManager?.services?.displaySetService?.getActiveDisplaySets?.();
    const studyUID = displaySets?.[0]?.StudyInstanceUID;
    const seriesUID = displaySets?.[0]?.SeriesInstanceUID;
    if (!studyUID || !seriesUID) {
      showMessage('❌ StudyInstanceUID or SeriesInstanceUID not found', 'error');
      return;
    }

    setSegmentationDone(false);
    setLoading(true);
    setStatus('');
    showMessage('🔍 Preparing segmentation...');

    try {
      const formData = new FormData();
      formData.append('studyUID', studyUID);
      formData.append('seriesUID', seriesUID);
      formData.append('scope', selectedScope);
      formData.append('organs', organs.join(','));

      showMessage('📡 Sending to Bio-Grid Server...');
      const res = await fetch(`${LOCAL_API}/segment`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Segmentation failed (${res.status}): ${errorText}`);
      }

      const result = await res.json();
      showMessage(`✅ Segmentation complete: ${result.filename || 'Done'}`, 'success');
      setSegmentationDone(true);

      // ✅ Force reload to show new SEG/RTSTRUCT immediately
      // setTimeout(() => window.location.reload(), 1000);  // short delay for UX
      
    } catch (error) {
      console.error(error);
      showMessage(`❌ Segmentation Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(displayOverlays, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full bg-black-light text-primary-light p-4 overflow-y-auto">
      <div className="flex flex-col items-center mb-4">
        <Typography variant="h4" className="text-center">
          Bio-Grid Segmentation Panel
        </Typography>
      </div>

      <Typography variant="caption" className="text-green-500 mb-4 block text-center">
        Select a segmentation scope and run segmentation.
      </Typography>

      <div className="mb-4">
        <label className="block text-white mb-1">Segmentation Scope</label>
        <select
          className="w-full px-3 py-2 bg-black border border-gray-600 text-white rounded"
          value={selectedScope}
          onChange={e => {
            setScope(e.target.value);
            setOrgans([]);
          }}
        >
          <option value="">-- Select Scope --</option>
          {SEGMENTATION_SCOPES.map(scope => (
            <option key={scope} value={scope}>
              {scope.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {selectedScope === 'whole_body' && (
        <div className="mt-4">
          <Typography variant="subtitle" className="mb-2">
            Organs to Segment
          </Typography>
          <div className="max-h-64 overflow-y-auto border border-primary-dark rounded p-2 space-y-1 bg-black">
            {ALL_LABELS.map(label => {
              const isChecked = organs.includes(label);
              return (
                <label
                  key={label}
                  className="flex items-center text-white text-sm hover:bg-primary-dark px-2 py-1 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() =>
                      setOrgans(prev =>
                        isChecked ? prev.filter(o => o !== label) : [...prev, label]
                      )
                    }
                    className="mr-2 accent-blue-500"
                  />
                  {label.replace(/_/g, ' ').toUpperCase()}
                </label>
              );
            })}
          </div>
          <div
            onClick={() => setOrgans([...ALL_LABELS])}
            className="mt-2 border border-blue-400 text-center text-blue-300 py-2 px-4 rounded cursor-pointer hover:bg-blue-900"
          >
            Select All Organs
          </div>
        </div>
      )}

      <div
        className={`mt-4 text-center py-2 px-4 rounded cursor-pointer ${
          loading
            ? 'bg-gray-500 text-white'
            : 'border border-green-500 text-green-400 hover:bg-green-900'
        }`}
        onClick={!loading ? handleSegment : undefined}
      >
        {loading ? 'Running...' : 'Run Segmentation'}
      </div>

      {status && <p className="mt-4 text-sm text-yellow-400">{status}</p>}

     {/* {segmentationDone && (
        <div className="mt-6">
          <button
            onClick={() => {
              const displaySetService = servicesManager.services?.displaySetService;
              const activeStudyUID = displaySetService?.getActiveDisplaySets?.()?.[0]?.StudyInstanceUID;
              // const patientID = displaySetService?.getStudyMetadata(activeStudyUID)?.PatientID;
              // const encodedPatientID = encodeURIComponent(patientID || '');
              window.location.href = `/segmentation?StudyInstanceUIDs=${StudyInstaceUID}`;
            }}
            className="block w-full border border-blue-500 text-blue-400 py-2 rounded hover:bg-blue-800 text-sm"
          >
            🧬 Open in Segmentation Mode
          </button>
        </div>
      )} */}

      {segmentationDone && (
        <div className="mt-6">
          <button
            onClick={() => {
              const studyUID =
                servicesManager.services?.displaySetService?.getActiveDisplaySets?.()?.[0]
                  ?.StudyInstanceUID ||
                window?.location?.search
                  ?.match(/StudyInstanceUIDs=([^&]*)/)?.[1];

              if (studyUID) {
                window.location.href = `/segmentation?StudyInstanceUIDs=${studyUID}`;
              } else {
                alert("❌ Could not determine StudyInstanceUID");
                console.error("No StudyInstanceUID found");
              }
            }}
            className="block w-full border border-blue-500 text-blue-400 py-2 rounded hover:bg-blue-800 text-sm"
          >
            🧬 Open in Segmentation Mode
          </button>
        </div>
      )}
    </div>
  );
};

export default MyPanel;

