import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../Table';
import { Icons } from '../../Icons';

type Series = {
  seriesInstanceUid?: string;
  SeriesInstanceUID?: string;
  modality?: string;
  Modality?: string;
  description?: string;
  SeriesDescription?: string;
  seriesNumber?: number | string;
  SeriesNumber?: number | string;
  numSeriesInstances?: number;
  numInstances?: number;
};

type PreviewSeriesListProps = {
  series: Series[];
  onSeriesClick?: (series: Series) => void;
};

export function PreviewSeriesList({ series, onSeriesClick }: PreviewSeriesListProps) {
  return (
    <div className="w-full px-2">
      <Table noScroll>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-0 text-base font-normal">
              <span className="text-foreground">Modality</span>
              <span className="text-muted-foreground"> / Series</span>
            </TableHead>
            <TableHead className="text-foreground w-8 pr-0 text-right text-base font-normal">
              <Icons.Series className="ml-auto h-4 w-4" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {series.map((s, idx) => {
            const seriesUID = s.seriesInstanceUid || s.SeriesInstanceUID || String(idx);
            const modality = String(s.modality || s.Modality || '').toUpperCase();
            const description = s.description || s.SeriesDescription || '';
            const numInstances = s.numSeriesInstances ?? s.numInstances ?? 0;

            return (
              <TableRow
                key={seriesUID}
                className="hover:text-muted-foreground cursor-default hover:bg-transparent"
              >
                <TableCell className="pl-0 text-base">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-normal">{modality}</span>
                    <span className="font-normal">{description}</span>
                  </div>
                </TableCell>
                <TableCell className="w-8 pr-0 text-right text-base">{numInstances}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
