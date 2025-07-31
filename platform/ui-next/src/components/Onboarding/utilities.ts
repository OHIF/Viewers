/**
 * Retrieves the list of tours that have been shown from localStorage.
 * @returns {string[]} An array of tour IDs that have been shown.
 */
const getShownTours = () => JSON.parse(localStorage.getItem('shownTours') || '[]');

/**
 * Checks if a specific tour has been shown.
 * @param {string} tourId - The ID of the tour to check.
 * @returns {boolean} True if the tour has been shown, false otherwise.
 */
const hasTourBeenShown = (tourId: string) => getShownTours().includes(tourId);

/**
 * Marks a specific tour as shown by adding it to localStorage.
 * @param {string} tourId - The ID of the tour to mark as shown.
 * @returns {void}
 */
const markTourAsShown = (tourId: string) => {
  const shownTours = getShownTours();
  if (!shownTours.includes(tourId)) {
    shownTours.push(tourId);
    localStorage.setItem('shownTours', JSON.stringify(shownTours));
  }
};

export { hasTourBeenShown, markTourAsShown };
