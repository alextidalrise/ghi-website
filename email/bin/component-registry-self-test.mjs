#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  componentExpressionProps,
  findMalformedCompiledOutput,
  loadComponentRegistry,
  resolveSourceVariant,
  resolveManifestSource,
  validateCampaignManifest,
  validateMasterPlaintextRepresentatives,
  validateManifestFilename,
  validateCampaignTemplateSource
} from '../lib/component-registry.mjs';
import config from '../config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const registry = await loadComponentRegistry(join(root, 'component-library', 'v1', 'registry.json'));

assert.equal(registry.id, 'ghi-email-components');
assert.equal(registry.version, '1.0.0');
assert.ok(registry.components.length >= 30, 'registry must cover primitives, semantic components and Albany patterns');
assert.equal(new Set(registry.components.map(({ id }) => id)).size, registry.components.length, 'component IDs must be unique');
for (const component of registry.components) {
  assert.match(component.id, /^ghi\.[a-z0-9]+(?:[.-][a-z0-9]+)*\.v1$/, `stable versioned ID: ${component.id}`);
  assert.ok(component.source.startsWith('src/components/'), `component source: ${component.id}`);
  assert.ok(component.variants.length > 0, `approved variants: ${component.id}`);
  assert.ok(component.variantSelector, `machine-readable variant selector: ${component.id}`);
  assert.ok(component.plaintext.required.length > 0, `plain-text contract: ${component.id}`);
}

const configuredLocals = new Set(Object.keys(config.locals));
for (const component of registry.components) {
  const source = await readFile(join(root, component.source), 'utf8');
  const missing = [...componentExpressionProps(source)].filter((prop) => !configuredLocals.has(prop));
  assert.deepEqual(missing, [], `${component.id} expression props need config.locals defaults`);
  for (const [ownerVariant, aliases] of Object.entries(component.representativeAliases || {})) {
    assert.ok(component.variants.includes(ownerVariant), `representative alias owner variant: ${component.id}/${ownerVariant}`);
    for (const alias of aliases) {
      const target = registry.components.find(({ id }) => id === alias.id);
      assert.ok(target?.variants.includes(alias.variant), `representative alias target: ${alias.id}/${alias.variant}`);
      assert.ok(source.includes(`<x-${target.tag}`), `${component.id}/${ownerVariant} must genuinely compose ${alias.id}/${alias.variant}`);
    }
  }
}
for (const name of ['component-library-v1', 'reference', 'reference-ar', 'portugal-v15']) {
  const compiled = await readFile(join(root, 'build_production', `${name}.html`), 'utf8');
  assert.deepEqual(findMalformedCompiledOutput(compiled), [], `${name} malformed compiled CSS/attributes`);
}

const validManifest = {
  schemaVersion: 1,
  campaignId: 'fixture',
  library: { id: registry.id, version: registry.version },
  source: 'src/templates/fixture.html',
  dataSources: ['https://example.com/source'],
  components: [
    { instanceId: 'lead', id: 'ghi.editorial-lead.v1', variant: 'default', dataSource: 'https://example.com/source' }
  ]
};
assert.deepEqual(validateCampaignManifest(validManifest, registry), []);
assert.deepEqual(validateManifestFilename('fixture.json', validManifest), []);
assert.match(validateManifestFilename('different.json', validManifest)[0], /source/i);
for (const source of ['elsewhere/fixture.html', 'src/templates/../fixture.html', 'src/templates/nested/fixture.html']) {
  assert.ok(validateManifestFilename('fixture.json', { ...validManifest, source }).some((message) => /source/i.test(message)), `reject non-canonical source: ${source}`);
}
assert.equal(resolveManifestSource(root, validManifest), join(root, 'src', 'templates', 'fixture.html'));
for (const source of ['elsewhere/fixture.html', 'src/templates/../../package.json', '/tmp/fixture.html']) {
  assert.throws(() => resolveManifestSource(root, { ...validManifest, source }), /source/i, `constrain source: ${source}`);
}

