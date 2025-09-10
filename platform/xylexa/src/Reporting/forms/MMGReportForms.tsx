import React, { useCallback } from 'react';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { useGetMMGReport, useUpsertMMGReport } from '../../api-client';
import { FormField } from './components/FormField';
import { FormSection } from './components/FormSection';
import { BreastFeatureFields } from './components/BreastFeatureFields';
import { useToast } from '../../hooks';
import { useGetQueryParams } from '../../hooks/useGetQueryParams';
import { useNavigate } from 'react-router-dom';

export type Inputs = {
  email: string;
  password: string;
};

export type BreastFeatures = {
  uuid: string;
  lesion_size: string;
  lesion_locationOclock: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
  lesion_locationQuadrant:
    | 'Upper Outer Quadrant (UOQ)'
    | 'Upper Inner Quadrant (UIQ)'
    | 'Lower Outer Quadrant (LOQ)'
    | 'Lower Inner Quadrant (LIQ)'
    | 'Retro Areolar Region';
  lesion_type: 'mass' | 'calcification';
  mass_type?:
    | 'Cyst'
    | 'Round'
    | 'Oval'
    | 'Lobulated'
    | 'Spiculated'
    | 'Architectural distortion'
    | null;
  calcification_type?: 'Micro' | 'Macro' | 'Dystrophic' | null;
};

// Method to create an ID for BreastFeature objects
const generateGUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export type MMGReportData = {
  study_instance_id: string;
  patient_id: string;
  study_date: string;
  patient_age: string;
  image_type?: string;
  patient_history?: string;
  manufacturer?: string;
  case_assessment_time?: string;
  breast_density: 'Type A' | 'Type B' | 'Type C' | 'Type D';
  birad_scoreRight: '0' | '1' | '2' | '3' | '4' | '5' | '6';
  birad_scoreLeft: '0' | '1' | '2' | '3' | '4' | '5' | '6';
  patient_level_assessment: 'Normal' | 'Benign' | 'Malignant';
  right_breast: BreastFeatures[];
  left_breast: BreastFeatures[];
};

