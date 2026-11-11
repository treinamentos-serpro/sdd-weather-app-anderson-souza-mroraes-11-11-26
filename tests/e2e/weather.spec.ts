import { expect, type Page, test } from '@playwright/test';

const geocoding = {
  results: [
    {
      id: 1,
      name: 'Seattle',
      country: 'Estados Unidos',
      admin1: 'Washington',
      latitude: 47.6,
      longitude: -122.33,
    },
  ],
};

const forecast = {
  current: {
    time: '2026-06-16T12:00',
    temperature_2m: 0,
    relative_humidity_2m: 80,
    wind_speed_10m: 10,
    surface_pressure: 1015,
    precipitation: 0,
    weather_code: 3,
  },
  daily: {
    time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
    weather_code: [3, 61, 80, 1, 0],
    temperature_2m_max: [20, 19, 22, 24, 25],
    temperature_2m_min: [12, 11, 13, 14, 15],
    precipitation_probability_max: [20, 90, 70, 10, 0],
  },
  hourly: {
    time: ['2026-06-16T12:00', '2026-06-17T09:00'],
    temperature_2m: [16, 14],
    relative_humidity_2m: [60, 65],
    precipitation_probability: [0, 10],
    precipitation: [0, 0.1],
    wind_speed_10m: [5, 8],
    weather_code: [3, 1],
  },
};

async function mockApis(page: Page) {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: geocoding }),
  );
  await page.route('**/api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));
}

test('fluxo completo: buscar → clima atual → previsão → trocar unidade', async ({ page }) => {
  await mockApis(page);
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();
  await page.getByRole('button', { name: 'Seattle, Washington, Estados Unidos' }).click();

  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();
  await expect(page.getByRole('region', { name: /previsão de 5 dias/i })).toBeVisible();

  // 0°C exibido; após trocar para °F deve virar 32°.
  await expect(page.getByText('0°').first()).toBeVisible();
  await page.getByRole('button', { name: '°F' }).click();
  await expect(page.getByText('32°').first()).toBeVisible();
  await expect(
    page.getByRole('region', { name: /previsão de 5 dias/i }).getByRole('listitem'),
  ).toHaveCount(5);
});

test('expande os horários apenas para o dia selecionado', async ({ page }) => {
  await mockApis(page);
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();
  await page.getByRole('button', { name: 'Seattle, Washington, Estados Unidos' }).click();
  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();
  await page.getByRole('button', { name: /ver horários de amanhã/i }).click();

  const hourlyRegion = page.getByRole('region', { name: /previsão horária de amanhã/i });
  await expect(hourlyRegion.getByText('09:00')).toBeVisible();
  await expect(hourlyRegion.getByText('12:00')).toHaveCount(0);
});

test('estado vazio quando a cidade não existe', async ({ page }) => {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) => route.fulfill({ json: {} }));
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('xyzxyz');
  await page.getByRole('button', { name: /buscar/i }).click();

  await expect(page.getByText(/nenhuma cidade encontrada/i)).toBeVisible();
});

test('viewport mobile renderiza o fluxo principal', async ({ page }) => {
  await mockApis(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();
  await page.getByRole('button', { name: 'Seattle, Washington, Estados Unidos' }).click();
  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: /previsão de 5 dias/i }).getByRole('listitem'),
  ).toHaveCount(5);
});

test('erro de forecast oferece retry e recupera a cidade', async ({ page }) => {
  let forecastRequests = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: geocoding }),
  );
  await page.route('**/api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    if (forecastRequests === 1) {
      return route.fulfill({ status: 503, body: 'service unavailable' });
    }
    return route.fulfill({ json: forecast });
  });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();
  await page.getByRole('button', { name: 'Seattle, Washington, Estados Unidos' }).click();
  await expect(page.getByRole('alert')).toBeVisible();

  await page.getByRole('button', { name: /tentar novamente/i }).click();
  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();
  expect(forecastRequests).toBe(2);
});

