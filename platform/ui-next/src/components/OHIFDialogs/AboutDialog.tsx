import * as React from 'react';
import { Dialog, DialogContent, DialogFooter } from '../Dialog';
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
      <DialogContent className={cn('max-w-md text-center', className)}>{children}</DialogContent>
    </Dialog>
  );
}

/** Subcomponent: Product Name */
interface ProductNameProps {
  children: React.ReactNode;
  className?: string;
}
function ProductName({ children, className }: ProductNameProps) {
  return <div className={cn("text-xl font-semibold", className)}>{children}</div>;
}

/** Subcomponent: Product Version */
interface ProductVersionProps {
  children: React.ReactNode;
  className?: string;
}
function ProductVersion({ children, className }: ProductVersionProps) {
  return <div className={cn("text-muted-foreground text-sm", className)}>{children}</div>;
}

/** Subcomponent: Product Beta */
interface ProductBetaProps {
  children: React.ReactNode;
  className?: string;
}
function ProductBeta({ children, className }: ProductBetaProps) {
  return <div className={cn("text-accent-foreground text-sm", className)}>{children}</div>;
}

/** Subcomponent: Body (wraps all detail items) */
interface BodyProps {
  children: React.ReactNode;
  className?: string;
}
function Body({ children, className }: BodyProps) {
  return <div className={cn("mt-4 flex flex-col items-center space-y-3", className)}>{children}</div>;
}

/** Subcomponent: Detail Title */
interface DetailTitleProps {
  children: React.ReactNode;
  className?: string;
}
function DetailTitle({ children, className }: DetailTitleProps) {
  return <div className={cn("mt-2 text-sm font-semibold uppercase tracking-wide", className)}>{children}</div>;
}

/** Subcomponent: Detail Text */
interface DetailProps {
  children: React.ReactNode;
  className?: string;
}
function Detail({ children, className }: DetailProps) {
  return <div className={cn("text-sm", className)}>{children}</div>;
}

/** Subcomponent: Social Icon (e.g. GitHub logo) */
interface SocialIconProps {
  children: React.ReactNode;
  className?: string;
}
function SocialIcon({ children, className }: SocialIconProps) {
  return <div className={cn("mr-2 inline-block", className)}>{children}</div>;
}

/** Subcomponent: Social Link */
interface SocialLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  className?: string;
}
function SocialLink({ children, className, ...props }: SocialLinkProps) {
  return (
    <a
      className={cn("text-primary text-sm underline", className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
}

/** Subcomponent: Footer */
interface FooterProps {
  children: React.ReactNode;
  className?: string;
}
function Footer({ children, className }: FooterProps) {
  return <DialogFooter className={cn("flex justify-center pt-4", className)}>{children}</DialogFooter>;
}

/** Attach subcomponents to AboutDialog as static properties */
AboutDialog.ProductName = ProductName;
AboutDialog.ProductVersion = ProductVersion;
AboutDialog.ProductBeta = ProductBeta;
AboutDialog.Body = Body;
AboutDialog.DetailTitle = DetailTitle;
AboutDialog.Detail = Detail;
AboutDialog.SocialIcon = SocialIcon;
AboutDialog.SocialLink = SocialLink;
AboutDialog.Footer = Footer;