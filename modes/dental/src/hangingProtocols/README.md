# Dental Hanging Protocols

**Note:** The hanging protocols for dental mode have been moved to the `@ohif/extension-dental-theme-toggle` extension for proper registration with OHIF's hanging protocol service.

**New Location:** `extensions/dental-theme-toggle/src/hangingProtocols/`

This directory is maintained for reference but is no longer actively used by the dental mode.

## Available Protocols

### 2x2 Dental Comparison Protocol (`@ohif/dental-2x2`)

A 2x2 grid layout optimized for dental comparison workflows.

#### Layout Structure

```
+------------------+------------------+
| Top-Left:        | Top-Right:       |
| Current Image    | Prior Exam       |
| (Primary Study)  | (Same Modality)  |
+------------------+------------------+
| Bottom-Left:     | Bottom-Right:    |
| Bitewing 1       | Bitewing 2       |
| (Placeholder)    | (Placeholder)    |
+------------------+------------------+
```

#### Features

- **Top-Left Viewport**: Displays the current/primary dental image from the active study
- **Top-Right Viewport**: Displays a prior exam with the same modality for comparison
- **Bottom Row**: Reserved for bitewing images (if available in the study)
- **Smart Matching**: Automatically matches series based on modality and description
- **Prior Support**: Works with or without prior studies (numberOfPriorsReferenced: 0)

#### Supported Modalities

- **DX** - Digital Radiography
- **PX** - Panoramic X-Ray
- **IO** - Intra-oral Radiography

#### Usage

##### Automatic Activation

The protocol will automatically activate when:
1. The dental mode is active
2. A study contains dental modalities (DX, PX, or IO)

##### Manual Activation via URL

You can force this hanging protocol by adding it to the URL:

```
http://localhost:3000/viewer?StudyInstanceUIDs=<study-uid>&hangingProtocolId=@ohif/dental-2x2
```

##### With Prior Study Comparison

To compare with a prior study, include both StudyInstanceUIDs:

```
http://localhost:3000/viewer?StudyInstanceUIDs=<current-study>&StudyInstanceUIDs=<prior-study>&hangingProtocolId=@ohif/dental-2x2
```

The first study in the URL will be considered the "current" study, and the second will be the "prior" study.

#### Display Set Selectors

The protocol uses three main display set selectors:

1. **currentDisplaySetId**: Selects images from the current study (index 0)
2. **priorDisplaySetId**: Selects images from the prior study (index 1)
3. **bitewingDisplaySetId**: Selects bitewing images based on series description

#### Viewport Configuration

Each viewport is configured with:
- **viewportType**: 'stack' (for 2D dental images)
- **toolGroupId**: 'default' (uses dental mode tool group)
- **allowUnmatchedView**: true (gracefully handles missing data)

## Adding New Hanging Protocols

To add a new dental hanging protocol:

1. Create a new file in this directory (e.g., `hpCustomDental.ts`)
2. Define your protocol following the OHIF HangingProtocol.Protocol type
3. Import and add it to the `hangingProtocols` array in `index.ts`
4. Export it from the module

Example:

```typescript
import { Types } from '@ohif/core';

const myCustomProtocol: Types.HangingProtocol.Protocol = {
  id: '@ohif/dental-custom',
  name: 'My Custom Dental Layout',
  // ... rest of protocol definition
};

export default myCustomProtocol;
```

Then update `index.ts`:

```typescript
import myCustomProtocol from './hpCustomDental';

const hangingProtocols = [
  { name: hp2x2Dental.id, protocol: hp2x2Dental },
  { name: myCustomProtocol.id, protocol: myCustomProtocol },
];
```

## References

- [OHIF Hanging Protocol Documentation](https://docs.ohif.org/platform/extensions/modules/hpmodule)
- [OHIF Hanging Protocol Service](https://docs.ohif.org/platform/services/data/hangingprotocolservice)
