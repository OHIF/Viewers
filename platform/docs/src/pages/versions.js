import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function Versions() {
  const versions = [
    {
      version: 'Version 1',
      status: 'deprecated',
      description: 'Built with Meteor as a full stack application.',
    },
    {
      version: 'Version 2',
      status: 'deprecated',
      description: 'Front end image viewer built with React',
    },
    {
      version: 'Version 3.x-beta',
      status: 'master branch',
      description: 'With latest bug fixes and features but not yet released (released under beta)',
    },
    {
      version: 'Version 3.x',
      status: 'release branch',
      description: 'Released version of the OHIF platform which is more stable and tested',
    },
  ];

  return (
    <Layout
      title="Versions"
      description="OHIF Platform Versions"
    >
      <div className="margin-top--lg padding-horiz--lg container">
        <h1>Versions</h1>

        <p>
          As we are increasing the efforts to make the OHIF platform more robust and up-to-date with
          the latest software engineering practices, here we are listing the versions of the OHIF
          platform that we are currently supporting, and the versions that have been deprecated.
        </p>

        <h2>Product Version</h2>

        <p>Currently we have four product versions:</p>

        <ul className="versions-list">
          {versions.map((item, index) => (
            <li key={index}>
              <strong>{item.version}</strong> ({item.status}): {item.description}
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
