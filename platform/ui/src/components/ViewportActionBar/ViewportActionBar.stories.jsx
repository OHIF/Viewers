import React from 'react'
import ViewportActionBar from './ViewportActionBar'

export default {
  component: ViewportActionBar,
  title: 'Components/ViewportActionBar',
}

export const Default = () => (
  <div className="w-1/2 p-4 h-64">
  <ViewportActionBar
    onSeriesChange={direction => alert(`Series ${direction}`)}
    studyData={{
      label: 'A',
      isTracked: false,
      isLocked: false,
      isRehydratable: true,
      studyDate: '07-Sep-2010',
      currentSeries: 1,
      seriesDescription:
        'Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit ',
      modality: 'CT',
      patientInformation: {
        patientName: 'Smith, Jane',
        patientSex: 'F',
        patientAge: '59',
        MRN: '10000001',
        thickness: '2.0mm',
        spacing: '1.25mm',
        scanner: 'Aquilion',
      },
    }}
  />
</div>
)
