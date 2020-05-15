import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { SidePanel, Toolbar } from '@ohif/ui';
//
import Header from './Header.jsx';

function ViewerLayout({
  // From Extension Module Params
  extensionManager,
  // From Modes
  leftPanels,
  rightPanels,
  toolBarLayout,
  displaySetInstanceUids,
  ViewportGrid,
}) {
  /**
   * Set body classes (tailwindcss) that don't allow vertical
   * or horizontal overflow (no scrolling). Also guarantee window
   * is sized to our viewport.
   */
  useEffect(() => {
    document.body.classList.add('bg-black');
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('bg-black');
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  const getPanelData = id => {
    const entry = extensionManager.getModuleEntry(id);
    // TODO, not sure why sidepanel content has to be JSX, and not a children prop?
    const content = entry.component({});

    return {
      iconName: entry.iconName,
      iconLabel: entry.iconLabel,
      label: entry.label,
      name: entry.name,
      content,
    };
  };

  const leftPanelComponents = leftPanels.map(getPanelData);
  const rightPanelComponents = rightPanels.map(getPanelData);

  console.warn(displaySetInstanceUids);
  console.warn(toolBarLayout);

  const [primaryToolBarLayout, secondaryToolBarLayout] = toolBarLayout;

  return (
    <div>
      <Header
        tools={primaryToolBarLayout.tools}
        moreTools={primaryToolBarLayout.moreTools}
      />
      <div
        className="flex flex-row flex-no-wrap items-stretch overflow-hidden w-full"
        style={{ height: 'calc(100vh - 57px' }}
      >
        {/* LEFT SIDEPANELS */}
        <SidePanel
          side="left"
          defaultComponentOpen={leftPanelComponents[0].name}
          childComponents={leftPanelComponents}
        />
        {/* TOOLBAR + GRID */}
        <div className="flex flex-col flex-1 h-full">
          <div className="flex flex-2 w-100 border-b border-transparent h-12">
            <Toolbar type="secondary" tools={secondaryToolBarLayout.tools} />
          </div>
          <div className="flex flex-1 h-full overflow-hidden bg-black items-center justify-center pb-2 pt-1">
            <ViewportGrid />
            {/*
              viewportContents={[
                <Viewport
                  viewportIndex={0}
                  onSeriesChange={direction => alert(`Series ${direction}`)}
                  studyData={{
                    label: 'A',
                    isTracked: true,
                    isLocked: false,
                    studyDate: '07-Sep-2011',
                    currentSeries: 1,
                    seriesDescription:
                      'Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit ',
                    modality: 'CT',
                    patientInformation: {
                      patientName: 'Smith, Jane',
                      patientSex: 'F',
                      patientAge: '59',
                      MRN: '10000001',
                      thickness: '5.0mm',
                      spacing: '1.25mm',
                      scanner: 'Aquilion',
                    },
                  }}
                >
                </Viewport>,
                <Viewport
                  viewportIndex={1}
                  onSeriesChange={direction => alert(`Series ${direction}`)}
                  studyData={{
                    label: 'A',
                    isTracked: false,
                    isLocked: true,
                    studyDate: '07-Sep-2010',
                    currentSeries: 2,
                    seriesDescription:
                      'Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit ',
                    modality: 'SR',
                    patientInformation: {
                      patientName: 'Smith, Jane',
                      patientSex: 'F',
                      patientAge: '59',
                      MRN: '10000001',
                      thickness: '2.0mm',
                      spacing: '1.25mm',
                      scanner: 'Aquilion',
                    },
                  }}
                >
                </Viewport>,
              ]}
              setActiveViewportIndex={setActiveViewportIndex}
              activeViewportIndex={activeViewportIndex}
            />*/}
          </div>
        </div>
        <SidePanel
          side="right"
          defaultComponentOpen={rightPanelComponents[0].name}
          childComponents={rightPanelComponents}
        />
      </div>
    </div>
  );
}

ViewerLayout.propTypes = {
  // From extension module params
  extensionManager: PropTypes.shape({
    getModuleEntry: PropTypes.func.isRequired,
  }).isRequired,
  // From modes
  // TODO: Not in love with this shape,
  toolBarLayout: PropTypes.arrayOf(
    PropTypes.shape({
      tools: PropTypes.array,
      moreTools: PropTypes.array,
    })
  ).isRequired,
  displaySetInstanceUids: PropTypes.any.isRequired,
  leftPanels: PropTypes.array,
  rightPanels: PropTypes.array,
  /** Responsible for rendering our grid of viewports; provided by consuming application */
  ViewportGrid: PropTypes.oneOfType(PropTypes.node, PropTypes.func).isRequired,
};

ViewerLayout.defaultProps = {
  toolBarLayout: [
    { tools: [], moreTools: [] },
    { tools: [], moreTools: [] },
  ],
};

export default ViewerLayout;
