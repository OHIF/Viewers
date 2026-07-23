---
title: useSearchParams
summary: A React hook that provides access to URL search parameters from both the query string and hash fragment.
---

# useSearchParams

The `useSearchParams` hook provides access to URL search parameters, combining both query string parameters and hash fragment parameters into a single URLSearchParams object.

## Overview

This hook extends the standard React Router `useLocation` functionality by merging search parameters from both the query string and the hash fragment of the URL. It also provides an option to normalize parameter keys to lowercase for case-insensitive parameter handling.

## Import

```js
import { useSearchParams } from '@ohif/app';
```

## Usage

```jsx
function RouteParameterReader() {
  const searchParams = useSearchParams();
  // Or with lowercase keys option
  const lowerCaseParams = useSearchParams({ lowerCaseKeys: true });

  const studyInstanceUID = searchParams.get('StudyInstanceUID');
  // With lowerCaseKeys: true
  const sameStudyUID = lowerCaseParams.get('studyinstanceuid');

  return (
    <div>
      <div>Study UID: {studyInstanceUID}</div>
      <div>All Parameters:</div>
      <ul>
        {Array.from(searchParams.entries()).map(([key, value]) => (
          <li key={key}>
            {key}: {value}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Parameters

- `options` (optional): Configuration options
  - `lowerCaseKeys` - Boolean indicating whether to convert all parameter keys to lowercase (default: false)

## Returns

A `URLSearchParams` object containing all parameters from both:
- The query string (e.g., `?param1=value1&param2=value2`)
- The hash fragment (e.g., `#param3=value3&param4=value4`)

If parameters with the same key exist in both the query string and hash fragment, the hash fragment values take precedence.

## Implementation Details

- The hook uses React Router's `useLocation` to access the current URL.
- It first creates a URLSearchParams object from the location's search property.
- It then creates another URLSearchParams object from the location's hash property (excluding the leading '#').
- The parameters from the hash are added to the search parameters, overriding any duplicate keys.
- If the `lowerCaseKeys` option is enabled, it creates a new URLSearchParams object with all keys converted to lowercase.

This is particularly useful in OHIF where parameters may be specified in either the query string or hash fragment, and where case-sensitivity of parameter names might vary across different systems.
