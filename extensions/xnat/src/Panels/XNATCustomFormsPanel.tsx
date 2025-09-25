import React, { useState, useEffect, useCallback } from 'react';
import { PanelSection, Icons } from '@ohif/ui-next';
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

  const getSubjectId = () => {
    // Try session map first
    const sessionSubjectId = sessionMap.getSubject();
    if (sessionSubjectId) return sessionSubjectId;
    
    return null;
  };

  const experimentId = getExperimentId();
  const projectId = getProjectId();
  const subjectId = getSubjectId();

  // Debug logging
  useEffect(() => {
    console.log('XNAT Custom Forms Panel - Debug Info:', {
      experimentId,
      projectId,
      subjectId,
      sessionMap: sessionMap.getSession(),
      urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
    });
  }, [experimentId, projectId, subjectId]);

  // Load custom forms for the project (form definitions)
  const loadCustomForms = useCallback(async () => {
    if (!projectId || !subjectId) {
      setError('No project selected');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Loading custom forms for project:', projectId, subjectId, experimentId || 'Not detected');
      const forms = await fetchCustomForms(projectId);
      console.log('Loaded custom forms:', forms);
      setCustomForms(forms);
      
      // Automatically select the first form if available
      if (forms.length > 0) {
        const firstFormUuid = forms[0].uuid;
        setSelectedFormUuid(firstFormUuid);
        console.log('Auto-selected first form:', firstFormUuid);
      }
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
  }, [projectId, subjectId, experimentId, uiNotificationService]);

  // Load form data for the current experiment (form data)
  const loadFormData = useCallback(async () => {
    if (!experimentId || !subjectId || !projectId) {
      setError('No experiment selected');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Loading form data for experiment:', experimentId, subjectId, projectId);
      const data = await getExperimentCustomFormData(experimentId);
      console.log('Loaded form data:', data);
      setFormData(data);
      
      // Detect form structures from existing data
      const templates = detectFormStructure(data);
      setFormTemplates(templates);
      
      // If we have a selected form, load its data for editing
      if (selectedFormUuid) {
        if (data[selectedFormUuid]) {
          // Use existing data
          setEditingData(data[selectedFormUuid]);
        } else {
          // Initialize form with field definitions from the selected form
          const selectedForm = customForms.find(f => f.uuid === selectedFormUuid);
          if (selectedForm) {
            const initialData: { [fieldName: string]: any } = {};
            selectedForm.fields.forEach(field => {
              initialData[field.key] = '';
            });
            setEditingData(initialData);
          }
        }
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

  // Load form data when a form is auto-selected
  useEffect(() => {
    if (selectedFormUuid && experimentId && customForms.length > 0) {
      // Trigger form data loading when a form is selected
      loadFormData();
    }
  }, [selectedFormUuid, experimentId, customForms.length, loadFormData]);

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
            className="w-full p-2 border border-input rounded text-sm bg-background text-foreground font-inherit"
          />
        );
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="w-full p-2 border border-input rounded text-sm bg-background text-foreground"
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
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">{fieldName}</span>
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${fieldName}`}
            className="w-full p-2 border border-input rounded text-sm bg-background text-foreground"
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${fieldName}`}
            className="w-full p-2 border border-input rounded text-sm bg-background text-foreground"
          />
        );
    }
  };

  if (!projectId) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden p-4">
        <PanelSection>
          <PanelSection.Header className="text-destructive">No Project Selected</PanelSection.Header>
          <PanelSection.Content>
            <div className="text-destructive text-sm">
              No project selected. Please select a project to view custom forms.
            </div>
          </PanelSection.Content>
        </PanelSection>
      </div>
    );
  }

  if (!experimentId) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-4">
        <PanelSection>
          <PanelSection.Header className="text-destructive">No Experiment Selected</PanelSection.Header>
          <PanelSection.Content>
            <div className="text-destructive text-sm">
              No experiment selected. Please select an experiment to view custom forms.
            </div>
          </PanelSection.Content>
        </PanelSection>
        
        {/* Manual Experiment ID Input */}
        <PanelSection>
          <PanelSection.Header>Manual Experiment ID Input</PanelSection.Header>
          <PanelSection.Content>
            <div className="text-sm space-y-3">
              <p>If you know the experiment ID, you can enter it manually:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualExperimentId}
                  onChange={(e) => setManualExperimentId(e.target.value)}
                  placeholder="Enter experiment ID (e.g., XNAT_E00019)"
                  className="flex-1 p-2 border border-input rounded text-sm bg-background text-foreground"
                />
                <button
                  onClick={() => {
                    if (manualExperimentId.trim()) {
                      // Force re-render by updating state
                      setManualExperimentId(manualExperimentId.trim());
                    }
                  }}
                  disabled={!manualExperimentId.trim()}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm border-none cursor-pointer disabled:bg-muted disabled:cursor-not-allowed"
                >
                  Load
                </button>
              </div>
            </div>
          </PanelSection.Content>
        </PanelSection>
        
        {/* Debug Information */}
        <PanelSection>
          <PanelSection.Header>Debug Information</PanelSection.Header>
          <PanelSection.Content>
            <div className="text-sm space-y-2">
              <p><strong>URL Parameters:</strong> {window.location.search}</p>
              <p><strong>Session Map:</strong> {JSON.stringify(sessionMap.getSession(), null, 2)}</p>
            </div>
          </PanelSection.Content>
        </PanelSection>
      </div>
    );
  }

    return (
    <div className="h-full overflow-y-auto overflow-x-hidden space-y-4 p-4">
      {/* API Information */}
      <PanelSection>
        <PanelSection.Header>
          <div className="flex items-center space-x-2 text-aqua-pale">
            <Icons.Clipboard className="w-4 h-4" />
            <span>Scan Information</span>
          </div>
        </PanelSection.Header>
        <PanelSection.Content>
          <div className="text-sm space-y-2 text-aqua-pale">
            
            <p><strong>Project:</strong> {projectId || 'Not detected'}</p>
            <p><strong>Project:</strong> {subjectId || 'Not detected'}</p>
            <p><strong>Experiment:</strong> {experimentId || 'Not detected'}</p>
          </div>
        </PanelSection.Content>
      </PanelSection>

      {error && (
        <PanelSection>
          <PanelSection.Header className="text-destructive">Error</PanelSection.Header>
          <PanelSection.Content>
            <div className="text-destructive text-sm">{error}</div>
          </PanelSection.Content>
        </PanelSection>
      )}

      {success && (
        <PanelSection>
          <PanelSection.Header className="text-green-500">Success</PanelSection.Header>
          <PanelSection.Content>
            <div className="text-green-500 text-sm">{success}</div>
          </PanelSection.Content>
        </PanelSection>
      )}
      {/* Form Data Display */}
      {selectedFormUuid && (
        <PanelSection>
          <PanelSection.Header>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <Icons.Clipboard className="w-4 h-4" />
                <span>{customForms.find(f => f.uuid === selectedFormUuid)?.title || 'Form Data'}</span>
              </div>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs border-none cursor-pointer disabled:bg-muted disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </PanelSection.Header>
          <PanelSection.Content>
            <div className="space-y-4">
          {/* Form Fields Editor */}
          <div className="mb-4">
            <h5 className="text-sm font-medium mb-3 text-foreground flex items-center space-x-2">
              <Icons.Clipboard className="w-4 h-4" />
              <span>Edit Form Data:</span>
            </h5>
            
            {/* Form Template Info */}
            {formTemplates[selectedFormUuid] && formTemplates[selectedFormUuid].length > 0 && (
              <PanelSection>
                <PanelSection.Header>
                  <div className="flex items-center space-x-2">
                    <Icons.Clipboard className="w-4 h-4" />
                    <span>Form Template Detected</span>
                  </div>
                </PanelSection.Header>
                <PanelSection.Content>
                  <div className="text-sm space-y-2 text-aqua-pale">
                    <p>This form typically contains these fields:</p>
                    <ul className="list-disc pl-5 space-y-1 text-aqua-pale">
                      {formTemplates[selectedFormUuid].map(fieldName => (
                        <li key={fieldName}>{fieldName}</li>
                      ))}
                    </ul>
                  </div>
                </PanelSection.Content>
              </PanelSection>
            )}
            {Object.keys(editingData).length === 0 ? (
              <div className="text-muted-foreground text-sm p-3 bg-muted rounded">
                No form data to edit. Use "Create New" to add data.
              </div>
            ) : (
              // Render form using field definitions from the selected form
              (() => {
                const selectedForm = customForms.find(f => f.uuid === selectedFormUuid);
                if (!selectedForm) {
                  return <div className="text-destructive text-sm p-3">Form definition not found</div>;
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
                    <div key={fieldName} className="mb-3 border border-border p-3 rounded bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-aqua-pale">
                          {fieldDef.label}
                        </label>
                        <button
                          onClick={() => handleRemoveField(fieldName)}
                          className="text-destructive text-xs bg-none border-none cursor-pointer p-1 hover:bg-destructive/10 rounded"
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
        </PanelSection.Content>
      </PanelSection>
      )}
    </div>
  );
};

export default XNATCustomFormsPanel; 