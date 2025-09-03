import { templates } from '../templates/templates';

const getBody = (mod = 'Default', tempId = '0') => {
  const mods = ['MG', 'CT', 'US', 'MRI'];
  if (!mods.includes(mod)) {
    tempId = '0';
    mod = 'Default';
  }

  const result = templates[mod]?.find(template => {
    return template?.id == tempId;
  });

  return result?.label === 'MAMMO REPORT TEMPLATE'
    ? `${result?.body}`
    : `<p class="MsoNormal" align="center" style="margin: 0in 0in 12px; line-height: 115%; font-family: Calibri, sans-serif; text-align: center; font-size: 12px;">
        <strong style="">
          <span style="line-height: 115%; font-family: Arial, Helvetica, sans-serif; font-size: 30px;">
            ${result?.value ? result?.value : ''}
          </span>
        </strong>
      </p>
      <p class="MsoNormal" align="center" style="margin: 0in 0in 12px; line-height: 115%; font-size: 12px; font-family: Calibri, sans-serif; text-align: center;">
        <strong>
          <u>
            <span style="font-size: 21px; line-height: 115%; font-family: Arial, sans-serif;">
              <br>
            </span>
          </u>
        </strong>
      </p>
      <table style="border-collapse:collapse;width: 100%;">
        <tbody>
          <tr>
            <td style="width: 17.2414%; vertical-align: top;">
              <span style="font-family: Arial, Helvetica, sans-serif;">
                <strong style="font-size: 18px;">CLINICAL DATA:</strong>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <table style="border-collapse:collapse;width: 100%;">
        <tbody>
          <tr>
            <td style="width: 52.5872%; vertical-align: top;">
              <span style="font-family: Arial, Helvetica, sans-serif; font-size: 11px;">
                <strong style="font-size: 16px;">TECHNIQUE:<br></strong>
                <li style="">
                  <span style="font-size: 16px;">
                    ${result?.tech ? result?.tech : ''}
                  </span>
                  <br>
                </li>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      ${result?.body}`;
};

export default getBody;
