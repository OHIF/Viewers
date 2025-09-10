import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@ohif/ui-next';

interface Report {
  id: string;
  studyInstanceUID: string;
  htmlContent: string;
  status: 'submitted' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface ReportsTableProps {
  onReportSelect?: (report: Report) => void;
}

export default function ReportsTable({ onReportSelect }: ReportsTableProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4000/report');
      setReports(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    if (status === 'draft') {
      return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
    } else {
      return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading reports...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-red-600">{error}</div>
            <Button
              onClick={fetchReports}
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Reports</CardTitle>
          <Button
            onClick={fetchReports}
            variant="outline"
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">No reports found</div>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div
                key={report.id}
                className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50"
                onClick={() => onReportSelect?.(report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium">Study: {report.studyInstanceUID}</span>
                      <span className={getStatusBadge(report.status)}>
                        {report.status === 'draft' ? 'Draft' : 'Submitted'}
                      </span>
                    </div>
                    <div className="text-muted-foreground mb-2 text-sm">
                      {stripHtml(report.htmlContent).substring(0, 150)}
                      {stripHtml(report.htmlContent).length > 150 && '...'}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Created: {formatDate(report.createdAt)}
                      {report.updatedAt !== report.createdAt && (
                        <span className="ml-2">Updated: {formatDate(report.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
