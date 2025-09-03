function formatDate(dateString) {
  const year = dateString?.slice(0, 4);
  const month = dateString?.slice(4, 6);
  const day = dateString?.slice(6, 8);

  return `${year}-${month}-${day}`;
}

function getHeader(userInfo, logo) {
  const formattedDate = formatDate(userInfo?.date);
  return `<table
  style="
    border-collapse: collapse;
    font-family: Arial, Helvetica, sans-serif;
    width: 100%;
    text-align: center;
  "
>
  <tbody>
    <tr>
      <td style="width: 19.2956%">
        <img
          src=${require(`../clientLogos/xylexaMono.png`).default}
          style="width: 90px; height: auto"
        /><br />
      </td>
      <td style="width: 100%; text-align: center; line-height: 1">
        <span style="font-size: 30px"
          ><strong style=""
            ><span style="font-size: 30px">Xylexa Patient Report</span><br /><span
              style="font-size: 16px"
              >Location: 9838 Townsville Circle, Suite 202, Highlands Ranch, CO, 80130, USA<br />Phone:&nbsp;+1
              (720) 569-9296&nbsp;|&nbsp;+92 333 4506666
            </span></strong
          ></span
        ><br />
      </td>
    </tr>
  </tbody>
</table>
<p><br /></p>
<hr />
<br />
<table style="border-collapse: collapse; width: 100%">
  <tbody>
    <tr>
      <td style="width: 24.9769%">
        <span style="font-family: Arial, Helvetica, sans-serif"><strong>Patient ID</strong></span>
      </td>
      <td style="width: 25.0231%">
      <input style="background-color:rgba(0, 0, 0, 0); color:black; border: none; outline:none;" type="text" value=${userInfo?.mrn ? userInfo?.mrn : ''} disabled>

      <br /></td>
      <td style="width: 24.9769%; text-align: left">
        <span style="font-family: Arial, Helvetica, sans-serif"><strong>Patient Age</strong></span>
      </td>

      <td style="width: 24.9769%">
      ${userInfo?.age ? userInfo?.age : ''}
      <br /></td>
    </tr>
    <tr>
      <td style="width: 24.9769%"><strong>Study Date</strong></td>
      <td>
       <input style="background-color:rgba(0, 0, 0, 0); color:black; border: none; outline:none;" type="text" value=${formattedDate ? formattedDate : ''} disabled>
      <br /></td>
      <td style="width: 24.9769%; text-align: left">
        <span style="font-family: Arial, Helvetica, sans-serif"><strong>Image Type</strong></span>
      </td>
      <td style="width: 24.9769%">
       <input style="background-color:rgba(0, 0, 0, 0); color:black; border: none; outline:none;" type="text" value=${userInfo?.modalities ? userInfo?.modalities : ''} disabled>
      <br /></td>
    </tr>
    <tr>
      <td style="width: 24.9769%">
        <span style="font-family: Arial, Helvetica, sans-serif"
          ><span style="font-size: 16px"><strong>Manufacturer</strong></span></span
        ><br />
      </td>
      <td colspan="3"><br /></td>
    </tr>

    <tr>
      <td style="width: 24.9769%">
        <span style="font-family: Arial, Helvetica, sans-serif"
          ><span style="font-size: 16px"><strong>Case Assessment Time</strong></span></span
        >
      </td>
      <td colspan="3"><br /></td>
    </tr>
  </tbody>
</table>
<hr>
`;
}
export default getHeader;
