import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

/** Alternador de unidade Celsius/Fahrenheit, acessível por teclado. */
export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex shrink-0 rounded-lg border border-white/10 bg-white/5 p-1 backdrop-blur-md"
    >
      <button
        type="button"
        aria-pressed={unit === 'celsius'}
        onClick={() => onChange('celsius')}
        className={`min-h-10 min-w-10 rounded-md px-3 py-1 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
          unit === 'celsius' ? 'bg-accent-600 text-white' : 'text-white/70 hover:text-white'
        }`}
      >
        °C
      </button>
      <button
        type="button"
        aria-pressed={unit === 'fahrenheit'}
        onClick={() => onChange('fahrenheit')}
        className={`min-h-10 min-w-10 rounded-md px-3 py-1 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
          unit === 'fahrenheit' ? 'bg-accent-600 text-white' : 'text-white/70 hover:text-white'
        }`}
      >
        °F
      </button>
    </div>
  );
}
