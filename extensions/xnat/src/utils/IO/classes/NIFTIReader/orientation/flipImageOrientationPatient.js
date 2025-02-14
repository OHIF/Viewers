const flipImageOrientationPatient = {
  /**
   * h: Flips ImageOrientationPatient in the horizontal direction.
   * @param {Number[6]} iop - ImageOrientationPatient
   * @returns {Number[6]} The transformed ImageOrientationPatient
   */
  h: iop => {
    return [iop[0], iop[1], iop[2], -iop[3], -iop[4], -iop[5]];
  },
  /**
   * v: Flips ImageOrientationPatient in the vertical direction.
   * @param {Number[6]} iop - ImageOrientationPatient
   * @returns {Number[6]} The transformed ImageOrientationPatient
   */
  v: iop => {
    return [-iop[0], -iop[1], -iop[2], iop[3], iop[4], iop[5]];
  },
  /**
   * hv: Flips ImageOrientationPatient in the horizontal and vertical directions.
   * @param {Number[6]} iop - ImageOrientationPatient
   * @returns {Number[6]} The transformed ImageOrientationPatient
   */
  hv: iop => {
    return [-iop[0], -iop[1], -iop[2], -iop[3], -iop[4], -iop[5]];
  },
};

export { flipImageOrientationPatient };
