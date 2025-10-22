// // Registration is done in the extension init. Avoid importing here to prevent side effects.

// // If you already have a TID300 class for SCOORD3D POINT, use it here.
// // Otherwise, implement a thin wrapper that dcmjs understands as a SCOORD3D POINT.
// class TID300Scoord3DPoint {
//   public _contentItem: any;

//   constructor(args: {
//     ReferencedSOPSequence?: any; // not used for 3D
//     FrameOfReferenceUID: string;
//     GraphicType: 'POINT';
//     GraphicData: [number, number, number];
//     TrackingIdentifier?: string;
//     TrackingUniqueIdentifier?: string;
//     finding?: any;
//     findingSites?: any[];
//   }) {
//     // Minimal shape that dcmjs TID1500 builder consumes later
//     this._contentItem = {
//       ValueType: 'SCOORD3D',
//       // Include ReferencedSOPSequence for consistency with dcmjs TID1501 expectations
//       ReferencedSOPSequence: args.ReferencedSOPSequence,
//       ReferencedFrameOfReferenceUID: args.FrameOfReferenceUID,
//       GraphicType: args.GraphicType,
//       GraphicData: args.GraphicData,
//     };
//     // Expose optional fields on the TID300 instance (not in the content item)
//     (this as any).ReferencedSOPSequence = args.ReferencedSOPSequence;
//     (this as any).TrackingIdentifier = args.TrackingIdentifier;
//     (this as any).TrackingUniqueIdentifier = args.TrackingUniqueIdentifier;
//     (this as any).finding = args.finding;
//     (this as any).findingSites = args.findingSites;
//   }


//   contentItem() {
//     return [this._contentItem];
//   }
// }

// export default class CustomProbe3DAdapter {
//   public toolType = 'CustomProbe'; // or 'SRSCOORD3DPoint' if you prefer
//   public TID300Representation = TID300Scoord3DPoint;
//   public trackingIdentifierTextValue = 'CORNERSTONE:CustomProbe';
//   public trackingIdentifiers = new Set<string>([this.trackingIdentifierTextValue]);
//   public parentType = 'volumetric';

//   init(toolType: string, representation: any) {
//     this.toolType = toolType || this.toolType;
//     this.TID300Representation = representation || this.TID300Representation;
//     return this;
//   }

//   isValidCornerstoneTrackingIdentifier(trackingIdentifier: string) {
//     return trackingIdentifier === this.trackingIdentifierTextValue;
//   }

//   // UI -> SR
//   getTID300RepresentationArguments(
//     tool: any,
//     _worldToImageCoords: any
//   ) {
//     // Derive FrameOfReferenceUID and world position from annotation structure
//     const frameOfReferenceUID = tool?.metadata?.FrameOfReferenceUID;

//     // Try common locations for a 3D point annotation
//     let worldPosition: [number, number, number] | undefined =
//       tool?.data?.renderableData?.POINT?.[0]?.[0] ||
//       tool?.data?.handles?.points?.[0] ||
//       tool?.data?.cachedStats?.projectionPoints?.[0];

//     if (!worldPosition || worldPosition.length !== 3 || !frameOfReferenceUID) {
//       throw new Error('CustomProbe requires worldPosition and FrameOfReferenceUID');
//     }

//     // Try to pass through ReferencedSOPSequence when available from 2D contexts
//     const referencedSOPSequence = tool?.metadata?.ReferencedSOPSequence || tool?.metadata?.referencedImageId;
//     return {
//       ReferencedSOPSequence: referencedSOPSequence,
//       FrameOfReferenceUID: frameOfReferenceUID,
//       GraphicType: 'POINT' as const,
//       GraphicData: worldPosition,
//       TrackingIdentifier: this.trackingIdentifierTextValue,
//       TrackingUniqueIdentifier: tool?.annotationUID || tool?.uid,
//       finding: tool.finding,
//       findingSites: tool.findingSites ?? [],
//     };
//   }

//   // SR -> UI
//   getMeasurementData(
//     measurementGroup: any,
//     _sopInstanceUIDToImageIdMap: any,
//     _imageToWorldCoords: any,
//     _metadata: any,
//     trackingIdentifier: string
//   ) {
//     // Extract SCOORD3D child from the group; return your runtime measurement
//     const seq = [].concat(measurementGroup?.ContentSequence || []);
//     const scoord3d = seq.find((g: any) => g.ValueType === 'SCOORD3D');
//     if (!scoord3d) {
//       throw new Error('No SCOORD3D content found for CustomProbe');
//     }

//     const FrameOfReferenceUID = scoord3d?.ReferencedFrameOfReferenceUID;
//     const GraphicType = scoord3d?.GraphicType;
//     const GraphicData = scoord3d?.GraphicData;

//     if (GraphicType !== 'POINT' || !Array.isArray(GraphicData) || GraphicData.length !== 3) {
//       throw new Error('Invalid SCOORD3D POINT');
//     }

//     // Optionally parse finding/findingSites similar to MeasurementReport.processSpatialCoordinatesGroup
//     return {
//       toolName: this.toolType,
//       uid: measurementGroup?.TrackingUniqueIdentifier || measurementGroup?.UID,
//       worldPosition: GraphicData as [number, number, number],
//       FrameOfReferenceUID,
//       trackingIdentifier,
//     };
//   }
// }

// // Registration is handled in `extensions/cornerstone-dicom-sr/src/init.ts`.
