import React from 'react';
import Layout from '@theme/Layout';
import { useHistory } from '@docusaurus/router';

export default function Hello() {
  const history = useHistory();

  return (
    <Layout
      title="Hello"
      description="Hello React Page"
    >
      <button
        className="bg-slate-400"
        onClick={() => history.push('/ui-playground')}
      >
        ui-playground
      </button>
      <button
        className="bg-slate-400"
        onClick={() => history.push('/patterns')}
      >
        patterns
      </button>
    </Layout>
  );
}
