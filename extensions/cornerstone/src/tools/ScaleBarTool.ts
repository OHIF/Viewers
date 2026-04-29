import { BaseTool, drawing } from '@cornerstonejs/tools';
import { metaData } from '@cornerstonejs/core';

/**
 * Custom ScaleBarTool implementation.
 *
 * 1. A tool that displays a ScaleBar on the bottom and right of the Viewport.
 * 2. Generated based on the DICOM image's Tag:'PixelSpacing'.
 * 3. Configuration properties determine location, color, number of ticks, etc.
 */
class ScaleBarTool extends BaseTool {
  static toolName = 'ScaleBar';

  constructor(
    toolProps = {},
    defaultToolProps = {
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {
        location: 'bottom-right',
        color: 'rgb(255, 0, 0)',
        lineWidth: 2,
        fontSize: '14px',
        numDivisions: 20, // Number of divisions in the scale bar
      },
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  onSetToolEnabled = (): void => {
    // Enable rendering
  };

  onSetToolDisabled = (): void => {
    // Disable rendering
  };

  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    const { viewport } = enabledElement;

    const imageId = viewport.getCurrentImageId();
    if (!imageId) {
      return;
    }

    const imagePlaneModule = metaData.get('imagePlaneModule', imageId);
    if (!imagePlaneModule || !imagePlaneModule.pixelSpacing) {
      return;
    }

    const { pixelSpacing } = imagePlaneModule;

    // Get the SVG element dimensions (not canvas)
    // The SVG is what we're actually drawing on
    const svgElement = svgDrawingHelper.getSvgNode
      ? svgDrawingHelper.svgLayerElement
      : enabledElement.viewport.element.querySelector('.svg-layer');

    if (!svgElement) {
      return;
    }

    const svgRect = svgElement.getBoundingClientRect();
    const canvasWidth = svgRect.width;
    const canvasHeight = svgRect.height;
    const targetWidth = canvasWidth * 1.0; // Target 100% of viewport width for horizontal (400% increase)
    const targetHeight = canvasHeight * 1.0; // Target 100% of viewport height for vertical (400% increase)

    // Convert target width/height to physical units (mm)
    const topLeftCanvas = [0, 0];
    const topLeftWorld = viewport.canvasToWorld(topLeftCanvas);
    const topRightCanvas = [targetWidth, 0];
    const topRightWorld = viewport.canvasToWorld(topRightCanvas);
    const bottomLeftCanvas = [0, targetHeight];
    const bottomLeftWorld = viewport.canvasToWorld(bottomLeftCanvas);

    // Horizontal distance in mm
    const hDistanceWorld = Math.sqrt(
      Math.pow(topRightWorld[0] - topLeftWorld[0], 2) +
        Math.pow(topRightWorld[1] - topLeftWorld[1], 2) +
        Math.pow(topRightWorld[2] - topLeftWorld[2], 2)
    );

    // Vertical distance in mm
    const vDistanceWorld = Math.sqrt(
      Math.pow(bottomLeftWorld[0] - topLeftWorld[0], 2) +
        Math.pow(bottomLeftWorld[1] - topLeftWorld[1], 2) +
        Math.pow(bottomLeftWorld[2] - topLeftWorld[2], 2)
    );

    // distanceWorld is in mm (usually)
    // We want a nice round number for the scale bar
    // Extended range: 0.1mm to 2000mm (2m) for extreme zoom levels
    const niceDistances = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]; // mm

    // Calculate bestDistance for horizontal
    let hBestDistance = niceDistances[0];
    for (const dist of niceDistances) {
      if (dist <= hDistanceWorld * 0.8) {
        hBestDistance = dist;
      }
    }

    // Calculate bestDistance for vertical
    let vBestDistance = niceDistances[0];
    for (const dist of niceDistances) {
      if (dist <= vDistanceWorld * 0.8) {
        vBestDistance = dist;
      }
    }

    // Use the smaller bestDistance for both scale bars (synchronized)
    const bestDistance = Math.min(hBestDistance, vBestDistance);

    // Calculate canvas length for bestDistance
    const canvasLength = (bestDistance / hDistanceWorld) * targetWidth;

    // Number of divisions
    const numDivisions = this.configuration.numDivisions || 20;

    // Draw
    const svgns = 'http://www.w3.org/2000/svg';

    // ===== HORIZONTAL SCALE BAR (Bottom Center-Right, avoiding left info area) =====
    const hSvgNodeHash = `scale-bar-h-${viewport.id}`;
    const hExistingElement = svgDrawingHelper.getSvgNode(hSvgNodeHash);

    // Position: Bottom area, horizontally centered within available area
    // Leave at least 20% of width on left for info display, 5% on right for vertical ScaleBar
    const padding = 20;
    const textOffset = 18; // Space for text outside the image
    const leftMargin = canvasWidth * 0.2; // Avoid left 20% where info is displayed
    const rightMargin = canvasWidth * 0.05; // Avoid right 5% for vertical ScaleBar
    const hAvailableWidth = canvasWidth - leftMargin - rightMargin; // Available width for horizontal ScaleBar
    const hStartX = leftMargin + (hAvailableWidth - canvasLength) / 2; // Horizontally centered
    const hStartY = canvasHeight - padding - textOffset; // Move ScaleBar up to make room for text below

    // Tick height for ruler divisions (increased for better visibility)
    const tickHeight = 12;

    // Generate horizontal path with 20 divisions
    const hPathD = this._generateHorizontalPath(
      hStartX,
      hStartY,
      canvasLength,
      numDivisions,
      tickHeight
    );

    // Horizontal text attributes - positioned below ScaleBar (outside image area)
    const hTextAttributes = {
      x: hStartX + canvasLength / 2,
      y: hStartY + tickHeight + 14, // Below the ScaleBar ticks
      fill: this.configuration.color,
      'font-size': this.configuration.fontSize,
      'text-anchor': 'middle',
      'pointer-events': 'none',
    };

    // Per-division distance for display
    const perDivisionMm = bestDistance / numDivisions;
    const hLabelText = perDivisionMm >= 1 ? `${perDivisionMm} mm` : `${perDivisionMm * 1000} µm`;

    if (hExistingElement) {
      drawing.setAttributesIfNecessary(
        {
          d: hPathD,
          stroke: this.configuration.color,
          'stroke-width': this.configuration.lineWidth,
          fill: 'none',
        },
        hExistingElement.querySelector('path')
      );

      const hTextElement = hExistingElement.querySelector('text');
      hTextElement.textContent = hLabelText;
      drawing.setAttributesIfNecessary(
        { x: hStartX + canvasLength / 2, y: hStartY + tickHeight + 14 },
        hTextElement
      );

      svgDrawingHelper.setNodeTouched(hSvgNodeHash);
    } else {
      const hGroup = document.createElementNS(svgns, 'g');
      hGroup.setAttribute('data-id', hSvgNodeHash);

      const hPath = document.createElementNS(svgns, 'path');
      drawing.setNewAttributesIfValid(
        {
          d: hPathD,
          stroke: this.configuration.color,
          'stroke-width': this.configuration.lineWidth,
          fill: 'none',
        },
        hPath
      );
      hGroup.appendChild(hPath);

      const hText = document.createElementNS(svgns, 'text');
      drawing.setNewAttributesIfValid(hTextAttributes, hText);
      hText.textContent = hLabelText;
      hGroup.appendChild(hText);

      svgDrawingHelper.appendNode(hGroup, hSvgNodeHash);
    }

    // ===== VERTICAL SCALE BAR (Right side) =====
    const vSvgNodeHash = `scale-bar-v-${viewport.id}`;
    const vExistingElement = svgDrawingHelper.getSvgNode(vSvgNodeHash);

    // Calculate vertical canvas length using the synchronized bestDistance
    const vCanvasLength = (bestDistance / vDistanceWorld) * targetHeight;

    // Position: Right side, vertically centered
    // Move ScaleBar left to make room for text on the right (outside image area)
    // Leave 5% at the bottom to avoid overlapping with horizontal ScaleBar
    const bottomMargin = canvasHeight * 0.05; // Avoid bottom 5% for horizontal ScaleBar
    const vStartX = canvasWidth - padding - textOffset;
    const vAvailableHeight = canvasHeight - bottomMargin;
    const vStartY = (vAvailableHeight - vCanvasLength) / 2;

    // Generate vertical path with 20 divisions
    const vPathD = this._generateVerticalPath(
      vStartX,
      vStartY,
      vCanvasLength,
      numDivisions,
      tickHeight
    );

    // Vertical text attributes (rotated) - positioned to the right of ScaleBar (outside image area)
    const vPerDivisionMm = bestDistance / numDivisions;
    const vLabelText = vPerDivisionMm >= 1 ? `${vPerDivisionMm} mm` : `${vPerDivisionMm * 1000} µm`;

    const vTextX = vStartX + tickHeight + 14; // Right of the ScaleBar ticks
    const vTextAttributes = {
      x: vTextX,
      y: vStartY + vCanvasLength / 2,
      fill: this.configuration.color,
      'font-size': this.configuration.fontSize,
      'text-anchor': 'middle',
      'pointer-events': 'none',
      'writing-mode': 'vertical-rl',
      transform: `rotate(180, ${vTextX}, ${vStartY + vCanvasLength / 2})`,
    };

    if (vExistingElement) {
      drawing.setAttributesIfNecessary(
        {
          d: vPathD,
          stroke: this.configuration.color,
          'stroke-width': this.configuration.lineWidth,
          fill: 'none',
        },
        vExistingElement.querySelector('path')
      );

      const vTextElement = vExistingElement.querySelector('text');
      vTextElement.textContent = vLabelText;
      drawing.setAttributesIfNecessary(
        {
          x: vTextX,
          y: vStartY + vCanvasLength / 2,
          transform: `rotate(180, ${vTextX}, ${vStartY + vCanvasLength / 2})`,
        },
        vTextElement
      );

      svgDrawingHelper.setNodeTouched(vSvgNodeHash);
    } else {
      const vGroup = document.createElementNS(svgns, 'g');
      vGroup.setAttribute('data-id', vSvgNodeHash);

      const vPath = document.createElementNS(svgns, 'path');
      drawing.setNewAttributesIfValid(
        {
          d: vPathD,
          stroke: this.configuration.color,
          'stroke-width': this.configuration.lineWidth,
          fill: 'none',
        },
        vPath
      );
      vGroup.appendChild(vPath);

      const vText = document.createElementNS(svgns, 'text');
      drawing.setNewAttributesIfValid(vTextAttributes, vText);
      vText.textContent = vLabelText;
      vGroup.appendChild(vText);

      svgDrawingHelper.appendNode(vGroup, vSvgNodeHash);
    }

    return true;
  };

