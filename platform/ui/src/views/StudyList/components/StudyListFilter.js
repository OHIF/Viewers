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
    <div className="flex flex-col mt-5 mb-3">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <Typography variant="h4" className="text-custom-aquaBright mr-6">
            Study List
          </Typography>
          <div className="flex flex-row items-start">
            <Button
              variant="text"
              className="text-custom-blueBright"
              startIcon={<Icon name="info-link" />}
            >
              Learn more
            </Button>
          </div>
        </div>
        <div className="flex flex-row">
          <Typography variant="h5" className="text-white">
            {numOfStudies > 100 ? '>100' : numOfStudies}
          </Typography>
          <Typography variant="body" className="text-custom-grayLight">
            Studies
          </Typography>
        </div>
      </div>
      <div className="flex flex-row">
        <Input
          label="Patient name"
          labelClassName="text-white"
          value={patientName}
        />
        <Input label="MRN" labelClassName="text-white" value={mrn} />
        <Input
          label="Study date"
          labelClassName="text-white"
          value={studyDate}
        />
        <Input
          label="Description"
          labelClassName="text-white"
          value={description}
        />
        <Input label="Modality" labelClassName="text-white" value={modality} />
        <Input
          label="Accession"
          labelClassName="text-white"
          value={accession}
        />
        <Input
          label="Instances"
          labelClassName="text-white"
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
