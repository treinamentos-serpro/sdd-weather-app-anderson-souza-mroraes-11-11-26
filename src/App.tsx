import { useState } from 'react';
import CityResults from './components/CityResults';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './types/weather';

/**
 * WeatherView — aplicação completa de previsão do tempo.
 *
 * Construída ao longo do treinamento de Spec-Driven Development com GitHub
 * Copilot, do briefing à entrega.
 */
export default function App() {
  const { status, data, cities, error, query, search, selectCity, retry } = useWeather();
  const [unit, setUnit] = useState<Unit>('celsius');
  const displayedData = status === 'success' ? data : null;

  return (
    <div className="min-h-screen text-white">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-night-700 px-4 py-3 text-white focus:fixed focus:left-4 focus:top-4 focus:not-sr-only focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl text-sun">
              ☀️
            </span>
            <h1 className="text-lg font-bold">WeatherView</h1>
          </div>
          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:gap-3">
            <SearchBar onSearch={search} disabled={status === 'loading'} />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-5xl space-y-8 px-4 py-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        {status === 'loading' && <LoadingState />}

        <div aria-busy={status === 'loading'}>
          {status === 'idle' && (
            <EmptyState
              title="Busque uma cidade para começar"
              hint="Ex.: Seattle, Lisboa, São Paulo…"
            />
          )}

          {cities.length > 0 && (
            <CityResults
              cities={cities}
              selectedCityId={displayedData?.city.id}
              disabled={status === 'loading'}
              onSelect={selectCity}
            />
          )}

          {status === 'empty' && (
            <EmptyState
              title={`Nenhuma cidade encontrada para "${query}"`}
              hint="Verifique a grafia e tente novamente."
            />
          )}

          {status === 'error' && error && <ErrorState message={error} onRetry={retry} />}

          {displayedData && (
            <>
              <CurrentWeather
                city={displayedData.city}
                current={displayedData.current}
                unit={unit}
              />
              <ForecastList
                forecast={displayedData.forecast}
                hourlyForecast={displayedData.hourlyForecast}
                unit={unit}
              />
            </>
          )}
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-white/70">
        Dados por{' '}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="text-accent-400 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          Open-Meteo
        </a>
      </footer>
    </div>
  );
}
