import { Slider } from "@/components/ui/slider";
import type React from "react";
import { MAX_SALARY, MIN_SALARY } from "../constants";

export function SalarySlider({
  value,
  min = MIN_SALARY,
  max = MAX_SALARY,
  step = 1000,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  function handleSliderChange(newValue: number[]) {
    onChange(newValue[0]);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleanValue = e.target.value.replace(/\D/g, "");
    if (cleanValue.length <= 7) {
      const newValue = Number.parseInt(cleanValue, 10) || 0;
      onChange(newValue);
    }
  }

  return (
    <div className="space-y-6 text-nowrap">
      <div>
        <label className="text-sm font-medium">Annual Salary</label>
        <div className="flex items-baseline gap-1 mt-3">
          <span className="text-4xl font-bold">$</span>
          <input
            type="text"
            value={value.toLocaleString("en-US")}
            onChange={handleInputChange}
            className="text-4xl font-bold bg-transparent border-b border-input pb-1 focus:outline-none focus:ring-0 focus:border-primary"
            style={{ width: `${7 * 0.6 + 1}em` }}
          />
        </div>
      </div>

      <Slider
        value={[value]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>${(min / 1000).toFixed(0)}k</span>
        <span>${(max / 1000).toFixed(0)}k</span>
      </div>
    </div>
  );
}
