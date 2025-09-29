import React from 'react';
import { createRoot } from 'react-dom/client';
// Import styles directly; no ThemeWrapper
import '../src/tailwind.css';
import '../src/assets/styles.css';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../src/components/Table';

import data from './patient-studies.json';

const App = () => (
  <div className="h-screen w-screen bg-black">
    <div className="mx-auto h-full max-w-7xl p-6">
      <h1 className="text-foreground mb-4 text-2xl font-medium">Study List</h1>
      <div className="bg-background rounded-md p-2">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>MRN</TableHead>
              <TableHead>Study Date and Time</TableHead>
              <TableHead>Modalities</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Accession Number</TableHead>
              <TableHead className="text-right">Instances</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell className="whitespace-nowrap">{row.patient}</TableCell>
                <TableCell className="whitespace-nowrap">{row.mrn}</TableCell>
                <TableCell className="whitespace-nowrap">{row.studyDateTime}</TableCell>
                <TableCell className="whitespace-nowrap">{row.modalities}</TableCell>
                <TableCell className="max-w-[320px] truncate">{row.description}</TableCell>
                <TableCell className="whitespace-nowrap">{row.accession}</TableCell>
                <TableCell className="text-right">{row.instances}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
);

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
const root = createRoot(container);
root.render(<App />);
