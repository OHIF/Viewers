import React, { useState } from 'react';
import '../css/custom.css';
import BrowserOnly from '@docusaurus/BrowserOnly';

const themes: Record<string, string> = {
  default: `--highlight: 191 74% 63%;
--neutral: 213 22% 59%;
--neutral-light: 214 69% 81%;
--neutral-dark: 214 16% 21%;
--background: 0 0% 0%;
--foreground: 0 0% 98%;
--card: 234 64% 10%;
--card-foreground: 0 0% 98%;
--popover: 219 90% 15%;
--popover-foreground: 0 0% 98%;
--primary: 214 98% 60%;
--primary-foreground: 0 0% 98%;
--secondary: 214 65% 36%;
--secondary-foreground: 200 50% 84%;
--muted: 234 64% 10%;
--muted-foreground: 200 46% 65%;
--accent: 217 79% 24%;
--accent-foreground: 0 0% 98%;
--destructive: 0 62.8% 30.6%;
--destructive-foreground: 0 0% 98%;
--border: 0 0% 14.9%;
--input: 236 52% 30%;
--ring: 214 98% 60%;`,

  orchid: `--highlight: 292 75% 62%;
--neutral: 270 18% 55%;
--neutral-light: 275 35% 75%;
--neutral-dark: 268 20% 24%;
--background: 270 45% 6%;
--foreground: 280 15% 96%;
--card: 268 40% 10%;
--card-foreground: 280 15% 96%;
--popover: 264 48% 13%;
--popover-foreground: 280 15% 96%;
--primary: 270 85% 65%;
--primary-foreground: 0 0% 98%;
--secondary: 268 45% 32%;
--secondary-foreground: 275 45% 88%;
--muted: 268 40% 10%;
--muted-foreground: 272 30% 60%;
--accent: 268 50% 20%;
--accent-foreground: 280 15% 96%;
--destructive: 0 65% 40%;
--destructive-foreground: 0 0% 98%;
--border: 268 30% 18%;
--input: 268 40% 25%;
--ring: 270 80% 60%;`,

  verdant: `--highlight: 152 79% 52%;
--neutral: 150 15% 52%;
--neutral-light: 145 30% 72%;
--neutral-dark: 155 18% 24%;
--background: 155 40% 5%;
--foreground: 140 15% 95%;
--card: 152 35% 9%;
--card-foreground: 140 15% 95%;
--popover: 167 65% 10%;
--popover-foreground: 140 15% 95%;
--primary: 152 75% 40%;
--primary-foreground: 155 50% 8%;
--secondary: 150 40% 26%;
--secondary-foreground: 145 40% 85%;
--muted: 152 35% 9%;
--muted-foreground: 148 25% 55%;
--accent: 150 45% 16%;
--accent-foreground: 140 15% 95%;
--destructive: 0 65% 38%;
--destructive-foreground: 0 0% 98%;
--border: 150 25% 16%;
--input: 150 35% 22%;
--ring: 152 75% 40%;`,

  arctic: `--highlight: 173 81% 52%;
--neutral: 185 20% 55%;
--neutral-light: 180 40% 78%;
--neutral-dark: 190 18% 22%;
--background: 0 0% 0%;
--foreground: 180 10% 97%;
--card: 203 39% 9%;
--card-foreground: 180 10% 97%;
--popover: 202 54% 11%;
--popover-foreground: 180 10% 97%;
--primary: 175 85% 42%;
--primary-foreground: 185 50% 8%;
--secondary: 180 45% 28%;
--secondary-foreground: 175 50% 88%;
--muted: 203 39% 9%;
--muted-foreground: 185 30% 60%;
--accent: 185 55% 18%;
--accent-foreground: 180 10% 97%;
--destructive: 0 65% 35%;
--destructive-foreground: 0 0% 98%;
--border: 190 25% 17%;
--input: 223 40% 24%;
--ring: 175 85% 42%;`,

  midnight: `--highlight: 188 90% 58%;
--neutral: 213 22% 59%;
--neutral-light: 214 69% 81%;
--neutral-dark: 214 16% 21%;
--background: 240 15% 3%;
--foreground: 0 0% 99%;
--card: 240 12% 8%;
--card-foreground: 0 0% 99%;
--popover: 225 45% 13%;
--popover-foreground: 0 0% 99%;
--primary: 210 100% 62%;
--primary-foreground: 0 0% 99%;
--secondary: 215 55% 32%;
--secondary-foreground: 200 60% 88%;
--muted: 240 12% 8%;
--muted-foreground: 210 40% 70%;
--accent: 220 65% 20%;
--accent-foreground: 0 0% 99%;
--destructive: 0 70% 35%;
--destructive-foreground: 0 0% 99%;
--border: 240 10% 18%;
--input: 225 35% 24%;
--ring: 210 100% 62%;`,

  slate: `--highlight: 217 97% 52%;
--neutral: 0 0% 55%;
--neutral-light: 0 0% 75%;
--neutral-dark: 0 0% 25%;
--background: 0 0% 0%;
--foreground: 0 0% 96%;
--card: 0 0% 7%;
--card-foreground: 0 0% 96%;
--popover: 0 0% 9%;
--popover-foreground: 0 0% 96%;
--primary: 230 75% 55%;
--primary-foreground: 0 0% 98%;
--secondary: 0 0% 25%;
--secondary-foreground: 0 0% 85%;
--muted: 0 0% 7%;
--muted-foreground: 0 0% 60%;
--accent: 0 0% 18%;
--accent-foreground: 0 0% 96%;
--destructive: 0 65% 40%;
--destructive-foreground: 0 0% 98%;
--border: 0 0% 18%;
--input: 0 0% 22%;
--ring: 215 75% 55%;`,

  deep: `--highlight: 184 53% 54%;
--neutral: 215 15% 50%;
--neutral-light: 210 20% 68%;
--neutral-dark: 220 18% 22%;
--background: 0 0% 0%;
--foreground: 215 15% 82%;
--card: 218 25% 5%;
--card-foreground: 215 15% 82%;
--popover: 215 30% 8%;
--popover-foreground: 215 15% 82%;
--primary: 200 43% 48%;
--primary-foreground: 210 20% 92%;
--secondary: 218 30% 18%;
--secondary-foreground: 215 25% 75%;
--muted: 214 28% 5%;
--muted-foreground: 215 18% 48%;
--accent: 216 32% 12%;
--accent-foreground: 215 15% 82%;
--destructive: 0 50% 35%;
--destructive-foreground: 0 15% 90%;
--border: 218 22% 10%;
--input: 216 28% 15%;
--ring: 215 45% 42%;`,
};

