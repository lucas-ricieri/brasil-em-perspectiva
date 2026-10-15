# Conhecimento e instruções do projeto

Documento de continuidade atualizado em **15/10/2026**. A fotografia dos dados permanece com referência em **14/10/2026**; a revisão desta documentação não significa nova coleta.

## 1. Objetivo e decisões do usuário

Construir um dashboard/HTML para explorar indicadores econômicos e sociais dos presidentes **do Brasil**, desde 1994, comparar administrações e gerar um ranking com critérios ajustáveis.

A lista original continha conceitos americanos. O usuário confirmou a adaptação ao Brasil. O painel deve mostrar a diferença entre dado efetivamente carregado, adaptação parcial, fonte identificada e informação ainda não integrada.

O usuário informou e autorizou o envio do projeto à branch `main` de **https://github.com/lucas-ricieri/brasil-em-perspectiva**. Não presumir autorização para substituir histórico remoto ou alterar a visibilidade do repositório.

## 2. Localização e raiz correta

Pasta do trabalho:

```text
C:\Users\Ricieri\Documents\ChatGPT\presidentes
```

Raiz do código e do repositório que já contém o projeto:

```text
C:\Users\Ricieri\Documents\ChatGPT\presidentes\painel
```

Há dois diretórios `.git`: um na pasta externa `presidentes` e outro em `painel`. São repositórios independentes, não um submódulo configurado. O externo está vazio e enxerga `painel/` como não rastreado. Para este projeto, executar Git **dentro de `painel`**. Não executar `git add painel` na pasta externa: um repositório aninhado pode acabar registrado como referência de outro repositório, em vez dos arquivos esperados.

Não apagar ou mover nenhum `.git` automaticamente. Uma eventual consolidação da estrutura deve preservar o histórico existente e ser tratada como uma tarefa própria.

## 3. Estado funcional entregue

- Interface em português, com gráficos históricos, tabela anual e comparação lado a lado.
- 25 séries carregadas: 21 do Banco Mundial/WDI, incluindo PIB mundial, e 4 do BCB/SGS.
- Inventário com 45 itens da solicitação e suas adaptações ou lacunas.
- Ranking com pesos por dimensão, seleção de métricas, modo evolução/nível e tratamento de 2016.
- Opção de incluir o mandato atual e comparar crescimento do PIB brasileiro ao mundial.
- Exportação CSV das séries e do ranking, incluindo critérios e valores intermediários.
- HTML independente, com dados e lógica incorporados. Fontes tipográficas externas são opcionais e têm fallback local.
- Sem backend, cadastro de usuários, banco de dados de aplicação ou atualização automática.

Arquivo para abrir diretamente no navegador: [dist/index.html](dist/index.html).

## 4. Arquitetura e arquivos

| Arquivo/pasta | Papel |
| --- | --- |
| `template.html` | Estrutura e textos da página; contém marcadores substituídos pelo build. |
| `style.css` | Identidade visual, layout responsivo, impressão e estilos acessíveis. |
| `app.js` | Interações, gráficos SVG, comparação, catálogo e exportações CSV. |
| `model.js` | Funções puras de períodos, cobertura e cálculo do ranking; funciona no navegador e em Node. |
| `inventory.js` | Mapeamento dos 45 itens solicitados e suas fontes/limitações. |
| `data/snapshot.json` | Séries processadas, metadados, URLs, datas e erros de coleta. |
| `data/raw/` | Respostas originais das APIs e metadados WDI, para auditoria. |
| `dist/data.js` | Dados serializados em `window.DATA`, usados no build. |
| `dist/index.html` | Artefato final com CSS, dados, modelo, inventário e aplicação incorporados. |
| `dist/dados.csv` | Exportação da coleta; inclui 1993 como ano auxiliar. A interface começa em 1994. |
| `scripts/collect.py` | Coleta por APIs públicas usando somente a biblioteca padrão Python. |
| `scripts/build.py` | Monta o HTML independente e preserva a identidade da configuração de hospedagem. |
| `scripts/test-model.cjs` | Verificações do cálculo e da integridade dos dados utilizados. |
| `.openai/hosting.json` | Identidade do Site e configuração de saída estática em `dist`. |
| `README.md` | Documentação de uso, metodologia e limitações da versão atual. |

