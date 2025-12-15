import React from 'react';
import { Toolbox } from '@ohif/extension-default';
import { PanelSection } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import ChatSection from './ChatSection';

interface PanelSegmentationWithChatProps {
  extensionManager: any;
}

function PanelSegmentationWithChat({ extensionManager }: PanelSegmentationWithChatProps) {
  const { servicesManager } = useSystem();
  const { toolbarService } = servicesManager.services;

  // Get the PanelSegmentation component from cornerstone extension
  const panelModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.panelModule.panelSegmentation'
  );

  const PanelSegmentation = panelModule?.component;

  return (
    <div className="ohif-scrollbar flex h-full flex-col overflow-auto bg-black">
      {/* Segmentation Tools */}
      <Toolbox
        buttonSectionId={toolbarService.sections.segmentationToolbox}
        title="Segmentation Tools"
      />

      {/* Segmentations Panel */}
      {PanelSegmentation && <PanelSegmentation />}

      {/* Chat Section */}
      <PanelSection defaultOpen={true}>
        <PanelSection.Header>Chat</PanelSection.Header>
        <PanelSection.Content>
          <ChatSection />
        </PanelSection.Content>
      </PanelSection>
    </div>
  );
}

export default PanelSegmentationWithChat;
