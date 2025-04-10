// Helper function to get appropriate SOPClassUID based on modality
export function getSOPClassUIDForModality(modality: string): string {
    if (modality === 'MR') {
      return '1.2.840.10008.5.1.4.1.1.4'; // MR Image Storage
    } else if (modality === 'CT') {
      return '1.2.840.10008.5.1.4.1.1.2'; // CT Image Storage
    } else if (modality === 'PT') {
      return '1.2.840.10008.5.1.4.1.1.128'; // PET Image Storage
    } else if (modality === 'US') {
      return '1.2.840.10008.5.1.4.1.1.6.1'; // Ultrasound Image Storage
    } else if (modality === 'CR' || modality === 'DX') {
      return '1.2.840.10008.5.1.4.1.1.1.1'; // Digital X-Ray Image Storage
    } else {
      return '1.2.840.10008.5.1.4.1.1.2'; // Default to CT Image Storage
    }
  }
  