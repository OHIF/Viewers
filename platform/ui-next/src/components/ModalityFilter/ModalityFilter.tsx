import React, { useRef, useState, useLayoutEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover/Popover';
import { Icons } from '../Icons';

const CHAR_PX = 7;
const BADGE_H_PAD = 8;
const BADGE_GAP = 6;
const estimateBadgeW = (text: string) => text.length * CHAR_PX + BADGE_H_PAD;

const getModalityBg = (mod: string): string => {
  const m = (mod || '').trim().toUpperCase();
  if (m === 'CT') return '#8b5cf6';
  if (m === 'XR' || m === 'CR' || m === 'DX') return '#ec4899';
  if (m === 'MR') return '#3b82f6';
  if (m === 'US') return '#10b981';
  if (m === 'PT' || m === 'PET') return '#f59e0b';
  if (m === 'NM') return '#f97316';
  if (m === 'MG') return '#14b8a6';
  if (m === 'SR') return '#a78bfa';
  return '#6b7280';
};

interface ModalityFilterProps {
  modalities: string[];
  /** null = "Toutes" (pas de filtre) */
  selectedModalities: string[] | null;
  onApply: (modalities: string[] | null) => void;
}

export function ModalityFilter({ modalities, selectedModalities, onApply }: ModalityFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(modalities.length);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Pendantes dans le popover (avant Apply)
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingSelection, setPendingSelection] = useState<string[]>(
    selectedModalities ?? modalities
  );

  // Quand selectedModalities change de l'extérieur, sync le pending
  React.useEffect(() => {
    setPendingSelection(selectedModalities ?? modalities);
  }, [selectedModalities, modalities]);

  // Calcule combien de badges tiennent dans le container
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      const totalW = containerRef.current!.clientWidth;
      // "Toutes" bouton ~ 64px + gap
      const toutesW = 64 + BADGE_GAP;
      let used = toutesW;
      let count = 0;

      for (let i = 0; i < modalities.length; i++) {
        const bw = estimateBadgeW(modalities[i]) + BADGE_GAP;
        const overflowBadgeW = i < modalities.length - 1 ? estimateBadgeW('+99') + BADGE_GAP : 0;
        if (used + bw + overflowBadgeW > totalW) break;
        used += bw;
        count++;
      }
      setVisibleCount(count);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    measure();
    return () => ro.disconnect();
  }, [modalities]);

  const visibleModalities = modalities.slice(0, visibleCount);
  const hiddenCount = modalities.length - visibleCount;
  const isAllSelected = selectedModalities === null;

  const filteredModalities = modalities.filter(m =>
    m.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePending = useCallback((mod: string) => {
    setPendingSelection(prev =>
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setPendingSelection([...modalities]);
  }, [modalities]);

  const handleDeselectAll = useCallback(() => {
    setPendingSelection([]);
  }, []);

  const handleApply = useCallback(() => {
    const allSelected =
      pendingSelection.length === modalities.length &&
      modalities.every(m => pendingSelection.includes(m));
    onApply(allSelected ? null : pendingSelection);
    setPopoverOpen(false);
  }, [pendingSelection, modalities, onApply]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // reset pending à l'état courant
      setPendingSelection(selectedModalities ?? modalities);
      setSearchQuery('');
    }
    setPopoverOpen(open);
  };

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div className="flex w-full items-center gap-[6px] overflow-hidden rounded-[6px] bg-[#3a3a3a] px-[6px] py-[5px]">
      {/* Bouton "Toutes" */}
      <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            onClick={() => handleOpenChange(!popoverOpen)}
            className={`flex h-[26px] shrink-0 items-center rounded px-[10px] text-[12px] font-semibold transition-colors ${
              isAllSelected
                ? 'bg-[#0076F7] text-white'
                : 'bg-[#4a4a4a] text-white hover:bg-[#555]'
            }`}
          >
            Toutes
          </button>
        </PopoverTrigger>

        {/* Badges des modalités visibles */}
        {visibleModalities.map(mod => {
          const isSelected = !isAllSelected && selectedModalities?.includes(mod);
          return (
            <button
              key={mod}
              onClick={() => {
                const newSel = selectedModalities
                  ? selectedModalities.includes(mod)
                    ? selectedModalities.filter(m => m !== mod)
                    : [...selectedModalities, mod]
                  : modalities.filter(m => m !== mod);
                const allSel =
                  newSel.length === modalities.length &&
                  modalities.every(m => newSel.includes(m));
                onApply(allSel ? null : newSel.length === 0 ? [] : newSel);
              }}
              className={`inline-flex h-[26px] shrink-0 items-center rounded px-[8px] font-['Inter'] text-[11px] font-semibold uppercase transition-colors ${
                isAllSelected || isSelected ? 'text-white' : 'opacity-40 text-white'
              }`}
              style={{ backgroundColor: getModalityBg(mod) }}
              title={mod}
            >
              {mod}
            </button>
          );
        })}

        {/* +N overflow */}
        {hiddenCount > 0 && (
          <button
            onClick={() => handleOpenChange(true)}
            className="inline-flex h-[26px] shrink-0 items-center rounded bg-[#555] px-[8px] font-['Inter'] text-[11px] font-semibold text-white hover:bg-[#666]"
          >
            +{hiddenCount}
          </button>
        )}

        {/* Dropdown popover */}
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-50 w-[260px] rounded-[8px] border-0 bg-[#272727] p-0 shadow-xl"
        >
          {/* Barre de recherche */}
          <div className="relative px-[10px] pt-[10px] pb-[6px]">
            <div className="flex items-center gap-[8px] rounded bg-[#3a3a3a] px-[10px] py-[6px]">
              <Icons.Search className="h-[14px] w-[14px] shrink-0 text-[#888]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-white placeholder-[#888] outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#888] hover:text-white">
                  <Icons.Cancel className="h-[12px] w-[12px]" />
                </button>
              )}
            </div>
          </div>

          {/* Tout sélectionner */}
          <div className="border-b border-[#3a3a3a] px-[10px] py-[8px]">
            <label className="flex cursor-pointer items-center gap-[10px]">
              <input
                type="checkbox"
                checked={
                  pendingSelection.length === modalities.length &&
                  modalities.every(m => pendingSelection.includes(m))
                }
                onChange={e => (e.target.checked ? handleSelectAll() : handleDeselectAll())}
                className="h-[16px] w-[16px] cursor-pointer accent-[#0076F7]"
              />
              <span className="text-[13px] font-semibold text-white">Tout sélectionner</span>
            </label>
          </div>

          {/* Liste des modalités */}
          <div className="max-h-[220px] overflow-y-auto">
            {filteredModalities.map(mod => (
              <label
                key={mod}
                className="flex cursor-pointer items-center gap-[10px] px-[10px] py-[7px] hover:bg-[#3a3a3a]"
              >
                <input
                  type="checkbox"
                  checked={pendingSelection.includes(mod)}
                  onChange={() => handleTogglePending(mod)}
                  className="h-[16px] w-[16px] cursor-pointer accent-[#0076F7]"
                />
                <span
                  className="inline-flex items-center rounded px-[5px] py-[3px] font-['Inter'] text-[11px] font-semibold uppercase text-white"
                  style={{ backgroundColor: getModalityBg(mod) }}
                >
                  {mod}
                </span>
              </label>
            ))}
            {filteredModalities.length === 0 && (
              <div className="px-[10px] py-[8px] text-[12px] text-[#888]">Aucun résultat</div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-[#3a3a3a] p-[10px] flex flex-col gap-[6px]">
            <button
              onClick={handleDeselectAll}
              className="w-full rounded bg-[#3a3a3a] py-[8px] text-[13px] font-medium text-white hover:bg-[#4a4a4a]"
            >
              Tout désélectionner
            </button>
            <button
              onClick={handleApply}
              className="w-full rounded bg-[#0076F7] py-[8px] text-[13px] font-semibold text-white hover:bg-[#0060d0]"
            >
              Appliquer
            </button>
          </div>
        </PopoverContent>
      </Popover>
      </div>
    </div>
  );
}

export default ModalityFilter;
