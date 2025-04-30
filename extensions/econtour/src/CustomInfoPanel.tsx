import React from 'react';
import { useImageViewer } from '@ohif/ui-next';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ohif/ui-next';
import { Separator } from '@ohif/ui-next';
import DOMPurify from 'dompurify';
import './styles/customInfoPanel.css';

export default function CustomInfoPanel({ children }: any) {
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
        return null;
      }
      throw new Error(`Error fetching contour data: ${response.status}`);
    }

    const data = await response.json();
    return data.responseBody;
  };

  // Use React Query to fetch and cache contour info
  const {
    data: contourInfo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contourInfoReport', StudyInstanceUIDs?.[0]],
    queryFn: () => (StudyInstanceUIDs?.[0] ? fetchContourInfo(StudyInstanceUIDs[0]) : null),
    enabled: !!StudyInstanceUIDs?.[0],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Sanitize HTML content to prevent XSS attacks
  const sanitizeHTML = (html: string) => {
    if (!html) {
      return '';
    }

    // Configure DOMPurify to allow specific tags and attributes we want to keep
    const purifyConfig = {
      ALLOWED_TAGS: [
        'a',
        'ul',
        'ol',
        'li',
        'p',
        'span',
        'strong',
        'em',
        'b',
        'i',
        'br',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'font',
      ],
      ALLOWED_ATTR: ['href', 'target', 'style', 'class', 'color'],
      ALLOW_DATA_ATTR: false,
    };

    return DOMPurify.sanitize(html, purifyConfig);
  };

  if (isLoading) {
    return <div className="text-foreground p-4">Loading contour information...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading contour information</div>;
  }

  if (!contourInfo) {
    return (
      <div className="text-foreground p-4">No contour information available for this study</div>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-3">
        <span className="text-foreground text-sm">{contourInfo.assessment}</span>
      </div>
      <Separator orientation="horizontal" />

      <Tabs defaultValue="rx" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="rx" className="flex-1">
            Rx
          </TabsTrigger>
          <Separator orientation="vertical" />
          <TabsTrigger value="contours" className="flex-1">
            Contours
          </TabsTrigger>
          <Separator orientation="vertical" />
          <TabsTrigger value="pearls" className="flex-1">
            Pearls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rx" className="mt-2 max-h-[calc(100vh-200px)] overflow-auto">
          <div
            className="prose prose-sm text-foreground custom-html-content max-w-none text-[13px]"
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(contourInfo.rtsummary) || 'No Rx information available',
            }}
          />
        </TabsContent>

        <TabsContent value="contours" className="mt-2 max-h-[calc(100vh-200px)] overflow-auto">
          <div
            className="prose prose-sm text-foreground custom-html-content max-w-none text-[13px]"
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(contourInfo.contours) || 'No contours information available',
            }}
          />
        </TabsContent>

        <TabsContent value="pearls" className="mt-2 max-h-[calc(100vh-200px)] overflow-auto">
          <div
            className="prose prose-sm text-foreground custom-html-content max-w-none text-[13px]"
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(contourInfo.pearls) || 'No pearls information available',
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
