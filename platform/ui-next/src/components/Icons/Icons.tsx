import React from 'react';
import { Code } from 'lucide-react';

type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {
  // Usage example: <Icons.ArrowLeft />
  Code: Code,
  Add: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="Add"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <g
          id="Group"
          transform="translate(6, 6)"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line
            x1="6"
            y1="0"
            x2="6"
            y2="12"
            id="Path"
          ></line>
          <line
            x1="12"
            y1="6"
            x2="0"
            y2="6"
            id="Path"
          ></line>
        </g>
      </g>
    </svg>
  ),
  ChevronClosed: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>icon-chevron-closed</title>
      <g
        id="icon-chevron-closed"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          opacity="0.2"
          transform="translate(12, 12) rotate(90) translate(-12, -12)"
          x="0"
          y="0"
          width="24"
          height="24"
          rx="4"
        ></rect>
        <polyline
          id="Path-2"
          stroke="currentColor"
          transform="translate(12.0902, 12.0451) rotate(90) translate(-12.0902, -12.0451)"
          points="8 10 12.090229 14.090229 16.1804581 10"
        ></polyline>
      </g>
    </svg>
  ),
  ChevronOpen: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>icon-chevron-open</title>
      <g
        id="icon-chevron-open"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          opacity="0.199999988"
          x="0"
          y="0"
          width="24"
          height="24"
          rx="4"
        ></rect>
        <polyline
          id="Path-2"
          stroke="currentColor"
          points="8 10 12.090229 14.090229 16.1804581 10"
        ></polyline>
      </g>
    </svg>
  ),
  ColorChange: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="ColorChange"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <g
          id="Group-4"
          transform="translate(4, 5)"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M11.9830989,1.93861826 C10.5789104,0.665654409 8.7439168,-0.0269214719 6.84881419,0.000801239617 C3.06621664,0.000801239617 0,2.55531723 0,5.70792489 C0.13353775,8.17267636 1.81407658,10.2821527 4.18664171,10.963157 C5.1582084,11.3047338 5.96098033,11.0256244 6.52318651,9.75767005 C6.72995019,9.15827585 7.22615951,8.70434675 7.84154981,8.55163978 C8.45694011,8.39893281 9.10779864,8.568221 9.57079585,9.00141636 L9.70370511,9.13432562"
            id="Path"
          ></path>
          <line
            x1="13.2723188"
            y1="6.75657895"
            x2="9.69838874"
            y2="13.9017808"
            id="Path"
          ></line>
          <path
            d="M12.5054323,4.46389421 C12.1415749,5.29815229 12.4941364,6.27127189 13.3079188,6.67887077 C14.1217013,7.08646964 15.1121527,6.7860243 15.5623453,5.99500889 C16.4969889,4.55848545 16.3097611,2.6657723 15.1117829,1.44020853 C15.0640204,1.39470251 14.9942555,1.38091172 14.9327711,1.40482233 C14.8712867,1.42873293 14.8291685,1.48603381 14.8246989,1.55185231 C14.8366608,3.08695427 13.4517463,2.56727906 12.5054323,4.46389421 Z"
            id="Path"
          ></path>
          <path
            d="M3.52608268,6.59044238 C3.70959208,6.59044238 3.85835583,6.73920613 3.85835583,6.92271553"
            id="Path"
          ></path>
          <path
            d="M3.19380953,6.92404462 C3.19345611,6.83569024 3.22830728,6.75083342 3.29065893,6.68823236 C3.35301058,6.62563131 3.4377276,6.59044167 3.52608268,6.59044238"
            id="Path"
          ></path>
          <path
            d="M3.52608268,7.25498868 C3.34257329,7.25498868 3.19380953,7.10622492 3.19380953,6.92271553"
            id="Path"
          ></path>
          <path
            d="M3.85835583,6.92404462 C3.85762387,7.10703476 3.70907428,7.25499014 3.52608268,7.25498868"
            id="Path"
          ></path>
          <path
            d="M4.52290214,3.26771086 C4.70641153,3.26771086 4.85517529,3.41647462 4.85517529,3.59998401"
            id="Path"
          ></path>
          <path
            d="M4.19062898,3.60131311 C4.19062898,3.41780371 4.33939274,3.26903996 4.52290214,3.26903996"
            id="Path"
          ></path>
          <path
            d="M4.52290214,3.93225717 C4.33939274,3.93225717 4.19062898,3.78349341 4.19062898,3.59998401"
            id="Path"
          ></path>
          <path
            d="M4.85517529,3.60131311 C4.85444332,3.78430325 4.70589374,3.93225863 4.52290214,3.93225717"
            id="Path"
          ></path>
          <path
            d="M7.84563365,2.60316456 C8.02914304,2.60316456 8.1779068,2.75192832 8.1779068,2.93543771"
            id="Path"
          ></path>
          <path
            d="M7.5133605,2.9367668 C7.51300708,2.84841243 7.54785824,2.76355561 7.61020989,2.70095455 C7.67256154,2.63835349 7.75727857,2.60316385 7.84563365,2.60316456"
            id="Path"
          ></path>
          <path
            d="M7.84563365,3.26771086 C7.66212425,3.26771086 7.5133605,3.11894711 7.5133605,2.93543771"
            id="Path"
          ></path>
          <path
            d="M8.1779068,2.9367668 C8.1779068,3.1202762 8.02914304,3.26903996 7.84563365,3.26903996"
            id="Path"
          ></path>
        </g>
      </g>
    </svg>
  ),
  Controls: (props: IconProps) => (
    <svg
      width="18px"
      height="18px"
      viewBox="0 0 18 18"
      {...props}
    >
      <g
        id="Controls"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle
          id="Oval"
          stroke="currentColor"
          cx="9"
          cy="3.34782609"
          r="1.73913043"
        ></circle>
        <line
          x1="10.7373913"
          y1="3.34782609"
          x2="16.4095652"
          y2="3.34782609"
          id="Path"
          stroke="currentColor"
        ></line>
        <line
          x1="1.62695652"
          y1="3.34782609"
          x2="7.2573913"
          y2="3.34782609"
          id="Path"
          stroke="currentColor"
        ></line>
        <g
          id="Group-26"
          transform="translate(9.0183, 9) scale(-1, 1) translate(-9.0183, -9)translate(1.627, 7.2609)"
          stroke="currentColor"
        >
          <circle
            id="Oval"
            transform="translate(3.8948, 1.7391) scale(-1, 1) translate(-3.8948, -1.7391)"
            cx="3.89478261"
            cy="1.73913043"
            r="1.73913043"
          ></circle>
          <line
            x1="5.63043478"
            y1="1.73913043"
            x2="14.7826087"
            y2="1.73913043"
            id="Path"
            transform="translate(10.2065, 1.7391) scale(-1, 1) translate(-10.2065, -1.7391)"
          ></line>
          <line
            x1="0"
            y1="1.73913043"
            x2="2.15217391"
            y2="1.73913043"
            id="Path"
            transform="translate(1.0761, 1.7391) scale(-1, 1) translate(-1.0761, -1.7391)"
          ></line>
        </g>
        <circle
          id="Oval"
          stroke="currentColor"
          cx="7.26086957"
          cy="14.6521739"
          r="1.73913043"
        ></circle>
        <line
          x1="8.99652174"
          y1="14.6521739"
          x2="16.4095652"
          y2="14.6521739"
          id="Path"
          stroke="currentColor"
        ></line>
        <line
          x1="1.62695652"
          y1="14.6521739"
          x2="5.52173913"
          y2="14.6521739"
          id="Path"
          stroke="currentColor"
        ></line>
      </g>
    </svg>
  ),
  Delete: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="Delete"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <circle
          id="Oval"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          cx="12"
          cy="12"
          r="7"
        ></circle>
        <line
          x1="8.95652174"
          y1="8.95652174"
          x2="15.0434783"
          y2="15.0434783"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></line>
        <line
          x1="15.0434783"
          y1="8.95652174"
          x2="8.95652174"
          y2="15.0434783"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></line>
      </g>
    </svg>
  ),
  Download: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>icon-download</title>
      <g
        id="icon-download"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
          rx="4"
        ></rect>
        <circle
          id="Oval"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          cx="12"
          cy="12"
          r="9"
        ></circle>
        <line
          x1="12"
          y1="7.5"
          x2="12"
          y2="16.5"
          id="Path"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></line>
        <line
          x1="12"
          y1="16.5"
          x2="8.625"
          y2="13.125"
          id="Path"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></line>
        <line
          x1="12"
          y1="16.5"
          x2="15.375"
          y2="13.125"
          id="Path"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></line>
      </g>
    </svg>
  ),
  Export: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="Export"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <line
          x1="12"
          y1="13.125"
          x2="12"
          y2="5"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></line>
        <polyline
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="9.1875 7.8125 12 5 14.8125 7.8125"
        ></polyline>
        <path
          d="M13.875,10.000625 L16.375,10.000625 C16.720178,10.000625 17,10.280447 17,10.625625 L17,18.750625 C17,19.095803 16.720178,19.375625 16.375,19.375625 L7.625,19.375625 C7.27982203,19.375625 7,19.095803 7,18.750625 L7,10.625625 C7,10.280447 7.27982203,10.000625 7.625,10.000625 L10.125,10.000625"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </g>
    </svg>
  ),
  Hide: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="hide"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <circle
          id="Oval"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          cx="12.4986195"
          cy="11.8041442"
          r="2.58684689"
        ></circle>
        <path
          d="M20.906611,11.5617197 C20.0470387,10.5861089 16.6094888,7 12.4986195,7 C8.38775024,7 4.95020027,10.5861089 4.090628,11.5617197 C3.96979067,11.7007491 3.96979067,11.9075393 4.090628,12.0465687 C4.95020027,13.0221796 8.38775024,16.6082885 12.4986195,16.6082885 C16.6094888,16.6082885 20.0470387,13.0221796 20.906611,12.0465687 C21.0274483,11.9075393 21.0274483,11.7007491 20.906611,11.5617197 Z"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </g>
    </svg>
  ),
  Info: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="icon-download"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
          rx="4"
        ></rect>
        <circle
          id="Oval"
          fillRule="nonzero"
          cx="12.192"
          cy="12.192"
          r="8.192"
        ></circle>
        <path
          d="M12.192,4.00160754 C7.66678807,4.00160754 4,7.6683956 4,12.1928038 C4,16.7172119 7.66759184,20.3848038 12.192,20.3848038 C16.7172119,20.3848038 20.384,16.7172119 20.384,12.1928038 C20.384,7.6683956 16.7172119,4.00080377 12.192,4.00080377 L12.192,4.00160754 Z M12.192,4.8053752 C16.2727284,4.8053752 19.5802323,8.11287912 19.5802323,12.1936075 C19.5802323,16.2735322 16.2727284,19.5818399 12.192,19.5818399 C8.11127159,19.5818399 4.80376766,16.2735322 4.80376766,12.1936075 C4.80376766,8.11287912 8.11127159,4.80457143 12.192,4.80457143 L12.192,4.8053752 Z"
          id="Shape"
          fill="currentColor"
          fillRule="nonzero"
        ></path>
        <path
          d="M11.5425557,10.4920314 C12.0867064,10.4920314 12.534405,10.905168 12.5882575,11.4356546 L12.5938838,11.5425557 L12.5938838,16.0870581 C12.5938838,16.308898 12.4138399,16.4889419 12.192,16.4889419 C11.9950769,16.4889419 11.8303046,16.346675 11.7965463,16.1593972 L11.7901162,16.0870581 L11.7901162,11.5425557 C11.7901162,11.4260094 11.7089356,11.3279498 11.5996232,11.3014254 L11.5433595,11.2957991 L10.2436672,11.2957991 C10.0218273,11.2957991 9.84178336,11.1157551 9.84178336,10.8939152 C9.84178336,10.6961884 9.98405024,10.5322198 10.1713281,10.4984615 L10.2436672,10.4920314 L11.541752,10.4920314 L11.5425557,10.4920314 Z M11.2178336,7.24561381 L11.3094631,7.25124019 C11.6679435,7.29625118 11.9444396,7.60168289 11.9444396,7.97221978 C11.9444396,8.37410361 11.6197174,8.69882575 11.2178336,8.69882575 C10.8167535,8.69882575 10.4920314,8.37329984 10.4920314,7.97221978 C10.4920314,7.60248666 10.7685275,7.29625118 11.1270078,7.25124019 L11.2178336,7.24561381 Z"
          id="Shape"
          fill="currentColor"
          fillRule="nonzero"
        ></path>
        <path
          d="M14.139529,15.6867818 C14.3613689,15.6867818 14.5414129,15.8668257 14.5414129,16.0886656 C14.5414129,16.2855887 14.399146,16.4503611 14.2118681,16.4841193 L14.139529,16.4905495 L10.244471,16.4905495 C10.0226311,16.4905495 9.84258713,16.3105055 9.84258713,16.0886656 C9.84258713,15.8909388 9.984854,15.7269702 10.1721319,15.6932119 L10.244471,15.6867818 L14.139529,15.6867818 L14.139529,15.6867818 Z"
          id="Path"
          fill="currentColor"
          fillRule="nonzero"
        ></path>
      </g>
    </svg>
  ),
  Lock: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="Lock"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <path
          d="M16,10.6666667 L16,8 C16,5.79133333 14.2086667,4 12,4 C9.79133333,4 8,5.79133333 8,8 L8,10.6666667 L7.5,10.6666667 C6.67157288,10.6666667 6,11.3382395 6,12.1666667 L6,18.5 C6,19.3284271 6.67157288,20 7.5,20 L16.5,20 C17.3284271,20 18,19.3284271 18,18.5 L18,12.1666667 C18,11.3382395 17.3284271,10.6666667 16.5,10.6666667 L16,10.6666667 L16,10.6666667 Z M9.33333333,10.6666667 L9.33333333,8 C9.33333333,6.52933333 10.5293333,5.33333333 12,5.33333333 C13.4706667,5.33333333 14.6666667,6.52933333 14.6666667,8 L14.6666667,10.6666667 L9.33333333,10.6666667 Z"
          id="Shape"
          fill="currentColor"
          fillRule="nonzero"
        ></path>
      </g>
    </svg>
  ),
  ListView: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>icon-list-view</title>
      <g
        id="icon-list-view"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <line
          x1="10.5"
          y1="8"
          x2="18.5"
          y2="8"
          id="Line-2"
          stroke="currentColor"
          strokeLinecap="round"
        ></line>
        <line
          x1="10.5"
          y1="12"
          x2="18.5"
          y2="12"
          id="Line-2"
          stroke="currentColor"
          strokeLinecap="round"
        ></line>
        <line
          x1="10.5"
          y1="16"
          x2="18.5"
          y2="16"
          id="Line-2"
          stroke="currentColor"
          strokeLinecap="round"
        ></line>
        <circle
          id="Oval"
          fill="currentColor"
          cx="7"
          cy="8"
          r="1"
        ></circle>
        <circle
          id="Oval"
          fill="currentColor"
          cx="7"
          cy="12"
          r="1"
        ></circle>
        <circle
          id="Oval"
          fill="currentColor"
          cx="7"
          cy="16"
          r="1"
        ></circle>
      </g>
    </svg>
  ),
  More: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>icon-more</title>
      <g
        id="icon-more"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
          rx="4"
        ></rect>
        <circle
          id="Oval"
          fill="currentColor"
          cx="6"
          cy="12"
          r="2"
        ></circle>
        <circle
          id="Oval"
          fill="currentColor"
          cx="12"
          cy="12"
          r="2"
        ></circle>
        <circle
          id="Oval"
          fill="currentColor"
          cx="18"
          cy="12"
          r="2"
        ></circle>
      </g>
    </svg>
  ),
  DisplayFillAndOutline: (props: IconProps) => (
    <svg
      width="18px"
      height="18px"
      viewBox="0 0 18 18"
      {...props}
    >
      <g
        id="view-outline-fill"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Group-13">
          <rect
            id="Rectangle"
            x="0"
            y="0"
            width="18"
            height="18"
          ></rect>
          <rect
            id="Rectangle"
            stroke="currentColor"
            x="1.5"
            y="1.5"
            width="15"
            height="15"
            rx="1"
          ></rect>
          <rect
            id="Rectangle"
            fill="currentColor"
            x="3.5"
            y="3.5"
            width="11"
            height="11"
            rx="1"
          ></rect>
        </g>
      </g>
    </svg>
  ),
  DisplayOutlineOnly: (props: IconProps) => (
    <svg
      width="18px"
      height="18px"
      viewBox="0 0 18 18"
      {...props}
    >
      <g
        id="view-outline"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Group-13">
          <rect
            id="Rectangle"
            x="0"
            y="0"
            width="18"
            height="18"
          ></rect>
          <rect
            id="Rectangle"
            stroke="currentColor"
            x="1.5"
            y="1.5"
            width="15"
            height="15"
            rx="1"
          ></rect>
        </g>
      </g>
    </svg>
  ),
  DisplayFillOnly: (props: IconProps) => (
    <svg
      width="18px"
      height="18px"
      viewBox="0 0 18 18"
      {...props}
    >
      <g
        id="view-fill"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Group-13">
          <rect
            id="Rectangle"
            x="0"
            y="0"
            width="18"
            height="18"
          ></rect>
          <rect
            id="Rectangle"
            fill="currentColor"
            x="2"
            y="2"
            width="14"
            height="14"
            rx="1"
          ></rect>
        </g>
      </g>
    </svg>
  ),
  Actions: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="more-dropdown"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <g
          id="Group-2"
          transform="translate(5, 4)"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle
            id="Oval"
            cx="6.74621802"
            cy="7.5938001"
            r="1.68710308"
          ></circle>
          <path
            d="M8.17972732,1.06493425 L8.67634848,2.69920529 C8.84616867,3.26259112 9.42371506,3.59782471 9.99714943,3.46585687 L11.6537273,3.08194406 C12.2982043,2.9366791 12.9621245,3.22831522 13.2911435,3.80120174 C13.6201625,4.37408825 13.5374848,5.09450899 13.0872366,5.57796434 L11.9284539,6.82714853 C11.528377,7.25995707 11.528377,7.92764314 11.9284539,8.36045168 L13.0872366,9.60963586 C13.5374848,10.0930912 13.6201625,10.813512 13.2911435,11.3863985 C12.9621245,11.959285 12.2982043,12.2509211 11.6537273,12.1056561 L9.99714943,11.7217433 C9.42371506,11.5897755 8.84616867,11.9250091 8.67634848,12.4883949 L8.17972732,14.122666 C7.98874475,14.7549849 7.40616232,15.1876002 6.745631,15.1876002 C6.08509968,15.1876002 5.50251725,14.7549849 5.31153468,14.122666 L4.81491352,12.4883949 C4.64509333,11.9250091 4.06754694,11.5897755 3.49411257,11.7217433 L1.83753467,12.1056561 C1.19305769,12.2509211 0.529137506,11.959285 0.200118485,11.3863985 C-0.128900535,10.813512 -0.0462227777,10.0930912 0.404025372,9.60963586 L1.56280807,8.36045168 C1.96288499,7.92764314 1.96288499,7.25995707 1.56280807,6.82714853 L0.404025372,5.57796434 C-0.0462227777,5.09450899 -0.128900535,4.37408825 0.200118485,3.80120174 C0.529137506,3.22831522 1.19305769,2.9366791 1.83753467,3.08194406 L3.49411257,3.46585687 C4.06754694,3.59782471 4.64509333,3.26259112 4.81491352,2.69920529 L5.31153468,1.06493425 C5.50251725,0.43261528 6.08509968,0 6.745631,0 C7.40616232,0 7.98874475,0.43261528 8.17972732,1.06493425 Z"
            id="Path"
          ></path>
        </g>
      </g>
    </svg>
  ),
  PinFill: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>icon-pin-fill</title>
      <g
        id="icon-pin-fill"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
          rx="4"
        ></rect>
        <path
          d="M6.60822653,11.9185094 L12.4722476,17.7825305 C13.3039432,16.88156 13.5654769,15.59278 13.1507792,14.4388774 L17.647936,9.94247454 L17.7813806,10.0751652 C18.1510591,10.4324165 18.7388453,10.4274758 19.1024662,10.0640606 C19.4660871,9.70064533 19.4713604,9.11286206 19.1143182,8.74298142 L15.6462677,5.27493091 C15.2775626,4.90747491 14.6807861,4.90848754 14.3133301,5.27719268 C13.9458741,5.64589783 13.9468867,6.24267435 14.3155918,6.61013036 L14.4490364,6.74357491 L9.95187958,11.2407317 C8.7980766,10.8263652 7.50959437,11.087548 6.60822653,11.9185094 Z"
          id="Path"
          stroke="currentColor"
          fill="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <line
          x1="9.54023706"
          y1="14.8505199"
          x2="4.5"
          y2="19.890757"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></line>
      </g>
    </svg>
  ),
  Pin: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>icon-pin</title>
      <g
        id="icon-pin"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
          rx="4"
        ></rect>
        <path
          d="M6.60822653,11.9185094 L12.4722476,17.7825305 C13.3039432,16.88156 13.5654769,15.59278 13.1507792,14.4388774 L17.647936,9.94247454 L17.7813806,10.0751652 C18.1510591,10.4324165 18.7388453,10.4274758 19.1024662,10.0640606 C19.4660871,9.70064533 19.4713604,9.11286206 19.1143182,8.74298142 L15.6462677,5.27493091 C15.2775626,4.90747491 14.6807861,4.90848754 14.3133301,5.27719268 C13.9458741,5.64589783 13.9468867,6.24267435 14.3155918,6.61013036 L14.4490364,6.74357491 L9.95187958,11.2407317 C8.7980766,10.8263652 7.50959437,11.087548 6.60822653,11.9185094 Z"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <line
          x1="9.54023706"
          y1="14.8505199"
          x2="4.5"
          y2="19.890757"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></line>
      </g>
    </svg>
  ),
  Rename: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="Rename"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <g
          id="rename"
          transform="translate(4.5, 5)"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon
            id="Rectangle"
            transform="translate(7.6682, 7.2953) rotate(45) translate(-7.6682, -7.2953)"
            points="5.71337096 0.360798742 9.62306412 0.360798742 9.62306412 14.2297836 5.71337096 14.2297836"
          ></polygon>
          <polygon
            id="Path"
            points="1.38207653 10.8162548 0 14.963136 4.14688121 13.5810595"
          ></polygon>
          <path
            d="M13.9536949,3.77359418 L11.1895418,1.00944111 L11.650234,0.548748934 C12.4172745,-0.192083594 13.6365239,-0.181488647 14.3905743,0.57256175 C15.1446246,1.32661215 15.1552196,2.54586147 14.4143871,3.312902 L13.9536949,3.77359418 Z"
            id="Path"
          ></path>
        </g>
      </g>
    </svg>
  ),
  ThumbnailView: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>icon-thumbnail-view</title>
      <g
        id="icon-thumbnail-view"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <rect
          id="Rectangle"
          fill="currentColor"
          x="6"
          y="6"
          width="5"
          height="5"
          rx="1.5"
        ></rect>
        <rect
          id="Rectangle"
          fill="currentColor"
          x="13"
          y="6"
          width="5"
          height="5"
          rx="1.5"
        ></rect>
        <rect
          id="Rectangle"
          fill="currentColor"
          x="6"
          y="13"
          width="5"
          height="5"
          rx="1.5"
        ></rect>
        <rect
          id="Rectangle"
          fill="currentColor"
          x="13"
          y="13"
          width="5"
          height="5"
          rx="1.5"
        ></rect>
      </g>
    </svg>
  ),
  IconMPR: (props: IconProps) => (
    <svg
      width="12px"
      height="12px"
      viewBox="0 0 12 12"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>info-mpr</title>
      <g
        id="info-mpr"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="12"
          height="12"
        ></rect>
        <g
          id="mpr"
          transform="translate(1.5, 1.5)"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon
            id="Path"
            points="4.5 0 0 1.90909091 4.5 3.81818182 9 1.90909091"
          ></polygon>
          <polyline
            id="Path"
            points="0 1.90909091 0 7.09090909 4.5 9 9 7.09090909 9 1.90909091"
          ></polyline>
          <line
            x1="4.5"
            y1="3.81818182"
            x2="4.5"
            y2="9"
            id="Path"
          ></line>
        </g>
      </g>
    </svg>
  ),
  InfoSeries: (props: IconProps) => (
    <svg
      width="12px"
      height="12px"
      viewBox="0 0 12 12"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>info-series</title>
      <g
        id="info-series"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="12"
          height="12"
        ></rect>
        <g
          id="series"
          transform="translate(1.5, 1.5)"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M2.22352941,6.3 L0.370588235,6.3 C0.165918004,6.3 0,6.134082 0,5.92941176 L0,0.370588235 C0,0.165918004 0.165918004,0 0.370588235,0 L5.92941176,0 C6.134082,0 6.3,0.165918004 6.3,0.370588235 L6.3,2.22352941"
            id="Path"
          ></path>
          <rect
            id="Rectangle"
            x="2.7"
            y="2.7"
            width="6.3"
            height="6.3"
            rx="1"
          ></rect>
        </g>
      </g>
    </svg>
  ),
  StatusError: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
    >
      <g
        id="StatusAlert"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <circle
          id="Oval"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          cx="12"
          cy="12"
          r="8"
        ></circle>
        <g
          id="Group"
          transform="translate(11.5, 8)"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line
            x1="0.502969489"
            y1="5"
            x2="0.502969489"
            y2="5.55111512e-16"
            id="Path"
          ></line>
          <path
            d="M0.494019489,7.75 C0.427967985,7.75102315 0.365128544,7.77867594 0.319754003,7.82668634 C0.274379462,7.87469675 0.250315262,7.93899595 0.253019489,8.005 C0.257853669,8.14136674 0.369567839,8.24954844 0.506019489,8.25 L0.506019489,8.25 C0.57198073,8.2487037 0.634656968,8.22096694 0.679972815,8.17301863 C0.725288662,8.12507033 0.749445908,8.06092934 0.747019489,7.995 C0.742888429,7.86182395 0.636177529,7.75467571 0.503019489,7.75 L0.498019489,7.75"
            id="Path"
          ></path>
        </g>
      </g>
    </svg>
  ),
  StatusSuccess: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="StatusSuccess"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <polyline
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="16.173913 8.52173913 11.3043478 15.1304348 7.82608696 12.3478261"
        ></polyline>
        <circle
          id="Oval"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          cx="12"
          cy="12"
          r="8"
        ></circle>
      </g>
    </svg>
  ),
  StatusTracking: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>status-tracking</title>
      <g
        id="status-tracking"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g>
          <rect
            id="Rectangle"
            x="0"
            y="0"
            width="24"
            height="24"
          ></rect>
          <rect
            id="Rectangle"
            stroke="#5ACCE6"
            fill="#5ACCE6"
            x="4.5"
            y="4.5"
            width="15"
            height="15"
            rx="7.5"
          ></rect>
          <path
            d="M15.388889,9 L11.7739644,14.5948033 C11.6112717,14.8456871 11.3630166,15.0025668 11.0931982,15.0249993 C10.8233798,15.0474318 10.5584004,14.9332222 10.3665704,14.7118131 L8.5,12.5449644"
            id="Path"
            stroke="#090C29"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </g>
      </g>
    </svg>
  ),
  StatusWarning: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>status-warning</title>
      <g
        id="status-warning"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g>
          <rect
            id="Rectangle"
            x="0"
            y="0"
            width="24"
            height="24"
          ></rect>
          <g
            id="Group-5"
            transform="translate(4, 4)"
            stroke="#FFD22A"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M8.0001715,11.3365862 C8.1842651,11.3365862 8.33350959,11.4858235 8.33350959,11.6699171 C8.33350959,11.8540107 8.1842651,12.0032552 8.0001715,12.0032552 C7.8160779,12.0032552 7.66684054,11.8540107 7.66684054,11.6699171 C7.66684054,11.4858235 7.8160779,11.3365862 8.0001715,11.3365862"
              id="Path"
            ></path>
            <line
              x1="8.0001715"
              y1="8.67127184"
              x2="8.0001715"
              y2="4.67130038"
              id="Path"
            ></line>
            <path
              d="M9.11749686,0.669995592 C8.89725509,0.25756493 8.46772416,0 8.0001715,0 C7.53261884,0 7.10308791,0.25756493 6.88284614,0.669995592 L0.141560901,13.5152373 C-0.0609866009,13.9006851 -0.0452769444,14.3643734 0.18289394,14.7352286 C0.413865574,15.107289 0.820963502,15.3332864 1.25888626,15.3325594 L14.7414567,15.3325594 C15.1793795,15.3332864 15.5864774,15.107289 15.8174491,14.7352286 C16.0456199,14.3643734 16.0613296,13.9006851 15.8587821,13.5152373 L9.11749686,0.669995592 Z"
              id="Path"
              fillOpacity="0.2"
              fill="#FFD22A"
            ></path>
          </g>
        </g>
      </g>
    </svg>
  ),
  SortingAscending: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="9"
      height="16"
      viewBox="0 0 9 16"
      {...props}
    >
      <g
        fill="currentColor"
        fillRule="evenodd"
      >
        <path
          fill="transparent"
          d="M8.69 11.516L7.51 10.274 4.5 13.442 1.49 10.274 0.31 11.516 4.5 15.926z"
        />
        <path
          d="M8.69 1.516L7.51 0.274 4.499 3.442 1.49 0.274 0.31 1.516 4.5 5.926z"
          transform="matrix(1 0 0 -1 0 6.2)"
        />
      </g>
    </svg>
  ),
  SortingDescending: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="9"
      height="16"
      viewBox="0 0 9 16"
      {...props}
    >
      <g
        fill="currentColor"
        fillRule="evenodd"
      >
        <path d="M8.69 11.516L7.51 10.274 4.5 13.442 1.49 10.274 0.31 11.516 4.5 15.926z" />
        <path
          fill="transparent"
          d="M8.69 1.516L7.51 0.274 4.499 3.442 1.49 0.274 0.31 1.516 4.5 5.926z"
          transform="matrix(1 0 0 -1 0 6.2)"
        />
      </g>
    </svg>
  ),
  Trash: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      aria-labelledby="title"
      fill="currentColor"
      {...props}
    >
      <title id="title">Trash</title>
      <path d="M32 464a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128H32zm272-256a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zM432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z" />
    </svg>
  ),
  Cancel: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="19"
      viewBox="0 0 19 19"
      {...props}
    >
      <g
        fill="currentColor"
        fillRule="evenodd"
      >
        <circle
          cx="9.5"
          cy="9.5"
          r="9.5"
          fill="currentColor"
        />
        <g
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <path
            d="M.188.187L8.813 8.812M8.813.187L.188 8.812"
            transform="translate(5 5)"
          />
        </g>
      </g>
    </svg>
  ),
  InfoLink: (props: IconProps) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        fill="currentColor"
        fillRule="evenodd"
      >
        <path d="M7 .102A6.899 6.899 0 1 0 7 13.9 6.899 6.899 0 0 0 7 .102zm0 .875a6.024 6.024 0 1 1 0 12.048A6.024 6.024 0 0 1 7 .977z" />
        <path d="M6.462 5.486c.503 0 .917.38.97.87l.006.106v3.769a.438.438 0 0 1-.868.078l-.007-.078V6.46a.101.101 0 0 0-.07-.095l-.031-.005H5.385a.437.437 0 0 1-.079-.868l.079-.007h1.077zM6.192 2.793l.089.006a.707.707 0 1 1-.177 0l.088-.006z" />
        <path d="M8.615 9.794c.242 0 .438.224.438.5 0 .246-.155.45-.359.492l-.079.008h-3.23c-.242 0-.438-.224-.438-.5 0-.245.155-.45.359-.492l.079-.008h3.23z" />
      </g>
    </svg>
  ),
  LoadingSpinner: (props: IconProps) => (
    <svg
      role="status"
      aria-label="Loading"
      className={`h-5 w-5 animate-spin ${props.className}`}
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="LoadingSpinner"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <g
          id="Group"
          transform="translate(1, 1)"
          fillRule="nonzero"
        >
          <path
            d="M11,0 C17.0751322,0 22,4.92486775 22,11 C22,17.0751322 17.0751322,22 11,22 C4.92486775,22 0,17.0751322 0,11 C0,4.92486775 4.92486775,0 11,0 Z M11,2 C6.02943725,2 2,6.02943725 2,11 C2,15.9705627 6.02943725,20 11,20 C15.9705627,20 20,15.9705627 20,11 C20,6.02943725 15.9705627,2 11,2 Z"
            id="Oval"
            fill="#348CFD"
            opacity="0.25"
          ></path>
          <path
            d="M19.0287175,4.94590384 C19.5005019,4.65878387 20.1157155,4.80848402 20.4028355,5.28026847 C21.4419642,6.98772474 22,8.94986784 22,10.9915479 C22,17.0666801 17.0751322,21.9915479 11,21.9915479 C10.4477153,21.9915479 10,21.5438326 10,20.9915479 C10,20.4392631 10.4477153,19.9915479 11,19.9915479 C15.9705627,19.9915479 20,15.9621106 20,10.9915479 C20,9.31924154 19.5441371,7.7163545 18.6943528,6.32002184 C18.4072329,5.84823739 18.556933,5.2330238 19.0287175,4.94590384 Z"
            id="Oval"
            fill="#5ACCE6"
          ></path>
        </g>
      </g>
    </svg>
  ),
  NavigationPanelReveal: (props: IconProps) => (
    <svg
      width="17"
      height="10"
      viewBox="0 0 17 10"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.856 5.078H1M5.078 1 1 5.078l4.078 4.078M15.582 9.156V1" />
      </g>
    </svg>
  ),
  MissingIcon: (props: IconProps) => <div>Missing icon</div>,
  Series: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="Series"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <path
          d="M8.17391304,15.826087 L4.69565217,15.826087 C4.31145409,15.826087 4,15.5146329 4,15.1304348 L4,4.69565217 C4,4.31145409 4.31145409,4 4.69565217,4 L15.1304348,4 C15.5146329,4 15.826087,4.31145409 15.826087,4.69565217 L15.826087,8.17391304"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <rect
          id="Rectangle"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          x="8.17391304"
          y="8.17391304"
          width="11.826087"
          height="11.826087"
          rx="1"
        ></rect>
      </g>
    </svg>
  ),
  Settings: (props: IconProps) => (
    <svg
      width="15.7826087px"
      height="15.7826087px"
      viewBox="0 0 15.7826087 15.7826087"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>icon-display-settings</title>
      <g
        id="Artboards"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g
          id="Segmentation---assets"
          transform="translate(-42.127, -62.1087)"
          stroke="currentColor"
        >
          <g
            id="icon-display-settings"
            transform="translate(40, 60)"
          >
            <circle
              id="Oval"
              cx="10"
              cy="4.34782609"
              r="1.73913043"
            ></circle>
            <line
              x1="11.7373913"
              y1="4.34782609"
              x2="17.4095652"
              y2="4.34782609"
              id="Path"
            ></line>
            <line
              x1="2.62695652"
              y1="4.34782609"
              x2="8.2573913"
              y2="4.34782609"
              id="Path"
            ></line>
            <g
              id="Group-26"
              transform="translate(10.0183, 10) scale(-1, 1) translate(-10.0183, -10)translate(2.627, 8.2609)"
            >
              <circle
                id="Oval"
                transform="translate(3.8948, 1.7391) scale(-1, 1) translate(-3.8948, -1.7391)"
                cx="3.89478261"
                cy="1.73913043"
                r="1.73913043"
              ></circle>
              <line
                x1="5.63043478"
                y1="1.73913043"
                x2="14.7826087"
                y2="1.73913043"
                id="Path"
                transform="translate(10.2065, 1.7391) scale(-1, 1) translate(-10.2065, -1.7391)"
              ></line>
              <line
                x1="0"
                y1="1.73913043"
                x2="2.15217391"
                y2="1.73913043"
                id="Path"
                transform="translate(1.0761, 1.7391) scale(-1, 1) translate(-1.0761, -1.7391)"
              ></line>
            </g>
            <circle
              id="Oval"
              cx="8.26086957"
              cy="15.6521739"
              r="1.73913043"
            ></circle>
            <line
              x1="9.99652174"
              y1="15.6521739"
              x2="17.4095652"
              y2="15.6521739"
              id="Path"
            ></line>
            <line
              x1="2.62695652"
              y1="15.6521739"
              x2="6.52173913"
              y2="15.6521739"
              id="Path"
            ></line>
          </g>
        </g>
      </g>
    </svg>
  ),
  Show: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        id="show"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <path
          d="M18.0567826,8.96286957 C19.1471229,9.75269568 20.1356859,10.674229 21,11.7065217 C21,11.7065217 17.1949565,16.5108696 12.5,16.5108696 C11.7479876,16.5066962 11.0007435,16.3911225 10.2826087,16.167913"
          id="Path"
          stroke="#348CFD"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <path
          d="M6.93286957,14.4413043 C5.84666081,13.6535964 4.86162018,12.7350857 4,11.7065217 C4,11.7065217 7.80504348,6.90217391 12.5,6.90217391 C13.1235541,6.90480509 13.7443251,6.98550531 14.3478261,7.1423913"
          id="Path"
          stroke="#348CFD"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <path
          d="M9.54347826,11.7065217 C9.54347826,10.0736799 10.8671581,8.75 12.5,8.75"
          id="Path"
          stroke="#348CFD"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <path
          d="M15.4565217,11.7065217 C15.4565217,13.3393636 14.1328419,14.6630435 12.5,14.6630435"
          id="Path"
          stroke="#348CFD"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <line
          x1="19.7065217"
          y1="4.5"
          x2="5.29347826"
          y2="18.9130435"
          id="Path"
          stroke="#348CFD"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></line>
      </g>
    </svg>
  ),
  SidePanelCloseLeft: (props: IconProps) => (
    <svg
      width="20px"
      height="20px"
      viewBox="0 0 20 20"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>icon-panel-close-left</title>
      <g
        id="Artboards-Updated"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Segmentation---assets"
          transform="translate(-370, -60)"
        >
          <g
            id="icon-panel-close-left"
            transform="translate(380, 70) scale(-1, 1) translate(-380, -70)translate(370, 60)"
          >
            <rect
              id="Rectangle"
              x="0"
              y="0"
              width="20"
              height="20"
            ></rect>
            <line
              x1="12.8336364"
              y1="10.4061473"
              x2="3"
              y2="10.4061473"
              id="Path"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(7.9168, 10.4061) scale(-1, 1) translate(-7.9168, -10.4061)"
            ></line>
            <polyline
              id="Path"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(10.7991, 10.4061) scale(-1, 1) translate(-10.7991, -10.4061)"
              points="12.8336364 6.33705636 8.76454545 10.4061473 12.8336364 14.4752382"
            ></polyline>
            <line
              x1="16.2418182"
              y1="14.4752382"
              x2="16.2418182"
              y2="6.33705636"
              id="Path"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(16.2418, 10.4061) scale(-1, 1) translate(-16.2418, -10.4061)"
            ></line>
          </g>
        </g>
      </g>
    </svg>
  ),
  SidePanelCloseRight: (props: IconProps) => (
    <svg
      width="20px"
      height="20px"
      viewBox="0 0 20 20"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>icon-panel-close-right</title>
      <g
        id="Artboards-Updated"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Segmentation---assets"
          transform="translate(-418, -60)"
        >
          <g
            id="icon-panel-close-right"
            transform="translate(418, 60)"
          >
            <rect
              id="Rectangle"
              x="0"
              y="0"
              width="20"
              height="20"
            ></rect>
            <line
              x1="12.8336364"
              y1="10.4061473"
              x2="3"
              y2="10.4061473"
              id="Path"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(7.9168, 10.4061) scale(-1, 1) translate(-7.9168, -10.4061)"
            ></line>
            <polyline
              id="Path"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(10.7991, 10.4061) scale(-1, 1) translate(-10.7991, -10.4061)"
              points="12.8336364 6.33705636 8.76454545 10.4061473 12.8336364 14.4752382"
            ></polyline>
            <line
              x1="16.2418182"
              y1="14.4752382"
              x2="16.2418182"
              y2="6.33705636"
              id="Path"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(16.2418, 10.4061) scale(-1, 1) translate(-16.2418, -10.4061)"
            ></line>
          </g>
        </g>
      </g>
    </svg>
  ),
  TabSegmentation: (props: IconProps) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        fill="none"
        fillRule="evenodd"
      >
        <circle
          stroke="currentColor"
          cx="11.037"
          cy="10.912"
          r="8"
        />
        <g stroke="currentColor">
          <path
            strokeLinecap="square"
            d="m11.354 3.575-7.779 7.779M17.364 6.757 6.757 17.364"
          />
          <path d="m18.955 9.763-9.192 9.192" />
          <path
            strokeLinecap="square"
            d="M15.066 4.46 4.459 15.065"
          />
        </g>
        <path d="M0 0h22v22H0z" />
      </g>
    </svg>
  ),
  TabLinear: (props: IconProps) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        fill="none"
        fillRule="evenodd"
      >
        <rect
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          x="1.5"
          y="16.37"
          width="4.13"
          height="4.13"
          rx="1"
        />
        <rect
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          x="16.37"
          y="1.5"
          width="4.13"
          height="4.13"
          rx="1"
        />
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.388 16.612 16.612 5.388"
        />
        <path d="M0 0h22v22H0z" />
      </g>
    </svg>
  ),
  TabStudies: (props: IconProps) => (
    <svg
      width="22px"
      height="23px"
      viewBox="0 0 22 23"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>tab-studies</title>
      <g
        id="Artboards-Updated"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Segmentation---assets"
          transform="translate(-61, -242)"
        >
          <g
            id="tab-studies"
            transform="translate(61, 242.5)"
          >
            <rect
              id="Rectangle"
              x="0"
              y="0"
              width="22"
              height="22"
            ></rect>
            <path
              d="M6.93478261,15.0652174 L3.23913043,15.0652174 C2.83091997,15.0652174 2.5,14.7342974 2.5,14.326087 L2.5,3.23913043 C2.5,2.83091997 2.83091997,2.5 3.23913043,2.5 L14.326087,2.5 C14.7342974,2.5 15.0652174,2.83091997 15.0652174,3.23913043 L15.0652174,6.93478261"
              id="Path"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <rect
              id="Rectangle"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              x="6.93478261"
              y="6.93478261"
              width="12.5652174"
              height="12.5652174"
              rx="1"
            ></rect>
          </g>
        </g>
      </g>
    </svg>
  ),
  Tab4D: (props: IconProps) => (
    <svg
      width="22px"
      height="22px"
      viewBox="0 0 22 22"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>tab-4d</title>
      <g
        id="tab-4d"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Group"
          transform="translate(1, 1)"
          stroke="currentColor"
        >
          <rect
            id="Rectangle"
            x="0"
            y="0"
            width="20"
            height="20"
            rx="2"
          ></rect>
          <g
            id="Group-3"
            transform="translate(4, 5)"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M6.9072464,0.398231009 C9.3565092,0.398231009 11.342029,2.38375081 11.342029,4.83301362 C11.342029,7.28227642 9.3565092,9.26779623 6.9072464,9.26779623 L6.9072464,0.398231009 Z"
              id="Path"
            ></path>
            <polyline
              id="Path-2"
              points="3.27497101 4.83301362 0 4.83301362 3.62401581 0 3.62401581 4.87475204 3.62401581 9.26779623"
            ></polyline>
          </g>
        </g>
      </g>
    </svg>
  ),
  TabPatientInfo: (props: IconProps) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        fill="none"
        fillRule="evenodd"
      >
        <path
          d="M3.638 13.16a17.265 17.265 0 0 1 3.652-1.586c.565-.21.626-1.504.221-1.95-.584-.642-1.08-1.396-1.08-3.215a2.572 2.572 0 0 1 2.632-2.811 2.572 2.572 0 0 1 2.631 2.811c0 1.822-.495 2.573-1.08 3.215-.404.446-.343 1.74.222 1.95 1.275.386 2.5.919 3.652 1.587"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.15 11.064V2.369a.87.87 0 0 0-.87-.869H2.37a.87.87 0 0 0-.87.87v13.91c0 .48.39.87.87.87h8.694M15.846 20.628l-3.043.87.87-3.044 5.2-5.2a1.537 1.537 0 0 1 2.174 2.173l-5.201 5.2zM18.221 13.905l2.174 2.174M13.672 18.454l2.174 2.174"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M0 0h22v22H0z" />
      </g>
    </svg>
  ),
  TabRoiThreshold: (props: IconProps) => (
    <svg
      width="23"
      height="22"
      viewBox="0 0 23 22"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        fill="none"
        fillRule="evenodd"
      >
        <path
          d="m13.34 11.74-2.971.425.425-2.971 7.64-7.64A1.8 1.8 0 1 1 20.98 4.1l-7.64 7.64zM8.644 19.034h7.383c.865 0 1.566-.701 1.566-1.566V10.03M12.504 4.94H5.066C4.2 4.94 3.5 5.643 3.5 6.508v1.972"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          stroke="currentColor"
          d="m11.5 8.5 2.333 2.333"
        />
        <g
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m1 14 2.5-2.5L6 14M1 17.5 3.5 20 6 17.5" />
        </g>
        <path d="M0 0h22v22H0z" />
      </g>
    </svg>
  ),

  // Aliases
  'tab-segmentation': (props: IconProps) => Icons.TabSegmentation(props),
  'tab-studies': (props: IconProps) => Icons.TabStudies(props),
  'tab-linear': (props: IconProps) => Icons.TabLinear(props),
  'tab-4d': (props: IconProps) => Icons.Tab4D(props),
  'tab-patient-info': (props: IconProps) => Icons.TabPatientInfo(props),
  'tab-roi-threshold': (props: IconProps) => Icons.TabRoiThreshold(props),
  'icon-mpr': (props: IconProps) => Icons.IconMPR(props),
};
