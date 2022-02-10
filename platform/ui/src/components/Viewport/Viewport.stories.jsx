import React from 'react'
import Viewport from './Viewport'

export default {
  component: Viewport,
  title: 'Components/Viewport',
}

export const Default = () => (
  <div className="w-1/2 p-4 h-screen">
  <Viewport
    viewportIndex={0}
    onSeriesChange={direction => alert(`Series ${direction}`)}
    studyData={{
      label: 'A',
      isTracked: true,
      isLocked: false,
      isRehydratable: false,
      studyDate: '07-Sep-2011',
      currentSeries: 1,
      seriesDescription:
        'Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit ',
      modality: 'CT',
      patientInformation: {
        patientName: 'Smith, Jane',
        patientSex: 'F',
        patientAge: '59',
        MRN: '10000001',
        thickness: '5.0mm',
        spacing: '1.25mm',
        scanner: 'Aquilion',
      },
    }}
  >
    <div className="flex justify-center items-center h-full">CONTENT</div>
  </Viewport>
</div>
)
