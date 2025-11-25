# Dental Hanging Protocols

This directory contains hanging protocols specifically designed for dental imaging workflows in OHIF.

## Location

These hanging protocols are registered through the `@ohif/extension-dental-theme-toggle` extension, which ensures they are properly available to OHIF's hanging protocol service.

## Available Protocols

### 2x2 Dental Comparison Protocol (`@ohif/dental-2x2`)

A 2x2 grid layout optimized for dental comparison workflows.

#### Layout Structure

```
┌──────────────────┬──────────────────┐
│   Top-Left       │   Top-Right      │
│ Current Image    │ Prior Exam       │
│ (Primary Study)  │ (Same Modality)  │
├──────────────────┼──────────────────┤
│  Bottom-Left     │  Bottom-Right    │
│  Bitewing 1      │  Bitewing 2      │
│ (Placeholder)    │ (Placeholder)    │
└──────────────────┴──────────────────┘
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
http://localhost:3000/viewer?StudyInstanceUIDs=<current>&StudyInstanceUIDs=<prior>&hangingProtocolId=@ohif/dental-2x2
```

The first study in the URL will be considered the "current" study (index 0), and the second will be the "prior" study (index 1).

## Extension Integration

The hanging protocols are registered through the extension's `getHangingProtocolModule()` method, which is called automatically by OHIF when the extension is loaded. The dental mode specifies this extension in its `extensionDependencies`, ensuring the protocols are available when the mode is activated.

### Extension Structure

```
extensions/dental-theme-toggle/
├── src/
│   ├── hangingProtocols/
│   │   └── hp2x2Dental.ts          # Protocol definition
│   ├── getHangingProtocolModule.ts  # Module export
│   └── index.tsx                    # Extension registration
```

### Mode Configuration

The dental mode references the hanging protocol:

```typescript
const modeInstance = {
  // ...
  hangingProtocol: '@ohif/dental-2x2',
  extensions: {
    '@ohif/extension-dental-theme-toggle': '^3.0.0', // Provides the protocol
    // ...
  },
};
```

## Adding New Hanging Protocols

To add a new dental hanging protocol:

1. Create a new protocol file in this directory (e.g., `hpCustomDental.ts`)
2. Define your protocol following the OHIF `HangingProtocol.Protocol` type
3. Import and add it to the array in `getHangingProtocolModule.ts`

Example:

```typescript
// In getHangingProtocolModule.ts
import hp2x2Dental from './hangingProtocols/hp2x2Dental';
import myCustomProtocol from './hangingProtocols/hpCustomDental';

function getHangingProtocolModule() {
  return [
    {
      name: hp2x2Dental.id,
      protocol: hp2x2Dental,
    },
    {
      name: myCustomProtocol.id,
      protocol: myCustomProtocol,
    },
  ];
}
```

## References

- [OHIF Hanging Protocol Documentation](https://docs.ohif.org/platform/extensions/modules/hpmodule)
- [OHIF Hanging Protocol Service](https://docs.ohif.org/platform/services/data/hangingprotocolservice)
- OHIF Extension Structure: `platform/core/src/extensions/`
