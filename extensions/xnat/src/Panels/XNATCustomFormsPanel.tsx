import React, { useState, useEffect, useCallback } from 'react';
import { PanelSection, Icons } from '@ohif/ui-next';
import sessionMap from '../utils/sessionMap';
import {
  getExperimentCustomFormData,
  updateExperimentFormData,
  getOverreadFormData,
  updateOverreadFormData,
  hasUserOverreadData,
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
  const [isOverreadMode, setIsOverreadMode] = useState<boolean>(false);
  const [userHasOverreadData, setUserHasOverreadData] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ userId: number; username: string } | null>(null);

  const { uiNotificationService } = servicesManager.services;

  // Get current experiment and project from multiple sources
  const getExperimentId = () => {
    // Try URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const urlExperimentId = urlParams.get('experimentId') || urlParams.get('sessionId');
    if (urlExperimentId) return urlExperimentId;

    // Try session map with different methods
    // @ts-ignore - getSession() without parameters returns all sessions
    const sessions = sessionMap.getSession();
    if (Array.isArray(sessions) && sessions.length > 0) {
      const latestSession = sessions[sessions.length - 1];
      if (latestSession?.experimentId) return latestSession.experimentId;
    }

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

  // Get current user information
  const getCurrentUser = useCallback(async () => {
    if (!experimentId) {
      console.log('No experiment ID available to get user info');
      return null;
    }

    try {
      const userData = await hasUserOverreadData(experimentId);
      console.log('Current user data:', userData);
      return {
        userId: userData.userId,
        username: userData.username
      };
    } catch (error) {
      console.error('Failed to get current user information:', error);
      return null;
    }
  }, [experimentId]);

  // Detect if we're in overread mode
  const detectOverreadMode = useCallback(() => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const isOverreadUrl = mode === 'overread' || window.location.pathname.includes('/overreads');

    // Check if we're in overread mode based on services manager
    const isOverreadService = servicesManager?.services?.isOverreadMode === true;

    return isOverreadUrl || isOverreadService;
  }, [servicesManager]);

  // Debug logging
  useEffect(() => {
    const overreadMode = detectOverreadMode();
    setIsOverreadMode(overreadMode);

    console.log('XNAT Custom Forms Panel - Debug Info:', {
      experimentId,
      projectId,
      subjectId,
      isOverreadMode: overreadMode,
      // @ts-ignore - getSession() without parameters returns all sessions
      sessionMap: sessionMap.getSession() || [],
      urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
    });
  }, [experimentId, projectId, subjectId, detectOverreadMode]);

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
      console.log('Loading form data for experiment:', experimentId, subjectId, projectId, 'overread mode:', isOverreadMode);

      // Use overread API if in overread mode, otherwise use regular API
      const data = isOverreadMode
        ? await getOverreadFormData(experimentId, selectedFormUuid)
        : await getExperimentCustomFormData(experimentId);

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

      // Check if user has overread data (only in overread mode)
      if (isOverreadMode) {
        try {
          const overreadDataCheck = await hasUserOverreadData(experimentId);
          setUserHasOverreadData(overreadDataCheck.hasData);
          console.log('User has overread data:', overreadDataCheck);
        } catch (overreadCheckError) {
          console.warn('Failed to check user overread data:', overreadCheckError);
          setUserHasOverreadData(false);
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
  }, [experimentId, selectedFormUuid, uiNotificationService, isOverreadMode]);

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

  // Send overread completion notification
  const sendOverreadCompletionNotification = useCallback(async (experimentId: string, projectId: string, formData: any) => {
    try {
      const { xnatRootUrl } = sessionMap;
      const url = `${xnatRootUrl}xapi/overread/completion/notify`;

      const requestBody = {
        projectId: projectId,
        experimentId: experimentId,
        overreadDetails: formData
      };

      console.log('Sending notification to URL:', url);
      console.log('Request body:', requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include', // Include cookies for authentication
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Overread completion notification sent:', result);
      return result;
    } catch (error) {
      console.error('Failed to send overread completion notification:', error);
      throw error;
    }
  }, []);

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

      // Get current user information if not already loaded
      let userInfo = currentUser;
      if (!userInfo) {
        userInfo = await getCurrentUser();
        if (userInfo) {
          setCurrentUser(userInfo);
        }
      }

      // Prepare form data with user information
      const formDataWithUser = {
        ...editingData,
        ...(userInfo && {
          completedByUserId: userInfo.userId,
          completedByUsername: userInfo.username,
          completedAt: new Date().toISOString()
        })
      };

      console.log('Saving form data with user info:', formDataWithUser);

      // Use overread API if in overread mode, otherwise use regular API
      const updatedData = isOverreadMode
        ? await updateOverreadFormData(experimentId, selectedFormUuid, formDataWithUser)
        : await updateExperimentFormData(experimentId, selectedFormUuid, formDataWithUser);

      setFormData(updatedData);
      setSuccess('Form data saved successfully');
      console.log('Editing data:', editingData);
      console.log('Project ID:', projectId);
      console.log('Experiment ID:', experimentId);
      console.log('Selected form UUID:', selectedFormUuid);
      console.log('Overread mode:', isOverreadMode);

      // Always send overread completion notification since this is always an overread form
      if (projectId) {
        try {
          const notificationResult = await sendOverreadCompletionNotification(
            experimentId,
            projectId,
            formDataWithUser
          );

          console.log('Overread completion notification sent:', notificationResult);

          // Update success message to include notification info
          if (notificationResult.success) {
            const totalEmails = notificationResult.totalEmailsSent || 0;
            const urgentEmails = notificationResult.urgentEmailsSent || 0;
            const completionEmails = notificationResult.completionEmailsSent || 0;

            setSuccess(`Form data saved successfully. Sent ${totalEmails} notifications (${completionEmails} completion, ${urgentEmails} urgent)`);

            uiNotificationService.show({
              title: 'Success',
              message: `Form saved and ${totalEmails} notifications sent`,
              type: 'success',
            });
          } else {
            uiNotificationService.show({
              title: 'Warning',
              message: 'Form saved but notifications failed',
              type: 'warning',
            });
          }
        } catch (notificationError) {
          console.warn('Failed to send overread completion notification:', notificationError);
          // Don't fail the save operation if notification fails
          uiNotificationService.show({
            title: 'Warning',
            message: 'Form saved but notification failed',
            type: 'warning',
          });
        }
      } else {
        uiNotificationService.show({
          title: 'Success',
          message: 'Form data saved successfully',
          type: 'success',
        });
      }

      // Update user has overread data flag
      if (isOverreadMode) {
        setUserHasOverreadData(true);
      }
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
  }, [experimentId, selectedFormUuid, editingData, uiNotificationService, projectId, sendOverreadCompletionNotification, isOverreadMode, currentUser, getCurrentUser]);



  // Load data on component mount
  useEffect(() => {
    loadCustomForms();
  }, [loadCustomForms]);

  useEffect(() => {
    if (experimentId) {
      loadFormData();
    }
  }, [experimentId, loadFormData]);

  // Load current user information
  useEffect(() => {
    if (experimentId) {
      getCurrentUser().then(userInfo => {
        if (userInfo) {
          setCurrentUser(userInfo);
          console.log('Current user loaded:', userInfo);
        }
      });
    }
  }, [experimentId, getCurrentUser]);

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
              {/* @ts-ignore - getSession() without parameters returns all sessions */}
              <p><strong>Session Map:</strong> {JSON.stringify(sessionMap.getSession() || [], null, 2)}</p>
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
            {isOverreadMode && (
              <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded">
                OVERREAD MODE
              </span>
            )}
          </div>
        </PanelSection.Header>
        <PanelSection.Content>
          <div className="text-sm space-y-2 text-aqua-pale">
            <p><strong>Project:</strong> {projectId || 'Not detected'}</p>
            <p><strong>Subject:</strong> {subjectId || 'Not detected'}</p>
            <p><strong>Experiment:</strong> {experimentId || 'Not detected'}</p>
            {currentUser && (
              <p><strong>Current User:</strong> {currentUser.username} (ID: {currentUser.userId})</p>
            )}
            {isOverreadMode && (
              <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900 rounded border border-orange-300 dark:border-orange-700">
                <p className="text-orange-800 dark:text-orange-200 text-sm">
                  <strong>Overread Mode:</strong> You can only see and edit your own overread results.
                  Other radiologists' data is not visible to you.
                </p>
                {userHasOverreadData && (
                  <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                    ✓ You have existing overread data for this experiment.
                  </p>
                )}
              </div>
            )}
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
