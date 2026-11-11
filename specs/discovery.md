# Discovery — Aplicação de Previsão do Tempo

## Contexto

A empresa solicita uma aplicação de previsão do tempo para pessoas que precisam consultar as condições de uma cidade. O briefing define cinco capacidades principais: buscar cidades, ver o clima atual, consultar a previsão de cinco dias, alternar entre Celsius e Fahrenheit e usar a aplicação em dispositivos móveis. Público-alvo, fonte de dados e detalhes da experiência ainda precisam ser esclarecidos.

## Requisitos Funcionais

- **RF1 — Buscar cidades:** permitir que a pessoa usuária pesquise uma cidade.
- **RF2 — Ver clima atual:** apresentar as condições meteorológicas atuais da cidade selecionada.
- **RF3 — Ver previsão:** apresentar a previsão do tempo para cinco dias, com detalhamento diário e horário.
- **RF4 — Alternar unidade de temperatura:** permitir alternar entre Celsius e Fahrenheit e refletir a unidade escolhida nos valores exibidos.

## Requisitos Não-Funcionais

- **RNF1 — Usabilidade móvel:** os fluxos de busca e consulta devem ser utilizáveis em dispositivos móveis, conforme solicitado no briefing.
- **RNF2 — Responsividade:** o conteúdo e os controles devem se adaptar a telas de diferentes tamanhos sem perda de informação ou funcionalidade.
- **RNF3 — Acessibilidade:** busca, seleção de cidade e alternância de unidade devem ser acessíveis por teclado e possuir nomes e estados identificáveis por tecnologias assistivas.
- **RNF4 — Consistência:** a unidade selecionada deve ser aplicada de forma uniforme a todas as temperaturas apresentadas.
- **RNF5 — Resiliência:** falhas de rede ou do serviço de dados devem ser comunicadas de forma compreensível, sem deixar a interface em estado indefinido.
- **RNF6 — Desempenho percebido:** a aplicação deve fornecer feedback durante buscas e consultas demoradas e manter os controles responsivos.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação inicial |
| --- | --- | --- | --- |
| Serviço de dados indisponível ou com limite de requisições | Média | Alto | Tratar falhas e limites, comunicar o problema e permitir nova tentativa; avaliar cache após definir a fonte. |
| Busca encontra cidades homônimas ou localiza a cidade errada | Alta | Alto | Exibir contexto suficiente, como estado ou país, para ajudar a pessoa usuária a distinguir resultados. |
| Conexão lenta ou ausente impede a atualização dos dados | Média | Médio | Exibir estado de carregamento e mensagem de erro clara; definir posteriormente se haverá cache. |
| Interface fica difícil de usar em telas pequenas | Média | Alto | Priorizar o uso móvel e validar os fluxos em larguras de tela representativas. |
| Conversão de Celsius e Fahrenheit apresenta valores inconsistentes | Baixa | Alto | Aplicar uma regra única de conversão e testar as temperaturas em todos os locais de exibição. |

## Perguntas do Discovery e Decisões

1. Qual fonte de dados meteorológicos será utilizada e quais são seus custos, limites e requisitos de acesso? **Decisão:** Open-Meteo Geocoding e Forecast, conforme a stack do projeto. Antes da produção, verificar limites e termos de uso.
2. A previsão de cinco dias inclui o dia atual ou os cinco dias seguintes? **Decisão (2026-11-11):** inclui hoje e os quatro dias seguintes, conforme as datas locais da API.
3. Quais informações devem aparecer no clima atual e na previsão, além da temperatura e da condição do tempo? **Decisão:** atuais: horário, temperatura, código, umidade, vento, pressão e precipitação; diários: data, código, mínima, máxima e probabilidade de precipitação; horários: hora, temperatura, código, umidade, vento, precipitação e probabilidade de precipitação.
4. Como devem ser diferenciadas cidades com o mesmo nome nos resultados da busca? **Decisão:** exibir nome, região/estado e país quando disponíveis, e exigir seleção antes de consultar o clima.
5. Qual unidade deve ser selecionada inicialmente? **Decisão:** Celsius, conforme o estado inicial implementado e a convenção do projeto.
6. A aplicação deve solicitar a localização do dispositivo ou usar somente a busca manual? **Decisão:** usar busca manual; geolocalização não foi solicitada.
7. Quais idiomas devem ser suportados? **Decisão:** pt-BR para a interface e `language=pt` na busca de cidades; outros idiomas ficam fora desta versão.
8. A última cidade ou unidade escolhida deve ser lembrada entre visitas? **Impacto:** define requisitos de persistência e expectativas de privacidade.
9. A aplicação precisa funcionar sem conexão ou exibir dados armazenados em cache? **Impacto:** altera o comportamento offline e a arquitetura de armazenamento.

## Suposições

- A aplicação é destinada a consultas individuais; o briefing não menciona colaboração ou contas de usuário.
- A busca de cidade é iniciada pela pessoa usuária, pois geolocalização automática não foi solicitada.
- O uso depende de uma conexão com a internet para obter dados atualizados, já que suporte offline não foi especificado.
- Celsius e Fahrenheit são as únicas unidades de temperatura necessárias, conforme informado no briefing.
- O detalhamento da previsão deve ser diário e horário, conforme decisão confirmada para o produto.
- Open-Meteo é a fonte de dados selecionada; a unidade inicial é Celsius e a interface usa pt-BR.
- Persistência de preferências permanece em aberto.
