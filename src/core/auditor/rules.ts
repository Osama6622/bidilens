import type { AuditCategory, LogicalReplacement } from './types';

export interface RuleMatchResult {
  ruleId: string;
  category: AuditCategory;
  replacements: LogicalReplacement[];
  message: string;
  whyItMatters: string;
}

interface DirectPropertyRule {
  ruleId: string;
  category: AuditCategory;
  logicalProperty: string;
  message: string;
  whyItMatters: string;
}

const DIRECT_PROPERTY_RULES: Record<string, DirectPropertyRule> = {
  // Box Model — Margins
  'margin-left': {
    ruleId: 'box-margin-left',
    category: 'box-model',
    logicalProperty: 'margin-inline-start',
    message: 'Replace physical `margin-left` with `margin-inline-start`.',
    whyItMatters:
      'Hardcoded left margin stays on the physical left in RTL layouts instead of mirroring to the inline start edge.',
  },
  'margin-right': {
    ruleId: 'box-margin-right',
    category: 'box-model',
    logicalProperty: 'margin-inline-end',
    message: 'Replace physical `margin-right` with `margin-inline-end`.',
    whyItMatters:
      'Hardcoded right margin stays on the physical right in RTL layouts, causing spacing collisions or misaligned trailing items.',
  },

  // Box Model — Paddings
  'padding-left': {
    ruleId: 'box-padding-left',
    category: 'box-model',
    logicalProperty: 'padding-inline-start',
    message: 'Replace physical `padding-left` with `padding-inline-start`.',
    whyItMatters:
      'Physical left padding fails to reserve space on the reading-start side in RTL (common bug in icon inputs and indented lists).',
  },
  'padding-right': {
    ruleId: 'box-padding-right',
    category: 'box-model',
    logicalProperty: 'padding-inline-end',
    message: 'Replace physical `padding-right` with `padding-inline-end`.',
    whyItMatters:
      'Physical right padding remains on the right in RTL instead of moving to the inline end edge.',
  },

  // Box Model — Borders
  'border-left': {
    ruleId: 'box-border-left',
    category: 'box-model',
    logicalProperty: 'border-inline-start',
    message: 'Replace physical `border-left` with `border-inline-start`.',
    whyItMatters:
      'Callout accent bars and dividers using `border-left` appear at the trailing edge of RTL text instead of the start edge.',
  },
  'border-right': {
    ruleId: 'box-border-right',
    category: 'box-model',
    logicalProperty: 'border-inline-end',
    message: 'Replace physical `border-right` with `border-inline-end`.',
    whyItMatters:
      'Separators using `border-right` stay on the physical right in RTL, appearing before adjacent items rather than after them.',
  },
  'border-left-width': {
    ruleId: 'box-border-left-width',
    category: 'box-model',
    logicalProperty: 'border-inline-start-width',
    message: 'Replace `border-left-width` with `border-inline-start-width`.',
    whyItMatters: 'Physical border widths do not mirror when `dir="rtl"` is active.',
  },
  'border-right-width': {
    ruleId: 'box-border-right-width',
    category: 'box-model',
    logicalProperty: 'border-inline-end-width',
    message: 'Replace `border-right-width` with `border-inline-end-width`.',
    whyItMatters: 'Physical border widths do not mirror when `dir="rtl"` is active.',
  },
  'border-left-style': {
    ruleId: 'box-border-left-style',
    category: 'box-model',
    logicalProperty: 'border-inline-start-style',
    message: 'Replace `border-left-style` with `border-inline-start-style`.',
    whyItMatters: 'Physical border styles remain fixed on the physical side in RTL.',
  },
  'border-right-style': {
    ruleId: 'box-border-right-style',
    category: 'box-model',
    logicalProperty: 'border-inline-end-style',
    message: 'Replace `border-right-style` with `border-inline-end-style`.',
    whyItMatters: 'Physical border styles remain fixed on the physical side in RTL.',
  },
  'border-left-color': {
    ruleId: 'box-border-left-color',
    category: 'box-model',
    logicalProperty: 'border-inline-start-color',
    message: 'Replace `border-left-color` with `border-inline-start-color`.',
    whyItMatters: 'Physical border colors stay pinned to the left edge in RTL.',
  },
  'border-right-color': {
    ruleId: 'box-border-right-color',
    category: 'box-model',
    logicalProperty: 'border-inline-end-color',
    message: 'Replace `border-right-color` with `border-inline-end-color`.',
    whyItMatters: 'Physical border colors stay pinned to the right edge in RTL.',
  },

  // Positioning
  left: {
    ruleId: 'pos-left',
    category: 'positioning',
    logicalProperty: 'inset-inline-start',
    message: 'Replace physical `left` offset with `inset-inline-start`.',
    whyItMatters:
      'Positioned icons, badges, and drawers using `left` stay pinned to the physical left in RTL, overlapping RTL content.',
  },
  right: {
    ruleId: 'pos-right',
    category: 'positioning',
    logicalProperty: 'inset-inline-end',
    message: 'Replace physical `right` offset with `inset-inline-end`.',
    whyItMatters:
      'Positioned notification dots, close buttons, and menus using `right` fail to flip to the trailing edge in RTL.',
  },

  // Corner Radii
  'border-top-left-radius': {
    ruleId: 'radius-top-left',
    category: 'corner-radius',
    logicalProperty: 'border-start-start-radius',
    message: 'Replace `border-top-left-radius` with `border-start-start-radius`.',
    whyItMatters:
      'Directional corner rounding stays on the top-left in RTL, breaking attached input groups, tabs, and ribbons.',
  },
  'border-top-right-radius': {
    ruleId: 'radius-top-right',
    category: 'corner-radius',
    logicalProperty: 'border-start-end-radius',
    message: 'Replace `border-top-right-radius` with `border-start-end-radius`.',
    whyItMatters:
      'Directional corner rounding stays on the top-right in RTL instead of moving to the block-start inline-end corner.',
  },
  'border-bottom-left-radius': {
    ruleId: 'radius-bottom-left',
    category: 'corner-radius',
    logicalProperty: 'border-end-start-radius',
    message: 'Replace `border-bottom-left-radius` with `border-end-start-radius`.',
    whyItMatters:
      'Directional corner rounding stays on the bottom-left in RTL instead of mirroring to block-end inline-start.',
  },
  'border-bottom-right-radius': {
    ruleId: 'radius-bottom-right',
    category: 'corner-radius',
    logicalProperty: 'border-end-end-radius',
    message: 'Replace `border-bottom-right-radius` with `border-end-end-radius`.',
    whyItMatters:
      'Directional corner rounding stays on the bottom-right in RTL instead of mirroring to block-end inline-end.',
  },
};

