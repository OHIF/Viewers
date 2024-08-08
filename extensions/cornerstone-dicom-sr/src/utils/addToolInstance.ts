import { addTool } from '@cornerstonejs/tools';

export default function addToolInstance(name: string, toolClass, configuration = {}): void {
  class InstanceClass extends toolClass {
    static toolName = name;
    constructor(toolProps, defaultToolProps) {
      if (toolProps.configuration) {
        toolProps.configuration = { ...toolProps.configuration, ...configuration };
      } else {
        toolProps.configuration = configuration;
      }
      super(toolProps, defaultToolProps);
    }
  }
  addTool(InstanceClass);
}
