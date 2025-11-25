# Dental Mode 2x2 Hanging Protocol Implementation

## Summary

Successfully implemented a 2x2 hanging protocol for the OHIF Dental Mode using the `hangingProtocolModule`. This protocol enables comparison workflows between current and prior dental exams with dedicated bitewing image placeholders.

## Implementation Details

### Files Created/Modified

1. **Created: `modes/dental/src/hangingProtocols/hp2x2Dental.ts`**
   - Defines the complete 2x2 hanging protocol
   - Protocol ID: `@ohif/dental-2x2`
   - Includes display set selectors for current, prior, and bitewing images

2. **Created: `modes/dental/src/hangingProtocols/index.ts`**
   - Exports the hanging protocol module for registration
   - Provides the `getHangingProtocolModule()` function

3. **Created: `modes/dental/src/hangingProtocols/README.md`**
   - Complete documentation for the hanging protocols
   - Usage examples and configuration guide

4. **Modified: `modes/dental/src/index.ts`**
   - Imported the hanging protocol module
   - Added `hangingProtocolModule` to the mode instance
   - Changed default hanging protocol to `@ohif/dental-2x2`

## Layout Structure

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

### Viewport Details

- **Top-Left**: Displays the current study's primary image (study index 0)
- **Top-Right**: Displays prior exam with matching modality (study index 1)
- **Bottom-Left**: First bitewing image from current study (if available)
- **Bottom-Right**: Second bitewing image from current study (if available)

## Features

### Display Set Selectors

The protocol uses three display set selectors:

1. **currentDisplaySetId**:
   - Matches study index 0 (current/primary study)
   - Prefers dental modalities: DX, PX, IO
   - Respects URL-specified display sets

2. **priorDisplaySetId**:
   - Matches study index 1 (prior study)
   - Same modality preferences as current
   - Enables side-by-side comparison

3. **bitewingDisplaySetId**:
   - Matches series with "bitewing" or "BW" in description
   - Prefers IO (Intra-oral) modality
   - Uses current study only

### Smart Matching

- **Modality-based**: Prioritizes dental-specific modalities (DX, PX, IO)
- **Description-based**: Identifies bitewings by series description
- **Prior-aware**: `numberOfPriorsReferenced: 0` allows working with or without priors
- **Graceful degradation**: `allowUnmatchedView: true` handles missing data

### Supported Modalities

- **DX** - Digital Radiography
- **PX** - Panoramic X-Ray
- **IO** - Intra-oral Radiography

## Usage

### Automatic Activation

The protocol automatically activates when the dental mode loads with:
- Dental modalities (DX, PX, or IO) present in the study
- At least one matching viewport

### Manual Activation via URL

Force the hanging protocol with URL parameter:

```
http://localhost:3000/viewer?StudyInstanceUIDs=<study-uid>&hangingProtocolId=@ohif/dental-2x2
```

### With Prior Study Comparison

Include both current and prior studies:

```
http://localhost:3000/viewer?StudyInstanceUIDs=<current-study>&StudyInstanceUIDs=<prior-study>&hangingProtocolId=@ohif/dental-2x2
```

**Note**: The first StudyInstanceUID in the URL is the "current" study (index 0), and the second is the "prior" study (index 1).

## Technical Notes

### TypeScript Compatibility

The `from: 'options'` property used in study matching rules is implemented in the JavaScript HPMatcher but not fully typed in the TypeScript definitions. We use type assertions (`as Types.HangingProtocol.MatchingRule`) to bypass this limitation while maintaining the correct runtime behavior.

### Study Index Matching

The protocol uses `studyInstanceUIDsIndex` attribute with `from: 'options'` to distinguish between current and prior studies:
- Index 0 = Current study
- Index 1 = Prior study

This pattern follows OHIF's comparison protocol conventions (see `@ohif/hpCompare`).

### Protocol Registration

The hanging protocol is registered through the mode's `hangingProtocolModule` property, which calls `getHangingProtocolModule()`. OHIF's HangingProtocolService automatically registers all protocols from active modes.

## Testing Recommendations

1. **Single Study**: Verify layout works with current study only
2. **Two Studies**: Test comparison with current + prior studies
3. **Bitewing Detection**: Confirm bitewing images are correctly identified
4. **Modality Matching**: Test with different dental modalities (DX, PX, IO)
5. **Missing Data**: Verify graceful handling of missing priors or bitewings

## Future Enhancements

Potential improvements:
- Additional stages for different layout configurations (1x2, 1x1)
- Custom viewport synchronization for measurements across current/prior
- Automatic series sorting by acquisition time
- Support for more dental-specific series types (panoramic, cephalometric)

## References

- [OHIF Hanging Protocol Documentation](https://docs.ohif.org/platform/extensions/modules/hpmodule)
- [OHIF Hanging Protocol Service](https://docs.ohif.org/platform/services/data/hangingprotocolservice)
- Comparison Protocol Example: `extensions/default/src/hangingprotocols/hpCompare.ts`
- 2x2 Grid Example: `extensions/default/src/hangingprotocols/hpMNGrid.ts`
