import React, { useState, useEffect } from 'react';
import { Input } from '@ohif/ui-next';

/**
 * Props for the MultiLabelInput component
 */
interface MultiLabelInputProps {
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Additional CSS class name for the input field */
  className?: string;
  /** Array of labels to display */
  labels?: string[];
  /** Callback function called when labels are added or removed */
  onLabelsChange?: (labels: string[]) => void;
}

/**
 * A component that allows users to input and manage multiple text labels
 * @param props - Component props
 * @returns The MultiLabelInput component
 */
const MultiLabelInput: React.FC<MultiLabelInputProps> = ({
  placeholder = 'Enter a label and press Enter',
  className,
  labels = [],
  onLabelsChange,
}) => {
  // State for the current input value
  const [inputValue, setInputValue] = useState<string>('');
  // Internal state for labels that syncs with the external labels prop
  const [internalLabels, setInternalLabels] = useState<string[]>(labels);

  // Update internal labels when external labels change
  useEffect(() => {
    setInternalLabels(labels);
  }, [labels]);

  /**
   * Handles changes to the input field
   * @param e - The change event
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  /**
   * Adds the current input value as a new label if it's not empty and not a duplicate
   */
  const handleAddLabel = () => {
    if (inputValue.trim() && !internalLabels.includes(inputValue.trim())) {
      const newLabels = [...internalLabels, inputValue.trim()];
      setInternalLabels(newLabels);
      if (onLabelsChange) {
        onLabelsChange(newLabels);
      }
      setInputValue('');
    }
  };

  /**
   * Removes a label from the list
   * @param label - The label to remove
   */
  const handleRemoveLabel = (label: string) => {
    const newLabels = internalLabels.filter(l => l !== label);
    setInternalLabels(newLabels);
    if (onLabelsChange) {
      onLabelsChange(newLabels);
    }
  };

  /**
   * Handles key press events in the input field
   * @param e - The keyboard event
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddLabel();
    }
  };

  return (
    <div>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className={className}
      />
      <div>
        {internalLabels.map((label, index) => (
          <span key={index} className="label">
            {label}
            <button className="remove-btn" onClick={() => handleRemoveLabel(label)}>
              X
            </button>
          </span>
        ))}
      </div>
      <style>{`
        .label {
          background-color: #2a2a4a;
          color: #ffffff;
          padding: 5px 15px;
          margin: 5px;
          border-radius: 50px; /* Makes the label look like an ellipse */
          display: inline-flex;
          align-items: center;
        }

        .remove-btn {
          background-color: #1e3a8a; /* Dark blue color */
          color: white;
          border: none;
          margin-left: 10px;
          cursor: pointer;
          padding: 3px 8px;
          font-size: 12px;
          border-radius: 50%; /* Makes the "X" button circular */
        }

        .remove-btn:hover {
          background-color: #2563eb; /* Lighter blue on hover */
        }
      `}</style>
    </div>
  );
};

export default MultiLabelInput;
