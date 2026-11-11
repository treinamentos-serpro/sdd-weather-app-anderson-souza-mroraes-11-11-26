# Especificação — Aplicação de Previsão do Tempo

## Overview

Aplicação de previsão do tempo para permitir que uma pessoa pesquise uma cidade, consulte as condições meteorológicas atuais e veja a previsão de cinco dias com detalhamento diário e horário. A temperatura deve poder ser apresentada em Celsius ou Fahrenheit, e os fluxos principais devem funcionar em dispositivos móveis.

Esta especificação deriva de [discovery.md](discovery.md). Open-Meteo foi selecionada para geocoding e forecast, com os campos listados nas suposições. A unidade inicial é Celsius e a interface usa pt-BR. O período da previsão está definido como hoje mais os quatro dias seguintes, usando as datas locais retornadas pela API.

## Functional Requirements

- **RF1 — Busca de cidades:** permitir que a pessoa usuária informe o nome de uma cidade e consulte resultados correspondentes. Quando houver cidades homônimas, os resultados devem oferecer contexto suficiente para distingui-las.
- **RF2 — Clima atual:** após a seleção de uma cidade, apresentar as condições meteorológicas atuais disponíveis para esse local.
- **RF3 — Previsão de cinco dias:** após a seleção de uma cidade, apresentar a previsão de hoje e dos quatro dias seguintes, com detalhamento diário e horário.
- **RF4 — Unidade de temperatura:** permitir alternar entre Celsius e Fahrenheit e atualizar as temperaturas exibidas para a unidade selecionada.
- **RF5 — Estados da consulta:** comunicar carregamento, ausência de resultados e falha na busca ou obtenção dos dados, sem deixar a interface em estado indefinido. Este requisito detalha a resiliência e o tratamento de falhas apontados no discovery.

## User Stories

- **US1 — Busca e clima atual (RF1, RF2):** Como pessoa que quer consultar o clima de uma cidade, quero buscá-la e selecioná-la para ver as condições atuais do local correto.
- **US2 — Planejamento (RF3):** Como pessoa que planeja os próximos dias, quero consultar a previsão diária e horária dos próximos cinco dias para organizar meus compromissos.
- **US3 — Preferência de unidade (RF4):** Como pessoa acostumada a uma unidade específica, quero alternar entre Celsius e Fahrenheit para interpretar as temperaturas com facilidade.
- **US4 — Uso móvel (RNF1, RNF2):** Como pessoa que consulta o tempo pelo celular, quero buscar cidades e visualizar os dados em uma tela pequena sem perder acesso às informações ou aos controles.
- **US5 — Recuperação de falhas (RF5):** Como pessoa usando uma conexão instável, quero receber uma mensagem clara quando a consulta falhar e saber que posso tentar novamente.

## Acceptance Criteria

### RF1 — Busca de cidades

- **Dado** um nome de cidade com resultados, **quando** a pessoa usuária envia a busca, **então** são apresentados resultados correspondentes para seleção.
- **Dado** que existam resultados com nomes de cidade iguais, **quando** eles são apresentados, **então** cada resultado inclui contexto suficiente para ajudar a distingui-los, como estado ou país quando disponível.
- **Dado** um termo sem correspondências, **quando** a busca termina, **então** a interface informa que nenhuma cidade foi encontrada.

### RF2 — Clima atual

- **Dado** que uma cidade foi selecionada e os dados atuais foram obtidos, **quando** a consulta termina, **então** as condições meteorológicas atuais dessa cidade são exibidas.
- **Dado** que a cidade selecionada mudou, **quando** os dados da nova cidade são exibidos, **então** eles correspondem à nova seleção, e não à cidade anterior.

### RF3 — Previsão de cinco dias

- **Dado** que uma cidade foi selecionada e há dados de previsão disponíveis, **quando** a consulta termina, **então** a interface apresenta a previsão abrangendo cinco dias, identifica os dias e permite consultar o detalhamento diário e horário.
- **Dado** que a previsão de um dia possui dados por hora, **quando** a pessoa usuária consulta esse dia, **então** os dados horários correspondentes são apresentados associados à data correta.
- **Dado** que uma cidade foi selecionada, **quando** a previsão de cinco dias é apresentada, **então** ela abrange a data local atual e os quatro dias locais seguintes.

### RF4 — Unidade de temperatura

- **Dado** que temperaturas são exibidas em Celsius, **quando** a pessoa usuária seleciona Fahrenheit, **então** todas as temperaturas visíveis passam a ser apresentadas em Fahrenheit com valores equivalentes.
- **Dado** que temperaturas são exibidas em Fahrenheit, **quando** a pessoa usuária seleciona Celsius, **então** todas as temperaturas visíveis passam a ser apresentadas em Celsius com valores equivalentes.

### RF5 — Estados da consulta

- **Dado** que uma busca ou consulta está em andamento, **quando** os dados ainda não chegaram, **então** a interface comunica que está carregando.
- **Dado** que a busca termina sem resultados, **quando** a resposta é apresentada, **então** a interface informa que nenhuma cidade foi encontrada.
- **Dado** que a busca ou consulta falha, **quando** a falha é detectada, **então** a interface comunica o problema e oferece uma forma de tentar novamente.

### Requisitos não funcionais

