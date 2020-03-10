import React, { useState } from 'react';
import {
  Typography,
  ButtonGroup,
  Button,
  IconButton,
} from '../../../components/';

const StudyListPagination = props => {
  const [currentPage, setCurrentPage] = useState(1);

  const navigateToPage = page => {
    const toPage = page < 1 ? 1 : page;
    setCurrentPage(toPage);
  };

  return (
    <div className="bg-black py-10">
      <div className="container m-auto relative px-8">
        <div className="flex justify-between">
          <div className="flex items-center">
            <select
              defaultValue="25"
              className="bg-black text-white border border-custom-darkSlateBlue text-base h-8 mr-3 focus:outline-none"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <Typography className="text-base opacity-60">
              Results per page
            </Typography>
          </div>
          <div className="">
            <div className="flex items-center">
              <Typography className="opacity-60 mr-4 text-base">
                Page {currentPage}
              </Typography>
              <ButtonGroup color="primary">
                <IconButton
                  size="small"
                  className="border-custom-darkSlateBlue px-4"
                  color="white"
                  onClick={() => navigateToPage(1)}
                >
                  <>{`<<`}</>
                </IconButton>
                <Button
                  size="small"
                  className="border-custom-darkSlateBlue"
                  color="white"
                  onClick={() => navigateToPage(currentPage - 1)}
                >{`< Previous`}</Button>
                <Button
                  size="small"
                  className="border-custom-darkSlateBlue"
                  color="white"
                  onClick={() => navigateToPage(currentPage + 1)}
                >
                  {`Next >`}
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyListPagination;
