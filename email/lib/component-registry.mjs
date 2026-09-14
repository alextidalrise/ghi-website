import { readFile } from 'node:fs/promises';
import { basename, extname, isAbsolute, relative, resolve, sep } from 'node:path';

const COMPONENT_ID = /^ghi\.[a-z0-9]+(?:[.-][a-z0-9]+)*\.v1$/;
const INSTANCE_ID = /^[a-z][a-z0-9_-]*$/;
const RAW_LAYOUT_TAGS = /<(?:table|tbody|thead|tfoot|tr|td|th|style|script|div|center)\b/i;
const INLINE_CSS = /<[^>]+\bstyle\s*=/i;
const JS_WORDS = new Set(['true', 'false', 'null', 'undefined', 'if', 'else', 'return', 'typeof', 'new', 'this']);

export async function loadComponentRegistry(path) {
  const registry = JSON.parse(await readFile(path, 'utf8'));
  if (registry.schemaVersion !== 1 || !registry.id || !registry.version || !Array.isArray(registry.components)) {
    throw new Error(`Invalid component registry: ${path}`);
  }
  return registry;
}

/** Return bare component locals referenced by expressions and condition attributes. */
export function componentExpressionProps(source) {
  const expressions = [
    ...[...source.matchAll(/{{([\s\S]*?)}}/g)].map((match) => match[1]),
    ...[...source.matchAll(/<(?:if|elseif)\b[^>]*\bcondition\s*=\s*"([^"]*)"/gi)].map((match) => match[1])
  ];
  const props = new Set();
  for (let expression of expressions) {
    expression = expression
      .replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, ' ')
      .replace(/\bpage(?:\.[A-Za-z_$][\w$]*)+/g, ' ');
    for (const match of expression.matchAll(/\b[A-Za-z_$][\w$]*\b/g)) {
      const name = match[0];
      const previous = expression.slice(0, match.index).trimEnd().at(-1);
      if (previous !== '.' && !JS_WORDS.has(name)) props.add(name);
    }
  }
  return props;
}

