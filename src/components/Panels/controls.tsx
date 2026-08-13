/**
 * controls.tsx — 패널에서 공용으로 쓰는 작은 컨트롤 컴포넌트
 */
import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  value?: ReactNode;
  children: ReactNode;
}

export function Field({ label, value, children }: FieldProps) {
  return (
    <div className="field">
      <div className="field-head">
        <span className="field-label">{label}</span>
        {value !== undefined && <span className="field-value">{value}</span>}
      </div>
      {children}
    </div>
  );
}

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}

export function Slider({ min, max, step = 1, value, onChange }: SliderProps) {
  return (
    <input
      type="range"
      className="slider"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  );
}

interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={String(o.value)}
          className={`seg-btn ${o.value === value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface SelectProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function Select<T extends string>({ options, value, onChange }: SelectProps<T>) {
  return (
    <select
      className="select"
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

interface PanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Panel({ title, subtitle, children, actions }: PanelProps) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          {subtitle && <p className="panel-subtitle">{subtitle}</p>}
        </div>
        {actions}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