test('erro de busca oferece retry e recupera os resultados', async ({ page }) => {
  let searchRequests = 0;
  let forecastRequests = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) => {
    searchRequests += 1;
    if (searchRequests === 1) {
      return route.fulfill({ status: 503, body: 'service unavailable' });
    }
    return route.fulfill({ json: geocoding });
  });
  await page.route('**/api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return route.fulfill({ json: forecast });
  });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();

  await page.getByRole('button', { name: /tentar novamente/i }).click();
  await expect(page.getByRole('region', { name: 'Resultados de cidades' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Seattle, Washington, Estados Unidos' }),
  ).toBeVisible();
  expect(searchRequests).toBe(2);
  expect(forecastRequests).toBe(0);
});

test('mostra loading e desabilita nova busca enquanto aguarda resposta', async ({ page }) => {
  let releaseSearch: () => void = () => {};
  let searchRequestReceived = false;
  await page.route('**/geocoding-api.open-meteo.com/**', async (route) => {
    searchRequestReceived = true;
    await new Promise<void>((resolve) => {
      releaseSearch = resolve;
    });
    await route.fulfill({ json: geocoding });
  });
  await page.route('**/api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.getByLabel(/buscar cidade/i)).toBeDisabled();
  await expect.poll(() => searchRequestReceived).toBe(true);

  releaseSearch();
  await page.getByRole('button', { name: 'Seattle, Washington, Estados Unidos' }).click();
  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();
});

test('dados parciais mostram indisponibilidade sem converter zero em ausência', async ({
  page,
}) => {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: geocoding }),
  );
  await page.route('**/api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        current: {
          time: '2026-06-16T12:00',
          temperature_2m: 0,
          precipitation: 0,
          weather_code: 0,
        },
        daily: {
          time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
          weather_code: [0, 1, 2, 3, 61],
          temperature_2m_max: [20, 19, 22, 24, 25],
          temperature_2m_min: [12, 11, 13, 14, 15],
        },
      },
    }),
  );
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();
  await page.getByRole('button', { name: 'Seattle, Washington, Estados Unidos' }).click();

  const currentWeather = page.getByRole('region', { name: /clima atual/i });
  const forecastRegion = page.getByRole('region', { name: /previsão de 5 dias/i });
  await expect(currentWeather.getByText('0°')).toBeVisible();
  await expect(currentWeather.getByText('0 mm')).toBeVisible();
  await expect(currentWeather.getByText('—')).toHaveCount(3);
  await expect(forecastRegion.getByText('—')).toHaveCount(5);
});

test('busca pode ser enviada pelo teclado', async ({ page }) => {
  await mockApis(page);
  await page.goto('/');

  const search = page.getByLabel(/buscar cidade/i);
  await search.fill('Seattle');
  await search.press('Enter');
  await page.getByRole('button', { name: 'Seattle, Washington, Estados Unidos' }).press('Enter');
  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();
});

test('cidades homônimas são desambiguadas e carregadas somente após seleção', async ({ page }) => {
  let forecastRequests = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 11,
            name: 'Springfield',
            country: 'Estados Unidos',
            admin1: 'Illinois',
            latitude: 39.8,
            longitude: -89.6,
          },
          {
            id: 12,
            name: 'Springfield',
            country: 'Estados Unidos',
            admin1: 'Massachusetts',
            latitude: 42.1,
            longitude: -72.6,
          },
        ],
      },
    }),
  );
  await page.route('**/api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return route.fulfill({ json: forecast });
  });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Springfield');
  await page.getByRole('button', { name: /buscar/i }).click();

  const illinois = page.getByRole('button', {
    name: 'Springfield, Illinois, Estados Unidos',
  });
  const massachusetts = page.getByRole('button', {
    name: 'Springfield, Massachusetts, Estados Unidos',
  });
  await expect(illinois).toBeVisible();
  await expect(massachusetts).toBeVisible();
  expect(forecastRequests).toBe(0);

  await massachusetts.click();
  await expect(massachusetts).toHaveAttribute('aria-pressed', 'true');
  await expect(illinois).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('heading', { name: 'Springfield' })).toBeVisible();
  expect(forecastRequests).toBe(1);
});