Não editar apenas `dist/index.html`: o próximo build sobrescreverá esse arquivo. Alterar as fontes e executar o build.

## 5. Fontes e conceitos dos dados

### Banco Mundial / WDI

API pública: `https://api.worldbank.org/v2/`. Os códigos e links específicos estão no snapshot e no catálogo do painel.

Dados carregados: PIB real, PIB por habitante, crescimento, desemprego, participação no trabalho, investimento, poupança nacional, Gini, pobreza, participações na renda, insegurança alimentar, expectativa de vida, mortalidade materna, homicídios, gastos de saúde, escolaridade e alfabetização; PIB mundial como contexto.

Ressalvas que devem continuar explícitas:

- Desemprego é estimativa modelada da OIT; não é a série observada da PNAD Contínua.
- Pobreza usa linhas internacionais em PPC de 2021: US$ 8,30 e US$ 3 por dia.
- Gini e participações por grupos se referem a renda/consumo, não patrimônio.
- PIB por habitante não substitui renda mediana das famílias.
- Poupança nacional não substitui poupança pessoal.
- Insegurança alimentar FAO/FIES não deve ser emendada à EBIA como se fosse a mesma medida.
- Escolaridade dos adultos não é taxa de formatura de uma coorte.
- Séries harmonizadas ainda podem conter mudanças de pesquisa, revisões e lacunas.

### Banco Central / SGS

| Código | Indicador | Tratamento anual |
| --- | --- | --- |
| 433 | IPCA mensal, origem IBGE | Composição dos 12 meses; somente anos completos. |
| 13762 | Dívida bruta do governo geral / PIB | Observação de dezembro; série desde 2006, metodologia a partir de 2008. |
| 5727 | Déficit nominal do governo geral / PIB | Observação de dezembro, acumulada em 12 meses; positivo indica déficit. |
| 4189 | Selic acumulada no mês e anualizada | Média das observações mensais anualizadas; não é meta Selic de dezembro. |

Não confundir governo geral com governo federal. Os indicadores fiscais não têm cobertura para toda a comparação histórica e ficam fora do ranking atual.

### Lacunas conhecidas

A consulta a `SH.UHC.SRVS.CV.XD` retornou indicador inexistente/arquivado. A resposta de erro foi preservada; valores não foram preenchidos.

Fontes nacionais adicionais foram identificadas para Caged, PNAD, educação, moradia, população de rua, Fies e Legislativo. A identificação da fonte não significa que os dados tenham sido extraídos. Ver `inventory.js` para a situação de cada item.

## 6. Recortes presidenciais

| Administração | Anos considerados no padrão |
| --- | --- |
| Itamar Franco | Somente 1994; aparece no histórico, sem nota. |
| Fernando Henrique Cardoso | 1995–2002; dois mandatos agrupados. |
| Lula I–II | 2003–2010; dois mandatos agrupados. |
| Dilma Rousseff | 2011–2015; 2016 é compartilhado e excluído no padrão. |
| Michel Temer | 2017–2018; 2016 é compartilhado e excluído no padrão. |
| Jair Bolsonaro | 2019–2022. |
| Lula III | 2023–2025; mandato em andamento na referência da coleta. |

As séries anuais terminam em 2025. Observações mensais de 2026 são mostradas separadamente. O usuário pode atribuir 2016 a Dilma ou Temer como teste de sensibilidade, sem presumir uma divisão de dados anuais por mês.

## 7. Regras do ranking

