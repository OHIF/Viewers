/**
 * Formats a DICOM datetime string (YYYYMMDD:HHmmss) into a human-readable format
 *
 * @param dateStr - DICOM datetime string in format "YYYYMMDD:HHmmss"
 * @returns Formatted date string (e.g., "Mon, Jan 1 2024")
 * @example
 * formatDicomDate("20240101:120000") // Returns "Mon, Jan 1 2024"
 * formatDicomDate("invalid") // Returns "invalid"
 */
export const formatDicomDate = (dateStr: string): string => {
  // Parse YYYYMMDD:HHmmss format
  const match = dateStr.match(/^(\d{4})(\d{2})(\d{2}):(\d{2})(\d{2})(\d{2})/);
  if (match == null) {
    return dateStr;
  }

  const [, year, month, day, hour, minute, second] = match;

  // Validate month and day
  const monthNum = parseInt(month);
  const dayNum = parseInt(day);
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    return dateStr;
  }

  const date = new Date(
    parseInt(year),
    monthNum - 1, // months are 0-based
    dayNum,
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );

  // Check if the date is invalid or if the month/day combination is invalid
  // This catches cases like February 31st where the date rolls over to March
  if (
    date.getMonth() !== monthNum - 1 || // month rolled over
    date.getDate() !== dayNum // day rolled over
  ) {
    return dateStr;
  }

  // Format parts separately to avoid the extra comma
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  const dayFormatted = date.getDate();
  const yearNum = date.getFullYear();

  return `${weekday}, ${monthName} ${dayFormatted} ${yearNum}`;
};
