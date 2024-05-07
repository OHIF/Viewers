export const TemplateHeader = (patDetaills) => {
  return `
      <p>
        <p style="border: 1px solid; display: flex">
          <strong>Patient Name:</strong> ${patDetaills?.po_pat_name}   <strong>Sex / Age:</strong> ${patDetaills?.po_pat_sex} / 30
        </p>
      </p>`
}
