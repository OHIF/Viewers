import React, { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  text: string;
}

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLElement>;
}

export default function TableOfContents({ contentRef }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const discoverHeadings = () => {
      const h2s = container.querySelectorAll('h2[id]');
      if (h2s.length === 0) return false;
      const sections = Array.from(h2s).map(h2 => ({
        id: h2.id,
        text: h2.textContent || '',
      }));
      setHeadings([{ id: 'overview', text: 'Overview' }, ...sections]);
      return true;
    };

    if (discoverHeadings()) return;

    // BrowserOnly content renders after mount — watch for it
    const observer = new MutationObserver(() => {
      if (discoverHeadings()) observer.disconnect();
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY + 80;
      let current = headings[0]?.id || '';

      for (const { id } of headings) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollTop) {
          current = id;
        }
      }

      setActiveId(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden w-44 shrink-0 xl:block">
      <div className="sticky top-[60px] overflow-y-auto py-8 pl-4">
        <p className="mb-3 text-sm font-medium text-foreground">
          On This Page
        </p>
        <ul className="space-y-0.5 border-l border-border">
          {headings.map(({ id, text }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`
                  -ml-px block border-l py-1 pl-3 text-sm no-underline transition-colors
                  ${
                    activeId === id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