- **Dado** que a aplicação é aberta em uma tela móvel ou maior, **quando** a pessoa usuária realiza os fluxos principais, **então** conteúdo e controles se adaptam à tela sem perda de funcionalidade.
- **Dado** que a pessoa navega sem mouse, **quando** utiliza busca, seleção de cidade e alternância de unidade, **então** consegue acessar e operar os controles por teclado e identificar seus nomes e estados.
- **Dado** que uma unidade está selecionada, **quando** temperaturas atuais e previsão são exibidas, **então** todas seguem essa mesma unidade.
- **Dado** que a rede ou o serviço de dados falha, **quando** a consulta não pode ser concluída, **então** a falha é comunicada e a interface permanece utilizável.

## Non-Functional Requirements

- **RNF1 — Usabilidade móvel:** os fluxos de busca e consulta devem ser utilizáveis em dispositivos móveis.
- **RNF2 — Responsividade:** conteúdo e controles devem se adaptar a diferentes tamanhos de tela sem perda de informação ou funcionalidade.
- **RNF3 — Acessibilidade:** busca, seleção de cidade e alternância de unidade devem ser acessíveis por teclado e identificáveis por tecnologias assistivas.
- **RNF4 — Consistência:** a unidade selecionada deve ser aplicada uniformemente a todas as temperaturas exibidas.
- **RNF5 — Resiliência:** falhas de rede ou do serviço devem ser comunicadas de forma compreensível e não deixar a interface em estado indefinido.
- **RNF6 — Desempenho percebido:** consultas demoradas devem apresentar feedback, mantendo os controles responsivos. Um limite numérico de tempo ainda não foi definido.

## Edge Cases

| Caso | Comportamento esperado |
| --- | --- |
| Campo de busca vazio ou contendo apenas espaços | Não iniciar uma consulta vazia; orientar a pessoa a informar uma cidade. |
| Cidade inexistente | Exibir estado sem resultados, sem apresentar dados de outra cidade. |
| Busca retorna cidades homônimas | Mostrar contexto de localização para que a pessoa possa escolher a cidade correta. |
| Nome com acentos, espaços ou caracteres especiais | Tratar a entrada sem quebrar a interface; apresentar resultados correspondentes quando disponíveis. |
| Serviço de busca/geocodificação retorna erro | Informar a falha e permitir nova tentativa. |
| Consulta excede o tempo esperado ou a conexão cai | Encerrar o estado de carregamento, informar a falha e manter a interface utilizável. |
| Serviço de previsão falha após a cidade ser selecionada | Informar que os dados de previsão não puderam ser obtidos e oferecer nova tentativa. |
| Resposta não contém algum dado meteorológico esperado | Não quebrar a página; omitir o dado ausente ou usar uma indicação de indisponibilidade. |
| Pessoa alterna a unidade durante ou após a consulta | Manter a seleção de cidade e apresentar todas as temperaturas na unidade escolhida. |
| Dados retornam para uma cidade diferente da seleção atual | Não substituir os dados da seleção atual por uma resposta obsoleta. |

## Assumptions

- A pessoa usuária inicia a consulta informando uma cidade; geolocalização automática não foi solicitada.
- Open-Meteo Geocoding e Forecast são as fontes de cidade e meteorologia.
- O clima atual usa horário, temperatura, código do tempo, umidade, vento, pressão e precipitação. A previsão diária usa data, código, mínima, máxima e probabilidade de precipitação; a horária usa horário, temperatura, código, umidade, vento, precipitação e probabilidade de precipitação.
- A unidade inicial é Celsius; os textos e a formatação da interface usam pt-BR, e a busca solicita resultados em português (`language=pt`). Celsius e Fahrenheit são suportadas.
- É necessária conexão com a internet para obter dados atualizados; comportamento offline não está especificado.
- A previsão de cinco dias inclui hoje e os quatro dias seguintes no fuso local informado pela API.
- A aplicação atende consultas individuais; contas, colaboração e autenticação não foram mencionadas.
- A interface precisa funcionar em dispositivos móveis e telas maiores; a matriz de dispositivos e navegadores ainda não está definida.
- Persistência de preferências permanece fora das decisões desta versão.
- A previsão deve oferecer detalhamento diário e horário, conforme decisão confirmada.

## Risks

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Serviço meteorológico indisponível ou com limite de requisições | Média | Alto | Tratar falhas e limites, comunicar o problema e permitir nova tentativa; avaliar cache após decidir a fonte. |
| Busca retorna cidade homônima ou localização incorreta | Alta | Alto | Apresentar contexto geográfico nos resultados para apoiar a desambiguação. |
| Conexão lenta ou ausente impede a atualização | Média | Médio | Comunicar carregamento e falha; manter a interface utilizável e oferecer nova tentativa. |
| Interface difícil de usar em telas pequenas | Média | Alto | Projetar os fluxos para uso móvel e validá-los em diferentes larguras de tela. |
| Conversão de unidade inconsistente | Baixa | Alto | Usar uma regra única de conversão e verificar temperaturas atuais e previstas. |

## Out of Scope

Os itens abaixo não fazem parte do escopo confirmado pelo briefing e não devem ser considerados requisitos desta versão sem decisão adicional:

- Geolocalização automática.
- Autenticação, contas de usuário ou sincronização entre dispositivos.
- Favoritos ou histórico persistente de cidades.
- Consulta offline ou garantia de dados em cache.
- Alertas, notificações ou recomendações personalizadas.
- Idiomas além do que vier a ser definido para a interface.

## Open Questions (se restar alguma)

Permanecem abertas as questões abaixo, registradas originalmente no discovery:

1. A última cidade ou unidade deve ser lembrada entre visitas?
2. Deve haver suporte offline ou cache de dados anteriores?
3. Qual tempo de resposta é aceitável para busca e consulta?
4. Quais navegadores e versões precisam ser suportados?
