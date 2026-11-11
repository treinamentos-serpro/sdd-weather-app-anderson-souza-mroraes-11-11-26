# Backlog — Weather App

**Entrada:** [Plano técnico](../plans/weather-app-plan.md)
**Escopo:** tarefas incrementais sobre a base existente. Busca, clima atual, previsão diária, alternância C/F e estados básicos já possuem implementação; não são repetidos como trabalho novo, exceto onde houver lacuna indicada no plano.

## Decisões e contratos

### T-01 — Confirmar fonte e campos da previsão (concluída)

- **Descrição:** registrar Open-Meteo como fonte e os campos meteorológicos atuais, diários e horários. A janela inclui hoje mais os quatro dias seguintes.
- **Critérios de aceite:**
  - A fonte e os campos de resposta necessários estão registrados em spec e plano.
  - A janela de hoje mais os quatro dias seguintes está registrada na spec e é compatível com `forecast_days=5`.
  - Fuso horário e comportamento para campos opcionais estão documentados.
- **Dependências:** Nenhuma.
- **Arquivos:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** Data

### T-02 — Definir interação para consultar detalhes horários (concluída)

- **Descrição:** usar expansão inline de um dia por vez, acionada por botão com estado acessível, e registrar o comportamento para orientar UI e testes.
- **Critérios de aceite:**
  - A interação diária/horária está descrita no plano e consistente com a spec.
  - A interação planejada pode ser operada por teclado e tem estado selecionado/expandido identificável.
- **Dependências:** Nenhuma.
- **Arquivos:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** UI

### T-03 — Confirmar unidade inicial e idioma/locale (concluída)

- **Descrição:** registrar Celsius como unidade inicial e pt-BR como idioma/locale da interface e da busca, sem alterar a regra de permitir C/F.
- **Critérios de aceite:**
  - Unidade inicial e locale estão registrados na spec e no plano.
  - Formatação de datas, horas e números está coerente com o locale escolhido.
- **Dependências:** Nenhuma.
- **Arquivos:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** UI

### T-04 — Definir persistência e comportamento offline

- **Descrição:** decidir se cidade/unidade serão lembradas e se a v1 terá cache ou suporte offline; manter fora do escopo aquilo que não for aprovado.
- **Critérios de aceite:**
  - Persistência e comportamento offline/cache estão marcados como dentro ou fora do escopo nos artefatos.
  - Nenhum requisito de persistência é implementado sem decisão documentada.
- **Dependências:** Nenhuma.
- **Arquivos:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** Infra

### T-05 — Definir metas de desempenho e navegadores suportados

- **Descrição:** transformar desempenho percebido e compatibilidade em critérios verificáveis, ou registrar explicitamente que não haverá metas quantitativas na v1.
- **Critérios de aceite:**
  - A spec registra metas mensuráveis ou a decisão de não estabelecer metas nesta versão.
  - O plano identifica navegadores/versões a validar ou registra essa cobertura como pendente.
- **Dependências:** Nenhuma.
- **Arquivos:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** Infra

## Dados e integração

### T-06 — Adicionar o modelo de previsão horária

- **Descrição:** ampliar os tipos de domínio para representar dados horários e conectá-los ao agregado de clima, mantendo temperaturas em Celsius e campos opcionais explicitamente anuláveis.
- **Critérios de aceite:**
  - `ForecastHour` representa horário, temperatura, código meteorológico e campos horários aprovados em T-01.
  - `WeatherData` contém a série horária sem acoplar o domínio ao JSON da API.
  - A tipagem passa no build TypeScript.
- **Dependências:** T-01.
- **Arquivos:** `src/types/weather.ts`
- **Tipo:** Data

### T-07 — Mapear dados horários no serviço meteorológico

- **Descrição:** solicitar os campos horários aprovados à API e mapear as séries de resposta para o novo modelo, preservando a associação entre horário e valores.
- **Critérios de aceite:**
  - A requisição forecast inclui os campos horários aprovados em T-01.
  - O mapeamento mantém timestamps e ordem correspondentes aos valores.
  - Erro HTTP, timeout e resposta sem dados horários seguem a estratégia de erro definida no plano.
- **Dependências:** T-01, T-06.
- **Arquivos:** `src/services/weatherService.ts`, `src/types/weather.ts`
- **Tipo:** Data

### T-08 — Cobrir o mapeamento horário do serviço

- **Descrição:** adicionar testes unitários para dados horários completos, campos opcionais e resposta incompleta.
- **Critérios de aceite:**
  - Testes verificam horários e valores mapeados corretamente.
  - Campos opcionais ausentes são representados como indisponíveis, não como zero.
  - Os testes passam isolados com `pnpm test -- tests/unit/weatherService.test.ts`.
