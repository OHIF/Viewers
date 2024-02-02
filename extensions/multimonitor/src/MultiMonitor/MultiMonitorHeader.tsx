import React, { useState, useEffect, } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header, } from '@ohif/ui';

const versionNumber = process.env.VERSION_NUMBER;
const commitHash = process.env.COMMIT_HASH;


export default function MultiMonitorLayout(props) {
  const { studyData, extensionManager } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();


  if (!studyData) return null;

  const onClickReturnButton = () => {
    const { pathname } = location;
    const dataSourceIdx = pathname.indexOf('/', 1);
    const query = new URLSearchParams(window.location.search);
    const configUrl = query.get('configUrl');

    const dataSourceName = pathname.substring(dataSourceIdx + 1);
    const existingDataSource = extensionManager.getDataSources(dataSourceName);

    const searchQuery = new URLSearchParams();
    if (dataSourceIdx !== -1 && existingDataSource) {
      searchQuery.append('datasources', pathname.substring(dataSourceIdx + 1));
    }

    if (configUrl) {
      searchQuery.append('configUrl', configUrl);
    }

    navigate({
      pathname: '/',
      search: decodeURIComponent(searchQuery.toString()),
    });
  };

  const menuOptions = [
    {
      title: t('Header:About'),
      icon: 'info',
      onClick: () =>
        console.log("Hello modal dialog")
    },
  ];


  return (<Header
    menuOptions={menuOptions}
    isReturnEnabled={true}
    onClickReturnButton={onClickReturnButton}
  >
    Multimonitor
  </Header>);
}
