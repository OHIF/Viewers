import React from 'react'
import PropTypes from 'prop-types'
import { usePluginData } from '@docusaurus/useGlobalData';
import { PropsTable } from '../react-docgen-props-table/PropsTable'

export function ComponentPropsTable({ componentName }) {
  if (!componentName) {
    return null;
  }

  const data = usePluginData('docusaurus-plugin-react-docgen')
  const componentDocGenData = data[componentName.toLowerCase()]
  if (!componentDocGenData) {
    return null;
  }

  return (
    <PropsTable className={'table-auto'} props={componentDocGenData.props}/>
  )
}

ComponentPropsTable.propTypes = {
  componentName: PropTypes.string.required
}
