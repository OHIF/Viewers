import { Badge } from '../Badge';
import { Button } from '../Button';
import { cn } from '../../lib/utils';
import { XIcon } from 'lucide-react';
import React, { forwardRef, useEffect, useState } from 'react';
import type { z } from 'zod';

const parseTagOpt = (params: { tag: string; tagValidator: z.ZodString }) => {
  const { tag, tagValidator } = params;
  const parsedTag = tagValidator.safeParse(tag);

  if (parsedTag.success) {
    return parsedTag.data;
  }

  return null;
};

// Define the InputProps type
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

type TagInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: readonly string[];
  onChange: (value: readonly string[]) => void;
  tagValidator?: z.ZodString;
};

const TagInput = forwardRef<HTMLInputElement, TagInputProps>((props, ref) => {
  const { className, value = [], onChange, tagValidator, ...domProps } = props;

  const [pendingDataPoint, setPendingDataPoint] = useState('');

  useEffect(() => {
    if (pendingDataPoint.includes(',')) {
      // Split by comma and filter/map in one pass
      const newTags = pendingDataPoint
        .split(',')
        .map(x => x.trim())
        .filter(x => x.length > 0)
        .map(trimmedX => {
          if (tagValidator) {
            const validatedTag = parseTagOpt({ tag: trimmedX, tagValidator });
            return validatedTag;
          }
          return trimmedX;
        })
        .filter(Boolean) as string[]; // Type assertion to resolve the string | null issue

      // Create a Set to remove duplicates and combine with existing values
      const newDataPoints = new Set([...value, ...newTags]);
      onChange([...newDataPoints]);
      setPendingDataPoint('');
    }
  }, [pendingDataPoint, onChange, value, tagValidator]);

  const addPendingDataPoint = () => {
    if (pendingDataPoint) {
      if (tagValidator) {
        const validatedTag = parseTagOpt({ tag: pendingDataPoint, tagValidator });
        if (validatedTag) {
          const newDataPoints = new Set([...value, validatedTag]);
          onChange([...newDataPoints]);
          setPendingDataPoint('');
        }
      } else {
        const newDataPoints = new Set([...value, pendingDataPoint]);
        onChange([...newDataPoints]);
        setPendingDataPoint('');
      }
    }
  };

  return (
    <div
      className={cn(
        'border-input text-foreground bg-background hover:bg-primary/10 min-h-7 focus-within:ring-ring flex h-auto w-full flex-wrap gap-1.5 rounded border px-2 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium focus-within:outline-none focus-within:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {value.map(item => (
        <Badge
          key={item}
          variant={'default'}
          className="my-0.5 h-5 py-0 px-1.5"
        >
          {item}
          <Button
            type="button"
            variant={'ghost'}
            size={'icon'}
            className={'ml-1 h-3.5 w-3.5 p-0'}
            onClick={() => {
              onChange(value.filter(i => i !== item));
            }}
          >
            <XIcon className={'w-3'} />
          </Button>
        </Badge>
      ))}
      <input
        className={'placeholder:text-muted-foreground flex-1 bg-transparent text-base outline-none'}
        value={pendingDataPoint}
        onChange={e => setPendingDataPoint(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addPendingDataPoint();
          } else if (e.key === 'Backspace' && pendingDataPoint.length === 0 && value.length > 0) {
            e.preventDefault();
            onChange(value.slice(0, -1));
          }
        }}
        {...domProps}
        ref={ref}
      />
    </div>
  );
});

TagInput.displayName = 'TagInput';

export { TagInput };
