import React from 'react';

type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {
  // Usage example: <Icons.ArrowLeft />

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
        fill="#348CFD"
        fillRule="evenodd"
      >
        <path d="M7 .102A6.899 6.899 0 1 0 7 13.9 6.899 6.899 0 0 0 7 .102zm0 .875a6.024 6.024 0 1 1 0 12.048A6.024 6.024 0 0 1 7 .977z" />
        <path d="M6.462 5.486c.503 0 .917.38.97.87l.006.106v3.769a.438.438 0 0 1-.868.078l-.007-.078V6.46a.101.101 0 0 0-.07-.095l-.031-.005H5.385a.437.437 0 0 1-.079-.868l.079-.007h1.077zM6.192 2.793l.089.006a.707.707 0 1 1-.177 0l.088-.006z" />
        <path d="M8.615 9.794c.242 0 .438.224.438.5 0 .246-.155.45-.359.492l-.079.008h-3.23c-.242 0-.438-.224-.438-.5 0-.245.155-.45.359-.492l.079-.008h3.23z" />
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
        stroke="#348CFD"
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
          stroke="#348CFD"
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
