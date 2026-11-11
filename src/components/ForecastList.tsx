import { useState } from 'react';
import { getDayLabel } from '../lib/format';
import type { ForecastDay, ForecastHour, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';
import ForecastHourlyList from './ForecastHourlyList';

interface ForecastListProps {
  forecast: ForecastDay[];
  hourlyForecast?: ForecastHour[];
  unit: Unit;
}

/** Grid responsivo com a previsão de 5 dias. */
export default function ForecastList({ forecast, hourlyForecast = [], unit }: ForecastListProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const hoursByDate = new Map<string, ForecastHour[]>();

  for (const hour of hourlyForecast) {
    // timezone=auto retorna horas locais; o prefixo evita deslocamentos por UTC.
    const date = hour.time.slice(0, 10);
    const hoursForDate = hoursByDate.get(date) ?? [];
    hoursForDate.push(hour);
    hoursByDate.set(date, hoursForDate);
  }

  const expandedIndex = forecast.findIndex((day) => day.date === expandedDate);
  const expandedDay = expandedIndex >= 0 ? forecast[expandedIndex] : undefined;

  return (
    <section aria-label="Previsão de 5 dias">
      <h2 className="mb-4 text-xl font-bold">Previsão de 5 dias</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {forecast.map((day, index) => (
          <ForecastCard
            key={day.date}
            day={day}
            index={index}
            unit={unit}
            isExpanded={day.date === expandedDate}
            onToggle={() => setExpandedDate(day.date === expandedDate ? null : day.date)}
          />
        ))}
      </ul>
      <div id="forecast-hourly-details" hidden={!expandedDay}>
        {expandedDay && (
          <ForecastHourlyList
            date={expandedDay.date}
            dayLabel={getDayLabel(expandedDay.date, expandedIndex)}
            hours={hoursByDate.get(expandedDay.date) ?? []}
            unit={unit}
          />
        )}
      </div>
    </section>
  );
}