1. A métrica deve ter, em todos os governos selecionados, pelo menos duas observações, 60% dos anos cobertos e observações a no máximo um ano de cada extremo do recorte.
2. Ausências não viram zero e não são interpoladas.
3. No modo evolução: `(último valor − primeiro valor) / anos decorridos`, com observações dentro do período. Não representa mudança desde a posse.
4. PIB e IPCA usam sempre a média das taxas anuais. No modo nível, as demais métricas também usam a média.
5. Por métrica, normalizar resultados entre 0 e 100 dentro do conjunto selecionado, considerando a direção desejável. Melhor recebe 100, pior recebe 0 e empate total recebe 50.
6. Fazer a média dentro de cada dimensão e aplicar pesos relativos entre dimensões. Padrão: economia, condições sociais e saúde/segurança com peso 1 cada.
7. Dimensões sem métricas elegíveis não entram no denominador. Se todos os pesos forem zero ou não houver métricas ativas, não produzir nota.
8. A ordem usa a precisão completa. A nota mostrada usa duas casas decimais.

A cesta comum padrão tem seis métricas: PIB, IPCA, desemprego OIT, Gini, pobreza US$ 8,30 e expectativa de vida. Ao excluir Lula III, mortalidade materna e homicídios podem passar pelo filtro de cobertura, totalizando oito métricas no snapshot atual.

No padrão, a dimensão saúde/segurança é composta apenas por expectativa de vida. A dimensão não representa cobertura completa de saúde e segurança. Finanças públicas, educação e moradia ficam fora da nota atual.

Comparar PIB ao mundo significa calcular a diferença descritiva entre taxas anuais. Não implementa ajuste causal. As notas dependem dos pesos, períodos e governos selecionados. Preservar a explicação de heranças, choques externos, políticas estaduais, duração dos governos e revisões das fontes.

## 8. Como executar e desenvolver

Ambiente verificado nesta máquina: Windows/PowerShell, Git 2.56.0.windows.1, Node 24.21.0 e Python 3.14.8. Não há dependências npm ou pip a instalar para os scripts atuais.

Entrar na raiz correta:

```powershell
Set-Location -LiteralPath 'C:\Users\Ricieri\Documents\ChatGPT\presidentes\painel'
```

Reconstruir a partir dos dados já coletados:

```powershell
python scripts/build.py
```

Validar JavaScript e cálculo:

```powershell
node --check app.js
node scripts/test-model.cjs
```

Visualizar com servidor local, se necessário:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Abrir `http://127.0.0.1:8765/`. Encerrar somente o servidor iniciado para a tarefa, com Ctrl+C no terminal correspondente. Abrir `dist/index.html` diretamente também funciona.

Nova coleta, apenas quando a tarefa pedir atualização:

```powershell
python scripts/collect.py
python scripts/build.py
node scripts/test-model.cjs
```

Antes de mudar a data de referência, revisar `ASOF`, os limites de consulta, o corte anual, os recortes dos governos e os textos de datas em toda a aplicação. A coleta usa datas fixadas para esta edição; mudar apenas `ASOF` não atualiza todos os limites. Preservar o snapshot anterior quando houver necessidade de comparar revisões. As APIs podem devolver revisões históricas, portanto repetir a consulta não recupera necessariamente a mesma versão antiga.

O build depende de `dist/data.js` e de `.openai/hosting.json`, ambos já versionados. Não excluir esses arquivos do checkout sem adaptar o processo.

## 9. Instruções para futuras alterações

