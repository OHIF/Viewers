import { UserInfo } from '../../types';

const getFooter = (userInfo: UserInfo) => {
  return `<table style="border-collapse: collapse; width: 100%">
  <table style="border-collapse: collapse; width: 99.8797%">
    <tbody>
      <tr>
        <td style="width: 21.0843%; vertical-align: top">
          <span style="font-family: Arial, Helvetica, sans-serif"
            ><strong style="font-size: 16px">E-Signature:</strong></span
          >
        </td>
        <td style="width: 78.9157%; font-family: Arial, Helvetica, sans-serif, font-size: 13px">
         <i><input style="font-style: italic; background-color:rgba(0, 0, 0, 0); color:black; border: none; outline:none;" type="text" value=${userInfo.name} disabled></i>
        </td>
      </tr>
    </tbody>
  </table>
  <br>
  <br>
  <p>I confirm that I have independently interpreted the study cases in accordance with the protocol.<br>By providing my e-signature, I certify the accuracy of my evaluations and their legal validity.</p>`;
};

export default getFooter;
