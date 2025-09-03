import React from 'react';
import { UseFormClearErrors, UseFormRegister } from 'react-hook-form';
import { MMGReportData } from '../mmg-report-form';

type FieldPath =
  | keyof MMGReportData
  | `leftBreast.${number}.${keyof MMGReportData['leftBreast'][number]}`
  | `rightBreast.${number}.${keyof MMGReportData['rightBreast'][number]}`;

interface FormFieldProps {
  id: string;
  label: string;
  register: UseFormRegister<MMGReportData>;
  name: FieldPath;
  type?: 'text' | 'number' | 'select' | 'date';
  required?: boolean;
  error?: string;
  min?: number;
  max?: number;
  step?: string;
  options?: { value: string | number; label: string }[];
  clearErrors?: UseFormClearErrors<MMGReportData>;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  register,
  name,
  type = 'text',
  required = false,
  error,
  min,
  max,
  step,
  options,
  clearErrors,
}) => {
  const inputClassName =
    'w-full rounded-md text-gray-200 placeholder-[#B0B0B0] px-3 py-2 shadow-sm transition-colors focus:border-[#BB86FC] focus:outline-none focus:ring-1 focus:ring-[#BB86FC]';
  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-gray-200"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {type === 'select' && options ? (
        <select
          id={id}
          {...register(name, required ? { required: 'This field is required.' } : {})}
          className={inputClassName}
          style={{ backgroundColor: '#2A2A2A' }}
        >
          <option value="">Select {label}</option>
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          {...register(
            name,
            required
              ? {
                  required: 'This field is required.',
                  onChange:
                    name?.split('.').includes('lesion_locationOclock') ||
                    name?.split('.').includes('lesion_size')
                      ? () => clearErrors(undefined)
                      : undefined,
                }
              : {}
          )}
          className={inputClassName}
          style={{ backgroundColor: '#2A2A2A' }}
          {...(min !== undefined && { min })}
          {...(max !== undefined && { max })}
          {...(step !== undefined && { step })}
        />
      )}
      {error && (
        <p
          className="mt-1 text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