interface ValueMappingRule {
  ruleId: string;
  category: AuditCategory;
  valueMap: Record<string, string>;
  whyItMatters: string;
}

const VALUE_MAPPING_RULES: Record<string, ValueMappingRule> = {
  'text-align': {
    ruleId: 'align-text',
    category: 'alignment-float',
    valueMap: {
      left: 'start',
      right: 'end',
    },
    whyItMatters:
      'Forcing `text-align: left` or `right` overrides natural RTL reading order; `start` and `end` adapt automatically to `dir`.',
  },
  float: {
    ruleId: 'align-float',
    category: 'alignment-float',
    valueMap: {
      left: 'inline-start',
      right: 'inline-end',
    },
    whyItMatters:
      'Physical floats pin elements to screen sides regardless of text direction; `inline-start` / `inline-end` flow with document direction.',
  },
  clear: {
    ruleId: 'align-clear',
    category: 'alignment-float',
    valueMap: {
      left: 'inline-start',
      right: 'inline-end',
    },
    whyItMatters:
      'Physical `clear` values fail to clear mirrored `inline-start` / `inline-end` floats in RTL.',
  },
};

interface BoxShorthandConfig {
  ruleId: string;
  blockProp: string;
  inlineProp: string;
  label: string;
}

const BOX_SHORTHAND_CONFIGS: Record<string, BoxShorthandConfig> = {
  margin: {
    ruleId: 'shorthand-margin',
    blockProp: 'margin-block',
    inlineProp: 'margin-inline',
    label: 'margin',
  },
  padding: {
    ruleId: 'shorthand-padding',
    blockProp: 'padding-block',
    inlineProp: 'padding-inline',
    label: 'padding',
  },
  inset: {
    ruleId: 'shorthand-inset',
    blockProp: 'inset-block',
    inlineProp: 'inset-inline',
    label: 'inset',
  },
  'border-width': {
    ruleId: 'shorthand-border-width',
    blockProp: 'border-block-width',
    inlineProp: 'border-inline-width',
    label: 'border-width',
  },
  'border-style': {
    ruleId: 'shorthand-border-style',
    blockProp: 'border-block-style',
    inlineProp: 'border-inline-style',
    label: 'border-style',
  },
  'border-color': {
    ruleId: 'shorthand-border-color',
    blockProp: 'border-block-color',
    inlineProp: 'border-inline-color',
    label: 'border-color',
  },
};

/**
 * Splits CSS whitespace-delimited value tokens while keeping parenthesized expressions
 * like `calc(100% - 16px)` or `rgb(15, 23, 42)` intact.
 */
