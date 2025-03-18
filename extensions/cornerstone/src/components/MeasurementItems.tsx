import React from 'react';
import { Accordion, AccordionContent, AccordionItem } from '@ohif/ui-next';

import PanelAccordionTrigger from './PanelAccordionTrigger';
import MeasurementsMenu from './MeasurementsMenu';
import { useSystem } from '@ohif/core';

export function MeasurementItem(props) {
  const { index, item } = props;
  return (
    <PanelAccordionTrigger
      count={index + 1}
      text={item.toolName || item.label || item.title}
      colorHex="#f00"
      isActive={item.isSelected}
      menu={MeasurementsMenu}
      group={{ items: [item], onClick: props.onClick }}
    />
  );
}

export default function MeasurementAccordion(props) {
  const { items } = props;
  const system = useSystem();

  const onClick = (e, group) => {
    const { items } = group;
    // Just jump to the first measurement in the set, and mark that one as active
    // with the set of items.
    system.commandsManager.run('jumpToMeasurement', {
      uid: items[0].uid,
      displayMeasurements: items,
      group,
    });
  };

  return (
    <Accordion
      type="multiple"
      className="flex-shrink-0 overflow-hidden"
    >
      {items.map((item, index) => {
        const { displayText: details = {} } = item;
        return (
          <AccordionItem
            key={`measurementAccordion:${item.uid}`}
            value={item.uid}
          >
            <MeasurementItem
              item={item}
              key={`measurementItem:${item.uid}`}
              index={index}
              onClick={onClick}
            />
            <AccordionContent key={`measurementContent:${item.uid}`}>
              <div className="ml-7 px-2 py-2">
                <div className="text-secondary-foreground flex items-center gap-1 text-base leading-normal">
                  {details.primary?.length > 0 &&
                    details.primary.map((detail, index) => (
                      <span key={`details:${item.uid}:${index}`}>{detail}</span>
                    ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
