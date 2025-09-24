import React from 'react';
import Layout from '@theme/Layout';
import { useHistory } from '@docusaurus/router';

export default function Patterns() {
  const history = useHistory();

  return (
    <Layout>
      <div>
        <h1>Patterns</h1>
        <button
          className="bg-slate-400"
          onClick={() => history.push('/patterns/patterns-segmentation')}
        >
          {'Segmentation Panel'}
        </button>
        <button
          className="bg-slate-400"
          onClick={() => history.push('/patterns/patterns-measurements')}
        >
          {'Measurements Panel'}
        </button>
        <button
          className="bg-slate-400"
          onClick={() => history.push('/patterns/patterns-tmtv')}
        >
          {'tmtv'}
        </button>
      </div>
    </Layout>
  );
}