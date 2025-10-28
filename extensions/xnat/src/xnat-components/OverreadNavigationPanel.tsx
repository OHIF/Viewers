import React, { useState, useEffect } from 'react';
import { PanelSection } from '@ohif/ui-next';
import XNATSubject from './XNATNavigation/XNATSubject';
import fetchJSON from '../utils/IO/fetchJSON';
import compareOnProperty from './XNATNavigation/helpers/compareOnProperty';
import sessionMap from '../utils/sessionMap';

interface Subject {
  ID: string;
  name?: string;
  label?: string;
  project?: string;
  scans?: any[];
  [key: string]: any;
}

interface OverreadNavigationPanelProps {
  servicesManager: {
    services: {
      uiNotificationService?: {
        show: (props: { title: string; message: string; type: string; duration: number }) => void;
      };
      [key: string]: any;
    };
  };
}

/**
 * OverreadNavigationPanel component - Shows hierarchical XNAT subject/subject structure
 * Modernized for OHIF v3
 *
 * @returns component
 */
const OverreadNavigationPanel: React.FC<OverreadNavigationPanelProps> = ({ servicesManager }) => {
  
  const [activeSubjects, setActiveSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use uiNotificationService from servicesManager if needed
  const { uiNotificationService } = servicesManager.services;

  /**
   * Fetch available subjects from XNAT on component mount
   */
  useEffect(() => {
    setLoading(true);
    
    const activeSubjectId = sessionMap.getSubject();
    console.log('OverreadNavigationPanel: Active subject ID:', activeSubjectId);
    console.log(`/data/archive/subjects/${activeSubjectId}?format=json`);
    fetchJSON(`/data/archive/subjects/${activeSubjectId}?format=json`)
      .promise.then(result => {
        
        if (!result) {
          console.error('OverreadNavigationPanel: No subject data returned from API');
          setError('No subject data returned');
          setLoading(false);
          return;
        }

        console.log('OverreadNavigationPanel: Raw API response:', result);

        // Extract subject data from the nested structure
        const subjectData = result.items && result.items[0];
        if (!subjectData) {
          console.error('OverreadNavigationPanel: No subject data found in response');
          setError('No subject data found');
          setLoading(false);
          return;
        }

        // Extract scans from the experiments section
        let scans = [];
        const experimentsSection = subjectData.children?.find(child => child.field === 'experiments/experiment');
        if (experimentsSection && experimentsSection.items && experimentsSection.items.length > 0) {
          const experiment = experimentsSection.items[0];
          const scansSection = experiment.children?.find(child => child.field === 'scans/scan');
          if (scansSection && scansSection.items) {
            scans = scansSection.items;
          }
        }

        console.log('OverreadNavigationPanel: Extracted scans:', scans);

        // Create a subject object with the extracted data
        const subject: Subject = {
          ID: subjectData.data_fields?.ID || activeSubjectId,
          label: subjectData.data_fields?.label || 'Unknown Subject',
          project: subjectData.data_fields?.project || 'Unknown Project',
          scans: scans
        };

        setActiveSubjects([subject]);
        setLoading(false);
      })
      .catch(err => {
        console.error('OverreadNavigationPanel: Error fetching XNAT subjects:', err);
        setError('Failed to load subjects');
        setLoading(false);
        
        // Use notification service if available
        if (uiNotificationService) {
          uiNotificationService.show({
            title: 'XNAT Navigation',
            message: 'Failed to load XNAT subjects',
            type: 'error',
            duration: 5000,
          });
        }
      });
  }, [uiNotificationService]);



  // Display loading state
  if (loading) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden p-4">
        <PanelSection>
          <PanelSection.Header>Loading</PanelSection.Header>
          <PanelSection.Content>
            <div className="text-sm text-muted-foreground">Loading XNAT subjects...</div>
          </PanelSection.Content>
        </PanelSection>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden p-4">
        <PanelSection>
          <PanelSection.Header className="text-destructive">Error</PanelSection.Header>
          <PanelSection.Content>
            <div className="text-destructive text-sm">Error: {error}</div>
          </PanelSection.Content>
        </PanelSection>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-4">
      {/* Active Subject Section */}
      <PanelSection>
        <PanelSection.Header>This Subject</PanelSection.Header>
        <PanelSection.Content>
          {activeSubjects.length > 0 ? (
            <div className="space-y-2">
              {activeSubjects.map(subject => (
                <div key={subject.ID}>
                  <XNATSubject ID={subject.ID} label={subject.label} projectId={subject.project} parentProjectId={subject.project} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No active subject selected</div>
          )}
        </PanelSection.Content>
      </PanelSection>

    </div>
  );
};

export default OverreadNavigationPanel; 