const badDataSource = structuredClone(validManifest);
badDataSource.dataSources = ['x'];
badDataSource.components[0].dataSource = 'x';
assert.ok(validateCampaignManifest(badDataSource, registry).some((message) => /canonical data source/i.test(message)));
const repositoryDataSource = 'repository://email/src/templates/fixture.html';
const repositoryManifest = structuredClone(validManifest);
repositoryManifest.dataSources = [repositoryDataSource];
repositoryManifest.components[0].dataSource = repositoryDataSource;
assert.deepEqual(validateCampaignManifest(repositoryManifest, registry), []);
const wrongCampaignRepositoryManifest = structuredClone(repositoryManifest);
wrongCampaignRepositoryManifest.dataSources.push('repository://email/src/templates/another-campaign.html');
wrongCampaignRepositoryManifest.components[0].dataSource = 'repository://email/src/templates/another-campaign.html';
assert.ok(
  validateCampaignManifest(wrongCampaignRepositoryManifest, registry).some((message) => /must exactly match manifest source/i.test(message)),
  'reject a syntactically valid, listed repository URI for another campaign'
);
const traversalRepositoryManifest = structuredClone(repositoryManifest);
traversalRepositoryManifest.dataSources = ['repository://email/src/templates/../fixture.html'];
traversalRepositoryManifest.components[0].dataSource = traversalRepositoryManifest.dataSources[0];
assert.ok(
  validateCampaignManifest(traversalRepositoryManifest, registry).some((message) => /canonical data source|must exactly match manifest source/i.test(message)),
  'reject repository URI traversal'
);

const unknown = structuredClone(validManifest);
unknown.components[0].id = 'ghi.unknown.v1';
assert.match(validateCampaignManifest(unknown, registry)[0], /Unknown component ID/);

const badVariant = structuredClone(validManifest);
badVariant.components[0].variant = 'campaign-special';
assert.match(validateCampaignManifest(badVariant, registry)[0], /Unapproved variant/);

const duplicateInstance = structuredClone(validManifest);
duplicateInstance.components.push({ ...duplicateInstance.components[0] });
assert.ok(validateCampaignManifest(duplicateInstance, registry).some((message) => /Duplicate instanceId/.test(message)));

const missingSource = structuredClone(validManifest);
missingSource.components[0].dataSource = '';
assert.ok(validateCampaignManifest(missingSource, registry).some((message) => /dataSource/.test(message)));

const safeSource = `---\ntitle: Fixture\n---\n<x-main><x-editorial-lead manifest-id="lead"><x-heading level="1">Hello</x-heading></x-editorial-lead></x-main>`;
assert.deepEqual(validateCampaignTemplateSource(safeSource, validManifest, registry), []);
assert.ok(validateCampaignTemplateSource(safeSource.replace(' manifest-id="lead"', ''), validManifest, registry).some((message) => /manifest-id/));
assert.ok(validateCampaignTemplateSource(`<x-section></x-section>${safeSource}`, validManifest, registry).some((message) => /sole campaign template root/i.test(message)), 'x-* composition outside x-main is forbidden');
assert.ok(validateCampaignTemplateSource(safeSource.replace('<x-main>', '<p>Top-level raw</p><x-main>'), validManifest, registry).some((message) => /Raw campaign HTML/.test(message)), 'top-level raw HTML is forbidden');
assert.ok(validateCampaignTemplateSource(safeSource.replace('</x-editorial-lead>', '</x-editorial-lead><x-section></x-section>'), validManifest, registry).some((message) => /top-level/));
assert.deepEqual(validateCampaignTemplateSource(safeSource.replace('<x-heading level="1">Hello</x-heading>', '<x-section><x-heading level="1">Hello</x-heading></x-section>'), validManifest, registry), []);
assert.ok(validateCampaignTemplateSource(safeSource.replace('editorial-lead', 'made-up'), validManifest, registry).some((message) => /Unknown template component/));
assert.ok(validateCampaignTemplateSource(safeSource.replace('<x-heading level="1">', '<table style="display:grid"><tr><td>'), validManifest, registry).some((message) => /Raw campaign layout HTML/));
assert.ok(validateCampaignTemplateSource(safeSource.replace('manifest-id="lead"', 'manifest-id="lead" style="padding:99px"'), validManifest, registry).some((message) => /Campaign-specific inline CSS/));
assert.ok(validateCampaignTemplateSource(safeSource.replace('<x-heading level="1">', '<p style="padding:99px">'), validManifest, registry).some((message) => /Campaign-specific inline CSS/));
for (const raw of [
  '<p>Raw paragraph</p>',
  '<h1>Raw heading</h1>',
  '<img src="https://example.com/a.jpg">',
  '<a href="https://example.com">Raw link</a>',
  '<ul><li>Raw item</li></ul>',
  '<x-section><p>Mixed raw paragraph</p></x-section>',
  '<x-section></x-section><p>Mixed sibling</p>'
]) {
  const adversarial = safeSource.replace('<x-heading level="1">Hello</x-heading>', raw);
  assert.ok(validateCampaignTemplateSource(adversarial, validManifest, registry).some((message) => /Raw campaign HTML/.test(message)), `reject raw campaign markup: ${raw}`);
}
assert.ok(validateCampaignTemplateSource(safeSource.replace('manifest-id="lead"', 'manifest-id="other"'), validManifest, registry).some((message) => /manifest-id/));
assert.ok(validateCampaignTemplateSource(safeSource.replace('<x-editorial-lead manifest-id="lead">', '<x-button manifest-id="lead">'), validManifest, registry).some((message) => /requires <x-editorial-lead>/));

