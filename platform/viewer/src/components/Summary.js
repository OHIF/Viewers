import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// ----------------------------------------------------------------------

const Summary = props => {
  useEffect(() => {
    localStorage.setItem(
      'summary',
      JSON.stringify({
        name: 'sadsad',
        name2: 'sadsad',
        name3: 'sadsad',
      })
    );
  }, []);

  return (
    <div
      style={{
        width: '100%',
        background: '#000000',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <div
        style={{
          paddingBottom: '40px',
        }}
      >
        <h1
          style={{
            textAlign: 'left',
            margin: 0,
          }}
        >
          RadCard Report Summary
        </h1>
      </div>

      <div
        style={{
          height: '100%',
          flex: 1,
        }}
      >
        <div
          className=""
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
        >
          <h2
            className="cad"
            style={{
              color: '#00c7ee',
            }}
          >
            Patient ID :{' '}
          </h2>
          <h2>abc123 </h2>
        </div>
        <div
          className=""
          style={{
            display: 'flex',
            marginTop: 12,
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
        >
          <h2
            className="cad"
            style={{
              color: '#00c7ee',
            }}
          >
            Classifier:{' '}
          </h2>
          <h2>Resnet-18 </h2>
        </div>

        <div
          className=""
          style={{
            display: 'flex',
            marginTop: 12,
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
        >
          <h2
            className="cad"
            style={{
              color: '#00c7ee',
            }}
          >
            Prediction:{' '}
          </h2>
          <h2>Necrosis</h2>
        </div>

        <div
          className=""
          style={{
            display: 'flex',
            flexDirection: 'row',
            marginTop: 12,
            justifyContent: 'flex-start',
          }}
        >
          <h2
            className="cad"
            style={{
              color: '#00c7ee',
            }}
          >
            Confidence:{' '}
          </h2>
          <h2>81%</h2>
        </div>

        <div
          className=""
          style={{
            marginTop: 12,
          }}
        >
          <button
            onClick={props.triggerDownload}
            // style={{
            //   marginTop: '20px',
            //   border: '1px yellow solid',
            //   fontSize: '24px',
            //   background: 'black',
            //   color: 'white',
            //   padding: '12px',
            // }}
            className="btn btn-primary btn-large"
          >
            Print To PDF
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
        }}
      ></div>
    </div>
  );
};

export default Summary;
