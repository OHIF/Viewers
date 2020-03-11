import React from 'react';
import PropTypes from 'prop-types';

import { Button, Icon, Input, Typography } from '@ohif/ui';

const StudyListFilter = ({
  patientName,
  mrn,
  studyDate,
  description,
  modality,
  accession,
  instances,
  numOfStudies = 0,
  sortByFilter,
  onSortByChange,
  onFilterChange,
}) => {
  const inputProps = {
    labelClassName: 'text-white text-sm pl-1',
    className: 'border-custom-blue mt-2 bg-black',
    containerClassName: 'mr-2',
  };
  return (
    <div className="flex flex-col pt-5 pb-3 bg-custom-navyDark px-4">
      <div className="flex flex-row justify-between mb-5">
        <div className="flex flex-row">
          <Typography variant="h4" className="text-custom-aquaBright mr-6">
            Study List
          </Typography>
          <div className="flex flex-row items-end">
            <Button
              variant="text"
              size="small"
              className="text-custom-blueBright"
              startIcon={<Icon name="info-link" className="w-2" />}
            >
              Learn more
            </Button>
          </div>
        </div>
        <div className="flex flex-row items-baseline">
          <Typography variant="h4" className="text-white mr-2">
            {numOfStudies > 100 ? '>100' : numOfStudies}
          </Typography>
          <Typography variant="h6" className="text-custom-grayLight">
            Studies
          </Typography>
        </div>
      </div>
      <div className="flex flex-row">
        <Input
          {...inputProps}
          label="Patient name"
          value={patientName}
          id="patientName"
        />
        <Input {...inputProps} label="MRN" value={mrn} id="mrn" />
        <Input
          {...inputProps}
          label="Study date"
          value={studyDate}
          id="studyDate"
        />
        <Input
          {...inputProps}
          label="Description"
          value={description}
          id="description"
        />
        <Input
          {...inputProps}
          label="Modality"
          value={modality}
          id="modality"
        />
        <Input
          {...inputProps}
          label="Accession"
          value={accession}
          id="accession"
        />
        <label className="text-white text-sm pl-1 flex flex-1">Instances</label>
      </div>
    </div>
  );
};

StudyListFilter.propTypes = {
  patientName: PropTypes.string,
  mrn: PropTypes.string,
  studyDate: PropTypes.any,
  description: PropTypes.string,
  modality: PropTypes.string,
  accession: PropTypes.string,
  instances: PropTypes.any,
  numOfStudies: PropTypes.number,
  sortByFilter: PropTypes.string,
  onSortByChange: PropTypes.func,
  onFilterChange: PropTypes.func.isRequired,
};

export default StudyListFilter;
