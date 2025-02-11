import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { Icons } from '../Icons';

interface AboutDialogProps {
  children: React.ReactNode;
  className?: string;
}

export function AboutDialog({ children, className }: AboutDialogProps) {
  return <div className={cn('text-center', className)}>{children}</div>;
}

/** Sub component: Product Name */
interface ProductNameProps {
  children: React.ReactNode;
  className?: string;
}
function ProductName({ children, className }: ProductNameProps) {
  return (
    <div className={cn('text-foreground pt-3 text-2xl font-semibold leading-none', className)}>
      {children}
    </div>
  );
}

/** Sub-component: Product Version */
interface ProductVersionProps {
  children: React.ReactNode;
  className?: string;
}
function ProductVersion({ children, className }: ProductVersionProps) {
  return (
    <div className={cn('text-muted-foreground text-2xl leading-none', className)}>{children}</div>
  );
}

/** Sub-component: Product Beta */
interface ProductBetaProps {
  children: React.ReactNode;
  className?: string;
}
function ProductBeta({ children, className }: ProductBetaProps) {
  return <div className={cn('text-muted-foreground text-xl', className)}>{children}</div>;
}

/** Sub-component: Body (wraps all detail items) */
interface BodyProps {
  children: React.ReactNode;
  className?: string;
}
function Body({ children, className }: BodyProps) {
  return (
    <div className={cn('my-3 flex flex-col items-center space-y-0', className)}>{children}</div>
  );
}

/** Sub-component: Detail Item */
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

/** Sub-component: Social Item */
interface SocialItemProps {
  icon: string;
  url: string;
  text: string;
  className?: string;
}
function SocialItem({ icon, url, text, className }: SocialItemProps) {
  return (
    <div className={cn('text-foreground mt-4 flex items-center space-x-2', className)}>
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

/** Attach sub-components to AboutDialog as static properties */
AboutDialog.ProductName = ProductName;
AboutDialog.ProductVersion = ProductVersion;
AboutDialog.ProductBeta = ProductBeta;
AboutDialog.Body = Body;
AboutDialog.DetailItem = DetailItem;
AboutDialog.SocialItem = SocialItem;
