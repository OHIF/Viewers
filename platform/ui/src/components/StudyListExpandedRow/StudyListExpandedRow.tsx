import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import Table from '../Table';
import TableHead from '../TableHead';
import TableBody from '../TableBody';
import TableRow from '../TableRow';
import TableCell from '../TableCell';
import { Checkbox } from '@ohif/ui-next';

const StudyListExpandedRow = ({ seriesTableColumns, seriesTableDataSource, children, selectedRows: propSelectedRows, onSelectionChange  }) => {
  const [selectedRows, setSelectedRows] = useState(propSelectedRows || []);

  useEffect(() => {
    setSelectedRows(propSelectedRows || []);
  }, [propSelectedRows]);

  const handleSelectAll = (newChecked) => {
    const newSelected = newChecked ? seriesTableDataSource.map((_, index) => index) : [];
    setSelectedRows(newSelected);
    onSelectionChange && onSelectionChange(newSelected);
  };

  const handleSelectRow = (index, newChecked) => {
    const newSelected = newChecked ? [...selectedRows, index] : selectedRows.filter(i => i !== index);
    setSelectedRows(newSelected);
    onSelectionChange && onSelectionChange(newSelected);
  };

  return (
    <div className="w-full bg-black py-4 pl-12 pr-2">
      <div className="block">{children}</div>
      <div className="mt-4">
        <Table>
          <TableHead>
            <TableRow
              className="hover:bg-gray-700 cursor-pointer"
              onClick={() => handleSelectAll(!(selectedRows.length === seriesTableDataSource.length && seriesTableDataSource.length > 0))}
            >
              <TableCell className='flex items-center' cellsNum={1}>
                <Checkbox
                  checked={selectedRows.length === seriesTableDataSource.length && seriesTableDataSource.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableCell>
              {Object.keys(seriesTableColumns).map(columnKey => {
                return <TableCell key={columnKey} cellsNum={1}>{seriesTableColumns[columnKey]}</TableCell>;
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {seriesTableDataSource.map((row, i) => (
              <TableRow key={i} 
                className="hover:bg-gray-700 cursor-pointer"
                onClick={() => handleSelectRow(i, !selectedRows.includes(i))}
              >
                <TableCell cellsNum={1} className='flex items-center'>
                  <Checkbox
                    checked={selectedRows.includes(i)}
                  />
                </TableCell>
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

StudyListExpandedRow.propTypes = {
  seriesTableDataSource: PropTypes.arrayOf(PropTypes.object).isRequired,
  seriesTableColumns: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

export default StudyListExpandedRow;
