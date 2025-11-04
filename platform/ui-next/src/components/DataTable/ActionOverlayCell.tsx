import * as React from 'react'

type Props = {
  isActive: boolean
  value: React.ReactNode
  overlay: React.ReactNode
  onActivate?: () => void
  alignRight?: boolean
  overlayAlign?: 'start' | 'center' | 'end'
}

export function DataTableActionOverlayCell({
  isActive,
  value,
  overlay,
  onActivate,
  alignRight = true,
  overlayAlign,
}: Props) {
  const computedAlign = overlayAlign ?? (alignRight ? 'end' : 'start')
  const valueAlignmentClass =
    computedAlign === 'end' ? 'text-right' : computedAlign === 'center' ? 'text-center' : ''
  const overlayPositionClass =
    computedAlign === 'center'
      ? 'inset-y-0 inset-x-0 justify-center px-2'
      : computedAlign === 'start'
        ? 'inset-y-0 left-0 px-2'
        : 'inset-y-0 right-0 px-2'
  const overlayVisibilityClass = isActive
    ? 'bg-popover opacity-100'
    : 'opacity-0 group-hover:bg-muted group-hover:opacity-100'
  const valueVisibilityClass = isActive
    ? 'invisible opacity-0'
    : 'group-hover:invisible group-hover:opacity-0 group-hover:text-transparent'

  return (
    <div className="relative">
      <div
        className={`transition-opacity ${valueAlignmentClass} ${valueVisibilityClass}`}
      >
        {value}
      </div>
      <div
        className={`absolute z-10 flex items-center ${overlayPositionClass} ${overlayVisibilityClass}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          e.stopPropagation()
          onActivate?.()
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onActivate?.()
        }}
      >
        {overlay}
      </div>
    </div>
  )
}
