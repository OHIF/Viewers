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

type PatientStudy = {
  patient: string;
  mrn: string;
  studyDateTime: string;
  modalities: string;
  description: string;
  accession: string;
  instances: number;
};

const data: PatientStudy[] = [
  {
    patient: 'John Doe',
    mrn: 'MRN001234',
    studyDateTime: '2025-06-14 09:32',
    modalities: 'CT',
    description: 'Chest CT w/ Contrast',
    accession: 'ACC-102938',
    instances: 324,
  },
  {
    patient: 'Jane Smith',
    mrn: 'MRN007891',
    studyDateTime: '2025-06-13 14:05',
    modalities: 'MR',
    description: 'Brain MRI',
    accession: 'ACC-564738',
    instances: 210,
  },
  {
    patient: 'Carlos Ruiz',
    mrn: 'MRN003456',
    studyDateTime: '2025-06-12 11:48',
    modalities: 'US',
    description: 'Abdominal Ultrasound',
    accession: 'ACC-223344',
    instances: 58,
  },
  {
    patient: 'Amina Khan',
    mrn: 'MRN005432',
    studyDateTime: '2025-06-11 08:21',
    modalities: 'PET/CT',
    description: 'Whole Body PET/CT',
    accession: 'ACC-998877',
    instances: 512,
  },
];

const App = () => (
  <div className="h-screen w-screen bg-black">
    <div className="mx-auto h-full max-w-7xl p-6">
      <h1 className="mb-4 text-xl font-medium">Study List</h1>
      <div className="border-input/50 rounded-md border p-2">
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
