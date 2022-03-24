import React, { useState } from 'react';
import { Icon } from '@ohif/ui';

import './ICRHelpContent.styl';

const MaskHelpContent = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const getTabClass = idx => {
    return idx === tabIndex ? 'active' : '';
  };

  const renderMainInfo = () => {
    return (
      <div>
        <h3>Masking Overview</h3>
        <p>
          A segment is defined as a 3D mask of a particular color, defining one
          region of interest. The "Mask-based ROIs" side panel displays a list
          of segments displayed on the scan in the active viewport, as well as
          settings relevant to the active masking tool.
        </p>

        <h5>Segment List (New Mask Collection)</h5>
        <ul>
          <li>Click on the "+ Add" button to add a new segment.</li>
          <li>
            Click "Remove" to delete a segment from your working collection.
          </li>
          <li>Click on a segment's label or type to edit its metadata.</li>
          <li>Click hide to hide a segment.</li>
          <li>
            Click on the "Palette" button to select which color to paint.
          </li>
        </ul>

        <h5>Import</h5>
        <p>
          You may overlay one labelmap on a scan at a time. This limitation is due
          to memory limitations within the browser, and will be improved in the
          future. You may edit the labelmap and re-save it as a new ROI Collection.
        </p>

        <h5>Export</h5>
        <p>
          You can export the labelmap. Overlapping segments are valid and can be
          exported.
        </p>

        <h5>Shortcuts</h5>
        The following shortcuts are available (where applicable) for all
        masking tools.
        <ul>
          <li>Use the [ and ] keys to increase/decrease the brush size.</li>
          <li>Ctrl + click before drawing to erase selected mask color.</li>
        </ul>
      </div>
    );
  };

  const renderManualInfo = () => {
    return (
      <div>
        <h3>Manual Tool</h3>
        <p>
          The Manual Brush tool allows you to segment images with a circular brush.
        </p>
        <h5>Painting with the brush</h5>
        <ul>
          <li>Click on the canvas to paint with the selected color.</li>
          <li>Drag to make brush strokes.</li>
          <li>Ctrl + click before drawing to erase selected mask color.</li>
          <li>Use the [ and ] keys to increase/decrease the brush size.</li>
        </ul>
      </div>
    );
  };

  const renderSmartCTInfo = () => {
    return (
      <div>
        <h3>Smart CT Tool</h3>
        <p>
          The smart CT brush tool allows you to segment specific tissue types of CT
          images based on a pair of Hounsfield Units (HU). The tissue type can be
          chosen in the Brush Settings menu, as well as a custom HU gate.
        </p>
        <p>
          Holes/artifacts are filled and stray pixels removed, based on the settings
          configured in the Segments side panel.
        </p>
        <h5>Painting with the brush</h5>
        <ul>
          <li>Click on the canvas to paint with the selected color.</li>
          <li>Drag to make brush strokes.</li>
        </ul>
        <h5>Smart CT Gate Selection</h5>
        <p>
          This option allows you to select the tissue type the Smart CT brush uses.
          You can also specify a custom gate in Hounsfield Units.
        </p>
        <h5>Smart/Auto Gate Settings</h5>
        <p>These settings affect both the Smart CT and Auto Brush tools.</p>
        <ul>
          <li>
            The first slider sets the size of holes to fill in whilst painting, as a
            fraction of the primary region painted within the brush circle.
          </li>
          <li>
            The second slider sets the size of non-primary regions to ignore whilst
            painting, as a fraction of the primary region painted within the brush
            circle. Regions smaller than this threshold will not be painted.
          </li>
        </ul>
      </div>
    );
  }

  const renderAutoInfo = () => {
    return (
      <div>
        <h3>Auto Tool</h3>
        <p>
          The Auto Brush tool finds the minimum and maximum pixel values within the
          brush radius when pressing down the mouse. Dragging after pressing down
          the mouse will only fill in pixels within this band.
        </p>
        <p>
          Holes/artifacts are filled and stray pixels removed, based on the settings
          configured in the Segments side panel.
        </p>
        <h5>Painting with the brush</h5>
        <ul>
          <li>Click on the canvas to paint with the selected color.</li>
          <li>Drag to make brush strokes.</li>
        </ul>
        <h5>Smart CT Gate Selection</h5>
        <p>
          This option allows you to select the tissue type the Smart CT brush uses.
          You can also specify a custom gate in Hounsfield Units.
        </p>
        <h5>Smart/Auto Gate Settings</h5>
        <p>These settings affect both the Smart CT and Auto Brush tools.</p>
        <ul>
          <li>
            The first slider sets the size of holes to fill in whilst painting, as a
            fraction of the primary region painted within the brush circle.
          </li>
          <li>
            The second slider sets the size of non-primary regions to ignore whilst
            painting, as a fraction of the primary region painted within the brush
            circle. Regions smaller than this threshold will not be painted.
          </li>
        </ul>
      </div>
    );
  };

  const otherToolsInfo = () => {
    return (
      <div>
        <h3>Other Masking Tools</h3>
        <p>
          A group of standard tools for manipulating labelmap data.
        </p>
        <h5>Circle Scissors Tool</h5>
        <ul>
          <li>Click once on the canvas to set the circle center.</li>
          <li>Drag outwards of the center and release to fill with the selected color.</li>
          <li>Ctrl + click before drawing to erase selected mask color.</li>
        </ul>
        <h5>Rectangle Scissors Tool</h5>
        <ul>
          <li>Click once on the canvas to set one corner or the rectangle.</li>
          <li>Drag around the corner and release to fill with the selected color.</li>
          <li>Ctrl + click before drawing to erase selected mask color.</li>
        </ul>
        <h5>Freehand Scissors Tool</h5>
        <ul>
          <li>Click once and drag the mouse around the region of interest.</li>
          <li>Release the mouse to fill with the selected color.</li>
          <li>Ctrl + click before drawing to erase selected mask color.</li>
        </ul>
        <h5>Spherical Brush Tool</h5>
        <p>
          Similar to the standard brush but it paints mask in 3D.
        </p>
        <ul>
          <li>Click on the canvas to paint with the selected color.</li>
          <li>Drag to make brush strokes.</li>
          <li>Ctrl + click before drawing to erase selected mask color.</li>
          <li>Use the [ and ] keys to increase/decrease the brush size.</li>
        </ul>
      </div>
    );
  };

  const aiaaToolInfo = () => {
    return (
      <div>
        <h3>NVIDIA AIAA Tools</h3>
        <p>
          The viewer integrates the NVIDIA AI-Assisted Annotation tools listed
          below. This feature is currently experimental. It can be enabled/disabled
          from the "Experimental Features" section in "Options->Preferences".
          Also to use this feature, an AIAA server URL should be set by a site admin.
        </p>
        <p>
          To use the AIAA tools, click on the AIAA button under the Mask toolbar
          button. This brings up the AIAA menu in the "Mask-based ROIs" side panel.
        </p>

        <h5>Annotation (DEXTR3D)</h5>
        <p>
          The DEXTR3D (or Deep Extreme cut in 3D) tool requires to provide 6+
          extreme points on the edges of an organ.
        </p>
        <ul>
          <li>Select "Annotation" from the "AIAA tool" dropdown list.</li>
          <li>Select which model to use from the "Annotation models" dropdown list.</li>
          <li>
            Click 6+ more points on edges around an organ. The points can be
            selected over multiple slices.
          </li>
          <li>
            Once the first 6 points were selected, the viewer will request from
            the server to run the analysis using the chosen model. The result
            of annotation is painted on the image in 3D after it was received
            back from the AIAA server.
          </li>
          <li>
            The clicks for consecutive points initiate the annotation requests
            and result rendering automatically for each additional point.
          </li>
        </ul>

        <h5>Deepgrow</h5>
        <p>
          Deepgrow annotation requires a single point, but can then be refined
          progressively by addition of more points. Deepgrow runs in 2D only.
        </p>
        <ul>
          <li>Select "Deepgorw" from the "AIAA tool" dropdown list.</li>
          <li>
            Click to add a foreground point within an organ/ROI. The points can
            be selected over multiple slices, but the annotation is only performed
            for the current slice.
          </li>
          <li>
            Once a point was clicked, the viewer will request from
            the server to run the analysis. The result is rendered back on the
            currently displayed slice in the viewer.
          </li>
          <li>
            To clear areas with over-segmentation, use ctrl + click to add a
            background point.
          </li>
        </ul>

        <h5>Segmentation</h5>
        <p>
          Fully automated segmentation with no additional input.
        </p>
        <ul>
          <li>Select "Segmentation" from the "AIAA tool" dropdown list.</li>
          <li>
            Select which model to use from the "Segmentation models" dropdown
            list.
          </li>
          <li>Click "Run".</li>
        </ul>
      </div>
    );
  };

  const renderTabs = () => {
    switch (tabIndex) {
      case 0:
        return renderMainInfo();
      case 1:
        return renderManualInfo();
      case 2:
        return renderSmartCTInfo();
      case 3:
        return renderAutoInfo();
      case 4:
        return otherToolsInfo();
      case 5:
        return aiaaToolInfo();
      default:
        break;
    }
  };

  return (
    <React.Fragment>
      <div className="help-sub-nav">
        <ul>
          <li onClick={() => setTabIndex(0)} className={getTabClass(0)}>
            <button>
              <Icon name="xnat-mask" />
            </button>
          </li>
          <li onClick={() => setTabIndex(1)} className={getTabClass(1)}>
            <button>
              <Icon name="xnat-mask-manual" />
            </button>
          </li>
          <li onClick={() => setTabIndex(2)} className={getTabClass(2)}>
            <button>
              <Icon name="xnat-mask-smart-ct" />
            </button>
          </li>
          <li onClick={() => setTabIndex(3)} className={getTabClass(3)}>
            <button>
              <Icon name="xnat-mask-auto" />
            </button>
          </li>
          <li onClick={() => setTabIndex(4)} className={getTabClass(4)}>
            <button>
              <Icon name="ellipse-circle" />
            </button>
          </li>
          <li onClick={() => setTabIndex(5)} className={getTabClass(5)}>
            <button>
              <Icon name="dot-circle" />
            </button>
          </li>
        </ul>
      </div>
      <div id="icr-help-content" className="help-content">{renderTabs()}</div>
    </React.Fragment>
  );
};

export { MaskHelpContent };
export default MaskHelpContent;
