import React from 'react';
import ReportsTable from '../components/ReportsTable';

export default function PanelReports() {
  const handleReportSelect = (report: any) => {
    console.log('Selected report:', report);
    // TODO: Implement report viewing/editing functionality
  };

  return (
    <div className="h-full p-4">
      <ReportsTable onReportSelect={handleReportSelect} />
    </div>
  );
}
