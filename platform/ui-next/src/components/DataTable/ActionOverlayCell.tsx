import * as React from 'react'

type Props = {
  isActive: boolean
  value: React.ReactNode
  overlay: React.ReactNode
  onActivate?: () => void
  alignRight?: boolean
}

export function DataTableActionOverlayCell({
  isActive,
  value,
  overlay,
  onActivate,
  alignRight = true,
}: Props) {
  return (
    <div className="relative">
      <div
        className={`transition-opacity ${alignRight ? 'text-right' : ''} ${
          isActive ? 'invisible opacity-0' : 'group-hover:invisible group-hover:opacity-0 group-hover:text-transparent'
        }`}
      >
        {value}
      </div>
      <div
        className={`absolute inset-y-0 ${alignRight ? 'right-0' : 'left-0'} z-10 flex items-center px-2 ${
          isActive ? 'bg-popover opacity-100' : 'opacity-0 group-hover:bg-muted group-hover:opacity-100'
        }`}
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

