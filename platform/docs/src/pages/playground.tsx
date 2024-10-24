import React from 'react';
import Layout from '@theme/Layout';
import { useHistory } from '@docusaurus/router';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../ui-next/src/components/Card';

export default function Hello() {
  const history = useHistory();

  return (
    <Layout
      title="Hello"
      description="Hello React Page"
    >
      <div className="flex h-screen items-center justify-center">
        <Card className="border-muted w-[350px]">
          <CardHeader>
            <CardTitle className="text-foreground">Components</CardTitle>
            <CardDescription>Short description here</CardDescription>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>

      {/* <button
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
        </button> */}
    </Layout>
  );
}
