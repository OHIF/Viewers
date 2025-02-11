import * as React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { Icons } from '../Icons';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function AboutDialog({ open, onOpenChange, children, className }: AboutDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className={cn('max-w-md gap-1 text-center', className)}>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/** Sub component: Product Name */
interface ProductNameProps {
  children: React.ReactNode;
  className?: string;
}
function ProductName({ children, className }: ProductNameProps) {
  return (
    <div className={cn('pt-3 text-2xl font-semibold leading-none', className)}>{children}</div>
  );
}

/** Subcomponent: Product Version */
interface ProductVersionProps {
  children: React.ReactNode;
  className?: string;
}
function ProductVersion({ children, className }: ProductVersionProps) {
  return (
    <div className={cn('text-muted-foreground text-2xl leading-none', className)}>{children}</div>
  );
}

/** Subcomponent: Product Beta */
interface ProductBetaProps {
  children: React.ReactNode;
  className?: string;
}
function ProductBeta({ children, className }: ProductBetaProps) {
  return <div className={cn('text-muted-foreground text-xl', className)}>{children}</div>;
}

/** Subcomponent: Body (wraps all detail items) */
interface BodyProps {
  children: React.ReactNode;
  className?: string;
}
function Body({ children, className }: BodyProps) {
  return (
    <div className={cn('my-3 flex flex-col items-center space-y-0', className)}>{children}</div>
  );
}

/** Subcomponent: Detail Item */
interface DetailItemProps {
  label: string;
  value: string;
  className?: string;
}
function DetailItem({ label, value, className }: DetailItemProps) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="text-muted-foreground pt-2 text-sm font-semibold tracking-wide">{label}</div>
      <div className="text-muted-foreground text-sm">{value}</div>
    </div>
  );
}

/** Subcomponent: Social Item */
interface SocialItemProps {
  icon: string;
  url: string;
  text: string;
  className?: string;
}
function SocialItem({ icon, url, text, className }: SocialItemProps) {
  return (
    <div className={cn('mt-4 flex items-center space-x-2', className)}>
      <div className="mr-2 inline-block">
        <Icons.ByName name={icon} />
      </div>
      <Button
        asChild
        variant="link"
        className="py-6 text-lg"
      >
        <a
          href={`https://github.com/${url}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {text}
        </a>
      </Button>
    </div>
  );
}

/** Subcomponent: Footer */
interface FooterProps {
  children: React.ReactNode;
  className?: string;
}
function Footer({ children, className }: FooterProps) {
  return (
    <DialogFooter className={cn('flex justify-center pt-4', className)}>{children}</DialogFooter>
  );
}

/** Subcomponent: Title */
function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <DialogHeader className={cn('mb-4 text-2xl font-semibold leading-none', className)}>
      <DialogTitle>{children}</DialogTitle>
    </DialogHeader>
  );
}

/** Attach subcomponents to AboutDialog as static properties */
AboutDialog.Title = Title;
AboutDialog.ProductName = ProductName;
AboutDialog.ProductVersion = ProductVersion;
AboutDialog.ProductBeta = ProductBeta;
AboutDialog.Body = Body;
AboutDialog.DetailItem = DetailItem;
AboutDialog.SocialItem = SocialItem;
AboutDialog.Footer = Footer;
