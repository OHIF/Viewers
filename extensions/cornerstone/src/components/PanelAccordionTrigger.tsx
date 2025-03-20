import React from 'react';
import { AccordionTrigger, ColorCircle } from '@ohif/ui-next';
import { ChevronDownIcon } from '@radix-ui/react-icons';

function onClickDefault(e) {
  const { group, onClick = group?.onClick } = this;
  if (!onClick) {
    console.log('No onClick function', group);
    return;
  }
  console.log('onClickDefault');
  e.preventDefault();
  e.stopPropagation();

  onClick(e, group);

  return false;
}

export default function PanelAccordionTrigger(props) {
  const { marginLeft = 8, isActive = false, colorHex, count, text, menu: Menu = null } = props;

  return (
    <AccordionTrigger
      style={{ marginLeft: `${marginLeft}px`, padding: 0 }}
      asChild={true}
    >
      <div className={`inline-flex text-base ${isActive ? 'bg-popover' : 'bg-muted'} flex-grow`}>
        <button onClick={onClickDefault.bind(props)}>
          <span
            className={`inline-flex rounded-l border-r border-black ${isActive ? 'bg-highlight' : 'bg-muted'}`}
          >
            {count !== undefined ? <span className="px-2">{count}</span> : null}
            {colorHex && <ColorCircle colorHex={colorHex} />}
          </span>
          <span>{text}</span>
        </button>
        {Menu && (
          <Menu
            {...props}
            classNames="justify-end flex-grow"
          />
        )}
        <ChevronDownIcon className="text-primary h-4 w-4 shrink-0 transition-transform duration-200" />
      </div>
    </AccordionTrigger>
  );
}
