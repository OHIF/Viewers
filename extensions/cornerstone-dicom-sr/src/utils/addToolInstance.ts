import { addTool } from '@cornerstonejs/tools';

export default function addToolInstance(name: string, toolClass, configuration = {}): void {
  class InstanceClass extends toolClass {
    static toolName = name;
    constructor(toolProps, defaultToolProps) {
      toolProps.configuration = toolProps.configuration
        ? { ...toolProps.configuration, ...configuration }
        : configuration;
      super(toolProps, defaultToolProps);
    }
  }
  addTool(InstanceClass);
}
