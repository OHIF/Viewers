import React, { useEffect, useState } from 'react';
import { SegmentationTable } from '@ohif/ui-next';
import { useActiveViewportSegmentationRepresentations } from '@ohif/extension-cornerstone';
import { metaData } from '@cornerstonejs/core';
import { useSystem } from '@ohif/core/src';
import { useImageViewer } from '@ohif/ui-next';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ohif/ui-next';
import { Separator } from '@ohif/ui-next';
import DOMPurify from 'dompurify';

// Add global styles for the custom HTML content
const customStyles = `
  .custom-html-content ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  
  .custom-html-content ul ul, 
  .custom-html-content ol ul {
    list-style-type: circle;
    padding-left: 1.5rem;
    margin: 0.25rem 0;
  }
  
  .custom-html-content ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  
  .custom-html-content li {
    margin-bottom: 0.25rem;
  }
  
  .custom-html-content a {
    color: #3b82f6;
    text-decoration: underline;
    cursor: pointer;
  }
  
  .custom-html-content a:hover {
    text-decoration: none;
  }
  
  .custom-html-content a[target="_blank"]::after {
    content: "↗";
    display: inline-block;
    margin-left: 0.25rem;
    font-size: 0.75rem;
  }
`;

export default function CustomInfoPanel({ children }: any) {
  const { commandsManager, servicesManager } = useSystem();
  const { customizationService, displaySetService } = servicesManager.services;
  const internalImageViewer = useImageViewer();
  const StudyInstanceUIDs = internalImageViewer.StudyInstanceUIDs;

  // Function to fetch contour info
  const fetchContourInfo = async (studyUID: string) => {
    if (!studyUID) {
      return null;
    }

    // Customize the environment as needed
    const environment = 'development';
    const baseUrl = environment ? `https://${environment}.econtour.org` : 'https://econtour.org';

    const response = await fetch(`${baseUrl}/api/study/?studyUID=${studyUID}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.debug('No contour data found for this study');
        return null;
      }
      throw new Error(`Error fetching contour data: ${response.status}`);
    }

    const data = await response.json();
    console.debug('Contour info retrieved:', data);
    return data.responseBody;
  };

  // Use React Query to fetch and cache contour info
  const {
    data: contourInfo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contourInfo', StudyInstanceUIDs?.[0]],
    queryFn: () => (StudyInstanceUIDs?.[0] ? fetchContourInfo(StudyInstanceUIDs[0]) : null),
    enabled: !!StudyInstanceUIDs?.[0],
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });

  // Sanitize HTML content to prevent XSS attacks
  const sanitizeHTML = (html: string) => {
    if (!html) return '';
    
    // Configure DOMPurify to allow specific tags and attributes we want to keep
    const purifyConfig = {
      ALLOWED_TAGS: ['a', 'ul', 'ol', 'li', 'p', 'span', 'strong', 'em', 'b', 'i', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'font'],
      ALLOWED_ATTR: ['href', 'target', 'style', 'class', 'color'],
      ALLOW_DATA_ATTR: false,
    };
    
    return DOMPurify.sanitize(html, purifyConfig);
  };

  if (isLoading) {
    return <div className="p-4 text-foreground">Loading contour information...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading contour information</div>;
  }

  if (!contourInfo) {
    return <div className="p-4 text-foreground">No contour information available for this study</div>;
  }

  return (
    <div className="p-2">
      <style>{customStyles}</style>
      <Tabs defaultValue="rx" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="rx" className="flex-1">Rx</TabsTrigger>
          <Separator orientation="vertical" />
          <TabsTrigger value="contours" className="flex-1">Contours</TabsTrigger>
          <Separator orientation="vertical" />
          <TabsTrigger value="pearls" className="flex-1">Pearls</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rx" className="mt-2 max-h-[calc(100vh-200px)] overflow-auto">
          <div 
            className="prose prose-sm max-w-none text-foreground text-[13px] custom-html-content" 
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHTML(contourInfo.rtsummary) || 'No Rx information available' 
            }} 
          />
        </TabsContent>
        
        <TabsContent value="contours" className="mt-2 max-h-[calc(100vh-200px)] overflow-auto">
          <div 
            className="prose prose-sm max-w-none text-foreground text-[13px] custom-html-content" 
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHTML(contourInfo.contours) || 'No contours information available' 
            }} 
          />
        </TabsContent>
        
        <TabsContent value="pearls" className="mt-2 max-h-[calc(100vh-200px)] overflow-auto">
          <div 
            className="prose prose-sm max-w-none text-foreground text-[13px] custom-html-content" 
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHTML(contourInfo.pearls) || 'No pearls information available' 
            }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
