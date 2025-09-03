import './template.css';

const getAiReportBody = reportData => {
  const upperKnee = reportData?.upper_knee ? reportData?.upper_knee : {};
  const leftLeg = reportData?.left_leg ? reportData?.left_leg : {};
  const rightLeg = reportData?.right_leg ? reportData?.right_leg : {};
  // const anteriorLeft = leftLeg.upper_anter_block_L && leftLeg.middle_anter_block_L ? [...leftLeg.upper_anter_block_L, ...leftLeg.middle_anter_block_L,leftLeg.lower_anter_block_L]
  return `<h2><strong style="font-size: 18px">AORTA:</strong></h2>
  <h3>

    <strong><span style="font-size: 13px">Blockage:</span></strong>
  </h3>
  <table style="border-collapse: collapse; border: 1px solid #bfccd4; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
        </tr>
      ${upperKnee?.aorta_blockage?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${
            index + 1
          }</td>
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${
            item?.Region
          }</td>
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${
            item?.Length
          }</td>
          ${
            item?.slice_range && item.slice_range.length > 0
              ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
              : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
          }
          </tr>
          `;
      })}
    </tbody>
  </table>
  <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
      </tr>
      ${upperKnee?.aorta_stenosis?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Region}</td>
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Length}</td>
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Type}</td>
          </tr>
          `;
      })}
    </tbody>
  </table>
  <br />
  <h2><strong style="font-size: 18px">COMMON ILLIAC RIGHT:</strong></h2>
  <h3><strong style="font-size: 13px">Blockage:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>

        </tr>
      ${upperKnee?.iliacR_blockage?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            index + 1
          }</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Region
          }</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Length
          }</td>
          ${
            item.slice_range && item.slice_range.length > 0
              ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
              : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
          }
          </tr>
          `;
      })}
    </tbody>
  </table>
  <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
      </tr>
      ${upperKnee?.iliacR_stenosis?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
          </tr>
          `;
      })}
    </tbody>
  </table>
  <br />
  <h2><strong style="font-size: 18px">COMMON ILLIAC LEFT:</strong></h2>
  <h3><strong style="font-size: 13px">Blockage:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
      </tr>
      ${upperKnee?.iliacL_blockage?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            index + 1
          }</td>
          <td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Region
          }</td>
          <td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Length
          }</td>
          ${
            item.slice_range && item.slice_range.length > 0
              ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
              : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
          }
          </tr>`;
      })}
    </tbody>
  </table>
  <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
      </tr>
      ${upperKnee?.iliacL_stenosis?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
          </tr>
          `;
      })}
    </tbody>
  </table>
  <br />
  <h2><strong style="font-size: 18px">EXTERNAL ILLIAC RIGHT:</strong></h2>
  <h3><strong style="font-size: 13px">Blockage:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>

        </tr>
      ${upperKnee?.eiliacR_blockage?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            index + 1
          }</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Region
          }</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Length
          }</td>
          ${
            item.slice_range && item.slice_range.length > 0
              ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
              : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
          }
          </tr>
          `;
      })}
    </tbody>
  </table>
  <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
      </tr>
      ${upperKnee?.eiliacR_stenosis?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Region}</td>
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Length}</td>
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Type}</td>
          </tr>
          `;
      })}
    </tbody>
  </table>
  <br />
  <h2>
    <strong><span style="font-size: 18px">EXTERNAL ILLIAC LEFT:</span></strong>
  </h2>
  <h3><strong style="font-size: 13px">Blockage:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>

        </tr>
      ${upperKnee?.eiliacL_blockage?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            index + 1
          }</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Region
          }</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Length
          }</td>
          ${
            item.slice_range && item.slice_range.length > 0
              ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
              : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
          }
          </tr>
          `;
      })}
    </tbody>
  </table>
  <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
      </tr>
      ${upperKnee?.eiliacL_stenosis?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Region}</td>
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Length}</td>
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
          <td style="width: 25%; text-align: center; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">${item.Type}</td>
          </tr>
          `;
      })}
    </tbody>
  </table>
  <br />
  <h2><strong style="font-size: 18px">FEMORAL RIGHT:</strong></h2>
  <h3><strong style="font-size: 13px">Blockage:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
      </tr>
      ${upperKnee?.sfaR_blockage?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            index + 1
          }</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Region
          }</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Length
          }</td>
          ${
            item.slice_range && item.slice_range.length > 0
              ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
              : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
          }
          </tr>
          `;
      })}
    </tbody>
  </table>
  <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
      </tr>
      ${upperKnee?.sfaR_stenosis?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
          </tr>
          `;
      })}
    </tbody>
  </table>
  <br />
  <h2><strong style="font-size: 18px">FEMORAL LEFT:</strong></h2>
  <h3><strong style="font-size: 13px">Blockage:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>

        </tr>
      ${upperKnee?.sfaL_blockage?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            index + 1
          }</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Region
          }</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
            item.Length
          }</td>
          ${
            item.slice_range && item.slice_range.length > 0
              ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
              : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
          }
          </tr>
          `;
      })}
    </tbody>
  </table>
  <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
  <table style="border-collapse: collapse; width: 100%">
    <tbody>
      <tr style="border: 1px solid #bfccd4;">
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
        <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
      </tr>
      ${upperKnee?.sfaL_stenosis?.map((item, index) => {
        return `
          <tr key=${index} style="border: 1px solid #bfccd4;">
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
          <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
          </tr>
          `;
      })}
    </tbody>
  </table>
    <br />
    <h2><strong style="font-size: 18px">POPLITEAL RIGHT:</strong></h2>
    <h3><strong style="font-size: 13px">Blockage:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
        </tr>
        ${rightLeg?.popliteal_block_R?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              index + 1
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Region
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Length
            }</td>
            ${
              item.slice_range && item.slice_range.length > 0
                ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
                : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
            }
            </tr>
            `;
        })}
      </tbody>
    </table>
    <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
        </tr>
        ${rightLeg?.popliteal_stenosis_R?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
            </tr>
            `;
        })}
      </tbody>
    </table>
    <br />
    <h2><strong style="font-size: 18px">POPLITEAL LEFT:</strong></h2>
    <h3><strong style="font-size: 13px">Blockage:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
        </tr>
        ${leftLeg?.popliteal_block_L?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              index + 1
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Region
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Length
            }</td>
            ${
              item.slice_range && item.slice_range.length > 0
                ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
                : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
            }
            </tr>
            `;
        })}
      </tbody>
    </table>
    <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
        </tr>
        ${leftLeg?.popliteal_stenosis_L?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
            </tr>
            `;
        })}
      </tbody>
    </table>

    <br />
    <h2><strong style="font-size: 18px">TIBIOFIBULAR RIGHT:</strong></h2>
    <h3><strong style="font-size: 13px">Blockage:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
        </tr>
        ${rightLeg?.tibio_block_R?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              index + 1
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Region
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Length
            }</td>
            ${
              item.slice_range && item.slice_range.length > 0
                ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
                : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
            }
            </tr>
            `;
        })}
      </tbody>
    </table>
    <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
        </tr>
        ${rightLeg?.tibio_stenosis_R?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
            </tr>
            `;
        })}
      </tbody>
    </table>
    <br />
    <h2><strong style="font-size: 18px">TIBIOFIBULAR LEFT:</strong></h2>
    <h3><strong style="font-size: 13px">Blockage:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
        </tr>
        ${leftLeg?.tibio_block_L?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              index + 1
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Region
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Length
            }</td>
            ${
              item.slice_range && item.slice_range.length > 0
                ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
                : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
            }
            </tr>
            `;
        })}
      </tbody>
    </table>
    <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
        </tr>
        ${leftLeg?.tibio_stenosis_L?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
            </tr>
            `;
        })}
      </tbody>
    </table>



    <br />

    <h2><strong style="font-size: 18px">ANTERIOR RIGHT:</strong></h2>
    <h3><strong style="font-size: 13px">Blockage:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
        </tr>
        ${rightLeg?.anterior_block_R?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              index + 1
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Region
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Length
            }</td>
            ${
              item.slice_range && item.slice_range.length > 0
                ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
                : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
            }
            </tr>
            `;
        })}
      </tbody>
    </table>
    <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
        </tr>
        ${rightLeg?.anterior_stenosis_R?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
            </tr>
            `;
        })}

      </tbody>
    </table>
    <br />
    <h2><strong style="font-size: 18px">ANTERIOR LEFT:</strong></h2>
    <h3><strong style="font-size: 13px">Blockage:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
        </tr>
        ${leftLeg?.anterior_block_L?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              index + 1
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Region
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Length
            }</td>
            ${
              item.slice_range && item.slice_range.length > 0
                ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
                : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
            }
            </tr>
            </tr>
            `;
        })}

      </tbody>
    </table>
    <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
        </tr>
        ${leftLeg?.anterior_stenosis_L?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
            </tr>
            `;
        })}

      </tbody>
    </table>
    <br />
    <h2><strong style="font-size: 18px">POSTERIOR RIGHT:</strong></h2>
    <h3><strong style="font-size: 13px">Blockage:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
        </tr>
        ${rightLeg?.posterior_block_R?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              index + 1
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Region
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Length
            }</td>
            ${
              item.slice_range && item.slice_range.length > 0
                ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
                : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
            }
            </tr>
            `;
        })}

      </tbody>
    </table>
    <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
        </tr>
        ${rightLeg?.posterior_stenosis_R?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
            </tr>
            `;
        })}

      </tbody>
    </table>
    <br />
    <h2><strong style="font-size: 18px">POSTERIOR LEFT:</strong></h2>
    <h3><strong style="font-size: 13px">Blockage:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
        </tr>
        ${leftLeg?.posterior_block_L?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              index + 1
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Region
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Length
            }</td>
            ${
              item.slice_range && item.slice_range.length > 0
                ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
                : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
            }
            </tr>
            </tr>
            `;
        })}

      </tbody>
    </table>
    <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
        </tr>
        ${leftLeg?.posterior_stenosis_L?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
            </tr>
            `;
        })}

      </tbody>
    </table>

    <br />
    <h2><strong style="font-size: 18px">PERONEAL RIGHT:</strong></h2>
    <h3><strong style="font-size: 13px">Blockage:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
        </tr>
        ${rightLeg?.peroneal_block_R?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              index + 1
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Region
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Length
            }</td>
            ${
              item.slice_range && item.slice_range.length > 0
                ? `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.slice_range}</td>`
                : `<td style="width: 25; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">N/A</td>`
            }
            </tr>
            `;
        })}

      </tbody>
    </table>
    <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
        </tr>
        ${rightLeg?.peroneal_stenosis_R?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Region ? item.Region : 'N/A'
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Length ? item.Length : 'N/A'
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Percentage ? item.Percentage : 'N/A'
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Type ? item.Type : 'N/A'
            }</td>
            </tr>
            `;
        })}

      </tbody>
    </table>
    <br />
    <h2><strong style="font-size: 18px">PERONEAL LEFT:</strong></h2>
    <h3><strong style="font-size: 13px">Blockage:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Sr. No.</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Slice Range</th>
        </tr>
        ${leftLeg?.peroneal_block_L?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              index + 1
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Region
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.Length
            }</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${
              item.slice_range ? item.slice_range : 'N/A'
            }</td>
            </tr>
            `;
        })}

      </tbody>
    </table>
    <h3><strong style="font-size: 13px">Stenosis:</strong></h3>
    <table style="border-collapse: collapse; width: 100%">
      <tbody>
        <tr style="border: 1px solid #bfccd4;">
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Region</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Length (cm)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">Percentage (%)</th>
          <th style="text-align: center;width: 25%; border: 1px solid #bfccd4; font-size: 13px; padding:0.2rem;">XyCAD Prediction</th>
        </tr>
        ${leftLeg?.peroneal_stenosis_L?.map((item, index) => {
          return `
            <tr key=${index} style="border: 1px solid #bfccd4;">
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Region}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Length}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Percentage}</td>
            <td style="width: 25%; border: 1px solid #bfccd4; text-align: center; font-size: 13px; padding:0.2rem;">${item.Type}</td>
            </tr>
            `;
        })}
      </tbody>
    </table>
    `;
};
export default getAiReportBody;
