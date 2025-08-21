import React, { useState, useEffect, useCallback } from 'react';
import sessionMap from '../utils/sessionMap';
import {
  getExperimentCustomFormData,
  updateExperimentFormData,
  CustomFormData,
  ParsedCustomForm,
  CustomFormField,
  fetchCustomForms,
} from '../utils/IO/customFormsApi';

interface XNATCustomFormsPanelProps {
  servicesManager: any;
}

const XNATCustomFormsPanel: React.FC<XNATCustomFormsPanelProps> = ({ servicesManager }) => {
  const [customForms, setCustomForms] = useState<ParsedCustomForm[]>([]);
  const [formData, setFormData] = useState<CustomFormData>({});
  const [selectedFormUuid, setSelectedFormUuid] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [editingData, setEditingData] = useState<{ [fieldName: string]: any }>({});
  const [formTemplates, setFormTemplates] = useState<{ [formUuid: string]: string[] }>({});
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [manualExperimentId, setManualExperimentId] = useState<string>('');

  const { uiNotificationService } = servicesManager.services;

  // Get current experiment and project from multiple sources
  const getExperimentId = () => {
    // Try session map first
    const sessionExperimentId = sessionMap.getSession()?.experimentId;
    if (sessionExperimentId) return sessionExperimentId;
    
    // Try URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlExperimentId = urlParams.get('experimentId') || urlParams.get('sessionId');
    if (urlExperimentId) return urlExperimentId;
    
    // Try getting from session map with different methods
    const session = sessionMap.getSession();
    if (session?.experimentId) return session.experimentId;
    if (session?.sessionId) return session.sessionId;
    
    // Try getting from services manager if available
    try {
      const { sessionRouter } = servicesManager.services;
      if (sessionRouter && sessionRouter.experimentId) {
        return sessionRouter.experimentId;
      }
    } catch (e) {
      console.log('Could not get experiment ID from session router');
    }
    
    // Return manual experiment ID if set
    return manualExperimentId || null;
  };

  const getProjectId = () => {
    // Try session map first
    const sessionProjectId = sessionMap.getProject();
    if (sessionProjectId) return sessionProjectId;
    
    // Try URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlProjectId = urlParams.get('projectId');
    if (urlProjectId) return urlProjectId;
    
    return null;
  };

  const experimentId = getExperimentId();
  const projectId = getProjectId();

  // Debug logging
  useEffect(() => {
    console.log('XNAT Custom Forms Panel - Debug Info:', {
      experimentId,
      projectId,
      sessionMap: sessionMap.getSession(),
      urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
    });
  }, [experimentId, projectId]);

  // Load custom forms for the project (form definitions)
  const loadCustomForms = useCallback(async () => {
    if (!projectId) {
      setError('No project selected');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Loading custom forms for project:', projectId);
      const forms = await fetchCustomForms(projectId);
      console.log('Loaded custom forms:', forms);
      setCustomForms(forms);
    } catch (err) {
      console.error('Failed to load custom forms:', err);
      setError('Failed to load custom forms from XNAT');
      uiNotificationService.show({
        title: 'Error',
        message: 'Failed to load custom forms',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, uiNotificationService]);

  // Load form data for the current experiment (form data)
  const loadFormData = useCallback(async () => {
    if (!experimentId) {
      setError('No experiment selected');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Loading form data for experiment:', experimentId);
      const data = await getExperimentCustomFormData(experimentId);
      console.log('Loaded form data:', data);
      setFormData(data);
      
      // Detect form structures from existing data
      const templates = detectFormStructure(data);
      setFormTemplates(templates);
      
      // If we have a selected form, load its data for editing
      if (selectedFormUuid && data[selectedFormUuid]) {
        setEditingData(data[selectedFormUuid]);
      }
    } catch (err) {
      console.error('Failed to load form data:', err);
      setError('Failed to load form data from XNAT');
      uiNotificationService.show({
        title: 'Error',
        message: 'Failed to load form data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [experimentId, selectedFormUuid, uiNotificationService]);

  // Handle form selection
  const handleFormSelect = useCallback((formUuid: string) => {
    setSelectedFormUuid(formUuid);
    
    // Find the selected form definition
    const selectedForm = customForms.find(f => f.uuid === formUuid);
    
    if (formData[formUuid]) {
      // Use existing data
      setEditingData(formData[formUuid]);
    } else if (selectedForm) {
      // Initialize form with field definitions
      const initialData: { [fieldName: string]: any } = {};
      selectedForm.fields.forEach(field => {
        initialData[field.key] = '';
      });
      setEditingData(initialData);
    } else {
      setEditingData({});
    }
  }, [formData, customForms]);

  // Handle field value changes
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setEditingData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  // Add new field to the form
  const handleAddField = useCallback((fieldName: string) => {
    if (fieldName.trim()) {
      setEditingData(prev => ({
        ...prev,
        [fieldName.trim()]: ''
      }));
      setNewFieldName('');
    }
  }, []);

  // Remove field from the form
  const handleRemoveField = useCallback((fieldName: string) => {
    setEditingData(prev => {
      const newData = { ...prev };
      delete newData[fieldName];
      return newData;
    });
  }, []);

  // Auto-detect form structure from existing data and form definitions
  const detectFormStructure = useCallback((formData: CustomFormData) => {
    const templates: { [formUuid: string]: string[] } = {};
    
    // First, get field keys from existing data
    Object.entries(formData).forEach(([formUuid, fields]) => {
      if (fields && typeof fields === 'object') {
        templates[formUuid] = Object.keys(fields);
      }
    });
    
    // Then, add field keys from form definitions
    customForms.forEach(form => {
      if (!templates[form.uuid]) {
        templates[form.uuid] = [];
      }
      form.fields.forEach(field => {
        if (!templates[form.uuid].includes(field.key)) {
          templates[form.uuid].push(field.key);
        }
      });
    });
    
    return templates;
  }, [customForms]);

  // Save form data
  const handleSave = useCallback(async () => {
    if (!experimentId || !selectedFormUuid) {
      setError('No experiment or form selected');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const updatedData = await updateExperimentFormData(
        experimentId,
        selectedFormUuid,
        editingData
      );

      setFormData(updatedData);
      setSuccess('Form data saved successfully');
      
      uiNotificationService.show({
        title: 'Success',
        message: 'Form data saved successfully',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to save form data:', err);
      setError('Failed to save form data');
      uiNotificationService.show({
        title: 'Error',
        message: 'Failed to save form data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [experimentId, selectedFormUuid, editingData, uiNotificationService]);



  // Load data on component mount
  useEffect(() => {
    loadCustomForms();
  }, [loadCustomForms]);

  useEffect(() => {
    if (experimentId) {
      loadFormData();
    }
  }, [experimentId, loadFormData]);

  // Render form field based on field definition and value
  const renderFormField = (fieldName: string, value: any, fieldDef?: CustomFormField) => {
    // Use field definition if available, otherwise fall back to auto-detection
    let fieldType = 'text';
    let fieldOptions: Array<{ label: string; value: string }> = [];
    
    if (fieldDef) {
      fieldType = fieldDef.type;
      if (fieldDef.data?.values) {
        fieldOptions = fieldDef.data.values;
      }
    } else {
      // Auto-detect field type based on field name patterns
      const fieldNameLower = fieldName.toLowerCase();
      if (fieldNameLower.includes('description') || fieldNameLower.includes('notes') || fieldNameLower.includes('comment')) {
        fieldType = 'textarea';
      } else if (fieldNameLower.includes('modality') || fieldNameLower.includes('type') || fieldNameLower.includes('category')) {
        fieldType = 'select';
      } else if (typeof value === 'boolean' || fieldNameLower.includes('flag') || fieldNameLower.includes('enabled')) {
        fieldType = 'checkbox';
      } else if (typeof value === 'number' || fieldNameLower.includes('count') || fieldNameLower.includes('size')) {
        fieldType = 'number';
      }
    }

    // Handle XNAT specific field types
    switch (fieldType) {
      case 'xnatSelect':
        fieldType = 'select';
        break;
      case 'textarea':
        fieldType = 'textarea';
        break;
      case 'textfield':
      case 'text':
        fieldType = 'text';
        break;
      case 'checkbox':
        fieldType = 'checkbox';
        break;
      case 'numberfield':
      case 'number':
        fieldType = 'number';
        break;
    }

    switch (fieldType) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${fieldName}`}
            rows={3}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ced4da', 
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
        );
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ced4da', 
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="">Select {fieldName}</option>
            {/* Use field options if available */}
            {fieldOptions.length > 0 ? (
              fieldOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            ) : (
              // Fallback options based on field name
              <>
                {fieldName.toLowerCase().includes('modality') && (
                  <>
                    <option value="mr">MR</option>
                    <option value="ct">CT</option>
                    <option value="pet">PET</option>
                    <option value="xr">XR</option>
                    <option value="us">US</option>
                  </>
                )}
                {fieldName.toLowerCase().includes('irregularity') && (
                  <>
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                    <option value="2">Emergency</option>
                  </>
                )}
              </>
            )}
          </select>
        );
      case 'checkbox':
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontSize: '14px', color: '#212529' }}>{fieldName}</span>
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${fieldName}`}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ced4da', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${fieldName}`}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ced4da', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        );
    }
  };

  if (!projectId) {
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f8f9fa', 
        minHeight: '200px',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <div style={{ color: '#dc3545', fontSize: '14px', fontWeight: '500' }}>
          No project selected. Please select a project to view custom forms.
        </div>
      </div>
    );
  }

  if (!experimentId) {
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f8f9fa', 
        minHeight: '300px',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <div style={{ color: '#dc3545', fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>
          No experiment selected. Please select an experiment to view custom forms.
        </div>
        
        {/* Manual Experiment ID Input */}
        <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#856404', marginBottom: '8px' }}>Manual Experiment ID Input</h4>
          <p style={{ fontSize: '12px', color: '#856404', marginBottom: '8px' }}>
            If you know the experiment ID, you can enter it manually:
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={manualExperimentId}
              onChange={(e) => setManualExperimentId(e.target.value)}
              placeholder="Enter experiment ID (e.g., XNAT_E00019)"
              style={{ flex: 1, padding: '8px', border: '1px solid #ffc107', borderRadius: '4px', fontSize: '12px' }}
            />
            <button
              onClick={() => {
                if (manualExperimentId.trim()) {
                  // Force re-render by updating state
                  setManualExperimentId(manualExperimentId.trim());
                }
              }}
              disabled={!manualExperimentId.trim()}
              style={{ 
                padding: '8px 12px', 
                backgroundColor: manualExperimentId.trim() ? '#ffc107' : '#6c757d', 
                color: 'white', 
                borderRadius: '4px', 
                fontSize: '12px',
                border: 'none',
                cursor: manualExperimentId.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Load
            </button>
          </div>
        </div>
        
        {/* Debug Information */}
        <div style={{ backgroundColor: '#e9ecef', border: '1px solid #dee2e6', padding: '12px', borderRadius: '4px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Debug Information</h4>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>
            <p><strong>URL Parameters:</strong> {window.location.search}</p>
            <p><strong>Session Map:</strong> {JSON.stringify(sessionMap.getSession(), null, 2)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '16px', 
      backgroundColor: '#ffffff', 
      minHeight: '400px',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#212529' }}>XNAT Custom Forms</h3>
        <div style={{ fontSize: '12px', color: '#6c757d' }}>
          Experiment: {experimentId}
        </div>
      </div>

      {/* API Information */}
      <div style={{ backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#0c5460', marginBottom: '8px' }}>How it works:</h4>
        <div style={{ fontSize: '12px', color: '#0c5460' }}>
          <p style={{ marginBottom: '4px' }}><strong>Step 1:</strong> Load form definitions from <code>/xapi/customforms</code></p>
          <p style={{ marginBottom: '4px' }}><strong>Step 2:</strong> Load form data from <code>/xapi/custom-fields/experiments/{experimentId}/fields</code></p>
          <p style={{ marginBottom: '4px' }}><strong>Project:</strong> {projectId || 'Not detected'}</p>
          <p style={{ marginBottom: '4px' }}><strong>Experiment:</strong> {experimentId || 'Not detected'}</p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          {success}
        </div>
      )}

      {/* Form Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#212529' }}>Select Form</label>
        <select
          value={selectedFormUuid}
          onChange={(e) => handleFormSelect(e.target.value)}
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '8px', 
            border: '1px solid #ced4da', 
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: loading ? '#e9ecef' : '#ffffff'
          }}
        >
          <option value="">Choose a form...</option>
          {customForms.map(form => (
            <option key={form.uuid} value={form.uuid}>
              {form.title} ({form.uuid})
            </option>
          ))}
        </select>
      </div>

      {/* Form Data Display */}
      {selectedFormUuid && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>
              {customForms.find(f => f.uuid === selectedFormUuid)?.title || 'Form Data'}
            </h4>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{ 
                padding: '6px 12px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                borderRadius: '4px', 
                fontSize: '12px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
          {/* Form Fields Editor */}
          <div style={{ marginBottom: '16px' }}>
            <h5 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#212529' }}>Edit Form Data:</h5>
            
            {/* Form Template Info */}
            {formTemplates[selectedFormUuid] && formTemplates[selectedFormUuid].length > 0 && (
              <div style={{ backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
                <h6 style={{ fontSize: '14px', fontWeight: '500', color: '#0c5460', marginBottom: '8px' }}>Form Template Detected:</h6>
                <div style={{ fontSize: '12px', color: '#0c5460' }}>
                  <p style={{ marginBottom: '4px' }}>This form typically contains these fields:</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '4px' }}>
                    {formTemplates[selectedFormUuid].map(fieldName => (
                      <li key={fieldName} style={{ marginBottom: '2px' }}>{fieldName}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {Object.keys(editingData).length === 0 ? (
              <div style={{ color: '#6c757d', fontSize: '12px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                No form data to edit. Use "Create New" to add data.
              </div>
            ) : (
              // Render form using field definitions from the selected form
              (() => {
                const selectedForm = customForms.find(f => f.uuid === selectedFormUuid);
                if (!selectedForm) {
                  return <div style={{ color: '#dc3545', fontSize: '12px', padding: '12px' }}>Form definition not found</div>;
                }

                return selectedForm.fields.map(fieldDef => {
                  const fieldName = fieldDef.key;
                  const value = editingData[fieldName] || '';
                  
                  // Check conditional logic
                  if (fieldDef.conditional) {
                    const conditionalField = fieldDef.conditional.when;
                    const conditionalValue = editingData[conditionalField];
                    const shouldShow = conditionalValue === fieldDef.conditional.eq;
                    
                    if (!shouldShow) {
                      return null; // Don't render this field
                    }
                  }

                  return (
                    <div key={fieldName} style={{ 
                      marginBottom: '12px', 
                      border: '1px solid #dee2e6', 
                      padding: '12px', 
                      borderRadius: '4px',
                      backgroundColor: '#ffffff'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#212529' }}>
                          {fieldDef.label}
                        </label>
                        <button
                          onClick={() => handleRemoveField(fieldName)}
                          style={{ 
                            color: '#dc3545', 
                            fontSize: '12px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px 4px'
                          }}
                          title="Remove field"
                        >
                          ✕
                        </button>
                      </div>
                      {renderFormField(fieldName, value, fieldDef)}
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default XNATCustomFormsPanel; 