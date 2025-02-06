import * as React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { cn } from '../../lib/utils';
import { Button } from '../Button';

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

/** Subcomponent: Product Name */
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

/** Subcomponent: Detail Title */
interface DetailTitleProps {
  children: React.ReactNode;
  className?: string;
}
function DetailTitle({ children, className }: DetailTitleProps) {
  return (
    <div
      className={cn('text-muted-foreground pt-2 text-sm font-semibold tracking-wide', className)}
    >
      {children}
    </div>
  );
}

/** Subcomponent: Detail Text */
interface DetailProps {
  children: React.ReactNode;
  className?: string;
}
function Detail({ children, className }: DetailProps) {
  return <div className={cn('text-muted-foreground text-sm', className)}>{children}</div>;
}

/** Subcomponent: Social Icon (e.g. GitHub logo) */
interface SocialIconProps {
  children: React.ReactNode;
  className?: string;
}
function SocialIcon({ children, className }: SocialIconProps) {
  return <div className={cn('mr-2 inline-block', className)}>{children}</div>;
}

/** Subcomponent: Social Link */
interface SocialLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  className?: string;
}
function SocialLink({ children, className, ...props }: SocialLinkProps) {
  return (
    <Button
      asChild
      variant="link"
      className={cn('py-6 text-lg', className)}
    >
      <a
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    </Button>
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
AboutDialog.DetailTitle = DetailTitle;
AboutDialog.Detail = Detail;
AboutDialog.SocialIcon = SocialIcon;
AboutDialog.SocialLink = SocialLink;
AboutDialog.Footer = Footer;