/** Reject empty/malformed dimensions and CSS declarations in compiled HTML. */
export function findMalformedCompiledOutput(html) {
  const findings = new Set();
  for (const match of html.matchAll(/\b(width|height)\s*=\s*(["'])\s*\2/gi)) findings.add(`empty ${match[1]} attribute`);
  for (const match of html.matchAll(/<[^>]+\s(width|height)(?=\s|\/?>)/gi)) findings.add(`bare ${match[1]} attribute`);
  for (const style of html.matchAll(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi)) {
    for (const declaration of style[2].split(';')) {
      if (!declaration.trim() || !declaration.includes(':')) continue;
      const [property, ...parts] = declaration.split(':');
      const value = parts.join(':').trim();
      if (!value) findings.add(`empty CSS property ${property.trim()}`);
      if (/^(?:px|%|em|rem)$/i.test(value)) findings.add(`unit-only CSS value ${property.trim()}:${value}`);
      if (/\b(?:padding|margin|font-size|line-height|width|height)\s*:\s*(?:px\b|;|$)/i.test(declaration)) {
        findings.add(`malformed CSS declaration ${declaration.trim()}`);
      }
      if (/\b\d+(?:\.\d+)?\s+px\b/i.test(value)) findings.add(`separated CSS unit ${property.trim()}:${value}`);
    }
  }
  return [...findings];
}

export function validateManifestFilename(file, manifest) {
  const stem = basename(file, extname(file));
  const expectedSource = `src/templates/${stem}.html`;
  const errors = [];
  if (manifest?.source !== expectedSource) errors.push(`Manifest source must be exactly "${expectedSource}".`);
  if (manifest?.campaignId !== stem) errors.push(`Manifest campaignId "${manifest?.campaignId || '(missing)'}" must match filename "${stem}".`);
  return errors;
}

/** Resolve only the canonical campaign template path beneath this email root. */
export function resolveManifestSource(root, manifest) {
  const expected = `src/templates/${manifest?.campaignId || ''}.html`;
  if (manifest?.source !== expected || isAbsolute(manifest.source)) throw new Error(`Manifest source must be exactly "${expected}".`);
  const templateRoot = resolve(root, 'src', 'templates');
  const source = resolve(root, manifest.source);
  const child = relative(templateRoot, source);
  if (!child || child.startsWith(`..${sep}`) || child === '..' || isAbsolute(child)) throw new Error('Manifest source must resolve beneath src/templates/.');
  return source;
}

function isCanonicalDataSource(value) {
  if (typeof value !== 'string') return false;
  if (/^repository:\/\/email\/src\/templates\/[a-z0-9][a-z0-9_-]*\.html$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateCampaignManifest(manifest, registry) {
  const errors = [];
  if (manifest?.schemaVersion !== 1) errors.push('Manifest schemaVersion must be 1.');
  if (!manifest?.campaignId) errors.push('Manifest campaignId is required.');
  if (!manifest?.source) errors.push('Manifest source is required.');
  if (manifest?.library?.id !== registry.id || manifest?.library?.version !== registry.version) errors.push(`Manifest must pin ${registry.id}@${registry.version}.`);
  if (!Array.isArray(manifest?.dataSources) || manifest.dataSources.length === 0) errors.push('Manifest dataSources must contain at least one authoritative source.');
  else {
    const repositorySource = `repository://email/${manifest.source}`;
    for (const source of manifest.dataSources) {
      if (!isCanonicalDataSource(source)) errors.push(`Manifest dataSources contains non-canonical data source "${source}".`);
      if (typeof source === 'string' && source.startsWith('repository://') && source !== repositorySource) {
        errors.push(`Repository data source "${source}" must exactly match manifest source "${repositorySource}".`);
      }
    }
  }
  if (!Array.isArray(manifest?.components) || manifest.components.length === 0) {
    errors.push('Manifest components must contain the ordered campaign composition.');
    return errors;
  }
  const approved = new Map(registry.components.map((component) => [component.id, component]));
  const instances = new Set();
  for (const [index, component] of manifest.components.entries()) {
    const prefix = `components[${index}]`;
    if (!INSTANCE_ID.test(component.instanceId || '')) errors.push(`${prefix}.instanceId is invalid.`);
    if (instances.has(component.instanceId)) errors.push(`Duplicate instanceId: ${component.instanceId}.`);
    instances.add(component.instanceId);
    if (!COMPONENT_ID.test(component.id || '') || !approved.has(component.id)) {
      errors.push(`Unknown component ID: ${component.id || '(missing)'}.`);
      continue;
    }
    if (!approved.get(component.id).variants.includes(component.variant)) errors.push(`Unapproved variant "${component.variant || '(missing)'}" for ${component.id}.`);
    if (!component.dataSource || !manifest.dataSources.includes(component.dataSource)) errors.push(`${prefix}.dataSource must reference manifest.dataSources.`);
  }
  return errors;
}

function parseAttributes(raw) {
  const attributes = {};
  for (const match of raw.matchAll(/\b([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? 'true';
  }
  return attributes;
}

/** Stack parser for x-* tags; comments and quoted > characters are respected. */
function parseComponentTree(source) {
  const roots = [];
  const stack = [];
  for (let cursor = 0; cursor < source.length;) {
    const start = source.indexOf('<', cursor);
    if (start < 0) break;
    if (source.startsWith('<!--', start)) {
      const end = source.indexOf('-->', start + 4);
      cursor = end < 0 ? source.length : end + 3;
      continue;
    }
    let quote = null;
    let end = start + 1;
    for (; end < source.length; end += 1) {
      const char = source[end];
      if (quote) {
        if (char === quote && source[end - 1] !== '\\') quote = null;
      } else if (char === '"' || char === "'") quote = char;
      else if (char === '>') break;
    }
    if (end >= source.length) break;
    const token = source.slice(start, end + 1);
    const match = /^<\s*(\/?)\s*x-([a-z0-9-]+)\b([\s\S]*?)\/?\s*>$/i.exec(token);
    cursor = end + 1;
    if (!match) continue;
    const closing = Boolean(match[1]);
    const tag = match[2].toLowerCase();
    if (closing) {
      const node = stack.pop();
      if (!node || node.tag !== tag) throw new Error(`Unbalanced component closing tag </x-${tag}>.`);
      continue;
    }
    const node = { tag, attributes: parseAttributes(match[3]), children: [] };
    if (stack.length) stack.at(-1).children.push(node); else roots.push(node);
    if (!/\/\s*>$/.test(token)) stack.push(node);
  }
  if (stack.length) throw new Error(`Unclosed component tag <x-${stack.at(-1).tag}>.`);
  return roots;
}

/** Reject every authored non-component tag and bare composition text. */
function rawCampaignMarkupFindings(source) {
  const errors = [];
  const clean = source.replace(/^---[\s\S]*?---/, '').replace(/<!--[\s\S]*?-->/g, '');
  const stack = [];
  let cursor = 0;
  while (cursor < clean.length) {
    const start = clean.indexOf('<', cursor);
    const endOfText = start < 0 ? clean.length : start;
    const text = clean.slice(cursor, endOfText);
    if (text.trim() && (stack.length === 0 || (stack.length === 1 && stack[0] === 'main'))) {
      errors.push('Raw campaign HTML/text is forbidden; compose with approved x-* components only.');
    }
    if (start < 0) break;
    let quote = null;
    let end = start + 1;
    for (; end < clean.length; end += 1) {
      const char = clean[end];
      if (quote) {
        if (char === quote && clean[end - 1] !== '\\') quote = null;
      } else if (char === '"' || char === "'") quote = char;
      else if (char === '>') break;
    }
    if (end >= clean.length) {
      errors.push('Raw campaign HTML is forbidden: unterminated tag.');
      break;
    }
    const token = clean.slice(start, end + 1);
    const tag = /^<\s*(\/?)\s*x-([a-z0-9-]+)\b[\s\S]*?(\/?)\s*>$/i.exec(token);
    if (!tag) errors.push(`Raw campaign HTML is forbidden: ${token.slice(0, 60)}.`);
    else if (tag[1]) stack.pop();
    else if (!tag[3]) stack.push(tag[2].toLowerCase());
    cursor = end + 1;
  }
  return [...new Set(errors)];
}

export function resolveSourceVariant(component, attributes) {
  const selector = component?.variantSelector;
  if (!selector) return null;
  if (selector.fixed) return selector.fixed;
  const raw = attributes[selector.attribute] ?? '';
  if (selector.presence) return raw === '' ? selector.presence.absent : selector.presence.present;
  return selector.values?.[String(raw).toLowerCase()] ?? selector.values?.['*'] ?? null;
}

export function validateCampaignTemplateSource(source, manifest, registry) {
  const errors = [];
  const body = source.replace(/^---[\s\S]*?---/, '').replace(/<!--[\s\S]*?-->/g, '');
  errors.push(...rawCampaignMarkupFindings(source));
  if (RAW_LAYOUT_TAGS.test(body)) errors.push('Raw campaign layout HTML is forbidden; use approved x-* components.');
  if (INLINE_CSS.test(body)) errors.push('Campaign-specific inline CSS is forbidden; use an approved component variant.');
  const knownTags = new Map(registry.components.map((component) => [component.tag, component]));
  knownTags.set('main', { id: 'locked-shell' });
  let roots;
  try { roots = parseComponentTree(source.replace(/^---[\s\S]*?---/, '')); }
  catch (error) { return [...errors, error.message]; }
  const all = [];
  const visit = (node) => { all.push(node); node.children.forEach(visit); };
  roots.forEach(visit);
  if (roots.length !== 1 || roots[0].tag !== 'main') errors.push('<x-main> must be the sole campaign template root.');
  for (const node of all) {
    if (!knownTags.has(node.tag)) {
      errors.push(`Unknown template component <x-${node.tag}>.`);
      continue;
    }
    if (node.tag !== 'main') {
      const registered = knownTags.get(node.tag);
      const selected = resolveSourceVariant(registered, node.attributes);
      if (!selected || !registered.variants.includes(selected)) {
        errors.push(`<x-${node.tag}> selects unapproved or unresolved source variant "${selected || '(unresolved)'}".`);
      }
    }
  }
  const mains = all.filter(({ tag }) => tag === 'main');
  if (mains.length !== 1) {
    errors.push('Campaign template must contain exactly one <x-main>.');
    return errors;
  }
  const present = mains[0].children;
  for (const node of present) {
    if (!node.attributes['manifest-id']) errors.push(`Top-level <x-${node.tag}> under <x-main> requires manifest-id.`);
  }
  const declared = Array.isArray(manifest?.components) ? manifest.components : [];
  const presentIds = present.map(({ attributes }) => attributes['manifest-id']).filter(Boolean);
  if (new Set(presentIds).size !== presentIds.length) errors.push('Duplicate manifest-id in campaign template.');
  if (declared.length !== present.length || declared.some(({ instanceId }, index) => present[index]?.attributes['manifest-id'] !== instanceId)) {
    errors.push(`Template top-level manifest-id order must exactly match the manifest (${declared.map(({ instanceId }) => instanceId).join(', ')}).`);
  }
  for (const [index, sourceComponent] of present.entries()) {
    const manifestComponent = declared[index];
    if (!manifestComponent || manifestComponent.instanceId !== sourceComponent.attributes['manifest-id']) continue;
    const registered = registry.components.find(({ id }) => id === manifestComponent.id);
    if (registered && registered.tag !== sourceComponent.tag) errors.push(`Template manifest-id "${manifestComponent.instanceId}" uses <x-${sourceComponent.tag}> but ${manifestComponent.id} requires <x-${registered.tag}>.`);
    if (registered) {
      const selected = resolveSourceVariant(registered, sourceComponent.attributes);
      if (selected !== manifestComponent.variant) errors.push(`Template manifest-id "${manifestComponent.instanceId}" selects variant "${selected || '(unresolved)'}" but manifest declares "${manifestComponent.variant}".`);
    }
  }
  return errors;
}

/** Assert plaintext markers against the source instance that claims them. */
export function validateMasterPlaintextRepresentatives(masterSource, masterText, registry) {
  const errors = [];
  const text = masterText.toUpperCase();
  const activeMasterSource = masterSource.replace(/<!--[\s\S]*?-->/g, '');
  const instancesById = new Map();
  for (const component of registry.components) {
    const escaped = component.tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`<x-${escaped}(?![a-z0-9-])([^>]*)>([\\s\\S]*?)<\\/x-${escaped}>|<x-${escaped}(?![a-z0-9-])([^>]*)\\/>`, 'gi');
    instancesById.set(component.id, [...activeMasterSource.matchAll(pattern)]
      .map((match) => ({ attributes: parseAttributes(match[1] ?? match[3] ?? ''), source: match[0] })));
  }
  for (const component of registry.components) {
    const directInstances = instancesById.get(component.id) || [];
    const aliasedInstances = [];
    for (const owner of registry.components) {
      for (const [ownerVariant, aliases] of Object.entries(owner.representativeAliases || {})) {
        if (!(aliases || []).some((alias) => alias.id === component.id)) continue;
        for (const instance of instancesById.get(owner.id) || []) {
          if (resolveSourceVariant(owner, instance.attributes) !== ownerVariant) continue;
          for (const alias of aliases.filter((candidate) => candidate.id === component.id)) {
            const declarations = (instance.attributes['representative-aliases'] || '')
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean);
            if (declarations.includes(`${alias.id}/${alias.variant}`)) {
              aliasedInstances.push({ ...instance, representativeVariant: alias.variant });
            }
          }
        }
      }
    }
    if (!directInstances.length && !aliasedInstances.length) errors.push(`${component.id} has no representative master instance.`);
    for (const variant of component.variants) {
      const contract = component.plaintext.masterVariants[variant];
      if (!contract) {
        errors.push(`${component.id}/${variant} has no plaintext master contract.`);
        continue;
      }
      const candidates = [
        ...directInstances.filter((instance) => resolveSourceVariant(component, instance.attributes) === variant),
        ...aliasedInstances.filter((instance) => instance.representativeVariant === variant)
      ];
      if (!candidates.length) {
        errors.push(`${component.id}/${variant} has no representative master instance.`);
        continue;
      }
      for (const marker of contract.markers || []) {
        const needle = marker.toUpperCase();
        const payload = needle.includes(': ') ? needle.slice(needle.lastIndexOf(': ') + 2) : needle.replace(/^GHI REFERENCE\s+/, '');
        const owned = candidates.some((instance) => {
          if (component.representativeMode === 'layout-shell') {
            const declared = (instance.attributes['plaintext-markers'] || '')
              .split(';;')
              .map((value) => value.trim().toUpperCase())
              .filter(Boolean);
            return declared.includes(needle);
          }
          const source = instance.source.toUpperCase();
          return source.includes(needle) || (payload.length >= 2 && source.includes(payload));
        });
        if (!owned) {
          errors.push(`${component.id}/${variant} representative does not own plaintext marker: ${marker}`);
        } else if (!text.includes(needle)) {
          errors.push(`${component.id}/${variant} plaintext marker is missing: ${marker}`);
        }
      }
    }
  }
  return errors;
}
