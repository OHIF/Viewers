import React from 'react';
import { UseFormClearErrors, UseFormRegister } from 'react-hook-form';
import { MrmcMmgReportData } from '../MrmcMmgReportForm';

type FieldPath =
  | keyof MrmcMmgReportData
  | `leftBreast.${number}.${keyof MrmcMmgReportData['leftBreast'][number]}`
  | `rightBreast.${number}.${keyof MrmcMmgReportData['rightBreast'][number]}`;

interface FormFieldProps {
  id: string;
  label: string;
  register: UseFormRegister<MrmcMmgReportData>;
  name: FieldPath;
  type?: 'text' | 'number' | 'select' | 'date' | 'textarea';
  required?: boolean;
  error?: string;
  min?: number;
  max?: number;
  step?: string;
  maxLength?: number;
  options?: { value: string | number; label: string }[];
  clearErrors?: UseFormClearErrors<MrmcMmgReportData>;
  disabled?: boolean;
  value?: string | null;
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
  maxLength,
  options,
  clearErrors,
  disabled = false,
  value = null,
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
          disabled={disabled}
        >
          <option
            value=""
            hidden
            disabled
            selected
          >
            Select {label}
          </option>
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          {...register(
            name,
            required
              ? {
                  required: 'This field is required.',
                }
              : {}
          )}
          className={inputClassName}
          style={{ backgroundColor: '#2A2A2A' }}
          rows={4}
          maxLength={maxLength}
          disabled={disabled}
          value={value}
        />
      ) : (
        <input
          id={id}
          type={type}
          {...register(
            name,
            required
              ? {
                  required: 'This field is required.',
                }
              : {}
          )}
          className={inputClassName}
          style={{ backgroundColor: '#2A2A2A' }}
          {...(min !== undefined && { min })}
          {...(max !== undefined && { max })}
          {...(step !== undefined && { step })}
          disabled={disabled}
          value={value}
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