- Ler este documento e `README.md` antes de continuar.
- Preservar transparência metodológica, links, datas, unidades e distinção entre renda e patrimônio.
- Não preencher lacunas, trocar conceitos ou agregar séries incompatíveis sem explicação visível.
- Ao adicionar uma métrica: definir fonte, unidade, periodicidade, direção, cobertura e elegibilidade; atualizar catálogo e documentação.
- Alterar o ranking em `model.js`; manter a interface em `app.js` e os textos no template coerentes com a regra final.
- Reconstruir o HTML depois de alterações em fontes ou dados.
- Verificar no navegador as interações afetadas e os estados sem dados. Testes do modelo não substituem inspeção da interface.
- Os testes atuais esperam seis métricas na cesta padrão e oito sem Lula III; reavaliar essas expectativas quando houver nova coleta.
- Não salvar tokens, credenciais temporárias ou cabeçalhos de autenticação em arquivos ou no histórico Git.
- Não publicar ou executar push para um destino presumido. Usar a URL que o usuário fornecer e inspecionar o histórico remoto antes de integrá-lo.
- Não usar force push nem substituir histórico remoto por rotina.

## 10. Hospedagem e situação de publicação

Existe configuração de Site em `.openai/hosting.json`, com saída estática `dist`. A identidade existente deve ser preservada se a hospedagem Sites for retomada; não criar outro Site para o mesmo projeto por tentativa.

A execução anterior gerou o commit local `e8c93f6550068b440fd95ce346d41f63732267d0` (`Update Site source`), com autoria técnica `Sites <sites@users.noreply.openai.com>`. Houve falha na etapa de empacotamento: o helper tentou iniciar `bash`, e o processo não foi iniciado nesse ambiente. **Não há publicação concluída com URL validada registrada nesta documentação.** A existência de configuração de hospedagem ou de commit não prova deploy.

Credenciais temporárias obtidas anteriormente não devem ser reaproveitadas como configuração permanente. O remote `origin` foi configurado para `https://github.com/lucas-ricieri/brasil-em-perspectiva.git`. Hospedagem Sites e envio ao GitHub são operações distintas.

## 11. Verificação Git em 15/10/2026

| Verificação | Resultado observado |
| --- | --- |
| Git instalado | Sim, versão 2.56.0.windows.1. |
| Repositório do código | `presidentes/painel`. |
| Branch | `main`. |
| Histórico inicial local | Commit `e8c93f6`, criado pelo Sites. |
| Integridade | `git fsck --full` sem problemas reportados na verificação. |
| Alterações antes desta documentação | Árvore limpa; documentação adicionada para o envio autorizado. |
| Remote | `origin`: `https://github.com/lucas-ricieri/brasil-em-perspectiva.git`. |
| Identidade para novos commits | Lucas, `lr.siquinelli@gmail.com`, confirmados na configuração efetiva. |
| Repositório externo | `presidentes`: branch inicial `master`, sem commits e sem remote; contém o repositório interno não rastreado. |
| Histórico remoto inspecionado | `origin/main` tinha o commit `ecd1892` (`Initial commit`) e somente um README inicial. Integrar esse histórico, preservando a documentação completa local. |
| Autenticação | Consulta e fetch do remoto funcionaram; a confirmação de escrita depende do resultado do push. |

A configuração `core.autocrlf` efetiva está como `true`. Evitar conversão em massa das terminações de linha sem necessidade.

Para os próximos envios, usar o repositório interno e conferir `git status`, o histórico remoto e a autoria efetiva. O envio inicial autorizado deve integrar os históricos local e remoto, manter o README completo e configurar `main` para acompanhar `origin/main`. Não alterar autoria de commits existentes automaticamente. Após cada push, confirmar que o SHA remoto corresponde ao HEAD local e que a árvore está limpa.

## 12. Próximos passos possíveis

- Continuar o versionamento em `https://github.com/lucas-ricieri/brasil-em-perspectiva`, na branch `main`, preservando o histórico.
- Resolver o empacotamento da hospedagem, caso o usuário queira continuar com Sites.
- Ampliar fontes nacionais, especialmente renda real, mercado de trabalho observado, educação, segurança e moradia, com tratamento das quebras metodológicas.
- Acrescentar análises de sensibilidade e incerteza, sem apresentar o ranking descritivo como prova causal.

Este documento registra fatos e instruções do projeto; o estado do Git e das APIs deve ser novamente consultado em tarefas futuras, pois pode mudar.