export type MMGReportFormProps = { setChangeInReportDetected: (boolean) => void };
export const MMGReportForm = ({ setChangeInReportDetected }: MMGReportFormProps) => {
  const [studyInstanceId, modality] = useGetQueryParams(window.location.search, [
    'studyInstanceId',
    'modality',
  ]);

  const isEditMode = () => {
    return window.location.pathname.split('/').includes('edit-report');
  };

  const navigate = useNavigate();

  const { data: report } = useGetMMGReport(studyInstanceId, modality === 'MG');

  const { mutate: upsertMMGReport } = useUpsertMMGReport();
  const { showToast } = useToast();
  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<MMGReportData>({
    values: report,
  });

  setChangeInReportDetected(isDirty);

  const {
    fields: leftBreastFields,
    append: appendLeftBreast,
    remove: removeLeftBreastField,
  } = useFieldArray({
    control,
    name: 'left_breast',
  });
  const {
    fields: rightBreastFields,
    append: appendRightBreast,
    remove: removeRightBreastField,
  } = useFieldArray({
    control,
    name: 'right_breast',
  });

  const onSubmit: SubmitHandler<MMGReportData> = data => {
    const formData: MMGReportData = { study_instance_id: studyInstanceId, ...data };

    upsertMMGReport(formData, {
      onSuccess: () => {
        showToast({
          content: 'Report Submitted Successfully',
          type: 'success',
        });
        navigate(`/report/view-report/?modality=${modality}&studyInstanceId=${studyInstanceId}`);
      },
      onError: error => {
        const fieldName = Object.keys(error.response.data)[0];
        setError(fieldName, { message: error.response.data[fieldName][0] });
      },
    });
  };

  const mouseHover = useCallback((event, color) => {
    event.currentTarget.style.backgroundColor = color;
  }, []);

  const appendLeftBreastCached = useCallback(
    () =>
      appendLeftBreast({
        uuid: generateGUID(),
        lesion_type: 'mass',
        lesion_locationQuadrant: 'Lower Inner Quadrant (LIQ)',
        calcification_type: null,
        mass_type: 'Architectural distortion',
        lesion_size: '0',
        lesion_locationOclock: '12',
      }),
    [appendLeftBreast]
  );

  const appendRightBreastCached = useCallback(
    () =>
      appendRightBreast({
        uuid: generateGUID(),
        calcification_type: null,
        lesion_locationQuadrant: 'Lower Inner Quadrant (LIQ)',
        lesion_type: 'calcification',
        mass_type: null,
        lesion_size: '0',
        lesion_locationOclock: '12',
      }),
    [appendRightBreast]
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        padding: '2rem',
        backgroundColor: '#121212',
        maxWidth: '70%',
        margin: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div
          className="rounded-lg p-6"
          style={{
            borderRadius: '0.5rem',
            padding: '1.5rem',
            backgroundColor: '#1E1E1E',
          }}
        >
          <h3 className="mb-4 text-xl font-medium text-gray-200">Patient Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormSection>
              <FormField
                id="patient_id"
                label="Patient ID"
                register={register}
                name="patient_id"
                error={errors?.patient_id?.message}
                required
              />
              <FormField
                id="patient_age"
                label="Patient Age"
                register={register}
                name="patient_age"
                error={errors.patient_age?.message}
                required
              />
            </FormSection>
          </div>
        </div>

        <div
          style={{
            borderRadius: '0.5rem',
            padding: '1.5rem',
            backgroundColor: '#1E1E1E',
          }}
        >
          <h3 className="mb-4 text-xl font-medium text-gray-200">Study Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormSection>
              <FormField
                id="study_date"
                label="Study Date"
                register={register}
                name="study_date"
                type="date"
                error={errors?.study_date?.message}
                required
              />
              <FormField
                id="breast_density"
                label="Breast Density"
                register={register}
                name="breast_density"
                type="select"
                error={errors?.breast_density?.message}
                options={[
                  { value: 'Type A', label: 'Type A' },
                  { value: 'Type B', label: 'Type B' },
                  { value: 'Type C', label: 'Type C' },
                  { value: 'Type D', label: 'Type D' },
                ]}
                required
              />
            </FormSection>

            <FormSection>
              <FormField
                id="image_type"
                label="Image Type"
                register={register}
                name="image_type"
              />
              <FormField
                id="patient_history"
                label="Patient History"
                register={register}
                name="patient_history"
              />
            </FormSection>

            <FormSection>
              <FormField
                id="manufacturer"
                label="Manufacturer"
                register={register}
                name="manufacturer"
              />
              <FormField
                id="case_assessment_time"
                label="Case Assessment Time"
                register={register}
                name="case_assessment_time"
              />
            </FormSection>
          </div>
        </div>

        <div
          style={{
            borderRadius: '0.5rem',
            padding: '1.5rem',
            backgroundColor: '#1E1E1E',
          }}
        >
          <h3 className="mb-4 text-xl font-medium text-gray-200">Assessment</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormSection>
              <FormField
                id="birad_scoreLeft"
                label="Left Breast BIRAD Score"
                register={register}
                name="birad_scoreLeft"
                type="select"
                error={errors?.birad_scoreLeft?.message}
                options={[
                  { value: '0', label: '0' },
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5' },
                  { value: '6', label: '6' },
                ]}
                required
              />
              <FormField
                id="birad_scoreRight"
                label="Right Breast BIRAD Score"
                register={register}
                name="birad_scoreRight"
                type="select"
                error={errors?.birad_scoreRight?.message}
                options={[
                  { value: '0', label: '0' },
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5' },
                  { value: '6', label: '6' },
                ]}
                required
              />
            </FormSection>
            <FormSection>
              <FormField
                id="patient_level_assessment"
                label="Patient Level Assessment"
                register={register}
                name="patient_level_assessment"
                type="select"
                error={errors?.patient_level_assessment?.message}
                options={[
                  { value: 'Normal', label: 'Normal' },
                  { value: 'Benign', label: 'Benign' },
                  { value: 'Malignant', label: 'Malignant' },
                ]}
                required
              />
            </FormSection>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              borderRadius: '0.5rem',
              padding: '1.5rem',
              backgroundColor: '#1E1E1E',
            }}
            className="bg-secondary rounded-lg p-6"
          >
            <div
              style={{
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 className="text-xl font-medium text-gray-200">Left Breast</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {leftBreastFields.map((field, index) => (
                <BreastFeatureFields
                  key={field.id}
                  register={register}
                  index={index}
                  errors={
                    errors?.left_breast && errors?.left_breast[index]
                      ? errors?.left_breast[index]
                      : errors
                  }
                  side="left"
                  onDelete={function () {
                    removeLeftBreastField(index);
                  }}
                  clearErrors={clearErrors}
                />
              ))}
              {leftBreastFields.length === 0 && (
                <p
                  className="text-center text-gray-500"
                  style={{
                    color: '#6b7280',
                  }}
                >
                  No findings added yet
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={appendLeftBreastCached}
                style={{
                  borderRadius: '0.375rem',
                  backgroundColor: '#3b82f6',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#e5e7eb',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={function (e) {
                  mouseHover(e, '#2563eb');
                }}
                onMouseOut={function (e) {
                  mouseHover(e, '#3b82f6');
                }}
              >
                Add Finding
              </button>
            </div>
          </div>

          <div
            style={{
              borderRadius: '0.5rem',
              padding: '1.5rem',
              backgroundColor: '#1E1E1E',
            }}
          >
            <div
              style={{
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#e5e7eb',
                }}
              >
                Right Breast
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rightBreastFields.map((field, index) => (
                <BreastFeatureFields
                  key={field.id}
                  register={register}
                  errors={
                    errors?.right_breast && errors.right_breast[index]
                      ? errors.right_breast[index]
                      : errors
                  }
                  index={index}
                  side="right"
                  onDelete={function () {
                    removeRightBreastField(index);
                  }}
                  clearErrors={clearErrors}
                />
              ))}
              {rightBreastFields.length === 0 && (
                <p
                  className="text-center text-gray-500"
                  style={{
                    color: '#6b7280',
                  }}
                >
                  No findings added yet
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={appendRightBreastCached}
                style={{
                  borderRadius: '0.375rem',
                  backgroundColor: '#3b82f6',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#e5e7eb',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={function (e) {
                  mouseHover(e, '#2563eb');
                }}
                onMouseOut={function (e) {
                  mouseHover(e, '#3b82f6');
                }}
              >
                Add Finding
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg px-6 py-3 font-medium text-gray-200 transition-colors duration-200"
          style={{
            width: '100%',
            borderRadius: '0.5rem',
            backgroundColor: !isDirty || isSubmitting ? '#4b5563' : '#16a34a',
            cursor: !isDirty || isSubmitting ? 'not-allowed' : 'pointer',
            padding: '0.75rem 1.5rem',
            fontWeight: '500',
            color: '#e5e7eb',
            transition: 'background-color 0.2s',
          }}
          disabled={!isDirty || isSubmitting}
        >
          {isEditMode() ? 'Update Report' : 'Submit Report'}
        </button>
      </div>
    </form>
  );
};
