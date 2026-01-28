import React, { useState, useEffect } from 'react';

/**
 * MedBook Panel component - displays medical book/reference information
 * Similar structure to PanelSegmentation
 */
function PanelMedBook({
  commandsManager,
  servicesManager,
  extensionManager,
  configuration,
}: withAppTypes) {
  const { customizationService } = servicesManager.services;

  // State for panel data
  const [medBookData, setMedBookData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Get customization options
  const panelTitle = customizationService.getCustomization('panelMedBook.title') || 'MedBook';
  const showHeader = customizationService.getCustomization('panelMedBook.showHeader') !== false;

  useEffect(() => {
    // Initialize panel data here
    // You can fetch from backend or use local data
  }, []);

  return (
    <div className="ohif-scrollbar flex h-full flex-col overflow-auto">
      {showHeader && (
        <div className="bg-primary-dark flex items-center justify-between border-b border-secondary-light px-4 py-2">
          <h2 className="text-lg font-semibold text-white">{panelTitle}</h2>
        </div>
      )}

      <div className="flex-1 p-4">
        {/* Navigation Tabs */}
        <div className="mb-4 flex space-x-2 border-b border-secondary-light">
          <button
            className={`px-3 py-2 text-sm ${
              activeSection === 'overview'
                ? 'border-b-2 border-primary-light text-primary-light'
                : 'text-secondary-light hover:text-white'
            }`}
            onClick={() => setActiveSection('overview')}
          >
            Overview
          </button>
          <button
            className={`px-3 py-2 text-sm ${
              activeSection === 'references'
                ? 'border-b-2 border-primary-light text-primary-light'
                : 'text-secondary-light hover:text-white'
            }`}
            onClick={() => setActiveSection('references')}
          >
            References
          </button>
          <button
            className={`px-3 py-2 text-sm ${
              activeSection === 'notes'
                ? 'border-b-2 border-primary-light text-primary-light'
                : 'text-secondary-light hover:text-white'
            }`}
            onClick={() => setActiveSection('notes')}
          >
            Notes
          </button>
        </div>

        {/* Content Area */}
        <div className="text-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-light border-t-transparent" />
            </div>
          ) : (
            <>
              {activeSection === 'overview' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-secondary-dark p-4">
                    <h3 className="mb-2 text-sm font-medium text-primary-light">
                      Medical Reference
                    </h3>
                    <p className="text-sm text-secondary-light">
                      This panel provides medical reference information and documentation related to
                      the current study.
                    </p>
                  </div>

                  <div className="rounded-lg bg-secondary-dark p-4">
                    <h3 className="mb-2 text-sm font-medium text-primary-light">Quick Actions</h3>
                    <div className="flex flex-col gap-2">
                      <button
                        className="rounded bg-primary-main px-3 py-2 text-sm text-white hover:bg-primary-light"
                        onClick={() => {
                          // Add your action here
                          console.log('Quick action clicked');
                        }}
                      >
                        View Documentation
                      </button>
                      <button
                        className="rounded bg-secondary-main px-3 py-2 text-sm text-white hover:bg-secondary-light"
                        onClick={() => {
                          // Add your action here
                          console.log('Export clicked');
                        }}
                      >
                        Export Notes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'references' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-secondary-dark p-4">
                    <h3 className="mb-2 text-sm font-medium text-primary-light">
                      Reference Materials
                    </h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-secondary-light">
                      <li>Clinical guidelines</li>
                      <li>Imaging protocols</li>
                      <li>Diagnostic criteria</li>
                      <li>Treatment recommendations</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeSection === 'notes' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-secondary-dark p-4">
                    <h3 className="mb-2 text-sm font-medium text-primary-light">Study Notes</h3>
                    <textarea
                      className="h-32 w-full resize-none rounded border border-secondary-light bg-secondary-main p-2 text-sm text-white placeholder-secondary-light focus:border-primary-light focus:outline-none"
                      placeholder="Add notes about this study..."
                    />
                    <button className="mt-2 rounded bg-primary-main px-3 py-1 text-sm text-white hover:bg-primary-light">
                      Save Notes
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PanelMedBook;
