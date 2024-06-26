import { codingValues, contextMenuCodeItem, findingsContextMenu } from './custom-context-menu';

export default function getCustomizationModule() {
  return [
    {
      name: 'custom-context-menu',
      value: [codingValues, contextMenuCodeItem, findingsContextMenu],
    },
    {
      name: 'contextMenuCodeItem',
      value: [contextMenuCodeItem],
    },
  ];
}
