import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  selectedCityId?: number;
  disabled?: boolean;
  onSelect: (city: City) => void;
}

/** Resultados de busca com contexto geográfico para distinguir homônimos. */
export default function CityResults({
  cities,
  selectedCityId,
  disabled = false,
  onSelect,
}: CityResultsProps) {
  return (
    <section aria-label="Resultados de cidades">
      <h2 className="mb-2 text-lg font-semibold">Escolha uma cidade</h2>
      <ul className="divide-y divide-white/10">
        {cities.map((city) => {
          const location = [city.admin1, city.country].filter(Boolean).join(', ');
          const accessibleName = location ? `${city.name}, ${location}` : city.name;

          return (
            <li key={city.id}>
              <button
                type="button"
                aria-label={accessibleName}
                aria-pressed={selectedCityId === city.id}
                disabled={disabled}
                onClick={() => onSelect(city)}
                className="flex min-h-12 w-full items-center justify-between gap-4 px-3 py-2 text-left transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="font-semibold">{city.name}</span>
                <span className="text-sm text-white/70">
                  {location || 'Localização não informada'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
