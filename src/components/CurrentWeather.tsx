import { formatNumber } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherType, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherType;
  unit: Unit;
}

interface MetricProps {
  icon: string;
  label: string;
  value: string;
}

function Metric({ icon, label, value }: MetricProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
      <span aria-hidden="true" className="text-xl">
        {icon}
      </span>
      <div>
        <p className="text-xs text-white/70">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function formatMetric(value: number | null, unit: string, round = false): string {
  if (value === null) return '—';
  return `${round ? Math.round(value) : formatNumber(value)}${unit}`;
}

/** Seção "hero" com as condições atuais da cidade selecionada. */
export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const location = [city.admin1, city.country].filter(Boolean).join(', ');

  return (
    <section
      aria-label="Clima atual"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-glass md:p-8"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">{city.name}</h2>
          {location && <p className="text-white/70">{location}</p>}

          <div className="mt-6 flex items-center gap-4">
            <span aria-hidden="true" className="text-6xl">
              {getWeatherIcon(current.weatherCode)}
            </span>
            <span className="text-6xl font-light md:text-7xl">
              {formatTemperature(current.temperature, unit)}
            </span>
          </div>
          <p className="mt-2 text-white/70">{getWeatherLabel(current.weatherCode)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric icon="💧" label="Umidade" value={formatMetric(current.humidity, '%', true)} />
          <Metric icon="💨" label="Vento" value={formatMetric(current.windSpeed, ' km/h', true)} />
          <Metric
            icon="🌧️"
            label="Precipitação"
            value={formatMetric(current.precipitation, ' mm')}
          />
          <Metric icon="📊" label="Pressão" value={formatMetric(current.pressure, ' hPa', true)} />
        </div>
      </div>
    </section>
  );
}
