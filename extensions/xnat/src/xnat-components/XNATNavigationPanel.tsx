import React, { useState, useEffect } from 'react';
import XNATProjectList from './XNATNavigation/XNATProjectList';
import XNATProject from './XNATNavigation/XNATProject';
import fetchJSON from '../utils/IO/fetchJSON';
import compareOnProperty from './XNATNavigation/helpers/compareOnProperty';
import sessionMap from '../utils/sessionMap';

import './XNATNavigationPanel.css';

interface Project {
  ID: string;
  name: string;
  [key: string]: any;
}

interface XNATNavigationPanelProps {
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
 * XNATNavigationPanel component - Shows hierarchical XNAT project/subject structure
 * Modernized for OHIF v3
 *
 * @returns component
 */
const XNATNavigationPanel: React.FC<XNATNavigationPanelProps> = ({ servicesManager }) => {
  
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [otherProjects, setOtherProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use uiNotificationService from servicesManager if needed
  const { uiNotificationService } = servicesManager.services;

  /**
   * Fetch available projects from XNAT on component mount
   */
  useEffect(() => {
    setLoading(true);
    fetchJSON('data/archive/projects/?format=json')
      .promise.then(result => {
        
        if (!result) {
          console.error('XNATNavigationPanel: No projects data returned from API');
          setError('No projects data returned');
          setLoading(false);
          return;
        }

        const allProjects = result.ResultSet.Result;
        
        const activeProjectId = sessionMap.getProject();

        const thisProjectIndex = allProjects.findIndex(
          element => element.ID === activeProjectId
        );

        let active: Project[] = [];
        let others: Project[] = [...allProjects];

        // If we found the active project, move it to active array
        if (thisProjectIndex !== -1) {
          active = allProjects.splice(thisProjectIndex, 1);
        }

        // Sort the other projects by name
        others.sort((a, b) => compareOnProperty(a, b, 'name'));

        setActiveProjects(active);
        setOtherProjects(others);
        setLoading(false);
      })
      .catch(err => {
        console.error('XNATNavigationPanel: Error fetching XNAT projects:', err);
        setError('Failed to load projects');
        setLoading(false);
        
        // Use notification service if available
        if (uiNotificationService) {
          uiNotificationService.show({
            title: 'XNAT Navigation',
            message: 'Failed to load XNAT projects',
            type: 'error',
            duration: 5000,
          });
        }
      });
  }, [uiNotificationService]);



  // Display loading state
  if (loading) {
    return (
      <div className="xnat-navigation-tree">
        <div className="loading-projects">Loading XNAT projects...</div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="xnat-navigation-tree">
        <div className="error-projects">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="xnat-navigation-tree">
      <ul>
        <h4>This Project</h4>
        {activeProjects.length > 0 ? (
          activeProjects.map(project => (
            <li key={project.ID}>
              <XNATProject ID={project.ID} name={project.name} />
            </li>
          ))
        ) : (
          <li className="no-active-project">No active project selected</li>
        )}
        <XNATProjectList projects={otherProjects} />
      </ul>
    </div>
  );
};

export default XNATNavigationPanel; 