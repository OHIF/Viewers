import cornerstone from "cornerstone-core";
import csTools from "cornerstone-tools";

export default class NLFreehandRoiTool extends csTools.FreehandRoiTool {
  constructor(props = {}) {
    super({
      name: "NLFreehandRoi",
      supportedInteractionTypes: ["Mouse", "Touch"],
    });
  }

  _editMouseUpCallback(evt) {
    const eventData = evt.detail;
    const { element } = eventData;
    const toolState = csTools.getToolState(element, this.name);
    const config = this.configuration;
    const data = toolState.data[config.currentTool];

    data.active = false;
    data.highlight = false;
    data.handles.invalidHandlePlacement = false;

    this._deactivateModify(element);

    this._dropHandle(eventData, toolState);

    this._modifying = false;
    data.invalidated = true;
    config.currentHandle = 0;
    config.currentTool = -1;
    data.canComplete = false;

    if (this._drawing) {
      this._deactivateDraw(element);
    }

    this.fireModifiedEvent(element, data);

    cornerstone.updateImage(element);
  }
}