export function splitCssValueTokens(rawValue: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let parenDepth = 0;
  let quoteChar: string | null = null;

  for (let i = 0; i < rawValue.length; i++) {
    const ch = rawValue[i];

    if (quoteChar) {
      current += ch;
      if (ch === quoteChar && rawValue[i - 1] !== '\\') {
        quoteChar = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quoteChar = ch;
      current += ch;
      continue;
    }

    if (ch === '(') {
      parenDepth++;
      current += ch;
      continue;
    }

    if (ch === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      current += ch;
      continue;
    }

    if (parenDepth === 0 && /\s/.test(ch)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Evaluates a single CSS declaration (`property`, `value` without `!important`)
 * against BidiLens's physical-to-logical rule registry.
 */
export function evaluateDeclarationRule(
  rawProperty: string,
  rawValue: string,
): RuleMatchResult | null {
  const prop = rawProperty.trim().toLowerCase();
  const val = rawValue.trim();

  // 1. Direct physical property -> logical property mapping
  const directRule = DIRECT_PROPERTY_RULES[prop];
  if (directRule) {
    return {
      ruleId: directRule.ruleId,
      category: directRule.category,
      replacements: [{ property: directRule.logicalProperty, value: val }],
      message: directRule.message,
      whyItMatters: directRule.whyItMatters,
    };
  }

  // 2. Physical directional keyword value mapping (`text-align`, `float`, `clear`)
  const valueRule = VALUE_MAPPING_RULES[prop];
  if (valueRule) {
    const normalizedVal = val.toLowerCase();
    const mappedVal = valueRule.valueMap[normalizedVal];
    if (mappedVal) {
      return {
        ruleId: valueRule.ruleId,
        category: valueRule.category,
        replacements: [{ property: prop, value: mappedVal }],
        message: `Replace \`${prop}: ${val}\` with \`${prop}: ${mappedVal}\`.`,
        whyItMatters: valueRule.whyItMatters,
      };
    }
    return null;
  }

  // 3. Four-value asymmetric box/inset/border shorthands (`top right bottom left`)
  const shorthandConfig = BOX_SHORTHAND_CONFIGS[prop];
  if (shorthandConfig) {
    const tokens = splitCssValueTokens(val);
    if (tokens.length === 4) {
      const [top, right, bottom, left] = tokens;
      // Only flag when physical right and left differ; symmetric inline values already mirror safely
      if (right !== left) {
        const blockValue = top === bottom ? top : `${top} ${bottom}`;
        // In LTR source: left = inline-start, right = inline-end
        const inlineValue = `${left} ${right}`;
        return {
          ruleId: shorthandConfig.ruleId,
          category: 'shorthand',
          replacements: [
            { property: shorthandConfig.blockProp, value: blockValue },
            { property: shorthandConfig.inlineProp, value: inlineValue },
          ],
          message: `Split asymmetric 4-value \`${shorthandConfig.label}\` shorthand into \`${shorthandConfig.blockProp}\` and \`${shorthandConfig.inlineProp}\`.`,
          whyItMatters: `\`${prop}: ${val}\` hardcodes left (\`${left}\`) and right (\`${right}\`) physical sides instead of inline-start and inline-end.`,
        };
      }
    }
    return null;
  }

  // 4. Asymmetric `border-radius` shorthand (without elliptical `/`)
  if (prop === 'border-radius' && !val.includes('/')) {
    const tokens = splitCssValueTokens(val);
    if (tokens.length >= 2 && tokens.length <= 4) {
      const tl = tokens[0];
      const tr = tokens[1];
      const br = tokens[2] ?? tokens[0];
      const bl = tokens[3] ?? tokens[1];

      // Horizontally asymmetric if top-left !== top-right OR bottom-left !== bottom-right
      if (tl !== tr || bl !== br) {
        return {
          ruleId: 'shorthand-border-radius',
          category: 'shorthand',
          replacements: [
            { property: 'border-start-start-radius', value: tl },
            { property: 'border-start-end-radius', value: tr },
            { property: 'border-end-end-radius', value: br },
            { property: 'border-end-start-radius', value: bl },
          ],
          message:
            'Expand horizontally asymmetric `border-radius` shorthand into logical corner radii.',
          whyItMatters: `\`border-radius: ${val}\` has different left/right corner radii that will not flip horizontally in RTL.`,
        };
      }
    }
  }

  return null;
}

export function getAllSupportedRuleIds(): string[] {
  return [
    ...Object.values(DIRECT_PROPERTY_RULES).map((r) => r.ruleId),
    ...Object.values(VALUE_MAPPING_RULES).map((r) => r.ruleId),
    ...Object.values(BOX_SHORTHAND_CONFIGS).map((r) => r.ruleId),
    'shorthand-border-radius',
  ];
}
