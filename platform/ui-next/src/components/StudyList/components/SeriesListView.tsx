import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../Table';
import { Icons } from '../../Icons';

type SeriesData = {
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

type Props = {
  series: SeriesData[];
  onSeriesClick?: (series: SeriesData) => void;
};

export function SeriesListView({ series, onSeriesClick }: Props) {
  return (
    <div className="w-full px-2">
      <Table noScroll>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-foreground text-[13px] font-normal">
              Modality / Series
            </TableHead>
            <TableHead className="text-foreground text-[13px] font-normal text-right w-8 pr-0">
              <Icons.Series className="h-4 w-4 ml-auto" />
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
                className="hover:bg-transparent hover:text-muted-foreground cursor-default"
              >
                <TableCell className="text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{modality}</span>
                    <span className="font-normal">{description}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-right w-8 pr-0">
                  {numInstances}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
