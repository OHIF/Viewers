/**
 * Fetches contour information from the eContour API
 * @param studyUID - The DICOM Study Instance UID to fetch contour info for
 * @returns Promise that resolves to the contour information
 */
export const fetchContourInfo = async (studyUID: string) => {
  if (!studyUID) {
    return null;
  }

  try {
    // Customize the environment as needed
    const environment = 'development';
    const baseUrl = environment ? `https://${environment}.econtour.org` : 'https://econtour.org';
    const url = `${baseUrl}/api/regions/?studyUID=${studyUID}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching contour data: ${response.status}`);
    }

    const data = await response.json();

    // Check if responseBody exists in the data
    if (!data.responseBody) {
      return data; // Return the whole data object if responseBody isn't present
    }

    return data.responseBody;
  } catch (error) {
    console.error('Error in fetchContourInfo:', error);
    throw error; // Re-throw to let React Query handle it
  }
};
