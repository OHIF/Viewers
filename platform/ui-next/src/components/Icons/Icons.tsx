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
      {...props}
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
      {...props}
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
  Refresh: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
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
          d="M4,12 C4,7.581722 7.581722,4 12,4 C16.418278,4 20,7.581722 20,12 C20,16.418278 16.418278,20 12,20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <polyline
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="12 8 12 12 15 14"
        ></polyline>
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
  Plus: (props: IconProps) => (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        fill="none"
        fillRule="evenodd"
      >
        <path d="M0 0h21v21H0z" />
        <g
          stroke="#348CFD"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.25"
        >
          <path d="M10.5 5.5v10M15.5 10.5h-10" />
        </g>
      </g>
    </svg>
  ),
  Minus: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        id="Remove"
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
          x1="18"
          y1="12"
          x2="6"
          y2="12"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></line>
      </g>
    </svg>
  ),

  FillAndOutline: (props: IconProps) => (
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
            stroke="#348CFD"
            x="1.5"
            y="1.5"
            width="15"
            height="15"
            rx="1"
          ></rect>
          <rect
            id="Rectangle"
            fill="#348CFD"
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
  OutlineOnly: (props: IconProps) => (
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
            stroke="#348CFD"
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
  FillOnly: (props: IconProps) => (
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
            fill="#348CFD"
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
  EyeVisible: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 13"
      {...props}
    >
      <g
        fill="none"
        fillRule="evenodd"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(0 1)"
      >
        <circle
          cx="10"
          cy="5.833"
          r="2.917"
        />
        <path d="M19.48 5.56C18.51 4.46 14.635.417 10 .417 5.365.417 1.49 4.46.52 5.56c-.136.157-.136.39 0 .547.97 1.1 4.845 5.143 9.48 5.143 4.635 0 8.51-4.043 9.48-5.143.136-.157.136-.39 0-.547z" />
      </g>
    </svg>
  ),
  EyeHidden: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 20"
      {...props}
    >
      <g
        fill="none"
        fillRule="evenodd"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <g opacity=".5">
          <path
            d="M17.433 2.556c1.352.98 2.578 2.122 3.65 3.402 0 0-4.719 5.959-10.541 5.959-.933-.006-1.86-.149-2.75-.426M3.637 9.35C2.29 8.373 1.07 7.234 0 5.958 0 5.958 4.719 0 10.542 0c.773.003 1.543.103 2.291.298M6.875 5.958c0-2.025 1.642-3.666 3.667-3.666M14.208 5.958c0 2.025-1.641 3.667-3.666 3.667"
            transform="translate(1 1) translate(.458 3.208)"
          />
        </g>
        <path
          d="M19.938 0.229L2.063 18.104"
          transform="translate(1 1)"
        />
      </g>
    </svg>
  ),
  ViewportViews: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        id="icon-views"
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
          d="M12.1675111,14.754511 C12.0607016,14.815163 11.9392984,14.815163 11.8324889,14.754511 L3.25173267,9.89965265 C3.09886891,9.81313583 3,9.61689546 3,9.4 C3,9.18310454 3.09886891,8.98686417 3.25173267,8.90034735 L11.8324889,4.04548902 C11.9392984,3.98483699 12.0607016,3.98483699 12.1675111,4.04548902 L20.7482673,8.90034735 C20.9011311,8.98686417 21,9.18310454 21,9.4 C21,9.61689546 20.9011311,9.81313583 20.7482673,9.89965265 L12.1675111,14.754511 Z"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <path
          d="M16.7792809,12.1 L20.7482673,14.3367372 C20.9011311,14.4227204 21,14.6177503 21,14.833308 C21,15.0488656 20.9011311,15.2438955 20.7482673,15.3298787 L12.1675111,20.1547916 C12.0607016,20.2150695 11.9392984,20.2150695 11.8324889,20.1547916 L3.25173267,15.3298787 C3.09886891,15.2438955 3,15.0488656 3,14.833308 C3,14.6177503 3.09886891,14.4227204 3.25173267,14.3367372 L7.2018101,12.1"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </g>
    </svg>
  ),
  StatusChecked: (props: IconProps) => (
    <svg
      width="14px"
      height="14px"
      viewBox="0 0 14 14"
      {...props}
    >
      <g
        id="status-checked"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="14"
          height="14"
        ></rect>
        <circle
          id="Oval"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          cx="7"
          cy="7"
          r="6"
        ></circle>
        <path
          d="M9.674,5.256 L6.769,9.129 C6.63825806,9.30267425 6.43875708,9.41127411 6.22192754,9.42680302 C6.00509799,9.44233192 5.79215707,9.36327034 5.638,9.21 L4.138,7.71"
          id="Path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </g>
    </svg>
  ),

  DicomTagBrowser: (props: IconProps) => (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 28 28"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>tool-dicom-tag-browser</title>
      <g
        id="tool-dicom-tag-browser"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="28"
          height="28"
        ></rect>
        <g
          id="Group"
          transform="translate(4, 5.5)"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <circle
            id="Oval"
            cx="1.73913043"
            cy="1.73913043"
            r="1.73913043"
          ></circle>
          <line
            x1="6.95652174"
            y1="1.73913043"
            x2="20"
            y2="1.73913043"
            id="Path"
          ></line>
          <circle
            id="Oval"
            cx="1.73913043"
            cy="8.69565217"
            r="1.73913043"
          ></circle>
          <line
            x1="6.95652174"
            y1="8.69565217"
            x2="20"
            y2="8.69565217"
            id="Path"
          ></line>
          <circle
            id="Oval"
            cx="1.73913043"
            cy="15.6521739"
            r="1.73913043"
          ></circle>
          <line
            x1="6.95652174"
            y1="15.6521739"
            x2="20"
            y2="15.6521739"
            id="Path"
          ></line>
        </g>
      </g>
    </svg>
  ),
  PowerOff: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 28"
      aria-labelledby="title"
      width="1em"
      height="1em"
      fill="currentColor"
      {...props}
    >
      <title id="title">Power Off</title>
      <path d="M24 14c0 6.609-5.391 12-12 12s-12-5.391-12-12c0-3.797 1.75-7.297 4.797-9.578 0.891-0.672 2.141-0.5 2.797 0.391 0.672 0.875 0.484 2.141-0.391 2.797-2.031 1.531-3.203 3.859-3.203 6.391 0 4.406 3.594 8 8 8s8-3.594 8-8c0-2.531-1.172-4.859-3.203-6.391-0.875-0.656-1.062-1.922-0.391-2.797 0.656-0.891 1.922-1.062 2.797-0.391 3.047 2.281 4.797 5.781 4.797 9.578zM14 2v10c0 1.094-0.906 2-2 2s-2-0.906-2-2v-10c0-1.094 0.906-2 2-2s2 0.906 2 2z" />
    </svg>
  ),
  MultiplePatients: (props: IconProps) => (
    <svg
      width="28px"
      height="28px"
      viewBox="0 0 28 28"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <title>icon-multiple-patients</title>
      <g
        id="4D-assets---final"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Artboard"
          transform="translate(-171, -280)"
        >
          <g
            id="icon-multiple-patients"
            transform="translate(171, 280)"
          >
            <rect
              id="Rectangle"
              x="0"
              y="0"
              width="28"
              height="28"
            ></rect>
            <g
              id="Group-3"
              transform="translate(2, 1.5)"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <g
                id="patient-icon"
                transform="translate(9, 10)"
              >
                <circle
                  id="Oval"
                  cx="7.5"
                  cy="7.5"
                  r="7.5"
                ></circle>
                <path
                  d="M2.331,12.935 C3.39163827,12.4490078 4.47638164,12.0174468 5.581,11.642 C6.189,11.416 6.09,9.827 5.82,9.531 C4.95198021,8.59033128 4.52668888,7.3239163 4.651,6.05 C4.5727272,5.23902161 4.83519788,4.43201369 5.37555564,3.82223826 C5.9159134,3.21246283 6.68549454,2.85483523 7.5,2.835 C8.31450546,2.85483523 9.0840866,3.21246283 9.62444436,3.82223826 C10.1648021,4.43201369 10.4272728,5.23902161 10.349,6.05 C10.4733111,7.3239163 10.0480198,8.59033128 9.18,9.531 C8.91,9.831 8.811,11.416 9.419,11.642 C10.5236184,12.0174468 11.6083617,12.4490078 12.669,12.935"
                  id="Path"
                ></path>
              </g>
              <g id="patient-icon">
                <path
                  d="M7.5,0 C11.6421356,0 15,3.35786438 15,7.5 C15,8.48189915 14.8113103,9.41972745 14.4682129,10.2792028 C12.213795,10.9117859 10.3898771,12.5712406 9.53178711,14.7207972 C8.88630634,14.9028658 8.20449663,15 7.5,15 C3.35786438,15 0,11.6421356 0,7.5 C0,3.35786438 3.35786438,0 7.5,0 Z"
                  id="Combined-Shape"
                ></path>
                <path
                  d="M2.331,12.935 C3.39163827,12.4490078 4.47638164,12.0174468 5.581,11.642 C6.189,11.416 6.09,9.827 5.82,9.531 C4.95198021,8.59033128 4.52668888,7.3239163 4.651,6.05 C4.5727272,5.23902161 4.83519788,4.43201369 5.37555564,3.82223826 C5.9159134,3.21246283 6.68549454,2.85483523 7.5,2.835 C8.31450546,2.85483523 9.0840866,3.21246283 9.62444436,3.82223826 C10.1648021,4.43201369 10.4272728,5.23902161 10.349,6.05 C10.4733111,7.3239163 10.0480198,8.59033128 9.18,9.531 C8.91,9.831 8.811,11.416 9.419,11.642 C10.5236184,12.0174468 10.5236184,12.0174468 10.9701462,12.2764988"
                  id="Path"
                ></path>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  ),
  Patient: (props: IconProps) => (
    <svg
      width="28px"
      height="28px"
      viewBox="0 0 28 28"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <title>icon-patient</title>
      <g
        id="Production"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Artboard"
          transform="translate(-104, -235)"
        >
          <g
            id="icon-patient"
            transform="translate(104, 235)"
          >
            <rect
              id="Rectangle"
              x="0"
              y="0"
              width="28"
              height="28"
            ></rect>
            <circle
              id="Oval"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              cx="14"
              cy="14"
              r="9"
            ></circle>
            <path
              d="M7.7972,20.522 C9.06996592,19.9388093 10.371658,19.4209361 11.6972,18.9704 C12.4268,18.6992 12.308,16.7924 11.984,16.4372 C10.9423763,15.3083975 10.4320267,13.7886996 10.5812,12.26 C10.4872726,11.2868259 10.8022375,10.3184164 11.4506668,9.58668591 C12.0990961,8.8549554 13.0225934,8.42580227 14,8.402 C14.9774066,8.42580227 15.9009039,8.8549554 16.5493332,9.58668591 C17.1977625,10.3184164 17.5127274,11.2868259 17.4188,12.26 C17.5679733,13.7886996 17.0576237,15.3083975 16.016,16.4372 C15.692,16.7972 15.5732,18.6992 16.3028,18.9704 C17.628342,19.4209361 18.9300341,19.9388093 20.2028,20.522"
              id="Path"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </g>
        </g>
      </g>
    </svg>
  ),
  ChevronPatient: (props: IconProps) => (
    <svg
      width="28px"
      height="29px"
      viewBox="0 0 28 29"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        id="Production"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Artboard"
          transform="translate(-154, -234)"
        >
          <g
            id="icon-chevron-patient"
            transform="translate(168, 248.5) scale(-1, -1) translate(-168, -248.5)translate(154, 234.5)"
          >
            <rect
              id="Rectangle"
              x="0"
              y="0"
              width="28"
              height="28"
            ></rect>
            <polyline
              id="Path"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(14.5, 14) scale(-1, 1) translate(-14.5, -14)"
              points="16.5 10 12.5 14 16.5 18"
            ></polyline>
          </g>
        </g>
      </g>
    </svg>
  ),
  OHIFLogo: (props: IconProps) => (
    <svg
      width="138px"
      height="28px"
      viewBox="0 0 138 28"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        id="Production"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Artboard"
          transform="translate(-74, -297)"
        >
          <g
            id="toolbar-branding-open-health-imaging-foundation"
            transform="translate(74, 297)"
          >
            <rect
              id="Rectangle"
              x="0"
              y="0"
              width="138"
              height="28"
            ></rect>
            <path
              d="M37.7225261,11.2237762 C39.7660251,11.2237762 41.2479518,9.64468611 41.2479518,7.11188811 C41.2479518,4.57909011 39.7660251,3 37.7225261,3 C35.6790271,3 34.1971004,4.57909011 34.1971004,7.11188811 C34.1971004,9.64468611 35.6790271,11.2237762 37.7225261,11.2237762 Z M37.8064648,10.3846154 C36.3486619,10.3846154 35.2043649,9.26464267 35.2043649,7.1958042 C35.2043649,5.12696572 36.3486619,4.00699301 37.8064648,4.00699301 C39.2642678,4.00699301 40.4085648,5.12696572 40.4085648,7.1958042 C40.4085648,9.26464267 39.2642678,10.3846154 37.8064648,10.3846154 Z M43.6645943,13.2377622 L43.6645943,10.1056298 L43.7413524,10.1056298 C43.9409235,10.4296435 44.324714,11.1393878 45.4607341,11.1393878 C46.9344898,11.1393878 47.9630485,9.95133759 47.9630485,8.0689723 C47.9630485,6.20203624 46.9344898,5.01398601 45.4453824,5.01398601 C44.2940108,5.01398601 43.9409235,5.7237303 43.7413524,6.03231478 L43.633891,6.03231478 L43.633891,5.09113213 L42.7588486,5.09113213 L42.7588486,13.2377622 L43.6645943,13.2377622 Z M45.4297631,10.3846154 C44.3559526,10.3846154 43.7661131,9.45029198 43.7661131,8.09552303 C43.7661131,6.75632615 44.3408286,5.85314685 45.4297631,5.85314685 C46.56407,5.85314685 47.1236614,6.83418643 47.1236614,8.09552303 C47.1236614,9.37243169 46.5489459,10.3846154 45.4297631,10.3846154 Z M51.8942607,11.2237762 C53.0952299,11.2237762 53.9728613,10.6137465 54.250008,9.7065227 L53.3723767,9.45625407 C53.141421,10.0819256 52.6063739,10.3947614 51.8942607,10.3947614 C50.8280156,10.3947614 50.0928069,9.69479135 50.0504651,8.40825421 L54.3423903,8.40825421 L54.3423903,8.01720949 C54.3423903,5.78043367 53.0336418,5.01398601 51.8018785,5.01398601 C50.2005862,5.01398601 49.1381904,6.29661271 49.1381904,8.1423438 C49.1381904,9.9880749 50.1851892,11.2237762 51.8942607,11.2237762 Z M53.5030032,7.53146853 L50.1454549,7.53146853 C50.20685,6.64403738 50.8553365,5.85314685 51.89138,5.85314685 C52.8737027,5.85314685 53.5030032,6.56606226 53.5030032,7.53146853 Z M56.7655682,11.0559441 L56.7655682,7.46804609 C56.7655682,6.42740036 57.4072575,5.83718338 58.2808828,5.83718338 C59.1274488,5.83718338 59.6415734,6.39245331 59.6415734,7.32825786 L59.6415734,11.0559441 L60.5538546,11.0559441 L60.5538546,7.26612976 C60.5538546,5.74399123 59.7459446,5.01398601 58.5437435,5.01398601 C57.6469246,5.01398601 57.0902785,5.41781869 56.8119554,6.02356769 L56.7346434,6.02356769 L56.7346434,5.09164614 L55.853287,5.09164614 L55.853287,11.0559441 L56.7655682,11.0559441 Z M66.2244746,11.0559441 L66.2244746,7.52786276 L70.4958343,7.52786276 L70.4958343,11.0559441 L71.4658866,11.0559441 L71.4658866,3.16783217 L70.4958343,3.16783217 L70.4958343,6.68050699 L66.2244746,6.68050699 L66.2244746,3.16783217 L65.2544223,3.16783217 L65.2544223,11.0559441 L66.2244746,11.0559441 Z M75.7328537,11.2237762 C76.9338229,11.2237762 77.8114543,10.6137465 78.088601,9.7065227 L77.2109697,9.45625407 C76.980014,10.0819256 76.4449669,10.3947614 75.7328537,10.3947614 C74.6666086,10.3947614 73.9313999,9.69479135 73.889058,8.40825421 L78.1809832,8.40825421 L78.1809832,8.01720949 C78.1809832,5.78043367 76.8722347,5.01398601 75.6404715,5.01398601 C74.0391792,5.01398601 72.9767834,6.29661271 72.9767834,8.1423438 C72.9767834,9.9880749 74.0237822,11.2237762 75.7328537,11.2237762 Z M77.3415962,7.53146853 L73.9840479,7.53146853 C74.045443,6.64403738 74.6939295,5.85314685 75.729973,5.85314685 C76.7122957,5.85314685 77.3415962,6.56606226 77.3415962,7.53146853 Z M81.3619048,11.2237762 C82.3877616,11.2237762 82.9236569,10.6620867 83.1073925,10.2720245 L83.1533264,10.2720245 L83.1533264,11.0833538 L84.0566928,11.0833538 L84.0566928,7.13592438 C84.0566928,5.23242085 82.6327423,5.01398601 81.8824889,5.01398601 C80.9944337,5.01398601 79.9838882,5.32603577 79.5245494,6.41820993 L80.3819819,6.73025969 C80.5810288,6.29339003 81.0518511,5.82531539 81.9131114,5.82531539 C82.7437492,5.82531539 83.1533264,6.27388692 83.1533264,7.04230945 L83.1533264,7.07351443 C83.1533264,7.51818533 82.7092988,7.47917911 81.6375081,7.6196015 C80.5465783,7.76392452 79.3561251,8.0096637 79.3561251,9.38268264 C79.3561251,10.5528692 80.2441803,11.2237762 81.3619048,11.2237762 Z M81.5864965,10.3846154 C80.8767925,10.3846154 80.3633896,10.0534566 80.3633896,9.40690853 C80.3633896,8.69728258 80.9824931,8.47651007 81.677097,8.38189327 C82.0545992,8.33458488 83.0663049,8.22419862 83.2173057,8.03496503 L83.2173057,8.88651617 C83.2173057,9.64345051 82.6435025,10.3846154 81.5864965,10.3846154 Z M86.7427314,11.0559441 L86.7427314,3.16783217 L85.9033443,3.16783217 L85.9033443,11.0559441 L86.7427314,11.0559441 Z M90.4262553,11.2237762 C90.7668998,11.2237762 90.9836735,11.1623657 91.1075442,11.1163078 L90.9217382,10.3026184 C90.844319,10.317971 90.7204482,10.3486763 90.5191583,10.3486763 C90.1165785,10.3486763 89.7294825,10.2258552 89.7294825,9.45822369 L89.7294825,6.0192344 L90.9991573,6.0192344 L90.9991573,5.25160287 L89.7294825,5.25160287 L89.7294825,3.83916084 L88.815936,3.83916084 L88.815936,5.25160287 L87.9178733,5.25160287 L87.9178733,6.0192344 L88.815936,6.0192344 L88.815936,9.70386578 C88.815936,10.732492 89.6520633,11.2237762 90.4262553,11.2237762 Z M93.350997,11.0559441 L93.350997,7.49704983 C93.350997,6.46481643 94.0034296,5.87937063 94.8924169,5.87937063 C95.7394347,5.87937063 96.2506978,6.41859703 96.2506978,7.35839161 L96.2506978,11.0559441 L97.1511312,11.0559441 L97.1511312,7.29676573 C97.1511312,5.77537697 96.3498981,5.0628278 95.1518638,5.0628278 C94.228538,5.0628278 93.7020134,5.45184113 93.4273049,6.06424825 L93.350997,6.06424825 L93.350997,3.16783217 L92.4505635,3.16783217 L92.4505635,11.0559441 L93.350997,11.0559441 Z M35.5401197,24.6503497 L35.5401197,16.7622378 L34.5328552,16.7622378 L34.5328552,24.6503497 L35.5401197,24.6503497 Z M38.3104302,24.6503497 L38.3104302,20.9226635 C38.3104302,20.048987 38.9522948,19.431589 39.6724356,19.431589 C40.3730074,19.431589 40.8622335,19.8859007 40.8622335,20.5654269 L40.8622335,24.6503497 L41.8015476,24.6503497 L41.8015476,20.7673432 C41.8015476,19.9985079 42.2868599,19.431589 43.1322426,19.431589 C43.7897625,19.431589 44.3533509,19.7771766 44.3533509,20.658619 L44.3533509,24.6503497 L45.2770098,24.6503497 L45.2770098,20.658619 C45.2770098,19.2568537 44.5177309,18.6083916 43.4453473,18.6083916 C42.5843094,18.6083916 41.9541862,19.0005753 41.6449953,19.6179733 L41.5823743,19.6179733 C41.2849249,18.9811602 40.7604745,18.6083916 39.9698851,18.6083916 C39.1871233,18.6083916 38.6078796,18.9811602 38.3573959,19.6179733 L38.2791197,19.6179733 L38.2791197,18.6860517 L37.3867713,18.6860517 L37.3867713,24.6503497 L38.3104302,24.6503497 Z M48.6258088,24.8181818 C49.6516656,24.8181818 50.1875609,24.2564923 50.3712965,23.8664301 L50.4172304,23.8664301 L50.4172304,24.6777594 L51.3205968,24.6777594 L51.3205968,20.73033 C51.3205968,18.8268264 49.8966463,18.6083916 49.1463929,18.6083916 C48.2583377,18.6083916 47.2477922,18.9204414 46.7884534,20.0126155 L47.6458859,20.3246653 C47.8449328,19.8877956 48.3157551,19.419721 49.1770154,19.419721 C50.0076532,19.419721 50.4172304,19.8682925 50.4172304,20.636715 L50.4172304,20.66792 C50.4172304,21.1125909 49.9732028,21.0735847 48.9014121,21.2140071 C47.8104823,21.3583301 46.6200291,21.6040693 46.6200291,22.9770882 C46.6200291,24.1472748 47.5080843,24.8181818 48.6258088,24.8181818 Z M48.6825231,23.979021 C47.9728191,23.979021 47.4594162,23.6478622 47.4594162,23.0013141 C47.4594162,22.2916882 48.0785197,22.0709157 48.7731236,21.9762989 C49.1506257,21.9289905 50.1623314,21.8186042 50.3133323,21.6293706 L50.3133323,22.4809218 C50.3133323,23.2378561 49.7395291,23.979021 48.6825231,23.979021 Z M55.3194467,27 C56.7317959,27 57.867816,26.3485258 57.867816,24.812908 L57.867816,18.6859481 L56.9927735,18.6859481 L56.9927735,19.6321368 L56.9006638,19.6321368 C56.7010927,19.321911 56.3326538,18.6083916 55.1812821,18.6083916 C53.6921748,18.6083916 52.6636161,19.802761 52.6636161,21.6330933 C52.6636161,23.4944483 53.7382296,24.549216 55.1659305,24.549216 C56.3173021,24.549216 56.6857411,23.8667192 56.8853122,23.5409821 L56.9620703,23.5409821 L56.9620703,24.7508628 C56.9620703,25.7435854 56.2712473,26.1934129 55.3194467,26.1934129 C54.2486711,26.1934129 53.8725563,25.6233729 53.6307683,25.293758 L52.9092421,25.8056306 C53.277681,26.4299601 54.0030451,27 55.3194467,27 Z M55.3647788,23.8111888 C54.2455961,23.8111888 53.6708806,22.9290096 53.6708806,21.6687536 C53.6708806,20.440004 54.230472,19.4475524 55.3647788,19.4475524 C56.4537134,19.4475524 57.0284289,20.361238 57.0284289,21.6687536 C57.0284289,23.0077756 56.4385893,23.8111888 55.3647788,23.8111888 Z M60.0502224,17.7692308 C60.4179539,17.7692308 60.721732,17.5048951 60.721732,17.1818182 C60.721732,16.8587413 60.4179539,16.5944056 60.0502224,16.5944056 C59.6824909,16.5944056 59.3787127,16.8587413 59.3787127,17.1818182 C59.3787127,17.5048951 59.6824909,17.7692308 60.0502224,17.7692308 Z M60.5538546,24.6503497 L60.5538546,18.7762238 L59.7144675,18.7762238 L59.7144675,24.6503497 L60.5538546,24.6503497 Z M63.14491,24.6503497 L63.14491,21.0624517 C63.14491,20.021806 63.7865993,19.431589 64.6602246,19.431589 C65.5067906,19.431589 66.0209152,19.9868589 66.0209152,20.9226635 L66.0209152,24.6503497 L66.9331964,24.6503497 L66.9331964,20.8605354 C66.9331964,19.3383968 66.1252863,18.6083916 64.9230852,18.6083916 C64.0262664,18.6083916 63.4696203,19.0122243 63.1912972,19.6179733 L63.1139852,19.6179733 L63.1139852,18.6860517 L62.2326288,18.6860517 L62.2326288,24.6503497 L63.14491,24.6503497 Z M70.9320463,27 C72.3443956,27 73.4804156,26.3485258 73.4804156,24.812908 L73.4804156,18.6859481 L72.6053731,18.6859481 L72.6053731,19.6321368 L72.5132634,19.6321368 C72.3136923,19.321911 71.9452534,18.6083916 70.7938817,18.6083916 C69.3047744,18.6083916 68.2762157,19.802761 68.2762157,21.6330933 C68.2762157,23.4944483 69.3508293,24.549216 70.7785301,24.549216 C71.9299018,24.549216 72.2983407,23.8667192 72.4979118,23.5409821 L72.5746699,23.5409821 L72.5746699,24.7508628 C72.5746699,25.7435854 71.8838469,26.1934129 70.9320463,26.1934129 C69.8612707,26.1934129 69.485156,25.6233729 69.2433679,25.293758 L68.5218417,25.8056306 C68.8902806,26.4299601 69.6156448,27 70.9320463,27 Z M70.9773785,23.8111888 C69.8581957,23.8111888 69.2834802,22.9290096 69.2834802,21.6687536 C69.2834802,20.440004 69.8430716,19.4475524 70.9773785,19.4475524 C72.0663131,19.4475524 72.6410285,20.361238 72.6410285,21.6687536 C72.6410285,23.0077756 72.051189,23.8111888 70.9773785,23.8111888 Z M79.4660384,24.6503497 L79.4660384,21.1222684 L82.8651459,21.1222684 L82.8651459,20.2749126 L79.4660384,20.2749126 L79.4660384,17.6095935 L83.2173057,17.6095935 L83.2173057,16.7622378 L78.5167381,16.7622378 L78.5167381,24.6503497 L79.4660384,24.6503497 Z M87.0784863,24.8181818 C88.6839346,24.8181818 89.7645249,23.5824805 89.7645249,21.7211076 C89.7645249,19.8440929 88.6839346,18.6083916 87.0784863,18.6083916 C85.4730379,18.6083916 84.3924476,19.8440929 84.3924476,21.7211076 C84.3924476,23.5824805 85.4730379,24.8181818 87.0784863,24.8181818 Z M87.162425,23.979021 C85.9515179,23.979021 85.3997121,22.9201211 85.3997121,21.7210727 C85.3997121,20.5220244 85.9515179,19.4475524 87.162425,19.4475524 C88.3733321,19.4475524 88.9251378,20.5220244 88.9251378,21.7210727 C88.9251378,22.9201211 88.3733321,23.979021 87.162425,23.979021 Z M93.2118681,24.8181818 C94.1176253,24.8181818 94.7110525,24.336689 94.9921495,23.73094 L95.0546155,23.73094 L95.0546155,24.7405217 L95.9759893,24.7405217 L95.9759893,18.7762238 L95.0546155,18.7762238 L95.0546155,22.3019936 C95.0546155,23.4202995 94.1957078,23.9328563 93.5085817,23.9328563 C92.743373,23.9328563 92.1967954,23.3737034 92.1967954,22.50391 L92.1967954,18.7762238 L91.2754216,18.7762238 L91.2754216,22.5660381 C91.2754216,24.0881766 92.0874798,24.8181818 93.2118681,24.8181818 Z M98.3991672,24.6503497 L98.3991672,21.0624517 C98.3991672,20.021806 99.0408566,19.431589 99.9144818,19.431589 C100.761048,19.431589 101.275172,19.9868589 101.275172,20.9226635 L101.275172,24.6503497 L102.187454,24.6503497 L102.187454,20.8605354 C102.187454,19.3383968 101.379544,18.6083916 100.177342,18.6083916 C99.2805237,18.6083916 98.7238775,19.0122243 98.4455544,19.6179733 L98.3682424,19.6179733 L98.3682424,18.6860517 L97.486886,18.6860517 L97.486886,24.6503497 L98.3991672,24.6503497 Z M106.200665,24.8181818 C107.336685,24.8181818 107.720475,24.1055406 107.920046,23.7802044 L108.027508,23.7802044 L108.027508,24.6942442 L108.90255,24.6942442 L108.90255,16.7622378 L107.996805,16.7622378 L107.996805,19.6902636 L107.920046,19.6902636 C107.720475,19.3804196 107.367388,18.6677784 106.216016,18.6677784 C104.726909,18.6677784 103.69835,19.8606778 103.69835,21.735234 C103.69835,23.6252824 104.726909,24.8181818 106.200665,24.8181818 Z M106.231636,23.979021 C105.112453,23.979021 104.537737,22.9668373 104.537737,21.6899286 C104.537737,20.428592 105.097329,19.4475524 106.231636,19.4475524 C107.32057,19.4475524 107.895286,20.3507317 107.895286,21.6899286 C107.895286,23.0446976 107.305446,23.979021 106.231636,23.979021 Z M112.419227,24.8181818 C113.445083,24.8181818 113.980979,24.2564923 114.164714,23.8664301 L114.210648,23.8664301 L114.210648,24.6777594 L115.114015,24.6777594 L115.114015,20.73033 C115.114015,18.8268264 113.690064,18.6083916 112.939811,18.6083916 C112.051756,18.6083916 111.04121,18.9204414 110.581871,20.0126155 L111.439304,20.3246653 C111.638351,19.8877956 112.109173,19.419721 112.970433,19.419721 C113.801071,19.419721 114.210648,19.8682925 114.210648,20.636715 L114.210648,20.66792 C114.210648,21.1125909 113.766621,21.0735847 112.69483,21.2140071 C111.6039,21.3583301 110.413447,21.6040693 110.413447,22.9770882 C110.413447,24.1472748 111.301502,24.8181818 112.419227,24.8181818 Z M112.643818,23.979021 C111.934114,23.979021 111.420711,23.6478622 111.420711,23.0013141 C111.420711,22.2916882 112.039815,22.0709157 112.734419,21.9762989 C113.111921,21.9289905 114.123627,21.8186042 114.274628,21.6293706 L114.274628,22.4809218 C114.274628,23.2378561 113.700824,23.979021 112.643818,23.979021 Z M118.797538,24.8181818 C119.138183,24.8181818 119.354957,24.7567713 119.478827,24.7107134 L119.293021,23.897024 C119.215602,23.9123766 119.091731,23.9430819 118.890442,23.9430819 C118.487862,23.9430819 118.100766,23.8202608 118.100766,23.0526293 L118.100766,19.61364 L119.370441,19.61364 L119.370441,18.8460085 L118.100766,18.8460085 L118.100766,17.4335664 L117.187219,17.4335664 L117.187219,18.8460085 L116.289157,18.8460085 L116.289157,19.61364 L117.187219,19.61364 L117.187219,23.2982714 C117.187219,24.3268976 118.023347,24.8181818 118.797538,24.8181818 Z M121.325479,17.7692308 C121.69321,17.7692308 121.996989,17.5048951 121.996989,17.1818182 C121.996989,16.8587413 121.69321,16.5944056 121.325479,16.5944056 C120.957748,16.5944056 120.653969,16.8587413 120.653969,17.1818182 C120.653969,17.5048951 120.957748,17.7692308 121.325479,17.7692308 Z M121.661234,24.6503497 L121.661234,18.7762238 L120.821847,18.7762238 L120.821847,24.6503497 L121.661234,24.6503497 Z M125.858169,24.8181818 C127.463618,24.8181818 128.544208,23.5824805 128.544208,21.7211076 C128.544208,19.8440929 127.463618,18.6083916 125.858169,18.6083916 C124.252721,18.6083916 123.172131,19.8440929 123.172131,21.7211076 C123.172131,23.5824805 124.252721,24.8181818 125.858169,24.8181818 Z M125.774231,23.979021 C124.563323,23.979021 124.011518,22.9201211 124.011518,21.7210727 C124.011518,20.5220244 124.563323,19.4475524 125.774231,19.4475524 C126.985138,19.4475524 127.536943,20.5220244 127.536943,21.7210727 C127.536943,22.9201211 126.985138,23.979021 125.774231,23.979021 Z M130.799508,24.6503497 L130.799508,21.0624517 C130.799508,20.021806 131.441198,19.431589 132.314823,19.431589 C133.161389,19.431589 133.675514,19.9868589 133.675514,20.9226635 L133.675514,24.6503497 L134.587795,24.6503497 L134.587795,20.8605354 C134.587795,19.3383968 133.779885,18.6083916 132.577684,18.6083916 C131.680865,18.6083916 131.124219,19.0122243 130.845896,19.6179733 L130.768584,19.6179733 L130.768584,18.6860517 L129.887227,18.6860517 L129.887227,24.6503497 L130.799508,24.6503497 Z"
              id="OpenHealthImagingFoundation"
              fill="#FFFFFF"
              fillRule="nonzero"
            ></path>
            <g
              id="Group"
              transform="translate(3, 3.0579)"
              fill="#FFFFFF"
              fillRule="nonzero"
              stroke="#FFFFFF"
              strokeWidth="0.25"
            >
              <path
                d="M20.874737,0 L14.2607623,0 C13.3583609,0 12.6268201,0.731540857 12.6268201,1.63394224 L12.6268201,8.24791696 C12.6268201,9.15031834 13.3583609,9.88185919 14.2607623,9.88185919 L20.874737,9.88185919 C21.7771384,9.88185919 22.5086793,9.15031834 22.5086793,8.24791696 L22.5086793,1.63394224 C22.5086793,0.731540857 21.7771384,0 20.874737,0 Z M14.2607623,0.653576894 L20.874737,0.653576894 C21.4161779,0.653576894 21.8551024,1.09250141 21.8551024,1.63394224 L21.8551024,8.24791696 C21.8551024,8.78935779 21.4161779,9.2282823 20.874737,9.2282823 L14.2607623,9.2282823 C13.7193215,9.2282823 13.280397,8.78935779 13.280397,8.24791696 L13.280397,1.63394224 C13.280397,1.09250141 13.7193215,0.653576894 14.2607623,0.653576894 Z"
                id="Rectangle"
              ></path>
              <path
                d="M8.24791696,0 L1.63394224,0 C0.731540857,0 0,0.731540857 0,1.63394224 L0,8.24791696 C0,9.15031834 0.731540857,9.88185919 1.63394224,9.88185919 L8.24791696,9.88185919 C9.15031834,9.88185919 9.88185919,9.15031834 9.88185919,8.24791696 L9.88185919,1.63394224 C9.88185919,0.731540857 9.15031834,0 8.24791696,0 Z M1.63394224,0.653576894 L8.24791696,0.653576894 C8.78935779,0.653576894 9.2282823,1.09250141 9.2282823,1.63394224 L9.2282823,8.24791696 C9.2282823,8.78935779 8.78935779,9.2282823 8.24791696,9.2282823 L1.63394224,9.2282823 C1.09250141,9.2282823 0.653576894,8.78935779 0.653576894,8.24791696 L0.653576894,1.63394224 C0.653576894,1.09250141 1.09250141,0.653576894 1.63394224,0.653576894 Z"
                id="Rectangle"
              ></path>
              <path
                d="M20.874737,12.6268201 L14.2607623,12.6268201 C13.3583609,12.6268201 12.6268201,13.3583609 12.6268201,14.2607623 L12.6268201,20.874737 C12.6268201,21.7771384 13.3583609,22.5086793 14.2607623,22.5086793 L20.874737,22.5086793 C21.7771384,22.5086793 22.5086793,21.7771384 22.5086793,20.874737 L22.5086793,14.2607623 C22.5086793,13.3583609 21.7771384,12.6268201 20.874737,12.6268201 Z M14.2607623,13.280397 L20.874737,13.280397 C21.4161779,13.280397 21.8551024,13.7193215 21.8551024,14.2607623 L21.8551024,20.874737 C21.8551024,21.4161779 21.4161779,21.8551024 20.874737,21.8551024 L14.2607623,21.8551024 C13.7193215,21.8551024 13.280397,21.4161779 13.280397,20.874737 L13.280397,14.2607623 C13.280397,13.7193215 13.7193215,13.280397 14.2607623,13.280397 Z"
                id="Rectangle"
              ></path>
              <path
                d="M8.24791696,12.6268201 L1.63394224,12.6268201 C0.731540857,12.6268201 0,13.3583609 0,14.2607623 L0,20.874737 C0,21.7771384 0.731540857,22.5086793 1.63394224,22.5086793 L8.24791696,22.5086793 C9.15031834,22.5086793 9.88185919,21.7771384 9.88185919,20.874737 L9.88185919,14.2607623 C9.88185919,13.3583609 9.15031834,12.6268201 8.24791696,12.6268201 Z M1.63394224,13.280397 L8.24791696,13.280397 C8.78935779,13.280397 9.2282823,13.7193215 9.2282823,14.2607623 L9.2282823,20.874737 C9.2282823,21.4161779 8.78935779,21.8551024 8.24791696,21.8551024 L1.63394224,21.8551024 C1.09250141,21.8551024 0.653576894,21.4161779 0.653576894,20.874737 L0.653576894,14.2607623 C0.653576894,13.7193215 1.09250141,13.280397 1.63394224,13.280397 Z"
                id="Rectangle"
              ></path>
            </g>
          </g>
        </g>
      </g>
    </svg>
  ),
  GearSettings: (props: IconProps) => (
    <svg
      width="28px"
      height="28px"
      viewBox="0 0 28 28"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        id="Production"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Artboard"
          transform="translate(-211, -235)"
        >
          <g
            id="icon-settings"
            transform="translate(211, 235)"
          >
            <rect
              id="Rectangle"
              x="0"
              y="0"
              width="28"
              height="28"
            ></rect>
            <path
              d="M20.2015688,10.2525279 C20.0232123,10.6274217 20.0120959,11.0603422 20.1709774,11.4438954 C20.3298588,11.8274487 20.6438515,12.1256974 21.0350638,12.2646554 L22.0250838,12.6168364 C22.6105106,12.8246232 23.00167,13.3785255 23.00167,13.9997339 C23.00167,14.6209423 22.6105106,15.1748446 22.0250838,15.3826314 L21.0350638,15.7348124 C20.6438515,15.8737704 20.3298588,16.1720191 20.1709774,16.5555724 C20.0120959,16.9391256 20.0232123,17.3720461 20.2015688,17.7469399 L20.6539257,18.6946982 C20.9219287,19.2558525 20.8071211,19.9250005 20.367394,20.3647276 C19.9276669,20.8044547 19.2585189,20.9192624 18.6973645,20.6512594 L17.748041,20.2004677 C17.3731472,20.0221111 16.9402267,20.0109948 16.5566735,20.1698763 C16.1731202,20.3287577 15.8748715,20.6427504 15.7359135,21.0339627 L15.3837325,22.0239827 C15.1756233,22.6088399 14.6220059,22.9994678 14.0012263,22.9994678 C13.3804467,22.9994678 12.8268293,22.6088399 12.6187202,22.0239827 L12.2665391,21.0339627 C12.127404,20.6426994 11.8290064,20.3287067 11.4453321,20.1698369 C11.0616578,20.0109671 10.6286351,20.0220972 10.253629,20.2004677 L9.30587073,20.6512594 C8.7446872,20.9203194 8.07479926,20.8059063 7.63473092,20.365838 C7.19466259,19.9257696 7.08024945,19.2558817 7.34930952,18.6946982 L7.80010123,17.7453747 C7.97845774,17.3704809 7.98957409,16.9375604 7.83069263,16.5540071 C7.67181118,16.1704539 7.35781846,15.8722052 6.96660615,15.7332471 L5.97658618,15.3810661 C5.39115942,15.1732793 5,14.619377 5,13.9981686 C5,13.3769603 5.39115942,12.8230579 5.97658618,12.6152712 L6.96660615,12.2630902 C7.35740035,12.124078 7.67105878,11.8260915 7.82990186,11.4429292 C7.98874494,11.0597669 7.97791757,10.6272622 7.80010123,10.2525279 L7.34930952,9.30320437 C7.08024945,8.74202085 7.19466259,8.0721329 7.63473092,7.63206456 C8.07479926,7.19199623 8.7446872,7.07758309 9.30587073,7.34664317 L10.2551942,7.79743487 C10.6298363,7.97533367 11.0622628,7.98639209 11.445508,7.82787471 C11.8287532,7.66935733 12.1270239,7.35606892 12.2665391,6.96550504 L12.6187202,5.97548507 C12.8268293,5.39062793 13.3804467,5 14.0012263,5 C14.6220059,5 15.1756233,5.39062793 15.3837325,5.97548507 L15.7359135,6.96550504 C15.8748715,7.35671735 16.1731202,7.67071008 16.5566735,7.82959153 C16.9402267,7.98847298 17.3731472,7.97735664 17.748041,7.79900012 L18.6973645,7.34664317 C19.2585189,7.07864018 19.9276669,7.19344783 20.367394,7.63317492 C20.8071211,8.07290202 20.9219287,8.74204999 20.6539257,9.30320437 L20.2015688,10.2525279 Z"
              id="Path"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <circle
              id="Oval"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              cx="14.000835"
              cy="13.9997339"
              r="3.52181017"
            ></circle>
          </g>
        </g>
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
  'power-off': (props: IconProps) => Icons.PowerOff(props),
  'icon-multiple-patients': (props: IconProps) => Icons.MultiplePatients(props),
  'icon-patient': (props: IconProps) => Icons.Patient(props),
  'icon-chevron-patient': (props: IconProps) => Icons.ChevronPatient(props),
  info: (props: IconProps) => Icons.Info(props),
  settings: (props: IconProps) => Icons.Settings(props),

  /** Adds an icon to the set of icons */
  addIcon: (name: string, icon) => {
    if (Icons[name]) {
      console.warn('Replacing icon', name);
    }
    Icons[name] = icon;
  },
};
