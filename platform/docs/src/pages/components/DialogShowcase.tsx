import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '../../../../ui-next/src/components/Dialog/Dialog';
import { Button } from '../../../../ui-next/src/components/Button';
import ShowcaseRow from './ShowcaseRow';

/**
 * DialogShowcase demonstrates a simple Radix‑based dialog.
 */
export default function DialogShowcase() {
  return (
    <ShowcaseRow
      title="Dialog"
      description="Modal dialog with header, content, and footer actions."
      code={`
<Dialog>
  <DialogTrigger asChild>
    <Button variant="default">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Example Dialog</DialogTitle>
    </DialogHeader>
    <DialogDescription>
      This is a short message inside the dialog.
    </DialogDescription>
    <DialogFooter>
      <Button variant="default">OK</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      `}
    >
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Example Dialog</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            This is a short message inside the dialog.
          </DialogDescription>
          <DialogFooter>
            <Button variant="default">OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShowcaseRow>
  );
}