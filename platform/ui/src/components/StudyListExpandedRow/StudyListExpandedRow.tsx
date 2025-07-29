import React from 'react';

import Table from '../Table';
import TableHead from '../TableHead';
import TableBody from '../TableBody';
import TableRow from '../TableRow';
import TableCell from '../TableCell';

interface StudyListExpandedRowProps {
  seriesTableDataSource: object[];
  seriesTableColumns: object;
  children: React.ReactNode;
}

const StudyListExpandedRow = ({
  seriesTableColumns,
  seriesTableDataSource,
  children
}: StudyListExpandedRowProps) => {
  return (
    <div className="w-full bg-black py-4 pl-12 pr-2">
      <div className="block">{children}</div>
      <div className="mt-4">
        <Table>
          <TableHead>
            <TableRow>
              {Object.keys(seriesTableColumns).map(columnKey => {
                return <TableCell key={columnKey}>{seriesTableColumns[columnKey]}</TableCell>;
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {seriesTableDataSource.map((row, i) => (
              <TableRow key={i}>
                {Object.keys(row).map(cellKey => {
                  const content = row[cellKey];
                  return (
                    <TableCell
                      key={cellKey}
                      className="truncate"
                    >
                      {content}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StudyListExpandedRow;
