'use strict';
// QA opcional: PLAYWRIGHT_MODULE pode apontar para o Playwright já instalado no ambiente.
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),url=process.env.PREVIEW_URL||'http://127.0.0.1:8765/';
(async()=>{
 const browser=await chromium.launch({headless:true});const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#countryAreas .area-card').count(),6);
  assert.equal(await page.locator('#countryTerms tbody tr').count(),10);
  assert((await page.locator('#countryValue').innerText()).includes('6/6'));
  await page.locator('#countryStrict').check();assert((await page.locator('#countryTerms tbody tr').filter({hasText:'FHC I'}).first().innerText()).includes('Sem índice'));
  await page.locator('#countryStrict').uncheck();
  await page.locator('#countryYear').selectOption('2025');assert((await page.locator('#countryValue').innerText()).includes('cobertura parcial'));
  await page.locator('#countryYear').selectOption('2023');
  await page.locator('#countryScale').selectOption('range');assert((await page.locator('#countryValue strong').innerText()).length>2);
  await page.locator('#countryScale').selectOption('robust');
  await page.locator('.country-settings > summary').click();
  await page.locator('#countryWeight_economia').evaluate(e=>{e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}));});assert((await page.locator('#countryValue').innerText()).includes('5/5'));
  await page.locator('#countryReset').click();await page.locator('.country-settings > summary').click();
  await page.locator('#indicator').selectOption('GB.XPD.RSDV.GD.ZS');const science=await page.locator('#eventContext').innerText();assert(science.includes('Lei de Inovação'));assert(!science.includes('Canal de Suez'));
  await page.locator('#indicator').selectOption('VC.IHR.PSRC.P5');assert((await page.locator('#eventContext').innerText()).includes('Desarmamento'));
  await page.locator('#indicator').selectOption('NY.GDP.MKTP.KD.ZG');assert.equal(await page.locator('#eventContext [data-event]').count(),5);
  await page.locator('#eventMode').selectOption('all');await page.locator('#eventLimit').selectOption('50');assert.equal(await page.locator('#eventContext [data-event]').count(),38);
  await page.locator('#eventCategory').selectOption('ciencia');assert((await page.locator('#eventContext').innerText()).includes('Inovação'));
  await page.locator('#eventCategory').selectOption('all');await page.locator('#eventMode').selectOption('main');await page.locator('#eventLimit').selectOption('8');
  await page.locator('#indicator').selectOption('ANP_GASOLINA');await page.locator('#startYear').selectOption('2020');await page.locator('#endYear').selectOption('2020');assert((await page.locator('#chart').innerText()).includes('Não há observações'));
  await page.locator('#startYear').selectOption('2025');await page.locator('#endYear').selectOption('2020');assert((await page.locator('#chart').innerText()).includes('Escolha um ano inicial'));
  await page.locator('#startYear').selectOption('1994');await page.locator('#endYear').selectOption('2025');await page.locator('#indicator').selectOption('NY.GDP.MKTP.KD.ZG');
  await page.locator('#investmentKind').selectOption('type');assert((await page.locator('#investmentLegend').innerText()).includes('Não classificado'));
  await page.locator('#investmentView').selectOption('gdp');assert((await page.locator('#investmentChartTitle').innerText()).includes('valor adicionado'));
  await page.locator('#investmentView').selectOption('fdi');assert.equal(await page.locator('#investmentYear option').count(),1);assert((await page.locator('#investmentChartTitle').innerText()).includes('2024'));
  await page.locator('#investmentLegend [data-slice="1"]').click();assert((await page.locator('#investmentDonut').innerText()).includes('Petróleo'));
  await page.locator('#investmentView').selectOption('exports');await page.locator('#investmentKind').selectOption('activity');await page.locator('#investmentYear').selectOption('2025');
  await page.locator('#companyKind').selectOption('unicorn');assert.equal(await page.locator('#companyCases .company-card').count(),8);
  await page.locator('#companyKind').selectOption('factory-exit');assert.equal(await page.locator('#companyCases .company-card').count(),2);
  await page.locator('#companyTerm').selectOption('fhc1');assert((await page.locator('#companyCases').innerText()).includes('Não há casos documentados'));
  await page.locator('#companyTerm').selectOption('all');await page.locator('#companyKind').selectOption('all');
  await page.locator('#policyA').selectOption('lula1');await page.locator('#policyB').selectOption('lula2');
  const left=await page.locator('#policyCards .policy-card').first().innerText(),right=await page.locator('#policyCards .policy-card').last().innerText();assert(left.includes('2003–2006')&&right.includes('2007–2010'));
  await page.locator('#policyTopic').selectOption('crime');assert((await page.locator('#policyCards').innerText()).includes('Desarmamento'));
  await page.locator('#policyTopic').selectOption('fiscal');await page.locator('#policyStatus').selectOption('attempted');assert((await page.locator('#policyCards').innerText()).includes('CPMF'));
  await page.locator('#policyA').selectOption('dilma2');await page.locator('#policyTopic').selectOption('ciencia');await page.locator('#policyStatus').selectOption('all');assert((await page.locator('#policyCards .policy-card').first().innerText()).includes('2016'));
  await page.locator('#policyCards .policy-action').first().locator('summary').click();await page.locator('#policyCards [data-policy-metric]').first().click();assert.equal(await page.locator('#indicator').inputValue(),'GB.XPD.RSDV.GD.ZS');
  // Downloads reais: arquivos precisam incluir critérios e fontes, não somente disparar o clique.
  for(const [id,contains] of [['exportCountry','media_mandato'],['exportInvestment','Agropecuária'],['exportData','FI.RES.TOTL.CD']]){
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#'+id).click()]);
   const file=await download.path();assert((await fs.readFile(file,'utf8')).includes(contains));
  }
  await page.locator('#rankingDetails > summary').click();await page.locator('.country-settings > summary').click();await page.locator('#transition').selectOption('dilma');assert(!(await page.locator('#rankingRows .rank-row').filter({hasText:'Dilma Rousseff · 2º'}).innerText()).includes('apenas um ano'));
  await page.locator('#transition').selectOption('exclude');await page.locator('.country-settings > summary').click();await page.locator('#rankingDetails > summary').click();
  await page.locator('#policyA').selectOption('lula1');await page.locator('#policyB').selectOption('bolsonaro');await page.locator('#policyTopic').selectOption('all');
  await page.locator('#indicator').selectOption('NY.GDP.MKTP.KD.ZG');await page.locator('#startYear').selectOption('1994');await page.locator('#endYear').selectOption('2025');
  await page.locator('#pais').screenshot({path:path.join(root,'preview-country.png')});await page.locator('#investimento').screenshot({path:path.join(root,'preview-investment.png')});
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(url,{waitUntil:'domcontentloaded'});
  assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Página não pode transbordar no celular');
  await mobile.locator('#investmentView').selectOption('gdp');await mobile.locator('#policyTopic').selectOption('crime');assert((await mobile.locator('#policyCards').innerText()).includes('combate ao crime'));
  await mobile.locator('#countryYear').selectOption('2023');await mobile.locator('#pais').screenshot({path:path.join(root,'preview-mobile.png')});
  // O artefato deve funcionar também aberto diretamente, sem servidor.
  const offline=await browser.newPage();offline.on('pageerror',e=>errors.push(e.message));await offline.goto('file://'+path.join(root,'dist/index.html'),{waitUntil:'domcontentloaded'});assert.equal(await offline.locator('#countryAreas .area-card').count(),6);assert((await offline.locator('#investmentChartTitle').innerText()).includes('2025'));
  assert.deepEqual(errors,[]);
  console.log('PASS: navegador desktop/móvel, índice, marcos por métrica, pizzas, perfis por mandato, filtros, transição, downloads, ausência de dados e HTML independente.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
