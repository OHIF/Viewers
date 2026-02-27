import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import LegacyButton from '../LegacyButton';
import Typography from '../Typography';
import InputGroup from '../InputGroup';
import { Icons, Input, DatePickerWithRange, Popover, PopoverTrigger, PopoverContent } from '@ohif/ui-next';

const SCROLLBAR_STYLE_ID = 'pacsia-filter-scrollbar-style';
function useFilterScrollbarStyle() {
  React.useEffect(() => {
    if (document.getElementById(SCROLLBAR_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SCROLLBAR_STYLE_ID;
    style.textContent = `
      .pacsia-filter-scroll {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      .pacsia-filter-scroll::-webkit-scrollbar {
        display: none !important;
        height: 0 !important;
        width: 0 !important;
      }
    `;
    document.head.appendChild(style);
  }, []);
}

/** Bloc scrollable avec indicateur custom gris fin en bas */
function ScrollableFilterGroup({ className, children }) {
  const scrollRef = React.useRef(null);
  const [scrollState, setScrollState] = React.useState({ thumbWidth: 0, thumbLeft: 0, needsScroll: false });

  const updateScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const needsScroll = scrollWidth > clientWidth;
    if (!needsScroll) {
      setScrollState({ thumbWidth: 0, thumbLeft: 0, needsScroll: false });
      return;
    }
    const ratio = clientWidth / scrollWidth;
    const thumbWidth = Math.max(ratio * clientWidth, 20);
    const maxThumbLeft = clientWidth - thumbWidth;
    const scrollRatio = scrollLeft / (scrollWidth - clientWidth);
    const thumbLeft = scrollRatio * maxThumbLeft;
    setScrollState({ thumbWidth, thumbLeft, needsScroll: true });
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScroll();
    el.addEventListener('scroll', updateScroll, { passive: true });
    const ro = new ResizeObserver(updateScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScroll);
      ro.disconnect();
    };
  }, [updateScroll]);

  return (
    <div className="relative">
      <div ref={scrollRef} className={className}>
        {children}
      </div>
      {scrollState.needsScroll && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: scrollState.thumbLeft,
              width: scrollState.thumbWidth,
              height: '3px',
              borderRadius: '1.5px',
              backgroundColor: '#374151',
              transition: 'left 0.05s ease-out',
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Icône checklist (liste avec coches - format_list_checked / clipboard-list) */
function IconCheckList({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="M5 6l1.5 1.5L9 5" />
      <path d="M5 12l1.5 1.5L9 11" />
      <path d="M5 18l1.5 1.5L9 16" />
    </svg>
  );
}

/** Formate YYYYMMDD en DD/MM/YY pour affichage sur le bouton période */
function formatDateShort(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length < 8) return '';
  return `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(2, 4)}`;
}

const PERIOD_OPTIONS = [
  { value: 'today', labelKey: 'StudyList:CeJour' },
  { value: '7d', labelKey: 'StudyList:Period7j' },
  { value: '30d', labelKey: 'StudyList:Period30j' },
  { value: 'custom', labelKey: 'StudyList:PeriodCustom' },
];

const STATUS_OPTIONS = [
  { value: 'nonLu', labelKey: 'StudyList:NonLu' },
  { value: 'enCours', labelKey: 'StudyList:EnCours' },
  { value: 'valide', labelKey: 'StudyList:Valide' },
];

const SCOPE_OPTIONS = [
  { value: 'mesExamens', labelKey: 'StudyList:MesExamens' },
  { value: 'tous', labelKey: 'StudyList:Tous' },
];

/** Croix blanche seule (pas de rond) pour retirer un tag */
function IconClose({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <line x1="2" y1="2" x2="12" y2="12" />
      <line x1="12" y1="2" x2="2" y2="12" />
    </svg>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full bg-[#374151] px-3 py-1.5 text-sm font-medium text-white"
      style={{ fontFamily: 'Roboto, sans-serif' }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex text-white hover:opacity-80"
        aria-label="Retirer"
      >
        <IconClose className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function StudyListFilter({
  filtersMeta,
  filterValues,
  onChange,
  clearFilters,
  isFiltering,
  numOfStudies,
  onUploadClick,
  getDataSourceConfigurationComponent,
  useNewDesign = false,
}) {
  const { t } = useTranslation('StudyList');
  const { sortBy, sortDirection } = filterValues;
  const filterSorting = { sortBy, sortDirection };
  const setFilterSorting = sortingValues => {
    onChange({
      ...filterValues,
      ...sortingValues,
    });
  };
  const isSortingEnabled = numOfStudies > 0 && numOfStudies <= 100;

  const searchQuery = filterValues.searchQuery ?? '';
  const periodType = filterValues.periodType ?? 'custom';
  const studyDate = filterValues.studyDate ?? { startDate: null, endDate: null };
  const modalities = Array.isArray(filterValues.modalities) ? filterValues.modalities : [];
  const statusFilter = filterValues.statusFilter ?? 'nonLu';
  const scopeFilter = filterValues.scopeFilter ?? 'tous';

  const modalityOptions = React.useMemo(() => {
    const meta = filtersMeta?.find(m => m.name === 'modalities');
    return meta?.inputProps?.options ?? [];
  }, [filtersMeta]);

  const activeFilterCount = [
    searchQuery ? 1 : 0,
    modalities.length,
    periodType !== 'custom' || studyDate?.startDate || studyDate?.endDate ? 1 : 0,
    statusFilter && statusFilter !== 'nonLu' ? 1 : 0,
    scopeFilter === 'mesExamens' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleSearchChange = e => {
    onChange({ ...filterValues, searchQuery: e.target.value });
  };

  const toggleModality = value => {
    const next = modalities.includes(value) ? modalities.filter(m => m !== value) : [...modalities, value];
    onChange({ ...filterValues, modalities: next });
  };

  const setPeriodType = value => {
    onChange({ ...filterValues, periodType: value });
  };

  const setStudyDate = ({ startDate, endDate }) => {
    onChange({
      ...filterValues,
      studyDate: { startDate, endDate },
    });
  };

  const setStatusFilter = value => {
    onChange({ ...filterValues, statusFilter: value });
  };

  const setScopeFilter = value => {
    onChange({ ...filterValues, scopeFilter: value });
  };

  const removeTag = (key, value) => {
    if (key === 'search') onChange({ ...filterValues, searchQuery: '' });
    if (key === 'modality') onChange({ ...filterValues, modalities: modalities.filter(m => m !== value) });
    if (key === 'period') onChange({ ...filterValues, periodType: 'custom', studyDate: { startDate: null, endDate: null } });
    if (key === 'status') onChange({ ...filterValues, statusFilter: 'nonLu' });
    if (key === 'scope') onChange({ ...filterValues, scopeFilter: 'tous' });
  };

  const periodCustomLabel = React.useMemo(() => {
    if (periodType !== 'custom') return t('StudyList:PeriodCustom');
    const start = studyDate?.startDate && formatDateShort(studyDate.startDate);
    const end = studyDate?.endDate && formatDateShort(studyDate.endDate);
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    if (end) return end;
    return t('StudyList:PeriodCustom');
  }, [periodType, studyDate?.startDate, studyDate?.endDate, t]);

  const [showTags, setShowTags] = React.useState(true);
  const [dateRangePopoverOpen, setDateRangePopoverOpen] = React.useState(false);

  useFilterScrollbarStyle();

  const filterGroupClass =
    'flex h-10 max-w-[280px] flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden rounded-lg px-1 pacsia-filter-scroll';

  /** Bordure et fond par état (inactif: fond blanc + bordure grise ; actif: fond principal, bordure assortie) */
  const filterItemClass = (isActive) =>
    classNames(
      'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
      isActive
        ? 'border-[#374151] bg-[#374151] text-white'
        : 'border-[#d1d5db] bg-white text-[#374151] hover:border-[#9ca3af] hover:bg-[#f9fafb]'
    );

  /** Séparateur vertical (pipe) entre chaque type de filtre */
  const FilterPipe = () => <div className="h-5 w-px shrink-0 bg-[#d1d5db]" aria-hidden />;

  if (useNewDesign) {
    return (
      <div className="sticky top-0 z-10 w-full border-b border-[#e5e7eb] bg-white" style={{ fontFamily: 'Roboto, sans-serif' }}>
        <div className="mx-auto flex w-full flex-col gap-1 px-4 py-4">
          {/* Une seule ligne : recherche (reste de la place) + bouton filtres + groupes de filtres */}
          <div className="flex w-full flex-wrap items-center gap-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
            {/* Barre de recherche : prend le reste de la place disponible */}
            <div className="relative h-10 min-w-[160px] flex-1 shrink-0">
              <Icons.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
              <Input
                type="text"
                placeholder={t('StudyList:SearchPlaceholder')}
                value={searchQuery}
                onChange={handleSearchChange}
                className="h-full w-full rounded-2xl border border-[#e5e7eb] bg-white pl-9 font-medium text-[#374151] placeholder:font-medium placeholder:text-[#9ca3af] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
            </div>

            {/* Bouton filtres : icône checklist ; bg couleur principale (#374151) quand tags dépliés (showTags) */}
            <button
              type="button"
              onClick={() => setShowTags(s => !s)}
              className={classNames(
                'flex h-10 shrink-0 items-center gap-1.5 rounded-2xl px-3 text-sm font-medium transition-colors',
                showTags
                  ? 'bg-[#374151] text-white hover:bg-[#4b5563]'
                  : 'bg-[#f9fafb] text-[#374151] hover:bg-[#f3f4f6]'
              )}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              <span>{activeFilterCount}</span>
              <IconCheckList className="h-4 w-4" />
            </button>

            {/* Modalités */}
            <ScrollableFilterGroup className={filterGroupClass}>
              {modalityOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleModality(value)}
                  className={filterItemClass(modalities.includes(value))}
                >
                  {label}
                </button>
              ))}
            </ScrollableFilterGroup>

            <FilterPipe />
            {/* Période */}
            <ScrollableFilterGroup className={filterGroupClass}>
              {PERIOD_OPTIONS.filter(opt => opt.value !== 'custom').map(({ value, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriodType(value)}
                  className={filterItemClass(periodType === value)}
                >
                  {t(labelKey)}
                </button>
              ))}
              <Popover open={dateRangePopoverOpen} onOpenChange={open => { setDateRangePopoverOpen(open); if (open) setPeriodType('custom'); }}>
                <PopoverTrigger asChild>
                  <button type="button" className={filterItemClass(periodType === 'custom')}>
                    {periodType === 'custom' ? periodCustomLabel : t('StudyList:PeriodCustom')}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto border-[#e5e7eb] bg-white p-3 shadow-md">
                  <DatePickerWithRange
                    id="study-date-range"
                    startDate={studyDate?.startDate || ''}
                    endDate={studyDate?.endDate || ''}
                    onChange={setStudyDate}
                    variant="light"
                    className="flex gap-2"
                  />
                </PopoverContent>
              </Popover>
            </ScrollableFilterGroup>

            <FilterPipe />
            {/* Statut */}
            <ScrollableFilterGroup className={filterGroupClass}>
              {STATUS_OPTIONS.map(({ value, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={filterItemClass(statusFilter === value)}
                >
                  {t(labelKey)}
                </button>
              ))}
            </ScrollableFilterGroup>

            <FilterPipe />
            {/* Scope */}
            <ScrollableFilterGroup className={filterGroupClass}>
              {SCOPE_OPTIONS.map(({ value, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScopeFilter(value)}
                  className={filterItemClass(scopeFilter === value)}
                >
                  {t(labelKey)}
                </button>
              ))}
            </ScrollableFilterGroup>
          </div>

          {/* Applied filters tags (hide/show via bouton filtres) */}
          {showTags && (activeFilterCount > 0 || isFiltering) && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {searchQuery && (
                <FilterChip label={searchQuery} onRemove={() => removeTag('search')} />
              )}
              {modalities.map(m => (
                <FilterChip
                  key={m}
                  label={m}
                  onRemove={() => removeTag('modality', m)}
                />
              ))}
              {periodType !== 'custom' && (
                <FilterChip
                  label={
                    periodType === 'today'
                      ? t('StudyList:CeJour')
                      : periodType === '7d'
                        ? t('StudyList:Period7j')
                        : t('StudyList:Period30j')
                  }
                  onRemove={() => removeTag('period')}
                />
              )}
              {studyDate?.startDate && periodType === 'custom' && (
                <FilterChip label={t('StudyList:PeriodCustom')} onRemove={() => removeTag('period')} />
              )}
              {statusFilter && statusFilter !== 'nonLu' && (
                <FilterChip
                  label={t(STATUS_OPTIONS.find(s => s.value === statusFilter)?.labelKey || 'StudyList:NonLu')}
                  onRemove={() => removeTag('status')}
                />
              )}
              {scopeFilter === 'mesExamens' && (
                <FilterChip
                  label={t('StudyList:MesExamens')}
                  onRemove={() => removeTag('scope')}
                />
              )}
            </div>
          )}
        </div>

        {numOfStudies > 100 && (
          <div className="border-t border-[#e5e7eb] bg-[#f9fafb] px-4 py-2 text-center text-sm text-[#6b7280]">
            {t('Filter list to 100 studies or less to enable sorting')}
          </div>
        )}
      </div>
    );
  }

  return (
    <React.Fragment>
      <div>
        <div className="bg-black">
          <div className="container relative mx-auto flex flex-col pt-5">
            <div className="mb-5 flex flex-row justify-between">
              <div className="flex min-w-[1px] shrink flex-row items-center gap-6">
                <Typography
                  variant="h6"
                  className="text-white"
                >
                  {t('StudyList')}
                </Typography>
                {getDataSourceConfigurationComponent && getDataSourceConfigurationComponent()}
                {onUploadClick && (
                  <div
                    className="text-primary-active flex cursor-pointer items-center gap-2 self-center text-lg font-semibold"
                    onClick={onUploadClick}
                  >
                    <Icons.Upload />
                    <span>{t('Upload')}</span>
                  </div>
                )}
              </div>
              <div className="flex h-[34px] flex-row items-center">
                {isFiltering && (
                  <LegacyButton
                    rounded="full"
                    variant="outlined"
                    color="primaryActive"
                    border="primaryActive"
                    className="mx-8"
                    startIcon={<Icons.Cancel />}
                    onClick={clearFilters}
                  >
                    {t('ClearFilters')}
                  </LegacyButton>
                )}

                <Typography
                  variant="h6"
                  className="mr-2"
                  data-cy={'num-studies'}
                >
                  {numOfStudies > 100 ? '>100' : numOfStudies}
                </Typography>
                <Typography
                  variant="h6"
                  className="text-primary-light"
                >
                  {`${t('Studies')} `}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sticky -top-1 z-10 mx-auto border-b-4 border-black">
        <div className="bg-primary-dark pt-3 pb-3">
          <InputGroup
            inputMeta={filtersMeta}
            values={filterValues}
            onValuesChange={onChange}
            sorting={filterSorting}
            onSortingChange={setFilterSorting}
            isSortingEnabled={isSortingEnabled}
          />
        </div>
        {numOfStudies > 100 && (
          <div className="container m-auto">
            <div className="bg-primary-main rounded-b py-1 text-center text-base">
              <p className="text-white">
                {t('Filter list to 100 studies or less to enable sorting')}
              </p>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

StudyListFilter.propTypes = {
  filtersMeta: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      displayName: PropTypes.string.isRequired,
      inputType: PropTypes.oneOf(['Text', 'MultiSelect', 'DateRange', 'None']).isRequired,
      isSortable: PropTypes.bool.isRequired,
      gridCol: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).isRequired,
      option: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string,
          label: PropTypes.string,
        })
      ),
    })
  ),
  filterValues: PropTypes.object.isRequired,
  numOfStudies: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  clearFilters: PropTypes.func.isRequired,
  isFiltering: PropTypes.bool.isRequired,
  onUploadClick: PropTypes.func,
  getDataSourceConfigurationComponent: PropTypes.func,
  useNewDesign: PropTypes.bool,
};

export default StudyListFilter;
