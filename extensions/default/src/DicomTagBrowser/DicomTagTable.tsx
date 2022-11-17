import React from 'react';

function ColumnHeaders() {
  return (
    <div className="m-auto flex flex-col py-2 bg-secondary-light">
      <div className="flex flex-row w-full">
        <div className="px-3 w-5/24">
          <label className="flex flex-col flex-1 text-white text-lg pl-1 select-none">
            <span className="flex flex-row items-center focus:outline-none">
              Tag
            </span>
          </label>
        </div>
        <div className="px-3 w-4/24">
          <label className="flex flex-col flex-1 text-white text-lg pl-1 select-none">
            <span className="flex flex-row items-center focus:outline-none">
              VR
            </span>
          </label>
        </div>
        <div className="px-3 w-6/24">
          <label className="flex flex-col flex-1 text-white text-lg pl-1 select-none">
            <span className="flex flex-row items-center focus:outline-none">
              Keyword
            </span>
          </label>
        </div>
        <div className="px-3 w-5/24">
          <label className="flex flex-col flex-1 text-white text-lg pl-1 select-none">
            <span className="flex flex-row items-center focus:outline-none">
              Value
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

function DicomTagTable({ rows }) {
  return (
    <div>
      {ColumnHeaders()}
      <div
        className="m-auto relative border-2 border-secondary-light overflow-hidden ohif-scrollbar"
        style={{ height: '32rem' }}
      >
        <table className="w-full text-white">
          <tbody>
            {rows.map((row, index) => {
              const className = row.className ? row.className : null;

              return (
                <tr
                  className="hover:bg-secondary-main transition duration-300 bg-primary-dark"
                  key={`DICOMTagRow-${index}`}
                >
                  <td
                    style={{ maxWidth: '0px' }}
                    className="px-4 py-2 text-base break-all border-b border-secondary-light w-5/24"
                  >
                    <div className="flex">
                      <div className="inline-flex max-w-full">{row[0]}</div>
                    </div>
                  </td>
                  <td
                    style={{ maxWidth: '0px' }}
                    className="px-4 py-2 text-base break-all border-b border-secondary-light w-4/24"
                  >
                    <div className="flex">
                      <div className="inline-flex max-w-full">{row[1]}</div>
                    </div>
                  </td>
                  <td
                    style={{ maxWidth: '0px' }}
                    className="px-4 py-2 text-base break-all border-b border-secondary-light w-6/24"
                  >
                    <div className="flex">
                      <div className="inline-flex max-w-full">{row[2]}</div>
                    </div>
                  </td>
                  <td
                    style={{ maxWidth: '0px' }}
                    className="px-4 py-2 text-base break-all border-b border-secondary-light w-14/24"
                  >
                    <div className="flex">
                      <div className="inline-flex max-w-full">{row[3]}</div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DicomTagTable;
