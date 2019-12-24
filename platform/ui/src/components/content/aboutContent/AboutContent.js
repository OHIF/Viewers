import React from 'react';
import detect from 'browser-detect';
import { useTranslation } from 'react-i18next';

import './AboutContent.styl';

const AboutContent = () => {
  const { t } = useTranslation('AboutContent');

  const { os, version, name } = detect();
  const capitalize = s =>
    s.substr(0, 1).toUpperCase() + s.substr(1).toLowerCase();

  const itemsPreset = () => {
    return [
      {
        name: t('Repository URL'),
        value: 'https://github.com/OHIF/Viewers/',
        link: 'https://github.com/OHIF/Viewers/',
      },
      {
        name: t('Latest Master Commits'),
        value: 'https://github.com/OHIF/Viewers/commits/master',
        link: 'https://github.com/OHIF/Viewers/commits/master',
      },
      {
        name: 'Version Number',
        value: process.env.VERSION_NUMBER,
      },
      {
        name: t('Build Number'),
        value: process.env.BUILD_NUM,
      },
      {
        name: t('Browser'),
        value: `${capitalize(name)} ${version}`,
      },
      {
        name: t('OS'),
        value: os,
      },
    ];
  };

  const renderTableRow = ({ name, value, link }) => (
    <tr key={name} style={{ backgroundColor: 'transparent' }}>
      <td>{name}</td>
      <td>
        {link ? (
          <a target="_blank" rel="noopener noreferrer" href={link}>
            {value}
          </a>
        ) : (
          value
        )}
      </td>
    </tr>
  );

  return (
    <div className="AboutContent" data-cy="about-modal">
      <div className="btn-group">
        <a
          className="btn btn-default"
          target="_blank"
          rel="noopener noreferrer"
          href="https://groups.google.com/forum/#!forum/cornerstone-platform"
        >
          {t('Visit the forum')}
        </a>
        {` `}
        <a
          className="btn btn-default"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/OHIF/Viewers/issues/new/choose"
        >
          {t('Report an issue')}
        </a>
        {` `}
        <a
          className="btn btn-default"
          target="_blank"
          rel="noopener noreferrer"
          href="http://ohif.org"
        >
          {t('More details')}
        </a>
      </div>
      <div>
        <h3>{t('Version Information')}</h3>
        <table className="table table-responsive">
          <thead>
            <tr>
              <th>{t('Name')}</th>
              <th>{t('Value')}</th>
            </tr>
          </thead>
          <tbody>{itemsPreset().map(item => renderTableRow(item))}</tbody>
        </table>
      </div>
    </div>
  );
};

export { AboutContent };
export default AboutContent;
