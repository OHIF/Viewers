import React, { useEffect } from 'react';

import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useGetMMGReport, useUpsertMMGReport } from '../../api-client';
import { FormField } from './components/FormField';
import { FormSection } from './components/FormSection';
import { useToast } from '../../hooks';
import { useGetQueryParams } from '../../hooks/useGetQueryParams';

export type Inputs = {
  email: string;
  password: string;
};

export type MrmcMmgReportData = {
  case_id: string;
  birad_assessment: '1' | '2' | '3' | '4' | '5';
  breast_density: 'A' | 'B' | 'C' | 'D';
  recall: 'Yes' | 'No' | null;
  quadrant: 'UOQ' | 'UIQ' | 'LOQ' | 'LIQ' | null;
  comments: string;
};

export type MrmcMmgReportFormProps = { setChangeInReportDetected: (boolean) => void };
export const MrmcMmgReportForm = ({ setChangeInReportDetected }: MrmcMmgReportFormProps) => {
  const [studyInstanceId, modality] = useGetQueryParams(window.location.search, [
    'studyInstanceId',
    'modality',
  ]);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const isEditMode = () => {
    return window.location.pathname.split('/').includes('edit-report');
  };

  const { data: report } = useGetMMGReport(studyInstanceId, modality === 'MG');

  const { mutate: upsertMMGReport } = useUpsertMMGReport();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<MrmcMmgReportData>({
    values: report,
    defaultValues: {
      recall: null,
      quadrant: null,
    },
  });

  const birad_assessment = watch('birad_assessment');
  const recall = watch('recall');

  useEffect(() => {
    if (birad_assessment === '1' || birad_assessment === '2' || birad_assessment === '3') {
      setValue('recall', null);
      setValue('quadrant', null);
    }
    if (recall === 'No') {
      setValue('quadrant', null);
    }
  }, [birad_assessment, setValue, recall]);

  setChangeInReportDetected(isDirty);

  const onSubmit: SubmitHandler<MrmcMmgReportData> = data => {
    const formData: MrmcMmgReportData = data;

    upsertMMGReport(formData, {
      onSuccess: () => {
        showToast({
          content: 'Report Submitted Successfully',
          type: 'success',
        });
        navigate(`/report/view-report/?modality=${modality}&studyInstanceId=${studyInstanceId}`);
      },
      onError: error => {
        const fieldName = Object.keys(error.response.data)[0] as keyof MrmcMmgReportData;
        setError(fieldName, { message: error.response.data[fieldName][0] });
      },
    });
  };

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
                id="study_instance_id"
                label="Case Id"
                register={register}
                name="study_instance_id"
                type="text"
                disabled={true}
                value={studyInstanceId}
              />
              <FormField
                id="breast_density"
                label="Breast Density"
                register={register}
                name="breast_density"
                type="select"
                error={errors?.breast_density?.message}
                options={[
                  { value: 'A', label: 'A' },
                  { value: 'B', label: 'B' },
                  { value: 'C', label: 'C' },
                  { value: 'D', label: 'D' },
                ]}
                required
              />
            </FormSection>

            <FormField
              id="birad_assessment"
              label="BI-RADS Assessment"
              register={register}
              name="birad_assessment"
              type="select"
              error={errors?.birad_assessment?.message}
              options={[
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
                { value: '5', label: '5' },
              ]}
              required
            />
            {(birad_assessment === '4' || birad_assessment === '5' || report?.birad_assessment) && (
              <FormField
                id="recall"
                label="Recall"
                register={register}
                name="recall"
                type="select"
                error={errors?.recall?.message}
                options={[
                  { value: 'Yes', label: 'Yes' },
                  { value: 'No', label: 'No' },
                ]}
                required={birad_assessment === '4' || birad_assessment === '5' ? true : false}
              />
            )}

            {(recall === 'Yes' || report?.recall) &&
              (birad_assessment === '4' ||
                birad_assessment === '5' ||
                report?.birad_assessment) && (
                <FormField
                  id="quadrant"
                  label="Quadrant"
                  register={register}
                  name="quadrant"
                  type="select"
                  error={errors?.quadrant?.message}
                  options={[
                    { value: 'UOQ', label: 'UOQ' },
                    { value: 'UIQ', label: 'UIQ' },
                    { value: 'LOQ', label: 'LOQ' },
                    { value: 'LIQ', label: 'LIQ' },
                  ]}
                  required={
                    (recall === 'Yes' || report?.recall) &&
                    (birad_assessment === '4' || birad_assessment === '5')
                      ? true
                      : false
                  }
                />
              )}

            <FormField
              id="comments"
              label="Comments"
              register={register}
              name="comments"
              type="textarea"
              maxLength={200}
              error={errors?.comments?.message}
            />
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
