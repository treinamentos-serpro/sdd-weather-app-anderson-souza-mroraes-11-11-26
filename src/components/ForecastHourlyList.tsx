import { getShortDate } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherLabel } from '../lib/weatherCodes';
import type { ForecastHour, Unit } from '../types/weather';

interface ForecastHourlyListProps {
  date: string;
  dayLabel: string;
  hours: ForecastHour[];
  unit: Unit;
}

function formatValue(value: number | null, unit: string, round = false): string {
  if (value === null) return '—';
  return `${round ? Math.round(value) : value}${unit}`;
}

function HourMetric({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="text-xs text-white/70">{label}</p>
      <p className="font-semibold">{children}</p>
    </div>
  );
}

/** Detalhes meteorológicos horários do dia selecionado, sem chamadas de rede. */
export default function ForecastHourlyList({
  date,
  dayLabel,
  hours,
  unit,
}: ForecastHourlyListProps) {
  const dateLabel = `${dayLabel}, ${getShortDate(date)}`;

  return (
    <section
      aria-label={`Previsão horária de ${dateLabel}`}
      className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-md"
    >
      <h3 className="mb-3 text-lg font-semibold">Detalhes por hora: {dateLabel}</h3>
      {hours.length === 0 ? (
        <p role="status" className="text-white/70">
          Sem dados horários disponíveis.
        </p>
      ) : (
        <ul aria-label={`Horários de ${dateLabel}`} className="space-y-2">
          {hours.map((hour) => (
            <li
              key={hour.time}
              className="grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-night-800/70 p-3 sm:grid-cols-4"
            >
              <div>
                <p className="text-xs text-white/70">Hora</p>
                <time dateTime={hour.time} className="font-semibold">
                  {hour.time.slice(11, 16)}
                </time>
              </div>
              <HourMetric label="Temperatura">
                {formatTemperature(hour.temperature, unit)}
              </HourMetric>
              <HourMetric label="Condição">{getWeatherLabel(hour.weatherCode)}</HourMetric>
              <HourMetric label="Umidade">{formatValue(hour.humidity, '%', true)}</HourMetric>
              <HourMetric label="Chance de chuva">
                {formatValue(hour.precipitationProbability, '%')}
              </HourMetric>
              <HourMetric label="Precipitação">{formatValue(hour.precipitation, ' mm')}</HourMetric>
              <HourMetric label="Vento">{formatValue(hour.windSpeed, ' km/h', true)}</HourMetric>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
