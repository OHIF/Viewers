import React from 'react';

import {
  Button,
  Icon,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@ohif/ui';

const StudyListExpandedRow = ({ series }) => {
  return (
    <td colSpan="7" className="py-4 pl-12 pr-2">
      <div className="block">
        <Button
          rounded="full"
          variant="contained"
          className="mr-4 font-bold"
          endIcon={<Icon name="launch-arrow" style={{ color: '#21a7c6' }} />}
        >
          Basic Viewer
        </Button>
        <Button
          rounded="full"
          variant="contained"
          className="mr-4 font-bold"
          endIcon={<Icon name="launch-arrow" style={{ color: '#21a7c6' }} />}
        >
          Segmentation{' '}
        </Button>
        <Button
          rounded="full"
          variant="outlined"
          endIcon={<Icon name="launch-info" />}
          className="font-bold"
        >
          Module 3
        </Button>
        <div className="ml-5 text-lg text-custom-grayBright inline-flex items-center">
          <Icon name="notificationwarning-diamond" className="mr-2 w-5 h-5" />
          Feedback text lorem ipsum dolor sit amet
        </div>
      </div>
      <div className="mt-4">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell size="normal">Description</TableCell>
              <TableCell size="small">Series</TableCell>
              <TableCell size="small">Modality</TableCell>
              <TableCell size="normal">Instances</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {series.map((seriesItem, i) => (
              <TableRow key={i}>
                <TableCell size="normal">Patient Protocol</TableCell>
                <TableCell size="small">{seriesItem.SeriesNumber}</TableCell>
                <TableCell size="small">{seriesItem.Modality}</TableCell>
                <TableCell size="normal">
                  {seriesItem.instances.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </td>
  );
};

export default StudyListExpandedRow;
