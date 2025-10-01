'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import type { Complexity, LineThickness } from '@coloringpage/types'

interface ParameterControlsProps {
  complexity: Complexity
  lineThickness: LineThickness
  onComplexityChange: (value: Complexity) => void
  onLineThicknessChange: (value: LineThickness) => void
  disabled?: boolean
  compact?: boolean
}

const complexityOptions = [
  { value: 'simple' as Complexity, label: 'Simple', age: '3-6' },
  { value: 'standard' as Complexity, label: 'Standard', age: '6-12' },
  { value: 'detailed' as Complexity, label: 'Detailed', age: '12+' }
]

const thicknessOptions = [
  { value: 'thin' as LineThickness, label: 'Thin', px: '1-2px' },
  { value: 'medium' as LineThickness, label: 'Medium', px: '2-3px' },
  { value: 'thick' as LineThickness, label: 'Thick', px: '3-4px' }
]

export function ParameterControls({
  complexity,
  lineThickness,
  onComplexityChange,
  onLineThicknessChange,
  disabled = false
}: ParameterControlsProps) {
  return (
    <div className="space-y-3">
      {/* Complexity */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-medium">Complexity</h4>
        <RadioGroup
          value={complexity}
          onValueChange={onComplexityChange}
          className="grid grid-cols-3 gap-2"
        >
          {complexityOptions.map((option) => (
            <div key={option.value}>
              <RadioGroupItem
                value={option.value}
                id={`complexity-${option.value}`}
                className="peer sr-only"
                disabled={disabled}
              />
              <Label
                htmlFor={`complexity-${option.value}`}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border-2 cursor-pointer transition-all text-center min-h-[64px] ${
                  complexity === option.value
                    ? 'border-brand-warm-orange bg-brand-warm-orange/5'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="text-base font-semibold">{option.label}</span>
                <span className="text-[11px] text-gray-500 mt-0.5">Ages {option.age}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Line Thickness */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-medium">Line Thickness</h4>
        <RadioGroup
          value={lineThickness}
          onValueChange={onLineThicknessChange}
          className="grid grid-cols-3 gap-2"
        >
          {thicknessOptions.map((option) => (
            <div key={option.value}>
              <RadioGroupItem
                value={option.value}
                id={`thickness-${option.value}`}
                className="peer sr-only"
                disabled={disabled}
              />
              <Label
                htmlFor={`thickness-${option.value}`}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border-2 cursor-pointer transition-all text-center min-h-[64px] ${
                  lineThickness === option.value
                    ? 'border-brand-warm-blue bg-brand-warm-blue/5'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="text-base font-semibold">{option.label}</span>
                <span className="text-[11px] text-gray-500 mt-0.5">{option.px}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}
