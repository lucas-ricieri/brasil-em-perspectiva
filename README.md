# Brasil em perspectiva

Painel estático em português para acompanhar indicadores do Brasil desde 1994, comparar **mandatos separados**, examinar políticas públicas e explorar investimento e comércio exterior.

Abra `dist/index.html` diretamente no navegador. Dados, gráficos e lógica estão incorporados: nenhuma API, conta ou servidor é necessário para usar o painel. Fontes tipográficas externas têm alternativa local. Repositório: [lucas-ricieri/brasil-em-perspectiva](https://github.com/lucas-ricieri/brasil-em-perspectiva).

## Estado da edição · 16/10/2026

- **43 séries**: 32 WDI, quatro BCB/SGS, uma ANP, quatro Tesouro/COFOG e duas MDIC.
- **Índice País** anual com seis áreas, 14 métricas, pesos ajustáveis, auditoria e CSV.
- **Dez recortes de mandato**, incluindo o único ano de Itamar no painel e o mandato atual parcial.
- **38 marcos históricos**, associados às métricas segundo `marcos-de-interesse.md`, com filtros de área, tipo, abrangência, relevância e quantidade.
- **56 ações e tentativas documentadas** nos perfis, com seis áreas e foco em combate ao crime, ciência e economia.
- Composição de exportações por atividade e tipo de uso, valor adicionado setorial e capital estrangeiro em gráficos de rosca interativos.
- **20 casos empresariais documentados**: oito marcos de unicórnios e 12 movimentos, separados em entrada, expansão, fechamento fabril, venda de controle e saída operacional.
- Paleta: azul `#728EAD`, verde `#7FB5A4`, bege `#E6DFD3`, mostarda `#D5AD6D` e terracota `#C57E74`. Cores partidárias permanecem como codificação histórica específica.

Não há backend, atualização automática ou avaliação causal dos presidentes. A edição atual inclui o fluxo de publicação no GitHub Pages descrito abaixo. Hospedagem GitHub Pages e a configuração Sites existente são independentes.

## Índice País · versão 1

O índice descreve níveis anuais observados no país. Não é uma medida oficial de bem-estar, de cumprimento de promessas ou do efeito de um presidente.

| Área | Cesta fixa | Direção adotada |
| --- | --- | --- |
| Economia | PIB real por habitante, crescimento real, desemprego OIT e IPCA | Maior nos dois primeiros; menor nos dois últimos |
| Condições sociais | Gini de renda e pobreza US$ 8,30 PPC 2021 | Menor |
| Saúde e segurança | Expectativa de vida e homicídios intencionais | Maior longevidade; menos homicídios |
| Educação | Adultos com ensino médio e alfabetização | Maior |
| Ciência e tecnologia | Dispêndio nacional em P&D e uso de internet | Maior esforço/acesso, sem equivalência com produtividade |
| Finanças públicas | Dívida bruta e déficit nominal do governo geral | Menor, uma escolha normativa que não mede qualidade do gasto |

A referência inclui as observações disponíveis de **1994–2025**, para cada métrica. A normalização padrão usa percentis históricos 10 e 90, por interpolação linear: `(valor − p10)/(p90 − p10)`, limitada ao intervalo 0–1 e multiplicada por 100. A direção é invertida quando se escolheu menor. O modo alternativo usa mínimo e máximo históricos. Uma referência totalmente empatada recebe 50. A seleção de mandatos não altera esses limites; uma revisão do snapshot pode alterá-los.

Uma área só recebe nota quando **todas as métricas de sua cesta fixa estão observadas no ano**. A nota de área é a média simples das métricas normalizadas; o índice é a média ponderada das áreas com peso positivo. Pesos padrão iguais. Todos os pesos zero resultam em ausência de nota. Não se interpolam dados nem se substitui ausência por zero.

**Modo exploratório:** áreas incompletas são omitidas e os pesos são redistribuídos entre as áreas completas disponíveis. Os pontos e trechos parciais são identificados e a cobertura aparece por ano e mandato. As notas parciais podem ter composição diferente e não constituem uma comparação de cesta constante.

**Exigir todas as áreas:** a nota só existe quando todas as áreas com peso positivo estão completas. Com pesos padrão e os dados desta edição, isso ocorre em 2006–2009 e 2011–2023. Em 2010 há lacuna de pesquisa social; antes de 2006 falta cobertura fiscal completa, além de outras lacunas. Não se fabrica um índice completo para os mandatos antigos ou para os anos finais sem cobertura.

Por mandato, mostramos média dos índices anuais observados, primeiro/último ano efetivo, notas por área e cobertura. Um recorte com um único ano pode ser descrito, mas não oferece tendência. Notas das áreas podem usar janelas diferentes, explicitadas em suas contagens, e não recompõem necessariamente a média do índice anual.

Limites: PIB por habitante não é renda mediana; indicadores de escolaridade e acesso digital carregam tendência temporal; P&D é insumo/esforço; gastos e resultados não são equivalentes. Maior pontuação é desejável apenas segundo a regra escolhida, não comprova superioridade causal. Não estimamos incerteza estatística. Referência de construção: [manual OCDE](https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators_533411815016.html).

## Mandatos e transição

| Recorte | Anos anuais no padrão |
| --- | --- |
| Itamar | Apenas 1994; o mandato começou em 1992 |
| FHC I | 1995–1998 |
| FHC II | 1999–2002 |
| Lula I | 2003–2006 |
| Lula II | 2007–2010 |
| Dilma I | 2011–2014 |
| Dilma II | 2015; governo até 2016 |
| Temer | 2017–2018; assumiu em 2016 |
| Bolsonaro | 2019–2022 |
| Lula III | 2023–2025 publicados; mandato em andamento |

2016 permanece no gráfico e no índice anual, sem atribuição por padrão. O controle do Índice País permite atribuí-lo a Dilma II ou Temer como sensibilidade, também nos recortes numéricos das comparações. Não se dividem observações anuais em dados mensais presumidos.

Os perfis usam a data do ato, separando CT&I de janeiro/2016 (Dilma) e atos de Temer posteriores à transição. Ações de mandatos consecutivos são filtradas pelas datas; os resumos de orientação são da presidência na amostra, identificados assim na interface.

## Investimento, setores e exportações

| Conteúdo | Cobertura | Definição |
| --- | --- | --- |
| IED recebido em US$ e % PIB | 1994–2025 na interface | Entradas líquidas; inclui aquisições, lucros reinvestidos e outras operações, não apenas projetos novos |
| Reservas internacionais, incluindo ouro | 1994–2025 na interface | Estoque no encerramento do ano, WDI; ativos administrados pelo BCB, expressos em US$, não saldo de dólares livres no Tesouro |
| Investimento interno fixo | 1994–2025, conforme a série | Formação bruta de capital fixo, público e privado, % PIB |
| Exportações/importações de mercadorias | 1997–2025 | Valores correntes FOB do MDIC; não inclui comércio de serviços |
| Exportações por atividade | 1997–2025 | Agropecuária, extrativa, transformação e outros produtos; soma exata ao total oficial |
| Exportações por tipo de uso | 1997–2025 | CGCE: bens de capital, intermediários, consumo, combustíveis/lubrificantes e eventual residual não classificado explícito |
| Valor adicionado por setor | Pizza em 1995–2025 | Participações WDI de agropecuária, indústria/construção e serviços no PIB; a pizza renormaliza o valor adicionado dos três setores para 100% |
| Capital estrangeiro por setor | Estoque ao fim de 2024 | Participação no capital: US$ 884,8 bi, BCB/RID; exclui operações intercompanhia e não representa fluxo anual |
| Internet e patentes residentes | 1994–2024 | Acesso à internet em % da população e número de pedidos de residentes; patentes não equivalem a concessões ou inovação realizada |

As séries setoriais brutas são preservadas; na composição de valor adicionado, a parcela fora dos três setores e a base percentual são visíveis. Os anos 1993/94 foram excluídos da pizza porque as participações publicadas não permitiam uma composição consistente nesta coleta. Participação no tamanho da economia não é contribuição ao crescimento. Agropecuária não é toda a cadeia do agronegócio.

Os percentuais setoriais de estoque de IED são os arredondados publicados pelo BCB. A pizza cobre 100%, com “demais setores”. Não apresentamos estoque como se fosse investimento recebido no ano ou um histórico setorial por mandato.

Os oito unicórnios e 12 movimentos são **amostra documental, não totais nacionais**. A data do unicórnio é a avaliação privada histórica de US$ 1 bilhão, não a fundação ou avaliação atual. Holding estrangeira é explicitada quando relevante. Uma expansão não conta como nova entrada; Ford/Mercedes são encerramentos fabris e HSBC/Walmart são vendas de controle. Contagens por mandato não medem saldo nacional nem atribuem criação ao presidente. As limitações e ausências da amostra ficam acessíveis no painel.

Não foi integrada uma série nacional de **P&D exclusivamente público** nesta coleta: a série WDI é público+privado. O acesso automatizado ao MCTI foi bloqueado, sem preenchimento ou substituição conceitual. Também não há censo histórico comparável de entradas/saídas de grandes empresas ou unicórnios.

## Eventos e perfis

`marcos-de-interesse.md` é o catálogo de orientação fornecido pelo usuário e permanece preservado. `event-catalog.js` associa fontes e métricas aos eventos; a seleção padrão mostra marcos prioritários relacionados ao indicador e respeita o recorte. Há filtros de área, tipo, Brasil/mundo e quantidade. Suez fica secundário e ligado a comércio; Coronaday não é tratado como variação diária de PIB. Aprovação, entrada em vigor e implantação de uma política têm datas distintas.

`context.js` e `policy-expansion.js` contêm os perfis documentais: medidas aprovadas, planos anunciados, propostas não aprovadas, rejeição parlamentar e devolução parcial são estados distintos. PEC é proposta; EC é emenda promulgada pelo Congresso. As iniciativas parlamentares não são atribuídas exclusivamente ao Executivo. Por exemplo, o referendo do art. 35 não rejeitou todo o Estatuto do Desarmamento.

O filtro permite navegar pelas seis áreas, com subfoco de combate ao crime e seleção de situação documental. “Nenhum marco na amostra” não significa ausência de política. As fontes e limites aparecem em cada ação, junto a indicador relacionado que pode ser apenas uma aproximação. Não há auditoria completa de promessas ou estimativa causal de impacto.

## Ranking de evolução anterior

Mantido em uma seção expansível, distinto do Índice País. Usa a cesta comum de candidatos elegíveis em todos os mandatos com pelo menos dois anos exclusivos, cobertura de 60% e observações a até um ano dos extremos. Itamar fica fora e Dilma II permanece sem nota quando só 2015 está atribuído, sem impedir o cálculo dos demais.

No modo evolução, `(último − primeiro)/anos decorridos` usa observações internas ao período; não mede a mudança desde a posse. PIB e IPCA sempre usam média anual; no modo nível, as demais métricas também usam média. A normalização min–max é entre os mandatos comparáveis selecionados, com empate total = 50, média dentro das três dimensões e pesos entre dimensões. Notas e posições mudam com o conjunto selecionado. A separação de mandatos **alterou legitimamente as notas desta edição**; os valores das séries anteriores foram preservados.

## Fontes e limites adicionais

A base original foi consultada em 14/10/2026, a extensão de despesas em 15/10/2026 e a de investimentos em 16/10/2026. `collectedAt` é preservado por série e não se confunde com atualização da fonte. Os anos anuais param em 2025; observações mensais de 2026 aparecem separadas.

- WDI/OIT: desemprego modelado, não PNAD Contínua observada. Pobreza em PPC 2021; Gini e participações medem renda/consumo, não patrimônio. Séries harmonizadas têm revisões, lacunas e mudanças de pesquisa.
- BCB/SGS: IPCA anual composto dos 12 meses; DBGG e déficit nominal são governo geral. DBGG tem metodologia a partir de 2008, série desde 2006. Selic é média de observações mensais anualizadas, não meta de dezembro.
- ANP: gasolina é média simples dos 12 preços mensais nacionais em R$/litro nominais. 2001 parcial e 2020 sem pesquisa em parte do período ficam sem média anual. A abrangência e a ponderação mudam historicamente; preços não estão deflacionados.
- Tesouro/COFOG: governo geral consolidado, série 2010–2024 sujeita a revisão. Ordem pública e segurança inclui polícia, bombeiros, Justiça e prisões. Coluna 31 é investimento bruto em ativos não financeiros, aquisição menos venda, não despesa total. Frações percentuais XLSX foram multiplicadas por 100.
- Despesa pública em educação, despesa corrente pública doméstica em saúde e P&D têm escopos diferentes; não foram concatenadas como se fossem a mesma medida de gasto. Mais gasto isoladamente não prova melhor resultado.
- O erro do antigo indicador WDI `SH.UHC.SRVS.CV.XD` foi preservado, sem criação de valores. Ausência de seguro privado não implica falta de cobertura SUS.

## Executar e reproduzir

Build e testes puros não exigem dependências npm/pip:

```bash
python scripts/build.py
node scripts/test-model.cjs
node scripts/test-context.cjs
node scripts/test-country.cjs
python scripts/test-investment.py
```

Para reproduzir as extensões com os arquivos preservados, sem rede:

```bash
python scripts/extend-data.py --cached
python scripts/collect-investment.py --cached
python scripts/integrate-data.py
python scripts/build.py
```

Uma nova coleta com rede deve ser uma tarefa explícita. A coleta completa exige `collect.py`, depois `extend-data.py`, `collect-investment.py`, `integrate-data.py` e build. Datas e limites são fixos à edição: revisar antes de alterar o recorte. APIs podem revisar a história. A integração recusa substituir valores novos já incorporados sem tratamento explícito de revisão.

O coletor de investimento valida TLS por padrão. O host local não completou a cadeia de certificados do MDIC durante esta edição; a coleta pública foi registrada com exceção restrita ao domínio, ativável somente por `--insecure-mdic`, e hashes das respostas em `data/raw/investment-fetch-log.json`. Não houve alteração global de TLS ou armazenamento de credenciais.

Prévia opcional:

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory dist
```

O teste opcional `scripts/test-browser.cjs` usa Playwright já instalado no ambiente, via `PLAYWRIGHT_MODULE`, e `PREVIEW_URL` se a porta mudar. Não é dependência do painel ou do build.

## Arquitetura e continuidade

Fontes visuais: `template.html`, `style.css`, `theme.css`. Lógica: `app.js`, `context-ui.js`, `timeline.js`, `country-ui.js`, `investment-ui.js`. Modelos puros: `model.js` e `country-model.js`. Conteúdo: `context.js`, `policy-expansion.js`, `event-catalog.js`, `inventory.js` e JSONs de dados.

Não editar somente `dist/index.html`; o build sobrescreve o artefato. Preservar `.openai/hosting.json`, os arquivos-fonte e as respostas originais. Os snapshots anteriores estão em `data/archive/`. Consulte `CONHECIMENTO_DO_PROJETO.md` para instruções de continuidade.

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` valida os modelos e dados, reconstrói o HTML a partir do snapshot versionado e publica **somente `dist/`**. Não executa nova coleta e não requer backend ou segredos adicionais. `dist/index.html` é servido como página principal; não é necessário mover arquivos para a raiz ou para `docs/`.

Ativação inicial no repositório:

1. Abra [Settings → Pages](https://github.com/lucas-ricieri/brasil-em-perspectiva/settings/pages).
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Em [Actions](https://github.com/lucas-ricieri/brasil-em-perspectiva/actions), abra **Publicar painel no GitHub Pages**, escolha **Run workflow → main → Run workflow**. Se houver uma execução anterior que falhou antes da ativação, reexecute-a.
4. Aguarde o job `deploy` concluir. A URL será apresentada no ambiente `github-pages` e no resumo da execução.

Endereço padrão esperado após a publicação: [lucas-ricieri.github.io/brasil-em-perspectiva/](https://lucas-ricieri.github.io/brasil-em-perspectiva/). A URL só confirma publicação depois de uma execução bem-sucedida; a configuração do workflow, por si só, não significa deploy concluído.

Depois da ativação inicial, cada push na `main` dispara a publicação. O workflow declara `pages: write` e `id-token: write` apenas no job de deploy, além de `contents: read` para obter o projeto. Se o repositório restringir Actions ou proteger o ambiente `github-pages`, o GitHub mostrará essa restrição na execução; revisar as regras existentes em vez de desativá-las automaticamente.

Referência: [workflows personalizados do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