- **Dependências:** T-07.
- **Arquivos:** `tests/unit/weatherService.test.ts`
- **Tipo:** Test

### T-09 — Agrupar horários pela data local

- **Descrição:** criar/estender utilitário para associar registros horários ao dia local correto, respeitando o fuso informado pela API.
- **Critérios de aceite:**
  - Cada registro horário aparece associado à data local correspondente.
  - Horários de datas adjacentes não são agrupados no dia errado.
  - O utilitário não altera os timestamps originais.
- **Dependências:** T-01, T-06.
- **Arquivos:** `src/lib/format.ts` ou `src/lib/forecast.ts`
- **Tipo:** Data

### T-10 — Testar agrupamento por data e fuso

- **Descrição:** cobrir agrupamento de série horária em datas diferentes e tratamento de horários ausentes.
- **Critérios de aceite:**
  - Casos de mudança de data local são cobertos.
  - Lista vazia e campo horário inválido têm comportamento definido e testado.
  - Os testes passam em `pnpm test`.
- **Dependências:** T-09.
- **Arquivos:** `tests/unit/format.test.ts` ou `tests/unit/forecast.test.ts`
- **Tipo:** Test

## Seleção de cidade e concorrência

### T-11 — Exigir seleção explícita de cidade (concluída)

- **Descrição:** após a busca, apresentar resultados para escolha e só carregar o clima após seleção; evitar carregar silenciosamente o primeiro resultado quando houver homônimos.
- **Critérios de aceite:**
  - A busca apresenta nome e contexto geográfico disponível para cada resultado.
  - A busca não carrega automaticamente o clima da primeira correspondência.
  - Selecionar um resultado carrega o clima daquela cidade.
- **Dependências:** Nenhuma.
- **Arquivos:** `src/hooks/useWeather.ts`, `src/components/SearchBar.tsx`, `src/App.tsx`
- **Tipo:** UI

### T-12 — Testar busca e seleção explícita (concluída)

- **Descrição:** cobrir resultados múltiplos, escolha de homônimo, nenhum resultado e busca vazia.
- **Critérios de aceite:**
  - Testes provam que nenhuma cidade é carregada antes da seleção.
  - Selecionar uma opção carrega a cidade correspondente.
  - Busca vazia não dispara request e busca sem resultados mostra estado vazio.
- **Dependências:** T-11.
- **Arquivos:** `tests/unit/SearchBar.test.tsx`, `tests/unit/App.test.tsx`, `tests/unit/useWeather.test.ts`
- **Tipo:** Test

### T-13 — Descartar respostas obsoletas

- **Descrição:** proteger buscas e consultas contra respostas fora de ordem usando cancelamento ou identificador de requisição vigente.
- **Critérios de aceite:**
  - Uma resposta antiga não substitui resultados nem clima da query/seleção mais recente.
  - Trocar de operação cancela ou invalida a requisição anterior sem produzir erro visível indevido.
  - O status final corresponde à operação vigente.
- **Dependências:** T-11.
- **Arquivos:** `src/hooks/useWeather.ts`, `src/services/weatherService.ts`
- **Tipo:** Data

### T-14 — Testar concorrência de buscas e consultas

- **Descrição:** simular respostas atrasadas e confirmar que o estado final pertence à última operação iniciada.
- **Critérios de aceite:**
  - Teste de duas buscas em ordem inversa mantém a busca mais recente.
  - Teste de duas seleções em ordem inversa mantém a cidade selecionada por último.
  - Cancelamento esperado não é apresentado como falha recuperável para a pessoa.
- **Dependências:** T-13.
- **Arquivos:** `tests/unit/useWeather.test.ts`, `tests/unit/weatherService.test.ts`
- **Tipo:** Test

## Interface de previsão horária

### T-15 — Criar componente de detalhes horários

- **Descrição:** implementar uma unidade de UI para exibir registros horários associados a um dia, incluindo horário, temperatura e demais campos aprovados em T-01.
- **Critérios de aceite:**
  - O componente recebe dados tipados e não faz chamadas de rede.
  - Temperaturas respeitam a unidade selecionada.
  - Campos indisponíveis não quebram o layout.
- **Dependências:** T-02, T-06, T-09.
- **Arquivos:** `src/components/ForecastHourlyList.tsx`
- **Tipo:** UI

### T-16 — Integrar detalhes horários à previsão diária

- **Descrição:** integrar o componente horário ao fluxo diário usando a interação definida em T-02.
- **Critérios de aceite:**
  - A pessoa consegue consultar os horários do dia escolhido.
  - Horários exibidos pertencem à data selecionada.
  - A navegação diária existente continua funcional em telas móveis e desktop.
