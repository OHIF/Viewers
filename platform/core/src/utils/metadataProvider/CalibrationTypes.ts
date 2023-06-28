/**
 * Defines the calibration types available.  These define how the units
 * for measurements are specified.
 */
export enum CalibrationTypes {
  /**
   * Not applicable means the units are directly defind by the underlying
   * hardware, such as CT and MR volumetric displays, so no special handling
   * or notification is required.
   */
  NOT_APPLICABLE = '',
  /**
   * ERMF is estimated radiographic magnification factor.  This defines how
   * much the image is magnified at the detector as opposed to the location in
   * the body of interest.  This occurs because the radiation beam is expanding
   * and effectively magnifies the image on the detector compared to where the
   * point of interest in the body is.
   * This suggests that measurements can be partially trusted, but the user
   * still needs to be aware that different depths within the body have differing
   * ERMF values, so precise measurements would still need to be manually calibrated.
   */
  ERMF = 'ERMF',
  /**
   * User calibration means that the user has provided a custom calibration
   * specifying how large the image data is.  This type can occur on
   * volumetric images, eg for scout images that might have invalid spacing
   * tags.
   */
  USER = 'User',
  /**
   * A projection calibration means the raw detector size, without any
   * ERMF applied, meaning that the size in the body cannot be trusted and
   * that a calibration should be applied.
   * This is different from Error in that there is simply no magnification
   * factor applied as opposed to having multiple, inconsistent magnification
   * factors.
   */
  PROJECTION = 'Proj',
  /**
   * A region calibration is used for other types of images, typically
   * ultrasouunds where the distance in the image may mean something other than
   * physical distance, such as mV or Hz or some other measurement values.
   */
  REGION = 'Region',
  /**
   * Unknown is used when there is pixel spacing but not enough information to
   * determine if it is ERMF calibrated or not, or what type it is.
   */
  UNKNOWN = 'Unknown',
  /**
   * Error is used to define mismatches between various units, such as when
   * there are two different ERMF values specified.  This is an indication to
   * NOT trust the measurement values but to manually calibrate.
   */
  ERROR = 'Error',
}

export default CalibrationTypes;