const variantManifest = structuredClone(validManifest);
variantManifest.components[0].id = 'ghi.section-intro.v1';
variantManifest.components[0].variant = 'ruled';
assert.equal(resolveSourceVariant(registry.components.find(({ id }) => id === 'ghi.section-intro.v1'), { ruled: 'true' }), 'ruled');
assert.deepEqual(validateCampaignTemplateSource('<x-main><x-section-intro ruled="true" manifest-id="lead"></x-section-intro></x-main>', variantManifest, registry), []);
assert.ok(validateCampaignTemplateSource('<x-main><x-section-intro manifest-id="lead"></x-section-intro></x-main>', variantManifest, registry).some((message) => /variant/i));
assert.ok(validateCampaignTemplateSource('<x-main><x-section-intro ruled="true" manifest-id="lead"></x-section-intro></x-main>', { ...variantManifest, components: [{ ...variantManifest.components[0], variant: 'default' }] }, registry).some((message) => /variant/i));

for (const name of ['reference', 'reference-ar', 'portugal-v15']) {
  const [source, manifest] = await Promise.all([
    readFile(join(root, 'src', 'templates', `${name}.html`), 'utf8'),
    readFile(join(root, 'src', 'manifests', `${name}.json`), 'utf8').then(JSON.parse)
  ]);
  assert.deepEqual(validateCampaignManifest(manifest, registry), [], `${name} manifest`);
  assert.deepEqual(validateCampaignTemplateSource(source, manifest, registry), [], `${name} source`);
}

