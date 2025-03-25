// Helper function to extract UID from filename (if following XNAT naming convention)
export function extractUIDFromFilename(url: string): string | null {
    if (!url) return null;
    try {
      // Extract the filename from the URL path
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      
      // Generate a unique SOPInstanceUID based on the timestamp and random number
      // Don't attempt to extract from filename as it contains StudyInstanceUID, not SOPInstanceUID
      const sopUID = `2.25.${Date.now()}.${Math.floor(Math.random() * 1000000)}`;
      console.log('XNAT: Generated new SOPInstanceUID:', sopUID);
      return sopUID;
    } catch (e) {
      console.warn('Error generating SOPInstanceUID:', e);
      return generateRandomUID();
    }
  }
  
export function extractStudyUIDFromURL(url: string): string | null {
    if (!url) return null;
    try {
      // Extract the filename from the URL path
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      const studyUIDMatch = filename.match(/(\d+\.\d+\.\d+\.\d+(?:\.\d+)*)/);
      return studyUIDMatch ? studyUIDMatch[1] : null;
    } catch (e) {
      console.warn('Error extracting study UID from URL:', e);
      return null;
    }
  }
  // Generate a random UID as a last resort
export function generateRandomUID(): string {
    // Simple random UID generator for fallback
    return `2.25.${Math.floor(Math.random() * 100000000)}.${Date.now()}`;
  }