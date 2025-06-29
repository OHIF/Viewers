// Global state to control whether to show the percentage in the overlay
export let showPercentage = true;

/**
 * Sets whether to show the pleura percentage in the viewport overlay
 * @param value - Boolean indicating whether to show the percentage
 */
export function setShowPercentage(value) {
  showPercentage = value;
}
