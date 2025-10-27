import React, { useState } from 'react';

interface ToothSelectorProps {
  onToothSelect?: (toothNumber: string, system: 'FDI' | 'Universal', selected?: any) => void;
  selectedTooth?: string;
  numberingSystem?: 'FDI' | 'Universal';
}

// FDI (Fédération Dentaire Internationale) numbering system
// Permanent teeth: 11-18 (upper right), 21-28 (upper left), 31-38 (lower left), 41-48 (lower right)
// Primary teeth: 51-55 (upper right), 61-65 (upper left), 71-75 (lower left), 81-85 (lower right)
const FDI_PermanentTeeth = [
  // Upper jaw
  { number: '18', position: 'upper-right', name: 'Wisdom Tooth' },
  { number: '17', position: 'upper-right', name: 'Molar' },
  { number: '16', position: 'upper-right', name: 'Molar' },
  { number: '15', position: 'upper-right', name: 'Premolar' },
  { number: '14', position: 'upper-right', name: 'Premolar' },
  { number: '13', position: 'upper-right', name: 'Canine' },
  { number: '12', position: 'upper-right', name: 'Incisor' },
  { number: '11', position: 'upper-right', name: 'Central Incisor' },
  { number: '21', position: 'upper-left', name: 'Central Incisor' },
  { number: '22', position: 'upper-left', name: 'Incisor' },
  { number: '23', position: 'upper-left', name: 'Canine' },
  { number: '24', position: 'upper-left', name: 'Premolar' },
  { number: '25', position: 'upper-left', name: 'Premolar' },
  { number: '26', position: 'upper-left', name: 'Molar' },
  { number: '27', position: 'upper-left', name: 'Molar' },
  { number: '28', position: 'upper-left', name: 'Wisdom Tooth' },
  // Lower jaw
  { number: '38', position: 'lower-left', name: 'Wisdom Tooth' },
  { number: '37', position: 'lower-left', name: 'Molar' },
  { number: '36', position: 'lower-left', name: 'Molar' },
  { number: '35', position: 'lower-left', name: 'Premolar' },
  { number: '34', position: 'lower-left', name: 'Premolar' },
  { number: '33', position: 'lower-left', name: 'Canine' },
  { number: '32', position: 'lower-left', name: 'Incisor' },
  { number: '31', position: 'lower-left', name: 'Central Incisor' },
  { number: '41', position: 'lower-right', name: 'Central Incisor' },
  { number: '42', position: 'lower-right', name: 'Incisor' },
  { number: '43', position: 'lower-right', name: 'Canine' },
  { number: '44', position: 'lower-right', name: 'Premolar' },
  { number: '45', position: 'lower-right', name: 'Premolar' },
  { number: '46', position: 'lower-right', name: 'Molar' },
  { number: '47', position: 'lower-right', name: 'Molar' },
  { number: '48', position: 'lower-right', name: 'Wisdom Tooth' },
];

// Universal numbering system (1-32 for permanent teeth)
const Universal_PermanentTeeth = [
  // Upper jaw (right to left)
  { number: '1', position: 'upper-right', name: 'Wisdom Tooth' },
  { number: '2', position: 'upper-right', name: 'Molar' },
  { number: '3', position: 'upper-right', name: 'Molar' },
  { number: '4', position: 'upper-right', name: 'Premolar' },
  { number: '5', position: 'upper-right', name: 'Premolar' },
  { number: '6', position: 'upper-right', name: 'Canine' },
  { number: '7', position: 'upper-right', name: 'Incisor' },
  { number: '8', position: 'upper-right', name: 'Central Incisor' },
  { number: '9', position: 'upper-left', name: 'Central Incisor' },
  { number: '10', position: 'upper-left', name: 'Incisor' },
  { number: '11', position: 'upper-left', name: 'Canine' },
  { number: '12', position: 'upper-left', name: 'Premolar' },
  { number: '13', position: 'upper-left', name: 'Premolar' },
  { number: '14', position: 'upper-left', name: 'Molar' },
  { number: '15', position: 'upper-left', name: 'Molar' },
  { number: '16', position: 'upper-left', name: 'Wisdom Tooth' },
  // Lower jaw (left to right)
  { number: '17', position: 'lower-left', name: 'Wisdom Tooth' },
  { number: '18', position: 'lower-left', name: 'Molar' },
  { number: '19', position: 'lower-left', name: 'Molar' },
  { number: '20', position: 'lower-left', name: 'Premolar' },
  { number: '21', position: 'lower-left', name: 'Premolar' },
  { number: '22', position: 'lower-left', name: 'Canine' },
  { number: '23', position: 'lower-left', name: 'Incisor' },
  { number: '24', position: 'lower-left', name: 'Central Incisor' },
  { number: '25', position: 'lower-right', name: 'Central Incisor' },
  { number: '26', position: 'lower-right', name: 'Incisor' },
  { number: '27', position: 'lower-right', name: 'Canine' },
  { number: '28', position: 'lower-right', name: 'Premolar' },
  { number: '29', position: 'lower-right', name: 'Premolar' },
  { number: '30', position: 'lower-right', name: 'Molar' },
  { number: '31', position: 'lower-right', name: 'Molar' },
  { number: '32', position: 'lower-right', name: 'Wisdom Tooth' },
];

