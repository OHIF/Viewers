import React from 'react';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '../../../../ui-next/src/components/HoverCard/HoverCard';
import { Button } from '../../../../ui-next/src/components/Button';
import ShowcaseRow from './ShowcaseRow';

/**
 * HoverCardShowcase demonstrates a Hover Card that appears on pointer hover.
 */
export default function HoverCardShowcase() {
  return (
    <ShowcaseRow
      title="Hover Card"
      description="Lightweight, non‑modal surface that appears on hover or focus."
      code={`
<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="link">Hover me</Button>
  </HoverCardTrigger>
  <HoverCardContent>
    <p className="text-sm">Hello there! I'm a hover card.</p>
  </HoverCardContent>
</HoverCard>
      `}
    >
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="link">Hover me</Button>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm">Hello there! I'm a hover card.</p>
        </HoverCardContent>
      </HoverCard>
    </ShowcaseRow>
  );
}