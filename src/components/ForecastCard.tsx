import { getDayLabel, getShortDate } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  index: number;
  unit: Unit;
  isExpanded: boolean;
  onToggle: () => void;
}

/** Card de um dia da previsão. */
export default function ForecastCard({
  day,
  index,
  unit,
  isExpanded,
  onToggle,
}: ForecastCardProps) {
  const dayLabel = getDayLabel(day.date, index);
  const dateLabel = getShortDate(day.date);

  return (
    <li className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
      <p className="font-semibold">{dayLabel}</p>
      <p className="text-xs text-white/70">{dateLabel}</p>
      <span role="img" aria-label={getWeatherLabel(day.weatherCode)} className="text-3xl">
        {getWeatherIcon(day.weatherCode)}
      </span>
      <p className="text-sm">
        <span className="font-semibold">{formatTemperature(day.max, unit)}</span>{' '}
        <span className="text-white/70">{formatTemperature(day.min, unit)}</span>
      </p>
      <p className="text-xs text-accent-400">
        <span className="sr-only">Probabilidade de precipitação: </span>
        <span aria-hidden="true">💧 </span>
        {day.precipitationProbability === null ? '—' : `${day.precipitationProbability}%`}
      </p>
      <button
        type="button"
        aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} horários de ${dayLabel}, ${dateLabel}`}
        aria-expanded={isExpanded}
        aria-controls="forecast-hourly-details"
        onClick={onToggle}
        className="min-h-10 rounded-md px-2 text-sm text-accent-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        {isExpanded ? 'Ocultar horários' : 'Ver horários'}
      </button>
    </li>
  );
}
