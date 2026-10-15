# Brasil em perspectiva

Repositório: [lucas-ricieri/brasil-em-perspectiva](https://github.com/lucas-ricieri/brasil-em-perspectiva). Instruções de continuidade: [CONHECIMENTO_DO_PROJETO.md](CONHECIMENTO_DO_PROJETO.md).

Dashboard em português para explorar governos brasileiros desde 1994. Consulta das fontes em **14/10/2026**. HTML com dados, estilos e lógica incorporados: `dist/index.html`. Abre diretamente no navegador; não requer servidor ou conexão para as interações. As fontes tipográficas externas são opcionais e têm fallback local.

## Conteúdo

- 25 séries verificadas: 21 do Banco Mundial/WDI (incluindo PIB mundial), 4 do BCB/SGS.
- 45 itens no inventário da lista original: carregados, adaptados, fontes identificadas ou não integrados.
- Gráficos com lacunas preservadas, tabela anual e comparação de administrações.
- Ranking exploratório com pesos, seleção de métricas, modo evolução/nível, tratamento de 2016 e referência mundial para PIB.
- Exportação de valores e de ranking com critérios, janelas efetivas, fontes e valores intermediários.

## Recortes e método

Itamar só aparece em 1994, fora do ranking. FHC 1995–2002; Lula I–II 2003–2010; Dilma 2011–2015; Temer 2017–2018; Bolsonaro 2019–2022; Lula III 2023–2025 (mandato atual, incompleto). 2016 é compartilhado e fica fora por padrão; pode ser atribuído a Dilma ou Temer como sensibilidade. Não se infere uma divisão mensal de dados anuais.

Os anos anuais terminam em 2025. Últimas observações mensais de 2026 aparecem separadas e não recebem nota anual. A cobertura varia por indicador; datas aparecem em cada visualização. Não há previsão ou atualização automática.

Uma métrica precisa de 2 observações ou mais, 60% dos anos cobertos e uma observação a no máximo um ano de cada extremo para **todos** os governos selecionados. No modo evolução, usa-se `(último - primeiro)/(ano final - ano inicial)` dentro do período, sem fabricar um valor na posse. PIB e IPCA usam sempre média das taxas anuais. IPCA anual é produto dos 12 fatores mensais menos um. Nível médio usa média aritmética das observações.

Por métrica, normalização min-max entre os governos selecionados, com direção desejável explícita. Empate total recebe 50. A média das métricas de cada dimensão é agregada por pesos relativos (padrão 1:1:1). Dimensão vazia não recebe peso, ausências não viram zero, pesos todos zero resultam em ausência de nota. Ordenação usa precisão completa; exibição usa duas casas.

A cesta padrão é PIB, IPCA, desemprego OIT, Gini, pobreza US$ 8,30 PPC 2021 e expectativa de vida. Mortalidade materna e homicídios não têm 2 anos publicados para Lula III nesta coleta; podem entrar ao excluir esse governo. Não há indicadores fiscais, educacionais ou habitacionais no ranking atual. O número de dimensões não significa que todos os assuntos de cada dimensão tenham sido medidos. O peso da saúde é, no padrão, inteiramente expectativa de vida.

**Não é avaliação causal ou definitiva de presidentes.** Os pesos são normativos, min-max é sensível aos governos incluídos, os períodos têm durações distintas, as janelas sociais podem ser menores e os resultados carregam heranças, mudanças metodológicas e choques. PIB relativo ao mundo é uma diferença descritiva, não um controle econométrico. Não há ajuste automático por Congresso, pandemia, demografia, commodities ou políticas estaduais. Notas próximas não representam diferença estatisticamente significativa; não foram estimados intervalos de incerteza. Nenhuma série foi escolhida em função da ordem produzida pelo ranking.

## Fontes e limitações

- Banco Mundial: APIs `api.worldbank.org/v2`, com metadados, organização de origem, valores e data de atualização preservados. Desemprego é estimativa modelada OIT, não PNAD Contínua observada. Pobreza usa PPC 2021. Gini e participações referem-se a renda/consumo, não patrimônio. As séries sociais harmonizadas não eliminam todas as quebras metodológicas.
- BCB: SGS 433 (IPCA/IBGE), 13762 (DBGG), 5727 (déficit nominal do governo geral), 4189 (Selic mensal anualizada). DBGG e déficit são governo geral, não apenas federal. Selic anual é média das taxas mensais anualizadas. A API não forneceu data de revisão; a data da consulta não é apresentada como revisão da fonte.
- Metadados e licenças devem ser consultados nos links por série. WDI tem fontes de diversas organizações; portal BCB usa ODbL.
- A tentativa de carregar `SH.UHC.SRVS.CV.XD` retornou indicador inexistente/arquivado. Erro preservado no snapshot, sem fabricação ou preenchimento. Não ter seguro privado não equivale a não ter cobertura de saúde no Brasil.
- Fontes nacionais adicionais foram mapeadas para extensão futura (IBGE, Inep, FJP, Ipea, Câmara e MEC). **Fonte identificada não significa série extraída ou integrada.** O inventário explicita a situação.

## Arquivos

- `dist/index.html`: painel independente.
- `dist/dados.csv`: valores coletados (inclui 1993 como ano auxiliar, fora da visualização).
- `data/snapshot.json`: dados processados, metadados, URLs de coleta e erros.
- `data/raw/`: respostas originais das APIs e metadados WDI.
- `model.js`: cálculo do ranking, independente da interface.
- `app.js`, `style.css`, `template.html`, `inventory.js`: fontes da aplicação.
- `scripts/collect.py`: coleta via biblioteca padrão Python; data de referência fixada para reproduzir o recorte. Uma nova coleta pode trazer revisões históricas; não garante recuperar versões antigas das APIs.
- `scripts/build.py`: gera HTML independente e configuração estática.
- `scripts/test-model.cjs`: verificações do modelo e dos dados.

Para reconstruir com o snapshot existente, executar `python scripts/build.py`. Para verificar os cálculos: `node scripts/test-model.cjs`. Para recoletar: `python scripts/collect.py` e depois reconstruir. Não é necessário instalar dependências.

## Verificação realizada

Testes de cobertura, cesta comum, pesos zero, seleção vazia, empates, limites das notas, transição 2016, diferença anualizada e composição do IPCA. Verificação no navegador de renderização, alteração dos critérios, pesos, inclusão do mandato atual, catálogo/busca, gráfico sem dados e download CSV. Console sem erros observados. As fontes podem revisar valores depois desta data.
