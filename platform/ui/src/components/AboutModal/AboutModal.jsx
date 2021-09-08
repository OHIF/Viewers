import React from 'react';
import { Typography, Icon } from '../';
import PropTypes from 'prop-types';
import detect from 'browser-detect';

const Link = ({ href, children, showIcon = false }) => {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Typography
        variant="subtitle"
        component="p"
        className="flex items-center text-primary-active"
      >
        {children}
        {!!showIcon && (
          <Icon name="external-link" className="w-5 text-white ml-2" />
        )}
      </Typography>
    </a>
  );
};

const Row = ({ title, value, link }) => {
  return (
    <div className="flex mb-4">
      <Typography variant="subtitle" component="p" className="text-white w-48">
        {title}
      </Typography>

      {link ? (
        <Link href={link}>{value}</Link>
      ) : (
          <Typography
            variant="subtitle"
            component="p"
            className="text-white w-48"
          >
            {value}
          </Typography>
        )}
    </div>
  );
};

const AboutModal = ({buildNumber, versionNumber}) => {
  const { os, version, name } = detect();
  const browser = `${name[0].toUpperCase()}${name.substr(1)} ${version}`;

  const renderRowTitle = title => (
    <div className="border-b-2 border-black pb-3 mb-3">
      <Typography variant="h6" className="text-primary-light">
        {title}
      </Typography>
    </div>
  );
  return (
    <div>
      {renderRowTitle('Important Links')}
      <div className="flex mb-8">
        <Link
          href="https://community.ohif.org/"
          showIcon={true}
        >
          Visit the forum
        </Link>
        <span className="ml-4">
          <Link
            href="https://github.com/OHIF/Viewers/issues/new/choose"
            showIcon={true}
          >
            Report an issue
          </Link>
        </span>
        <span className="ml-4">
          <Link href="https://ohif.org/" showIcon={true}>
            More details
          </Link>
        </span>
      </div>

      {renderRowTitle('Version Information')}
      <div className="flex flex-col">
        <Row
          title="Repository URL"
          value="https://github.com/OHIF/Viewers/tree/v3-stable"
          link="https://github.com/OHIF/Viewers/tree/v3-stable"
        />
        {/* <Row
          title="Last Master Commits"
          value="https://github.com/OHIF/Viewers/tree/v3-stable"
          link="https://github.com/OHIF/Viewers/tree/v3-stable"
        /> */}
        <Row title="Version number" value={versionNumber} />
        <Row title="Build number" value={buildNumber} />
        <Row title="Browser" value={browser} />
        <Row title="OS" value={os} />
      </div>
    </div>
  );
};

AboutModal.propTypes = {
  buildNumber: PropTypes.string,
  versionNumber: PropTypes.string,
}

export default AboutModal;
