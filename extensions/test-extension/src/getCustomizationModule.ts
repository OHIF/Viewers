import { codingValues, contextMenuCodeItem, findingsContextMenu } from './custom-context-menu';

export default function getCustomizationModule() {
  return {
    'custom-context-menu': [codingValues, contextMenuCodeItem, findingsContextMenu],
    contextMenuCodeItem: [contextMenuCodeItem],
  };
}
