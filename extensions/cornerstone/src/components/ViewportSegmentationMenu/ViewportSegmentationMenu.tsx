import React, { useEffect, useState } from 'react'
import { Button, Icons, ScrollArea  } from '@ohif/ui-next'

function ViewportSegmentationMenu({ viewportId, displaySets, servicesManager, commandsManager, location }) {
  const { segmentationService } = servicesManager.services;
  const [representations, setRepresentations] = useState(segmentationService.getSegmentationRepresentations(viewportId));
  const [selectedRepresentationId , setSelectedRepresentationId] = useState(null);
  const [allVisibleIcon, setAllVisibleIcon] = useState(true);

  useEffect(() => {
    const representations = segmentationService.getSegmentationRepresentations(viewportId);
    setRepresentations(representations);

    // re-evaluate allVisibleIcon
      const allVisible = representations.length > 0 && representations.every(rep => rep.visible);
      console.debug("🚀 ~ allVisible:", allVisible);
      const allInvisible = representations.length > 0 && representations.every(rep => !rep.visible);
      console.debug("🚀 ~ allInvisible:", allInvisible);

      if (allVisible) {
        setAllVisibleIcon(true);
      } else if (allInvisible) {
        setAllVisibleIcon(false);
      }
  }, [viewportId]);

  useEffect(() => {
    const eventSubscriptions = [
      segmentationService.EVENTS.SEGMENTATION_MODIFIED,
      segmentationService.EVENTS.SEGMENTATION_REMOVED,
      segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
    ];

    const allUnsubscribeFunctions = eventSubscriptions.map(evt => {
      const { unsubscribe } = segmentationService.subscribe(evt, () => {
        const representations = segmentationService.getSegmentationRepresentations(viewportId);
        setRepresentations(representations);
        // re-evaluate allVisibleIcon
      const allVisible = representations.length > 0 && representations.every(rep => rep.visible);
      const allInvisible = representations.length > 0 && representations.every(rep => !rep.visible);

      if (allVisible) {
        setAllVisibleIcon(true);
      } else if (allInvisible) {
          setAllVisibleIcon(false);
        }
      });



      return unsubscribe;
    });

    return () => {
      allUnsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [segmentationService, viewportId]);

  const onSelectItem = (representationId) => {
    setSelectedRepresentationId(representationId);
  };

  const onToggleVisibility = (representationId) => {
    if (representationId === 'all') {
      // Check if any representations are currently visible
      const anyVisible = representations.some(rep => rep.visible);

      // Toggle visibility based on current state
      representations.forEach(rep => {
        segmentationService.setSegmentationVisibility(
          viewportId,
          rep.segmentationId,
          !anyVisible
        );
      });
    } else {
      const representation = representations.find(rep => rep.id === representationId);
      segmentationService.toggleSegmentationVisibility(viewportId, representation.segmentationId);
    }
  };

  if (!representations.length) {
    return (
      <div className="bg-muted">
        No Segmentations Available
      </div>
    )
  };

  return (
    <div className="flex h-full w-[262px] flex-col">
      <ScrollArea className="bg-muted h-[132px] rounded-t border-gray-300 p-1">
         <ul
          aria-label="Item List"
          className="space-y-1"
        >
          {/* All Item */}
          <li key="all">
            <div className="flex items-center">
              <button
                onClick={() => onSelectItem('all')}
                className={`text-foreground flex h-7 w-full flex-grow cursor-pointer items-center justify-between rounded p-1 text-sm ${
                  'all' === selectedRepresentationId ? 'bg-primary/20' : 'bg-muted hover:bg-primary/30'
                } focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1`}
                aria-pressed={'all' === selectedRepresentationId}
              >
                <span className="ml-1">All Items</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={e => {
                    e.stopPropagation();
                    onToggleVisibility('all');
                  }}
                  aria-label={`Toggle visibility`}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {allVisibleIcon ? <Icons.EyeVisible /> : <Icons.EyeHidden />}
                  </div>
                </Button>
              </button>
            </div>
          </li>
          {/* Individual Representations */}
          {representations.map(representation => (
            <li key={representation.id}>
              <div className="flex items-center">
                <button
                  onClick={() => onSelectItem(representation.id)}
                  className={`text-foreground flex h-7 w-full flex-grow cursor-pointer items-center justify-between rounded p-1 text-sm ${
                    representation.id === selectedRepresentationId ? 'bg-primary/20' : 'bg-muted hover:bg-primary/30'
                  } focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1`}
                  aria-pressed={representation.id === selectedRepresentationId}
                >
                  <span className="ml-1">{representation.label}</span>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={e => {
                      e.stopPropagation(); // Prevent parent onClick
                      onToggleVisibility(representation.id);
                    }}
                    aria-label={
                      representation.visible ? `Hide ${representation.label}` : `Show ${representation.label}`
                    }
                  >
                    {representation.visible ? (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <Icons.EyeVisible />
                        </div>
                    ) : (
                      <div className="w-4 h-4 flex items-center justify-center">
                        <Icons.EyeHidden />
                      </div>
                    )}
                  </Button>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

export default ViewportSegmentationMenu;
