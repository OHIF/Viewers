import React from 'react';
import PropTypes from 'prop-types';
import detect from 'browser-detect';

import Typography from '../Typography';
import Icon from '../Icon';

const Link = ({ href, children, showIcon = false }) => {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Typography
        variant="subtitle"
        component="p"
        color="primaryActive"
        className="flex items-center"
      >
        {children}
        {!!showIcon && (
          <Icon name="external-link" className="w-5 ml-2 text-white" />
        )}
      </Typography>
    </a>
  );
};

const Row = ({ title, value, link }) => {
  return (
    <div className="flex mb-4">
      <Typography variant="subtitle" component="p" className="w-48 text-white">
        {title}
      </Typography>

      {link ? (
        <Link href={link}>{value}</Link>
      ) : (
        <Typography
          variant="subtitle"
          component="p"
          className="w-48 text-white"
        >
          {value}
        </Typography>
      )}
    </div>
  );
};

const AboutModal = ({ buildNumber, versionNumber, commitHash }) => {
  const { os, version, name } = detect();
  const browser = `${name[0].toUpperCase()}${name.substr(1)} ${version}`;

  const renderRowTitle = title => (
    <div className="pb-3 mb-3 border-b-2 border-black">
      <Typography
        variant="inherit"
        color="primaryLight"
        className="text-[16px] font-semibold !leading-[1.2]"
      >
        {title}
      </Typography>
    </div>
  );
  return (
    <div>
      {renderRowTitle('Important Links')}
      <div className="flex mb-8">
        <Link href="https://community.ohif.org/" showIcon={true}>
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
          value="https://github.com/OHIF/Viewers/"
          link="https://github.com/OHIF/Viewers/"
        />
        <Row
          title="Data Citation"
          value="https://github.com/OHIF/Viewers/blob/master/DATACITATION.md"
          link="https://github.com/OHIF/Viewers/blob/master/DATACITATION.md"
        />
        {/* <Row
          title="Last Master Commits"
          value="https://github.com/OHIF/Viewers/"
          link="https://github.com/OHIF/Viewers/"
        /> */}
        <Row title="Version number" value={versionNumber} />
        {buildNumber && <Row title="Build number" value={buildNumber} />}
        {commitHash && <Row title="Commit Hash" value={commitHash} />}
        <Row title="Browser" value={browser} />
        <Row title="OS" value={os} />
      </div>
    </div>
  );
};

AboutModal.propTypes = {
  buildNumber: PropTypes.string,
  versionNumber: PropTypes.string,
};

export default AboutModal;