- **Dependências:** T-15.
- **Arquivos:** `src/components/ForecastList.tsx`, `src/components/ForecastCard.tsx`, `src/App.tsx`
- **Tipo:** UI

### T-17 — Testar interação e acessibilidade do detalhe horário

- **Descrição:** cobrir abertura/seleção do dia, renderização horária, teclado e estado sem horas disponíveis.
- **Critérios de aceite:**
  - Testes verificam que a interação mostra as horas do dia correto.
  - Controle de seleção/expansão é operável por teclado e tem nome/estado acessível.
  - Dados horários ausentes geram estado compreensível, sem erro de renderização.
- **Dependências:** T-16.
- **Arquivos:** `tests/unit/ForecastList.test.tsx`, `tests/unit/ForecastHourlyList.test.tsx`
- **Tipo:** Test

## Respostas parciais

### T-18 — Preservar campos indisponíveis no mapeamento

- **Descrição:** ajustar tipos e mapeadores para preservar valores `null`/ausentes em vez de convertê-los em zero ou assumir que todos os campos existem.
- **Critérios de aceite:**
  - Probabilidade de precipitação ausente permanece indisponível no domínio.
  - Validação diferencia campos essenciais ausentes de campos opcionais ausentes.
  - Uma resposta parcial válida mantém os dados disponíveis para apresentação.
- **Dependências:** T-01, T-06, T-07.
- **Arquivos:** `src/types/weather.ts`, `src/services/weatherService.ts`
- **Tipo:** Data

### T-19 — Testar respostas parciais e payload inválido

- **Descrição:** adicionar casos para campos opcionais ausentes, séries inconsistentes e ausência de dados essenciais.
- **Critérios de aceite:**
  - Campos opcionais não são convertidos em valores meteorológicos fictícios.
  - Dados essenciais inválidos produzem erro tipado e recuperável.
  - Dados parciais válidos continuam disponíveis no resultado.
- **Dependências:** T-18.
- **Arquivos:** `tests/unit/weatherService.test.ts`
- **Tipo:** Test

### T-20 — Exibir dados indisponíveis sem quebrar a UI

- **Descrição:** atualizar os componentes de clima e previsão para representar dados ausentes de maneira consistente, sem ocultar dados válidos do mesmo conjunto.
- **Critérios de aceite:**
  - Campo indisponível é apresentado como indisponível/omitido conforme o componente.
  - Valores zero reais continuam sendo exibidos como zero.
  - Clima atual, diário e horário permanecem renderizáveis com payload parcial.
- **Dependências:** T-18, T-16.
- **Arquivos:** `src/components/CurrentWeather.tsx`, `src/components/ForecastCard.tsx`, `src/components/ForecastHourlyList.tsx`
- **Tipo:** UI

### T-21 — Testar apresentação de dados ausentes

- **Descrição:** cobrir dados opcionais ausentes e valores zero nos componentes de clima e previsão.
- **Critérios de aceite:**
  - Testes distinguem `0` de `null`/ausente.
  - Componentes não lançam erro ao receber dados parciais.
  - A informação disponível continua visível.
- **Dependências:** T-20.
- **Arquivos:** `tests/unit/CurrentWeather.test.tsx`, `tests/unit/ForecastCard.test.tsx`, `tests/unit/ForecastHourlyList.test.tsx`
- **Tipo:** Test

## Integração e entrega

### T-22 — Atualizar cenários E2E do fluxo completo

- **Descrição:** ampliar fixtures e fluxos Playwright para cobrir escolha da cidade, previsão diária/horária, unidade, erro/retry e viewport móvel.
- **Critérios de aceite:**
  - Fluxo E2E cobre cidade ambígua, seleção explícita e exibição dos detalhes horários.
  - Trocar C/F atualiza todas as temperaturas sem nova chamada forecast.
  - Cenários de erro/retry e viewport móvel passam usando APIs interceptadas.
- **Dependências:** T-12, T-14, T-17, T-21.
- **Arquivos:** `tests/e2e/weather.spec.ts`
- **Tipo:** Test

### T-23 — Executar os gates de qualidade

- **Descrição:** executar lint, build, testes unitários e E2E após integrar o backlog e resolver falhas relacionadas às mudanças.
- **Critérios de aceite:**
  - `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` terminam com sucesso.
  - Falhas ambientais ou previamente existentes são registradas separadamente, sem mascarar regressões da implementação.
- **Dependências:** T-22.
- **Arquivos:** Nenhum arquivo obrigatório; corrigir apenas arquivos relacionados às tarefas que falharem.
- **Tipo:** Test