  /**
   * Generate SVG path for horizontal scale bar with tick marks
   */
  _generateHorizontalPath(
    startX: number,
    startY: number,
    length: number,
    numDivisions: number,
    tickHeight: number
  ): string {
    let pathD = '';

    // Draw horizontal baseline
    pathD += `M ${startX} ${startY} L ${startX + length} ${startY}`;

    // Draw tick marks
    for (let i = 0; i <= numDivisions; i++) {
      const x = startX + (length * i) / numDivisions;
      let currentTickHeight: number;

      if (i === 0 || i === numDivisions) {
        // End ticks - tallest
        currentTickHeight = tickHeight;
      } else if (i % 10 === 0) {
        // Every 10th division - medium
        currentTickHeight = tickHeight * 0.8;
      } else if (i % 5 === 0) {
        // Every 5th division - smaller
        currentTickHeight = tickHeight * 0.6;
      } else {
        // Regular divisions - smallest
        currentTickHeight = tickHeight * 0.4;
      }

      pathD += ` M ${x} ${startY - currentTickHeight} L ${x} ${startY}`;
    }

    return pathD;
  }

  /**
   * Generate SVG path for vertical scale bar with tick marks
   */
  _generateVerticalPath(
    startX: number,
    startY: number,
    length: number,
    numDivisions: number,
    tickHeight: number
  ): string {
    let pathD = '';

    // Draw vertical baseline
    pathD += `M ${startX} ${startY} L ${startX} ${startY + length}`;

    // Draw tick marks
    for (let i = 0; i <= numDivisions; i++) {
      const y = startY + (length * i) / numDivisions;
      let currentTickHeight: number;

      if (i === 0 || i === numDivisions) {
        // End ticks - tallest
        currentTickHeight = tickHeight;
      } else if (i % 10 === 0) {
        // Every 10th division - medium
        currentTickHeight = tickHeight * 0.8;
      } else if (i % 5 === 0) {
        // Every 5th division - smaller
        currentTickHeight = tickHeight * 0.6;
      } else {
        // Regular divisions - smallest
        currentTickHeight = tickHeight * 0.4;
      }

      pathD += ` M ${startX - currentTickHeight} ${y} L ${startX} ${y}`;
    }

    return pathD;
  }
}

export default ScaleBarTool;