function ToothSelector({
  onToothSelect,
  selectedTooth,
  numberingSystem = 'FDI',
}: ToothSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const teeth = numberingSystem === 'FDI' ? FDI_PermanentTeeth : Universal_PermanentTeeth;

  const handleToothClick = (toothNumber: string, selected?: any) => {
    onToothSelect?.(toothNumber, numberingSystem, selected);
    setIsOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getToothPosition = (position: string) => {
    switch (position) {
      case 'upper-right':
        return { gridArea: '1 / 1' };
      case 'upper-left':
        return { gridArea: '1 / 2' };
      case 'lower-left':
        return { gridArea: '2 / 1' };
      case 'lower-right':
        return { gridArea: '2 / 2' };
      default:
        return {};
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="tooth-selector-button flex items-center space-x-2 rounded-lg border px-4 py-2 transition-all duration-200"
      >
        <span className="text-lg">🦷</span>
        <span className="font-medium">
          {selectedTooth ? `Tooth ${selectedTooth}` : 'Select Tooth'}
        </span>
        <span
          className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="tooth-modal absolute top-full right-0 z-50 mt-2 min-w-[500px] rounded-lg border p-6 shadow-xl">
          <div className="mb-6 text-center">
            <h3 className="modal-title mb-2 text-xl font-bold">
              {numberingSystem} Numbering System
            </h3>
            <p className="modal-description text-sm">
              {numberingSystem === 'FDI'
                ? 'FDI uses 2-digit numbers (11-18, 21-28, 31-38, 41-48)'
                : 'Universal uses single numbers (1-32)'}
            </p>
          </div>

          {/* Dental Chart Grid */}
          <div className="mb-6 grid grid-cols-2 gap-6">
            {/* Upper Right Quadrant */}
            <div className="text-center">
              <div className="quadrant-label mb-3 text-sm font-semibold">Upper Right</div>
              <div className="grid grid-cols-4 gap-2">
                {teeth
                  .filter(tooth => tooth.position === 'upper-right')
                  .map(tooth => (
                    <button
                      key={tooth.number}
                      onClick={() => handleToothClick(tooth.number, tooth)}
                      className={`tooth-button h-12 w-12 rounded-lg border-2 text-sm font-bold transition-all duration-200 hover:scale-105 ${
                        selectedTooth === tooth.number ? 'selected' : ''
                      }`}
                      title={tooth.name}
                    >
                      {tooth.number}
                    </button>
                  ))}
              </div>
            </div>

            {/* Upper Left Quadrant */}
            <div className="text-center">
              <div className="quadrant-label mb-3 text-sm font-semibold">Upper Left</div>
              <div className="grid grid-cols-4 gap-2">
                {teeth
                  .filter(tooth => tooth.position === 'upper-left')
                  .map(tooth => (
                    <button
                      key={tooth.number}
                      onClick={() => handleToothClick(tooth.number, tooth)}
                      className={`tooth-button h-12 w-12 rounded-lg border-2 text-sm font-bold transition-all duration-200 hover:scale-105 ${
                        selectedTooth === tooth.number ? 'selected' : ''
                      }`}
                      title={tooth.name}
                    >
                      {tooth.number}
                    </button>
                  ))}
              </div>
            </div>

            {/* Lower Left Quadrant */}
            <div className="text-center">
              <div className="quadrant-label mb-3 text-sm font-semibold">Lower Left</div>
              <div className="grid grid-cols-4 gap-2">
                {teeth
                  .filter(tooth => tooth.position === 'lower-left')
                  .map(tooth => (
                    <button
                      key={tooth.number}
                      onClick={() => handleToothClick(tooth.number, tooth)}
                      className={`tooth-button h-12 w-12 rounded-lg border-2 text-sm font-bold transition-all duration-200 hover:scale-105 ${
                        selectedTooth === tooth.number ? 'selected' : ''
                      }`}
                      title={tooth.name}
                    >
                      {tooth.number}
                    </button>
                  ))}
              </div>
            </div>

            {/* Lower Right Quadrant */}
            <div className="text-center">
              <div className="quadrant-label mb-3 text-sm font-semibold">Lower Right</div>
              <div className="grid grid-cols-4 gap-2">
                {teeth
                  .filter(tooth => tooth.position === 'lower-right')
                  .map(tooth => (
                    <button
                      key={tooth.number}
                      onClick={() => handleToothClick(tooth.number, tooth)}
                      className={`tooth-button h-12 w-12 rounded-lg border-2 text-sm font-bold transition-all duration-200 hover:scale-105 ${
                        selectedTooth === tooth.number ? 'selected' : ''
                      }`}
                      title={tooth.name}
                    >
                      {tooth.number}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <button
              onClick={() => handleToothClick('')}
              className="action-button text-sm font-medium transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="close-button rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ToothSelector;
