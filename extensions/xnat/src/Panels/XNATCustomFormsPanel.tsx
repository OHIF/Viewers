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
  const [availableExperiments, setAvailableExperiments] = useState<any[]>([]);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>('');

  const { uiNotificationService } = servicesManager.services;

  // Get current experiment and project from multiple sources
  const getExperimentId = () => {
    // If user has selected a specific experiment, use that
    if (selectedExperimentId) return selectedExperimentId;

    // Try URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const urlExperimentId = urlParams.get('experimentId') || urlParams.get('sessionId');

    // If we have multiple experiments available, don't return a default
    if (availableExperiments.length > 1) {
      return null; // Let UI prompt for selection
    }

    // Single experiment case
    if (urlExperimentId) return urlExperimentId;

    // Try session map with different methods
    // @ts-ignore - getSession() without parameters returns all sessions
    const sessions = sessionMap.getSession();
    if (Array.isArray(sessions) && sessions.length > 0) {
      // If only one session, use it directly
      if (sessions.length === 1) {
        const session = sessions[0];
        if (session?.experimentId) return session.experimentId;
      }
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

    // Try URL parameters - check both singular and plural forms
    const urlParams = new URLSearchParams(window.location.search);
    const urlSubjectId = urlParams.get('subjectId') || urlParams.get('subjectIds');
    if (urlSubjectId) return urlSubjectId;

    return null;
  };

  const experimentId = getExperimentId();
  const projectId = getProjectId();
  const subjectId = getSubjectId();

  // Get current user information
  const getCurrentUser = useCallback(async () => {
    if (!experimentId) {
      return null;
    }

    try {
      const userData = await hasUserOverreadData(experimentId);
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

  // Detect multiple experiments on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // Collect all experiment IDs from URL parameters
    const allExperimentIds: string[] = [];

    // Add single experimentId if present
    const singleExperimentId = urlParams.get('experimentId');
    if (singleExperimentId) {
      allExperimentIds.push(singleExperimentId);
    }

    // Add multiple experimentIds if present
    const experimentIdsParam = urlParams.getAll('experimentIds');
    allExperimentIds.push(...experimentIdsParam);

    // Remove duplicates
    const uniqueExperimentIds = [...new Set(allExperimentIds)];

    if (uniqueExperimentIds.length > 1) {
      // Multiple experiments from URL
      const experiments = uniqueExperimentIds.map(expId => ({
        experimentId: expId,
        experimentLabel: expId,
        projectId: urlParams.get('projectId') || 'Unknown Project',
        subjectId: urlParams.get('subjectId') || 'Unknown Subject'
      }));

      // Also update the subjectId state for form loading
      const subjectIdFromUrl = urlParams.get('subjectId');
      if (subjectIdFromUrl) {
        // We can't directly set subjectId state here since it's computed
        // But this will help with debugging
        console.log('SubjectId from URL:', subjectIdFromUrl);
      }
      setAvailableExperiments(experiments);
    } else {
      // Check session map for multiple sessions
      // @ts-ignore - getSession() without parameters returns all sessions
      const sessions = sessionMap.getSession();
      if (Array.isArray(sessions) && sessions.length > 1) {
        setAvailableExperiments(sessions);
      }
    }
  }, []); // Only run once on mount

  // Debug logging
  useEffect(() => {
    const overreadMode = detectOverreadMode();
    setIsOverreadMode(overreadMode);

  }, [experimentId, projectId, subjectId, detectOverreadMode, selectedExperimentId, availableExperiments]);

  // Load custom forms for the project (form definitions)
  // Only projectId is required for fetching form definitions; subjectId is not used by the API
  const loadCustomForms = useCallback(async () => {
    if (!projectId) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const forms = await fetchCustomForms(projectId);
      setCustomForms(forms);

      // Automatically select the first form if available
      if (forms.length > 0) {
        const firstFormUuid = forms[0].uuid;
        setSelectedFormUuid(firstFormUuid);
      } else {
        setSelectedFormUuid('');
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
  }, [projectId, uiNotificationService]);

  // Load form data for the current experiment (form data)
  const loadFormData = useCallback(async () => {
    if (!experimentId || !subjectId || !projectId) {
      setError('No experiment selected');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // In overread mode, try overread API first, fall back to regular API
      let data;
      if (isOverreadMode) {
        try {
          data = await getOverreadFormData(experimentId, selectedFormUuid);
          // If overread API returns no data (empty object), fall back to regular API
          if (!data || Object.keys(data).length === 0) {
            data = await getExperimentCustomFormData(experimentId, selectedFormUuid);
          }
        } catch (error) {
          data = await getExperimentCustomFormData(experimentId, selectedFormUuid);
        }
      } else {
        data = await getExperimentCustomFormData(experimentId, selectedFormUuid);
      }

      // Detect form structures from existing data
      const templates = detectFormStructure(data);
      setFormTemplates(templates);

      // If we have a selected form, load its data for editing
      if (selectedFormUuid) {
        let formData = null;

        // Check for different data structures
        if (data[selectedFormUuid]) {
          const formDataObj = data[selectedFormUuid];
          // Check if it's nested under "1" key
          if (formDataObj["1"]) {
            formData = formDataObj["1"];
          } else if (typeof formDataObj === 'object' && !Array.isArray(formDataObj)) {
            // Check if it's direct field data
            formData = formDataObj;
          }
        }

        // Check for user-specific data structure (current API response)
        // Look for data under a key that matches the current user's ID
        if (!formData) {
          const currentUserId = currentUser?.userId?.toString();
          if (currentUserId && data[currentUserId]) {
            formData = data[currentUserId];
          } else if (data["1"]) {
            // Fallback to "1" for backward compatibility
            formData = data["1"];
          }
        }

        // Also check for flattened fields (formUuid_fieldName format)
        if (!formData) {
          const selectedForm = customForms.find(f => f.uuid === selectedFormUuid);
          if (selectedForm) {
            const flattenedData: { [fieldName: string]: any } = {};
            let hasFlattenedData = false;

            selectedForm.fields.forEach(field => {
              const flattenedKey = `${selectedFormUuid}_${field.key}`;
              if (data[flattenedKey] !== undefined) {
                flattenedData[field.key] = data[flattenedKey];
                hasFlattenedData = true;
              }
            });

            if (hasFlattenedData) {
              formData = flattenedData;
            }
          }
        }

        if (formData) {
          // Use existing data
          setEditingData(formData);
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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
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

      // Use overread API if in overread mode, otherwise use regular API
      const updatedData = isOverreadMode
        ? await updateOverreadFormData(experimentId, selectedFormUuid, formDataWithUser)
        : await updateExperimentFormData(experimentId, selectedFormUuid, formDataWithUser);

      setFormData(updatedData);
      setSuccess('Form data saved successfully');

      // Always send overread completion notification since this is always an overread form
      if (projectId) {
        try {
          const notificationResult = await sendOverreadCompletionNotification(
            experimentId,
            projectId,
            formDataWithUser
          );

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
    if (experimentId && selectedFormUuid) {
      loadFormData();
    }
  }, [experimentId, selectedExperimentId, selectedFormUuid, loadFormData]);

  // Load current user information
  useEffect(() => {
    if (experimentId) {
      getCurrentUser().then(userInfo => {
        if (userInfo) {
          setCurrentUser(userInfo);
        }
      });
    }
  }, [experimentId, getCurrentUser]);

  // Load form data when a form is auto-selected and experiment is selected
  useEffect(() => {
    if (selectedFormUuid && experimentId && customForms.length > 0) {
      // Trigger form data loading when a form is selected and experiment is available
      loadFormData();
    }
  }, [selectedFormUuid, experimentId, customForms.length, loadFormData]);

  // Reload form data when selected experiment changes
  useEffect(() => {
    if (selectedExperimentId && customForms.length > 0) {
      loadFormData();
    }
  }, [selectedExperimentId, customForms.length, loadFormData]);

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

  if (!experimentId && availableExperiments.length <= 1) {
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

      {/* Experiment Selection for Comparison Mode */}
      {availableExperiments.length > 1 && (
        <PanelSection>
          <PanelSection.Header>
            <div className="flex items-center space-x-2 text-aqua-pale">
              <Icons.Clipboard className="w-4 h-4" />
              <span>Select Experiment</span>
            </div>
          </PanelSection.Header>
          <PanelSection.Content>
            <div className="text-sm space-y-3 text-aqua-pale">
              <p>Multiple experiments are loaded. Select which experiment's custom forms you want to view:</p>
              <div className="space-y-2">
                <select
                  value={selectedExperimentId}
                  onChange={(e) => {
                    const newExperimentId = e.target.value;
                    setSelectedExperimentId(newExperimentId);
                    // Clear form data when switching experiments (but keep form selection)
                    setFormData({});
                    setEditingData({});
                  }}
                  className="w-full p-2 border border-input rounded text-sm bg-background text-foreground"
                >
                  <option value="">Select an experiment...</option>
                  {availableExperiments.map(experiment => (
                    <option key={experiment.experimentId} value={experiment.experimentId}>
                      {experiment.experimentLabel || experiment.experimentId}
                    </option>
                  ))}
                </select>
                {selectedExperimentId && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ Selected: {availableExperiments.find(exp => exp.experimentId === selectedExperimentId)?.experimentLabel || selectedExperimentId}
                  </p>
                )}
              </div>
            </div>
          </PanelSection.Content>
        </PanelSection>
      )}

      {/* Overread / Custom Forms selector and state */}
      <PanelSection>
        <PanelSection.Header>
          <div className="flex items-center space-x-2 text-aqua-pale">
            <Icons.Clipboard className="w-4 h-4" />
            <span>{isOverreadMode ? 'Overread Forms' : 'Custom Forms'}</span>
          </div>
        </PanelSection.Header>
        <PanelSection.Content>
          {loading && customForms.length === 0 ? (
            <div className="text-sm text-muted-foreground">Loading forms...</div>
          ) : customForms.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No custom forms configured for this project.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {isOverreadMode
                  ? 'There is an overread form configured for this project.'
                  : 'There is a custom form configured for this project.'}
              </p>
              <label className="block text-sm font-medium text-foreground">Select form</label>
              <select
                value={selectedFormUuid}
                onChange={(e) => handleFormSelect(e.target.value)}
                className="w-full p-2 border border-input rounded text-sm bg-background text-foreground"
              >
                <option value="">Choose a form...</option>
                {customForms.map(form => (
                  <option key={form.uuid} value={form.uuid}>
                    {form.title}
                  </option>
                ))}
              </select>
            </div>
          )}
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
                    Loading form data...
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
