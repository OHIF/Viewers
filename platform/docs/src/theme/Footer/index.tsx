import React, { type JSX } from 'react';
import Link from '@docusaurus/Link';

function FooterLink({
  href,
  isInternal = true,
  children,
}: {
  href: string;
  isInternal?: boolean;
  children: React.ReactNode;
}) {
  const className =
    'text-[#358cfd] text-[16px] leading-[31px] hover:text-white transition-colors no-underline';

  if (isInternal) {
    return (
      <li>
        <Link className={className} to={href}>
          {children}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <a
        className={className}
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    </li>
  );
}

export default function Footer(): JSX.Element {
  return (
    <footer className="bg-[#050615] text-white pb-12 md:pb-16 pt-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-2">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Column 1: OHIF Title */}
          <div>
            <h4 className="text-[18px] md:text-[20px] leading-[32px] font-normal text-white m-0">
              Open Health
              <br />
              Imaging Foundation
            </h4>
          </div>

          {/* Column 2: Internal Links */}
          <div className="lg:ml-8">
            <ul className="list-none p-0 m-0 space-y-0.5">
              <FooterLink href="https://ohif.org/roadmap" isInternal={false}>
                Roadmap
              </FooterLink>
              <FooterLink href="https://ohif.org/team" isInternal={false}>
                Team
              </FooterLink>
              <FooterLink
                href="https://github.com/OHIF/Viewers/blob/master/LICENSE"
                isInternal={false}
              >
                License
              </FooterLink>
              <FooterLink href="https://ohif.org/release-notes" isInternal={false}>
                Release Notes
              </FooterLink>
            </ul>
          </div>

          {/* Column 3: External Links */}
          <div>
            <ul className="list-none p-0 m-0 space-y-0.5">
              <FooterLink href="https://ohif.org/get-support" isInternal={false}>
                <span className="leading-tight">Support &amp; Collaborate</span>
              </FooterLink>
              <FooterLink
                href="https://github.com/OHIF/Viewers"
                isInternal={false}
              >
                GitHub
              </FooterLink>
              <FooterLink
                href="https://join.slack.com/t/cornerstonejs/shared_invite/zt-3108kuc8m-ON1zP3nWsrgPNv9mM0E5fw"
                isInternal={false}
              >
                Slack Group
              </FooterLink>
              <FooterLink
                href="https://community.ohif.org/"
                isInternal={false}
              >
                Discussions
              </FooterLink>
              <FooterLink
                href="https://www.linkedin.com/company/ohif"
                isInternal={false}
              >
                LinkedIn
              </FooterLink>
            </ul>
          </div>

          {/* Column 4: MGH Logo + License */}
          <div className="md:col-span-3 lg:col-span-3 md:pt-8 lg:pt-0 lg:pl-24">
            <div className="mb-6">
              <a
                href="https://www.massgeneral.org"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/img/mgh-logo-white.svg"
                  alt="Massachusetts General Hospital - Founding Member, Mass General Brigham"
                  className="h-[33px] w-[317px] hover:opacity-75 transition-opacity"
                />
              </a>
            </div>

            <p className="text-[15px] leading-[22px] text-white/50 m-0">
              OHIF is open source software released under the{' '}
              <a
                href="https://github.com/OHIF/Viewers/blob/master/LICENSE"
                target="_blank"
                rel="noreferrer"
                className="mit-license-link"
              >
                MIT license
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
