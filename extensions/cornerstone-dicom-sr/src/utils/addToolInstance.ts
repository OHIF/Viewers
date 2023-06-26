import { addTool } from '@cornerstonejs/tools';

export default function addToolInstance(
  name: string,
  toolClass,
  configuration?
): void {
  class InstanceClass extends toolClass {
    static toolName = name;
    static baseToolName = toolClass.toolName;
  }
  addTool(InstanceClass);
}
