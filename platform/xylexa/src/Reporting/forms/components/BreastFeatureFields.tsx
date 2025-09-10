import React from 'react';
import { Ref, UseFormClearErrors, UseFormRegister } from 'react-hook-form';
import { FormField } from './FormField';
import { MMGReportData } from '../MMGReportForms';

const LESION_TYPE_OPTIONS = [
  { value: 'mass', label: 'Mass' },
  { value: 'calcification', label: 'Calcification' },
];

const MASS_TYPE_OPTIONS = [
  { value: 'Cyst', label: 'Cyst' },
  { value: 'Round', label: 'Round' },
  { value: 'Oval', label: 'Oval' },
  { value: 'Lobulated', label: 'Lobulated' },
  { value: 'Spiculated', label: 'Spiculated' },
  { value: 'Architectural distortion', label: 'Architectural distortion' },
];

const CALCIFICATION_TYPE_OPTIONS = [
  { value: 'Micro', label: 'Micro' },
  { value: 'Macro', label: 'Macro' },
  { value: 'Dystrophic', label: 'Dystrophic' },
];

const QUADRANT_OPTIONS = [
  { value: 'Upper Outer Quadrant (UOQ)', label: 'Upper Outer Quadrant (UOQ)' },
  { value: 'Upper Inner Quadrant (UIQ)', label: 'Upper Inner Quadrant (UIQ)' },
  { value: 'Lower Outer Quadrant (LOQ)', label: 'Lower Outer Quadrant (LOQ)' },
  { value: 'Lower Inner Quadrant (LIQ)', label: 'Lower Inner Quadrant (LIQ)' },
  { value: 'Retro Areolar Region', label: 'Retro Areolar Region' },
];

interface BreastFeatureFieldsProps {
  register: UseFormRegister<MMGReportData>;
  index: number;
  side: 'left' | 'right';
  errors: {
    lesion_size: { type: 'required'; message: string; ref: Ref };
    lesion_locationOclock: { type: 'required'; message: string; ref: Ref };
    lesion_locationQuadrant: { type: 'required'; message: string; ref: Ref };
    lesion_type: { type: 'required'; message: string; ref: Ref };
  } | null;
  onDelete: () => void;
  clearErrors?: UseFormClearErrors<MMGReportData>;
}

export const BreastFeatureFields: React.FC<BreastFeatureFieldsProps> = ({
  register,
  index,
  side,
  errors,
  onDelete,
  clearErrors,
}) => {
  const prefix = `${side}_breast.${index}` as const;

  return (
    <div className="relative rounded-lg p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
        <h4 className="text-md font-medium text-gray-200">Finding #{index + 1}</h4>
        <button
          className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:text-red-200"
          onClick={onDelete}
          type="button"
        >
          Remove
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            id={`${prefix}.lesion_size`}
            label="Lesion Size"
            register={register}
            name={`${prefix}.lesion_size`}
            step="0.1"
            error={errors?.lesion_size?.message}
            clearErrors={clearErrors}
            required
          />
          <FormField
            id={`${prefix}.lesion_locationOclock`}
            label="Location (O'clock)"
            register={register}
            name={`${prefix}.lesion_locationOclock`}
            error={errors?.lesion_locationOclock?.message}
            min={1}
            max={12}
            required
            clearErrors={clearErrors}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            id={`${prefix}.lesion_locationQuadrant`}
            label="Quadrant"
            register={register}
            name={`${prefix}.lesion_locationQuadrant`}
            type="select"
            options={QUADRANT_OPTIONS}
            error={errors?.lesion_locationQuadrant?.message}
            required
          />
          <FormField
            id={`${prefix}.lesion_type`}
            label="Lesion Type"
            register={register}
            name={`${prefix}.lesion_type`}
            type="select"
            options={LESION_TYPE_OPTIONS}
            error={errors?.lesion_type?.message}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            id={`${prefix}.mass_type`}
            label="Mass Type"
            register={register}
            name={`${prefix}.mass_type`}
            type="select"
            options={MASS_TYPE_OPTIONS}
          />
          <FormField
            id={`${prefix}.calcification_type`}
            label="Calcification Type"
            register={register}
            name={`${prefix}.calcification_type`}
            type="select"
            options={CALCIFICATION_TYPE_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
};
