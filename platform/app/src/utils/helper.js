export const ConvertStringToDate = (dateString, timeString) => {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6) - 1; // Month is zero-based in JavaScript Date objects
  const day = dateString.substring(6, 8);

  // Extract hour, minute, and second from the time string
  const hour = timeString.substring(0, 2);
  const minute = timeString.substring(2, 4);
  const second = timeString.substring(4, 6);

  // Create a Date object
  const combinedDate = new Date(year, month, day, hour, minute, second);
  return combinedDate;
}
