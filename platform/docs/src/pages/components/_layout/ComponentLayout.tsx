import React, { useState, useRef } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { sidebarSections } from './sidebar-config';
import TableOfContents from './TableOfContents';

interface ComponentLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function ComponentLayout({ title, description, children }: ComponentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLElement>(null);
  const { pathname: currentPath } = useLocation();
  const { ScrollArea } = require('../../../../../ui-next/src/components/ScrollArea');

  return (
    <Layout
      title={title}
      description={description || `OHIF ${title} component documentation`}
    >
      <div className="showcase-isolated flex min-h-screen font-['Inter',sans-serif] bg-background">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-[60px] left-0 z-50 flex h-8 w-8 items-center justify-center rounded-r-md bg-muted text-foreground lg:hidden"
          aria-label="Toggle sidebar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {sidebarOpen ? (
              <path d="M4 4l8 8M12 4l-8 8" />
            ) : (
              <path d="M2 4h12M2 8h12M2 12h12" />
            )}
          </svg>
        </button>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-[60px] left-0 z-40 h-[calc(100vh-60px)] w-60 shrink-0
            component-sidebar bg-background
            transition-transform duration-200
            lg:sticky lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <ScrollArea className="h-full">
            <nav className="px-3 pt-4 pb-8">
              {sidebarSections.map(section => (
                <div
                  key={section.title}
                  className="mb-4"
                >
                  <h4 className="mb-1 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {section.title}
                  </h4>
                  <ul className="space-y-0.5">
                    {section.items.map(item => {
                      const isActive =
                        currentPath === item.href ||
                        currentPath === item.href + '/';
                      return (
                        <li key={item.href + item.label}>
                          <Link
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              block rounded-md px-2 py-1.5 text-base font-semibold no-underline transition-colors
                              ${
                                isActive
                                  ? 'bg-primary/15 text-primary'
                                  : 'text-muted-foreground hover:bg-muted hover:text-highlight'
                              }
                            `}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Content */}
        <main
          ref={contentRef}
          className="min-w-0 flex-1 px-6 py-8 lg:px-12"
        >
          <div className="mx-auto max-w-4xl pb-36">{children}</div>
        </main>

        {/* Right-hand table of contents */}
        <TableOfContents contentRef={contentRef} />
      </div>
    </Layout>
  );
}