function Swatch({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        border: '1px solid rgba(255,255,255,0.1)',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    />
  );
}

function SwatchSm({ color }: { color: string }) {
  return (
    <span
      className="mr-1.5 inline-block rounded-full align-middle"
      style={{
        width: 14,
        height: 14,
        background: color,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    />
  );
}

function TokenRow({
  color,
  token,
  children,
}: {
  color: string;
  token: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 grid items-start gap-x-3" style={{ gridTemplateColumns: '24px 200px 1fr' }}>
      <Swatch color={color} />
      <code className="bg-transparent pl-0 pt-0.5 text-sm text-[#7cacf8]">{token}</code>
      <div className="text-secondary-foreground text-lg">{children}</div>
    </div>
  );
}

function SwatchSet({ colors }: { colors: string[] }) {
  return (
    <div className="flex items-center">
      {colors.map((c, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 36,
            height: 36,
            background: c,
            border: '2px solid #232323',
            marginLeft: i > 0 ? -13 : 0,
          }}
        />
      ))}
    </div>
  );
}

function CopyThemeLink({ themeName }: { themeName: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    const tokens = themes[themeName];
    if (!tokens) return;
    try {
      await navigator.clipboard.writeText(tokens);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = tokens;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <a
      href="#"
      onClick={handleCopy}
      aria-label={`Copy ${themeName} theme tokens`}
      className="whitespace-nowrap text-[13px] no-underline transition-colors"
      style={{ color: copied ? '#6ee7b7' : '#7cacf8' }}
    >
      {copied ? 'Copied!' : 'Copy Theme'}
    </a>
  );
}

function ThemeRow({
  backgrounds,
  text,
  interactive,
  name,
  previewUrl,
  themeName,
}: {
  backgrounds: string[];
  text: string[];
  interactive: string[];
  name: string;
  previewUrl: string;
  themeName: string;
}) {
  return (
    <>
      <SwatchSet colors={backgrounds} />
      <SwatchSet colors={text} />
      <SwatchSet colors={interactive} />
      <span className="pl-3.5 text-[15px] text-[#999]">{name}</span>
      <a
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Preview ${name} theme in Viewer`}
        className="whitespace-nowrap text-[13px] text-primary no-underline hover:underline"
      >
        Preview in Viewer
      </a>
      <CopyThemeLink themeName={themeName} />
    </>
  );
}

function ContrastTable({
  rows,
}: {
  rows: Array<{
    fgLabel: string;
    fgColor: string;
    bgLabel: string;
    bgColor: string;
    result: string;
    requirement: string;
  }>;
}) {
  return (
    <table className="my-4 mb-6 w-full border-collapse text-[15px]" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th className="border-b border-[#333] px-3 py-2 text-left text-[13px] font-medium uppercase tracking-wider text-[#999]" style={{ width: '30%' }}>Foreground</th>
          <th className="border-b border-[#333] px-3 py-2 text-left text-[13px] font-medium uppercase tracking-wider text-[#999]" style={{ width: '30%' }}>Background</th>
          <th className="border-b border-[#333] px-3 py-2 text-left text-[13px] font-medium uppercase tracking-wider text-[#999]" style={{ width: '16%' }}>Result</th>
          <th className="border-b border-[#333] px-3 py-2 text-left text-[13px] font-medium uppercase tracking-wider text-[#999]" style={{ width: '24%' }}>Requirements</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="border-b border-[#1a1a1a] px-3 py-2.5">
              <SwatchSm color={r.fgColor} />
              <code className="bg-transparent text-[13px] text-[#7cacf8]">{r.fgLabel}</code>
            </td>
            <td className="border-b border-[#1a1a1a] px-3 py-2.5">
              <SwatchSm color={r.bgColor} />
              <code className="bg-transparent text-[13px] text-[#7cacf8]">{r.bgLabel}</code>
            </td>
            <td className="border-b border-[#1a1a1a] px-3 py-2.5">{r.result}</td>
            <td className="border-b border-[#1a1a1a] px-3 py-2.5 text-[#666]">{r.requirement}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Accordion({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const buttonId = id ? `${id}-button` : undefined;
  const contentId = id ? `${id}-content` : undefined;
  return (
    <div id={id} className="my-2 mb-9 rounded-lg border border-[#222] bg-[#0a0a0a] px-5">
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center bg-transparent py-4 text-left text-lg font-normal text-white"
        style={{ border: 'none', cursor: 'pointer' }}
      >
        <span
          aria-hidden="true"
          className="mr-2 inline-block text-[#7cacf8] transition-transform"
          style={{ transform: open ? 'rotate(90deg)' : 'none' }}
        >
          &#x25B8;
        </span>
        {title}
      </button>
      {open && (
        <div id={contentId} role="region" aria-labelledby={buttonId} className="mb-4 border-t border-[#222] pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

const BASE_VIEWER = 'https://ohif-theme-apply.netlify.app/viewer?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5&theme=';

function ThemingPageContent() {
  const ComponentLayout = require('./components/_layout/ComponentLayout').default;
  const PageHeader = require('./components/_layout/PageHeader').default;
  const Section = require('./components/_layout/Section').default;

  return (
    <ComponentLayout
      title="Colors & Theming"
      description="Color tokens, themes, and accessibility for the OHIF Viewer"
    >
      <PageHeader
        title="Colors & Theming"
        description="How color is used in the OHIF Viewer and how to apply new colors and themes for clinical use."
      />

      {/* ================================ */}
      {/* APPLYING THEMES */}
      {/* ================================ */}

      <Section title="Applying Themes">
        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <p>
            The <strong className="text-foreground">Appearance</strong> dialog can be accessed from the settings menu in the
            main header. Open the <strong className="text-foreground">Theme</strong> dropdown and choose a preset. The
            interface will update immediately, and your selection is remembered the next time
            you open the Viewer. Selecting <strong className="text-foreground">Tonal: OHIF Blue</strong> returns to the default.
          </p>

          <p>
            <em className="text-muted-foreground">Testing custom theme colors:</em> Use this dialog to test your custom themes in
            the viewer{' '}
            <a href="#testing-themes" className="text-primary no-underline hover:underline">(see more details)</a>
          </p>

          <img
            src="/img/theming-dialog-01-select-theme.png"
            alt="Appearance modal with the Theme dropdown open, showing the preset options"
            className="my-4 mb-6 w-full rounded-lg border border-[#222]"
          />
        </div>
      </Section>

      {/* ================================ */}
      {/* COLOR TOKENS AND ROLES */}
      {/* ================================ */}

      <Section title="Color Tokens and Roles">
        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <p>
            While these token names are largely shared across many web applications, within the OHIF Viewer design,
            each one plays a specific role in the interface.
          </p>

          <img
            src="/img/theming-color-roles.png"
            alt="Color roles overview"
            className="my-6 mb-8 w-full"
          />
        </div>

        {/* Layering Model Accordion */}
        <Accordion title="Layering Model: colors used for hierarchy" id="layering-model">
          <p className="text-secondary-foreground mb-4 text-lg">
            A set of three background colors are used to create a layering system that shows visual depth
            and hierarchy in the product. Background color use should align with these details:
          </p>

          <h3 className="mt-7 mb-3 text-lg font-medium text-foreground">Three Levels</h3>

          <p className="text-secondary-foreground mb-4 text-lg">
            <strong className="text-foreground">Level 1: Surface</strong>{' '}
            <Swatch color="hsl(0, 0%, 0%)" />{' '}
            <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">background</code>
          </p>
          <ul className="text-secondary-foreground mb-4 list-disc pl-6 text-lg">
            <li className="mb-2">The base layer of the entire interface</li>
            <li className="mb-2">Includes the app shell, panel backgrounds, and empty or negative space</li>
            <li className="mb-2">In the default OHIF theme, this is black to seamlessly match the viewport background</li>
            <li className="mb-2">Changing this from black can create more separation from viewports or add a full background color to panels</li>
          </ul>

          <p className="text-secondary-foreground mb-4 text-lg">
            <strong className="text-foreground">Level 2: Working Space</strong>{' '}
            <Swatch color="hsl(234, 64%, 10%)" />{' '}
            <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">muted</code> or{' '}
            <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">card</code>
          </p>
          <ul className="text-secondary-foreground mb-4 list-disc pl-6 text-lg">
            <li className="mb-2">This is the base content layer of the interface</li>
            <li className="mb-2">Includes panel content areas, dialog backgrounds, rows of data, etc.</li>
            <li className="mb-2">This is the base of the working space separated from the viewer content</li>
          </ul>

          <p className="text-secondary-foreground mb-4 text-lg">
            <strong className="text-foreground">Level 3: Elevated</strong>{' '}
            <Swatch color="hsl(219, 90%, 15%)" />{' '}
            <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">popover</code>
          </p>
          <ul className="text-secondary-foreground mb-4 list-disc pl-6 text-lg">
            <li className="mb-2">The top-most layer, used for UI that floats above the surface</li>
            <li className="mb-2">Includes popovers, dropdown menus, floating components, grouping elements such as panel sections</li>
            <li className="mb-2">Use this for any component that needs to appear &quot;above&quot; the content layer</li>
          </ul>

          <img
            src="/img/theming-layers.png"
            alt="Layering model overview"
            className="my-6 mb-8 w-full"
          />

          <h3 className="mt-7 mb-3 text-lg font-medium text-foreground">Creating Contrast</h3>
          <ul className="text-secondary-foreground mb-4 list-disc pl-6 text-lg">
            <li className="mb-2">
              The <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">primary</code> color
              is used across these different layers to show what elements are interactable. Be sure to review any
              new colors for backgrounds work with <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">primary</code> as the foreground at each of the three different levels.
            </li>
            <li className="mb-2">
              See the <a href="#creating-themes" className="text-primary no-underline hover:underline">Creating Themes</a> section
              for details on how different levels of contrast can be used to separate these layers.
            </li>
          </ul>

          <h3 className="mt-7 mb-3 text-lg font-medium text-foreground">Alpha Colors</h3>
          <p className="text-secondary-foreground mb-4 text-lg">
            <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">primary</code> also uses
            various alpha values for many components across the product. This allows components to adapt and work
            well with different background colors or various layers of the interface.
          </p>
        </Accordion>

        {/* Token Sections */}
        <div className="ml-[248px]">
          <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">Interactive or Currently Active</h3>
        </div>

        <TokenRow color="hsl(214, 98%, 60%)" token="primary">
          The most important color in the system. Primary represents anything the user can interact with
          which includes: tool actions, toggles for showing and hiding content, links, navigation elements, etc.
        </TokenRow>

        <TokenRow color="hsl(191, 74%, 63%)" token="highlight">
          The brightest color in the system. Highlight is used to show the user what is &quot;currently active&quot;.
          It should not be used more than a few times in flows or screen views.
          <ul className="mt-2 list-disc pl-6">
            <li className="mb-1">Highlight border around the active viewport</li>
            <li className="mb-1">Highlight background to show the active tool</li>
            <li className="mb-1">Highlight color at the end of a selected data row</li>
          </ul>
        </TokenRow>

        <div className="ml-[248px]">
          <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">Text and Content</h3>
        </div>

        <TokenRow color="hsl(0, 0%, 98%)" token="foreground">
          Used for standard text or for more important text to stand out. This includes headings,
          labels for controls, or anything critical for what the user is doing.
        </TokenRow>

        <TokenRow color="hsl(200, 46%, 65%)" token="muted-foreground">
          Used for secondary text that is paired with standard text. This includes sub titles,
          help text, or anything that needs to play a reduced role for content.
        </TokenRow>

        <div className="ml-[248px]">
          <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">Background Colors</h3>
          <p className="text-secondary-foreground mb-4 text-lg">
            See the <a href="#layering-model" className="text-primary no-underline hover:underline">Layering Model</a> above for detailed notes.
          </p>
        </div>

        <TokenRow color="hsl(0, 0%, 0%)" token="background">
          The base background layer of the product (app shell, panels, negative spaces)
        </TokenRow>
        <TokenRow color="hsl(234, 64%, 10%)" token="muted">
          The second background layer where most content lives
        </TokenRow>
        <TokenRow color="hsl(219, 90%, 15%)" token="popover">
          The third background layer for any content that needs to be elevated
        </TokenRow>

        <div className="ml-[248px]">
          <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">Supporting Colors</h3>
        </div>

        <TokenRow color="hsl(214, 65%, 36%)" token="secondary">
          Used for secondary buttons in the interface
        </TokenRow>
        <TokenRow color="hsl(200, 50%, 84%)" token="secondary-foreground">
          Text color used on secondary
        </TokenRow>
        <TokenRow color="hsl(217, 79%, 24%)" token="accent">
          Sometimes used for hover states or other interaction feedback
        </TokenRow>
        <TokenRow color="hsl(0, 0%, 98%)" token="accent-foreground">
          Text color used on accent
        </TokenRow>
        <TokenRow color="hsl(0, 62.8%, 30.6%)" token="destructive">
          Used for any destructive action or operations in the interface
        </TokenRow>
        <TokenRow color="hsl(0, 0%, 98%)" token="destructive-foreground">
          Text color used on destructive
        </TokenRow>

        <div className="ml-[248px]">
          <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">Inputs and Borders</h3>
        </div>

        <TokenRow color="hsl(236, 52%, 30%)" token="input">
          Used on input fields and other interactive components
        </TokenRow>
        <TokenRow color="hsl(0, 0%, 14.9%)" token="border">
          A neutral color used minimally as separators
        </TokenRow>
        <TokenRow color="hsl(214, 98%, 60%)" token="ring">
          Used as focus rings for accessibility &mdash; indicates which components are currently selected
          (in use or keyboard highlighted)
        </TokenRow>

        <div className="ml-[248px]">
          <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">Neutral Colors</h3>
          <p className="text-secondary-foreground mb-4 text-lg">
            Neutral colors are used sparingly across the interface in areas such as viewports.
          </p>
        </div>

        <TokenRow color="hsl(213, 22%, 59%)" token="neutral">
          Used for elements like scrollbars in viewports
        </TokenRow>
        <TokenRow color="hsl(214, 69%, 81%)" token="neutral-light">
          Lighter text that appears over dark background viewports
        </TokenRow>
        <TokenRow color="hsl(214, 16%, 21%)" token="neutral-dark">
          Darker text that appears over light background viewports
        </TokenRow>
      </Section>

      {/* ================================ */}
      {/* CREATING THEMES */}
      {/* ================================ */}

      <Section title="Creating Themes">
        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <img
            src="/img/theming-themes.png"
            alt="Creating themes overview"
            className="my-6 mb-8 w-full"
          />

          <p>
            Theming in the OHIF Viewer works by replacing the default color tokens and working with the product
            color system outlined in{' '}
            <a href="#color-tokens-and-roles" className="text-primary no-underline hover:underline">Color Tokens and Roles</a> and{' '}
            <a href="#layering-model" className="text-primary no-underline hover:underline">Layering Model</a>.
          </p>

          <p>
            When updating any colors in the system, follow the{' '}
            <a href="#accessibility" className="text-primary no-underline hover:underline">Accessibility</a> section to ensure the
            product retains accessibility standards.
          </p>

          <p>
            OHIF can be themed with a few different approaches. Use the guidance below to match the desired
            product or brand feel.
          </p>
        </div>

        <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">Approach 1: Tonal</h3>

        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <p>
            A tonal theme applies a hue across the background layers of the product which gives the product a
            strong color identity. The default Viewer theme uses this approach with blue.
          </p>

          <ul className="mb-4 list-disc pl-6">
            <li className="mb-2">All three background layers work within the theme&apos;s color hue</li>
            <li className="mb-2">Different hues can be used in place of the Viewer&apos;s default blue</li>
            <li className="mb-2">A tonal theme does not need to match the saturation of the default, see examples</li>
            <li className="mb-2">Use this approach if you like the general feel of the Viewer, but want it to be more unique</li>
          </ul>
        </div>

        {/* Tonal theme grid */}
        <div className="my-9 mb-8 grid items-center gap-x-2.5 gap-y-2.5" style={{ gridTemplateColumns: '82px 59px 59px auto auto auto' }}>
          <span className="pb-1.5 text-[11px] font-normal text-[#555]">Backgrounds</span>
          <span className="pb-1.5 text-[11px] font-normal text-[#555]">Text</span>
          <span className="pb-1.5 text-[11px] font-normal text-[#555]">Interactive</span>
          <span className="pb-1.5 pl-3.5 text-[11px] font-normal text-[#555]">Theme name</span>
          <span></span>
          <span></span>

          <ThemeRow
            backgrounds={['hsl(0, 0%, 0%)', 'hsl(234, 64%, 10%)', 'hsl(219, 90%, 15%)']}
            text={['hsl(200, 46%, 65%)', 'hsl(0, 0%, 98%)']}
            interactive={['hsl(214, 98%, 60%)', 'hsl(191, 74%, 63%)']}
            name="Default Blue"
            previewUrl={BASE_VIEWER + 'default'}
            themeName="default"
          />
          <ThemeRow
            backgrounds={['hsl(270, 45%, 6%)', 'hsl(268, 40%, 10%)', 'hsl(264, 48%, 13%)']}
            text={['hsl(272, 30%, 60%)', 'hsl(280, 15%, 96%)']}
            interactive={['hsl(270, 85%, 65%)', 'hsl(292, 75%, 62%)']}
            name="Orchid"
            previewUrl={BASE_VIEWER + 'orchid'}
            themeName="orchid"
          />
          <ThemeRow
            backgrounds={['hsl(155, 40%, 5%)', 'hsl(152, 35%, 9%)', 'hsl(167, 65%, 10%)']}
            text={['hsl(148, 25%, 55%)', 'hsl(140, 15%, 95%)']}
            interactive={['hsl(152, 75%, 40%)', 'hsl(152, 79%, 52%)']}
            name="Verdant"
            previewUrl={BASE_VIEWER + 'verdant'}
            themeName="verdant"
          />
          <ThemeRow
            backgrounds={['hsl(0, 0%, 0%)', 'hsl(203, 39%, 9%)', 'hsl(202, 54%, 11%)']}
            text={['hsl(185, 30%, 60%)', 'hsl(180, 10%, 97%)']}
            interactive={['hsl(175, 85%, 42%)', 'hsl(173, 81%, 52%)']}
            name="Arctic"
            previewUrl={BASE_VIEWER + 'arctic'}
            themeName="arctic"
          />
        </div>

        <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">Approach 2: Neutral</h3>

        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <p>
            A neutral theme still keeps the full color system in place, but reduces the reliance on color in backgrounds.
          </p>

          <ul className="mb-4 list-disc pl-6">
            <li className="mb-2">All three background layers are more neutral and are more subtle in their differences</li>
            <li className="mb-2">A more unique primary can be chosen if background colors are more similar</li>
            <li className="mb-2">Brand color can be emphasized in detailed accents rather than color fills</li>
            <li className="mb-2">This approach reduces the focus on color to emphasize image content</li>
            <li className="mb-2">Accessibility can be simpler, but testing is still recommended</li>
          </ul>
        </div>

        {/* Neutral theme grid */}
        <div className="my-9 mb-8 grid items-center gap-x-2.5 gap-y-2.5" style={{ gridTemplateColumns: '82px 59px 59px auto auto auto' }}>
          <span className="pb-1.5 text-[11px] font-normal text-[#555]">Backgrounds</span>
          <span className="pb-1.5 text-[11px] font-normal text-[#555]">Text</span>
          <span className="pb-1.5 text-[11px] font-normal text-[#555]">Interactive</span>
          <span className="pb-1.5 pl-3.5 text-[11px] font-normal text-[#555]">Theme name</span>
          <span></span>
          <span></span>

          <ThemeRow
            backgrounds={['hsl(240, 15%, 3%)', 'hsl(240, 12%, 8%)', 'hsl(225, 45%, 13%)']}
            text={['hsl(210, 40%, 70%)', 'hsl(0, 0%, 99%)']}
            interactive={['hsl(210, 100%, 62%)', 'hsl(188, 90%, 58%)']}
            name="Midnight"
            previewUrl={BASE_VIEWER + 'midnight'}
            themeName="midnight"
          />
          <ThemeRow
            backgrounds={['hsl(0, 0%, 0%)', 'hsl(0, 0%, 7%)', 'hsl(0, 0%, 9%)']}
            text={['hsl(0, 0%, 60%)', 'hsl(0, 0%, 96%)']}
            interactive={['hsl(230, 75%, 55%)', 'hsl(217, 97%, 52%)']}
            name="Slate"
            previewUrl={BASE_VIEWER + 'slate'}
            themeName="slate"
          />
          <ThemeRow
            backgrounds={['hsl(0, 0%, 0%)', 'hsl(214, 28%, 5%)', 'hsl(215, 30%, 8%)']}
            text={['hsl(215, 18%, 48%)', 'hsl(215, 15%, 82%)']}
            interactive={['hsl(200, 43%, 48%)', 'hsl(184, 53%, 54%)']}
            name="Deep"
            previewUrl={BASE_VIEWER + 'deep'}
            themeName="deep"
          />
        </div>

        <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">Approach 3: Custom</h3>

        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <p>
            Themes do not need to follow any of these models and more unique combinations can be
            considered by following the core color rules and product principles:
          </p>

          <ul className="mb-4 list-disc pl-6">
            <li className="mb-2">Three levels of background are separated enough</li>
            <li className="mb-2">Primary serves its purpose to show to users what can be interacted with</li>
            <li className="mb-2">Colors are <a href="#accessibility" className="text-primary no-underline hover:underline">accessible</a> in all content scenarios</li>
          </ul>

          <p>
            Theming is flexible enough to support any direction, as long as the colors still work in the product.
          </p>
        </div>

        <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">Experiment with the Color Tool</h3>

        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <p>
            We built a small public web tool that edits the color tokens directly, so you can experiment with
            colors and see the results instantly. When a combination looks right, use its{' '}
            <strong className="text-foreground">Copy Theme</strong> button and paste the result into the
            Custom Theme field in the Viewer&rsquo;s Appearance dialog (see{' '}
            <a href="#testing-themes" className="text-primary no-underline hover:underline">Testing Themes</a>) &mdash; an easy
            way to iterate quickly and find what works best. The tool is optional; you can also edit tokens by hand.
          </p>

          <p>
            <a
              href="https://ohif-theming-beta.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary no-underline hover:underline"
            >
              Open the color tool &rarr;
            </a>
          </p>
        </div>

        <h3 id="testing-themes" className="mt-12 mb-4 scroll-mt-20 text-[22px] font-normal text-foreground">
          Testing Themes in the Viewer
        </h3>

        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <p>
            You can preview a theme without writing any code using the{' '}
            <strong className="text-foreground">Custom Theme</strong> option in the Appearance dialog
            (settings menu in the main header) &mdash; useful while designing a theme around the approaches above.
          </p>

          <img
            src="/img/theming-dialog-02-default.png"
            alt="Appearance modal showing the Custom Theme button below the Theme dropdown"
            className="my-4 mb-6 w-full rounded-lg border border-[#222]"
          />

          <p>
            The <strong className="text-foreground">Custom Theme</strong> option opens a text field where
            you paste CSS color tokens and press <strong className="text-foreground">Apply</strong> to see
            them right away. <strong className="text-foreground">Clear</strong> removes them and returns to
            the default. A pasted theme is remembered across page reloads.
          </p>

          <img
            src="/img/theming-dialog-03-custom.png"
            alt="Custom theme text field for pasting color tokens, with Apply and Clear buttons"
            className="my-4 mb-6 w-full rounded-lg border border-[#222]"
          />
        </div>

        <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">For Developers: Adding a New Preset</h3>

        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <p>
            A preset lives in two places. The <strong className="text-foreground">CSS block is what actually renders</strong>;
            the JSON only registers the preset so it appears in the dropdown.
          </p>

          <ul className="mb-4 list-disc pl-6">
            <li className="mb-2">
              <strong className="text-foreground">themes.css</strong> &mdash; add a{' '}
              <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">.theme-&#123;name&#125;</code>{' '}
              block to <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">platform/ui-next/src/themes/themes.css</code>{' '}
              with the full token set. This is the source of truth for the theme&rsquo;s colors.
            </li>
            <li className="mb-2">
              <strong className="text-foreground">&#123;name&#125;.json</strong> &mdash; create{' '}
              <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">platform/ui-next/src/themes/&#123;name&#125;.json</code>{' '}
              providing <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">name</code> and{' '}
              <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">label</code> (the dropdown entry).
              Its <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">cssVars.dark</code> values
              are <strong className="text-foreground">not read at runtime</strong> &mdash; only{' '}
              <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">name</code> and{' '}
              <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">label</code> are used &mdash;
              so the <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">.theme-&#123;name&#125;</code>{' '}
              CSS block above is what takes effect.
            </li>
            <li className="mb-2">
              <strong className="text-foreground">index.ts</strong> &mdash; import the JSON in{' '}
              <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">platform/ui-next/src/themes/index.ts</code>{' '}
              and add it to the <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">themePresets</code> array.
            </li>
          </ul>

          <p>
            The dropdown, persistence, and theme switching then work automatically. The JSON{' '}
            <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">name</code> field must match the
            CSS class suffix (e.g. <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">&quot;name&quot;: &quot;orchid&quot;</code>{' '}
            &harr; <code className="rounded bg-[#111] px-1.5 py-0.5 text-sm text-[#7cacf8]">.theme-orchid</code>).
          </p>
        </div>
      </Section>

      {/* ================================ */}
      {/* ACCESSIBILITY */}
      {/* ================================ */}

      <Section title="Accessibility">
        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <p>
            The OHIF Viewer is a medical imaging product. The interface supports clinicians and other
            professionals working and reading images. Colors in theming should never get in the way.
            A theme needs to remain accessible with color contrast and other accessibility standards.
          </p>

          <p>
            The default OHIF theme has been tested and works out of the box to meet these standards.
          </p>

          <p>
            Color contrast must meet{' '}
            <a
              href="https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary no-underline hover:underline"
            >
              WCAG 2.1 Success Criterion 1.4.3 Contrast (Minimum), Level AA
            </a>
            : text needs a contrast ratio of at least <strong className="text-foreground">4.5:1</strong> against
            its background (<strong className="text-foreground">3:1</strong> for large text &mdash; 24px, or 18.66px bold).
          </p>

          <p>
            The pairs below show the <strong className="text-foreground">default OHIF theme</strong> and how its
            colors meet the contrast requirements. The <strong className="text-foreground">Result</strong> column
            is each pair&apos;s actual contrast ratio, and the <strong className="text-foreground">Guidance</strong>{' '}
            column is the minimum it must meet. When creating your own theme, check every foreground against each
            background layer it can appear on.
          </p>
        </div>

        <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">
          Test Primary Across All Three Background Colors
        </h3>

        <p className="text-secondary-foreground mb-4 text-lg">
          The most important color that shows content that can be interactive needs to be tested across
          all three background layers.
        </p>

        <ContrastTable rows={[
          { fgLabel: 'primary', fgColor: 'hsl(214, 98%, 60%)', bgLabel: 'background', bgColor: 'hsl(0, 0%, 0%)', result: '6.3:1', requirement: '≥ 4.5:1' },
          { fgLabel: 'primary', fgColor: 'hsl(214, 98%, 60%)', bgLabel: 'muted', bgColor: 'hsl(234, 64%, 10%)', result: '5.7:1', requirement: '≥ 4.5:1' },
          { fgLabel: 'primary', fgColor: 'hsl(214, 98%, 60%)', bgLabel: 'popover', bgColor: 'hsl(219, 90%, 15%)', result: '5.0:1', requirement: '≥ 4.5:1' },
        ]} />

        <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">
          Test Text Content Across All Three Background Colors
        </h3>

        <p className="text-secondary-foreground mb-4 text-lg">
          Text appears on each background layer. Be sure to test each to ensure readability.
        </p>

        <ContrastTable rows={[
          { fgLabel: 'foreground', fgColor: 'hsl(0, 0%, 98%)', bgLabel: 'background', bgColor: 'hsl(0, 0%, 0%)', result: '20.1:1', requirement: '≥ 4.5:1' },
          { fgLabel: 'foreground', fgColor: 'hsl(0, 0%, 98%)', bgLabel: 'muted', bgColor: 'hsl(234, 64%, 10%)', result: '18.3:1', requirement: '≥ 4.5:1' },
          { fgLabel: 'foreground', fgColor: 'hsl(0, 0%, 98%)', bgLabel: 'popover', bgColor: 'hsl(219, 90%, 15%)', result: '15.9:1', requirement: '≥ 4.5:1' },
        ]} />

        <ContrastTable rows={[
          { fgLabel: 'muted-foreground', fgColor: 'hsl(200, 46%, 65%)', bgLabel: 'background', bgColor: 'hsl(0, 0%, 0%)', result: '9.2:1', requirement: '≥ 4.5:1' },
          { fgLabel: 'muted-foreground', fgColor: 'hsl(200, 46%, 65%)', bgLabel: 'muted', bgColor: 'hsl(234, 64%, 10%)', result: '8.4:1', requirement: '≥ 4.5:1' },
          { fgLabel: 'muted-foreground', fgColor: 'hsl(200, 46%, 65%)', bgLabel: 'popover', bgColor: 'hsl(219, 90%, 15%)', result: '7.3:1', requirement: '≥ 4.5:1' },
        ]} />

        <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">
          Test Viewport Text If You Change It
        </h3>

        <p className="text-secondary-foreground mb-4 text-lg">
          Be sure to test the viewport neutral text over standard viewport backgrounds, but increase
          the contrast here as much as possible since text needs to remain readable over various image content.
        </p>

        <ContrastTable rows={[
          { fgLabel: 'neutral-light', fgColor: 'hsl(214, 69%, 81%)', bgLabel: '#000000', bgColor: '#000000', result: '12.5:1', requirement: '≥ 4.5:1 (aim higher)' },
          { fgLabel: 'neutral-dark', fgColor: 'hsl(214, 16%, 21%)', bgLabel: '#FFFFFF', bgColor: '#ffffff', result: '12.5:1', requirement: '≥ 4.5:1 (aim higher)' },
        ]} />

        <h3 className="mt-12 mb-4 text-[22px] font-normal text-foreground">
          Test Foreground Colors Over Their Backgrounds
        </h3>

        <ContrastTable rows={[
          { fgLabel: 'foreground', fgColor: 'hsl(0, 0%, 98%)', bgLabel: 'primary/80', bgColor: 'hsla(214, 98%, 60%, 0.8)', result: '4.7:1', requirement: '≥ 4.5:1' },
          { fgLabel: 'secondary-foreground', fgColor: 'hsl(200, 50%, 84%)', bgLabel: 'secondary', bgColor: 'hsl(214, 65%, 36%)', result: '5.3:1', requirement: '≥ 4.5:1' },
          { fgLabel: 'accent-foreground', fgColor: 'hsl(0, 0%, 98%)', bgLabel: 'accent', bgColor: 'hsl(217, 79%, 24%)', result: '11.9:1', requirement: '≥ 4.5:1' },
          { fgLabel: 'destructive-foreground', fgColor: 'hsl(0, 0%, 98%)', bgLabel: 'destructive', bgColor: 'hsl(0, 62.8%, 30.6%)', result: '9.6:1', requirement: '≥ 4.5:1' },
        ]} />
      </Section>
    </ComponentLayout>
  );
}

export default function ThemingPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <ThemingPageContent />}</BrowserOnly>
  );
}
