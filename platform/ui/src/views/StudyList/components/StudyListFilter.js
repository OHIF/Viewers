import React from 'react';
import PropTypes from 'prop-types';

import { Button, Icon, Input } from '@ohif/ui';

const StudyListFilter = ({
  patientName,
  mrn,
  studyDate,
  description,
  modality,
  accession,
  instances,
  onFilterChange,
}) => {
  return (
    <div>
      <div>
        <div>
          <div>Study List</div>
          <div>
            <Button startIcon={<Icon name="info-link" />}>Learn more</Button>
          </div>
        </div>
        <div>> 100 Studies</div>
      </div>
      <div>
        <Input label="Patient name" value={patientName} />
        <Input label="MRN" value={mrn} />
        <Input label="Study date" value={studyDate} />
        <Input label="Description" value={description} />
        <Input label="Modality" value={modality} />
        <Input label="Accession" value={accession} />
        <Input label="Instances" value={instances} />
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
  onFilterChange: PropTypes.func.isRequired,
};

export default StudyListFilter;
