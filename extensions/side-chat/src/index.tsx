import getPanelModule from './getPanelModule';
import { id } from './id.js';

console.log('[SideChat] Extension loading with ID:', id);

const sideChatExtension = {
  id,
  getPanelModule: (params) => {
    console.log('[SideChat] getPanelModule called');
    const panels = getPanelModule(params);
    console.log('[SideChat] Returning panels:', panels.map(p => p.name));
    return panels;
  },
};

export default sideChatExtension;
