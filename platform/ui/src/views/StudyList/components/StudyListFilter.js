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
              className="text-custom-blueBright text-xs"
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
          label="Patient name"
          labelClassName="text-white"
          className="border-custom-blue mt-2"
          containerClassName="mr-2"
          value={patientName}
        />
        <Input
          label="MRN"
          labelClassName="text-white"
          className="border-custom-blue mt-2"
          containerClassName="mr-2"
          value={mrn}
        />
        <Input
          label="Study date"
          labelClassName="text-white"
          className="border-custom-blue mt-2 rounded-r-none border-r-0"
          containerClassName=""
          value={studyDate}
        />
        <Input
          label="Study date"
          labelClassName="text-white"
          className="border-custom-blue mt-2 rounded-l-none"
          containerClassName="mr-2"
          value={studyDate}
        />
        <Input
          label="Description"
          labelClassName="text-white"
          className="border-custom-blue mt-2"
          containerClassName="mr-2"
          value={description}
        />
        <Input
          label="Modality"
          labelClassName="text-white"
          className="border-custom-blue mt-2"
          containerClassName="mr-2"
          value={modality}
        />
        <Input
          label="Accession"
          labelClassName="text-white"
          className="border-custom-blue mt-2"
          containerClassName="mr-2"
          value={accession}
        />
        <Input
          label="Instances"
          labelClassName="text-white"
          className="invisible mt-2"
          containerClassName="mr-2"
          value={instances}
        />
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