const [master, masterText] = await Promise.all([
  readFile(join(root, 'build_production', 'component-library-v1.html'), 'utf8'),
  readFile(join(root, 'build_production', 'component-library-v1.txt'), 'utf8')
]);
const [masterSource, layoutSource] = await Promise.all([
  readFile(join(root, 'src', 'templates', 'component-library-v1.html'), 'utf8'),
  readFile(join(root, 'src', 'layouts', 'main.html'), 'utf8')
]);
const activeMasterAndLayoutSource = `${masterSource}\n${layoutSource}`.replace(/<!--[\s\S]*?-->/g, '');
for (const component of registry.components) {
  assert.ok(activeMasterAndLayoutSource.includes(`<x-${component.tag}`), `active master instance for ${component.id}`);
  assert.deepEqual(Object.keys(component.plaintext.masterVariants).sort(), [...component.variants].sort(), `plain-text variants for ${component.id}`);
  for (const variant of component.variants) {
    const contract = component.plaintext.masterVariants[variant];
    assert.ok(contract.markers.length > 0 || contract.noOutput, `visible markers or explicit no-output contract: ${component.id}/${variant}`);
  }
}
assert.deepEqual(validateMasterPlaintextRepresentatives(`${masterSource}\n${layoutSource}`, masterText, registry), []);
const masterWithCommentedRule = masterSource.replace(
  '<x-rule tone="border" gap="16"></x-rule>',
  '<!-- <x-rule tone="border" gap="16"></x-rule> -->'
);
assert.ok(
  validateMasterPlaintextRepresentatives(`${masterWithCommentedRule}\n${layoutSource}`, masterText, registry)
    .some((message) => /ghi\.rule\.v1\/border.*no representative/i.test(message)),
  'commented-out no-output variants are inactive and cannot satisfy master coverage'
);
const masterWithoutHeadingAlias = masterSource.replace(' representative-aliases="ghi.heading.v1/h1"', '');
assert.ok(
  validateMasterPlaintextRepresentatives(`${masterWithoutHeadingAlias}\n${layoutSource}`, masterText, registry)
    .some((message) => /ghi\.heading\.v1\/h1.*no representative/i.test(message)),
  'a composed representative requires an explicit declaration on its owning master instance'
);
const scopedRegistry = {
  components: [
    { id: 'ghi.alpha.v1', tag: 'alpha', variants: ['default'], variantSelector: { fixed: 'default' }, plaintext: { masterVariants: { default: { markers: ['SHARED MARKER'] } } } },
    { id: 'ghi.beta.v1', tag: 'beta', variants: ['default'], variantSelector: { fixed: 'default' }, plaintext: { masterVariants: { default: { markers: ['SHARED MARKER'] } } } }
  ]
};
const scopedErrors = validateMasterPlaintextRepresentatives('<x-alpha>Shared marker</x-alpha><x-beta>Different copy</x-beta>', 'SHARED MARKER\nDIFFERENT COPY', scopedRegistry);
assert.ok(scopedErrors.some((message) => /ghi\.beta\.v1\/default/.test(message)), 'a marker from one component cannot satisfy another component');
const missingVariantRegistry = {
  components: [
    {
      id: 'ghi.multi.v1',
      tag: 'multi',
      variants: ['default', 'alternate'],
      variantSelector: { attribute: 'variant', values: { '': 'default', alternate: 'alternate' } },
      plaintext: { masterVariants: { default: { markers: ['DEFAULT COPY'] }, alternate: { markers: ['ALTERNATE COPY'] } } }
    }
  ]
};
assert.ok(
  validateMasterPlaintextRepresentatives('<x-multi>Default copy</x-multi>', 'DEFAULT COPY\nALTERNATE COPY', missingVariantRegistry)
    .some((message) => /ghi\.multi\.v1\/alternate.*no representative/i.test(message)),
  'every approved variant needs an explicit representative even if its marker exists globally'
);
const shellOwnershipRegistry = {
  components: [
    { id: 'ghi.alpha.v1', tag: 'alpha', variants: ['default'], variantSelector: { fixed: 'default' }, plaintext: { masterVariants: { default: { markers: ['SHELL MARKER'] } } } },
    { id: 'ghi.masthead.v1', tag: 'masthead', representativeMode: 'layout-shell', variants: ['compact'], variantSelector: { fixed: 'compact' }, plaintext: { masterVariants: { compact: { markers: ['SHELL MARKER'] } } } }
  ]
};
assert.ok(
  validateMasterPlaintextRepresentatives('<x-alpha>Shell marker</x-alpha><x-masthead></x-masthead>', 'SHELL MARKER', shellOwnershipRegistry)
    .some((message) => /ghi\.masthead\.v1\/compact.*does not own/i.test(message)),
  'layout-rendered shell components cannot borrow a plaintext marker from another component'
);
assert.equal((master.match(/<h1\b/gi) || []).length, 1, 'master must contain exactly one H1');
const editRegions = [...master.matchAll(/mc:edit="([^"]*)"/g)].map((match) => match[1]);
assert.ok(editRegions.length >= 30, 'master must expose stable visible semantic regions');
assert.ok(editRegions.every(Boolean), 'master mc:edit values must not be empty');
assert.equal(new Set(editRegions).size, editRegions.length, 'master mc:edit values must be unique');
assert.ok(editRegions.includes('partner_article_hero_caption'), 'default partner article caption edit region survives compilation');
const repeatRegions = [...master.matchAll(/mc:repeatable="([^"]*)"/g)].map((match) => match[1]);
assert.ok(repeatRegions.length >= 7, 'master must expose intended repeatable row/card families');
assert.ok(repeatRegions.every(Boolean), 'master mc:repeatable values must not be empty');
assert.equal(new Set(repeatRegions).size, repeatRegions.length, 'master mc:repeatable values must be unique');
for (const malformed of ['occasionsConcise', 'founderFounder']) assert.ok(!masterText.includes(malformed), `plain-text join: ${malformed}`);

console.log('  Component registry and campaign-manifest contract: PASS');
