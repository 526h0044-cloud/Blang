import Prism from 'prismjs';

/**
 * Initializes and registers the BLang syntax grammar with Prism.js.
 */
export function initBLangPrism() {
  if (Prism.languages.blang) return;

  Prism.languages.blang = {
    // Comments: multi-line /* ... */ and single-line // ...
    comment: [
      {
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: true,
        greedy: true,
      },
      {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: true,
        greedy: true,
      },
      {
        pattern: /(^|[^\\:])#.*/,
        lookbehind: true,
        greedy: true,
      },
    ],
    // Strings: single or double quoted with escape support
    string: {
      pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      greedy: true,
    },
    // Sigil Identifiers (BLang variable prefixes)
    'sigil-num': {
      pattern: /@[a-zA-Z_]\w*/,
      alias: 'variable-num',
    },
    'sigil-str': {
      pattern: /\$[a-zA-Z_]\w*/,
      alias: 'variable-str',
    },
    'sigil-tmp': {
      pattern: /_[a-zA-Z_]\w*/,
      alias: 'variable-tmp',
    },
    // Macros (%random...)
    macro: {
      pattern: /%random\b/,
      alias: 'builtin',
    },
    // Core Language Keywords
    keyword: /\b(?:function|return|if|elseif|else|while|for|in|break|continue|import|null|true|false)\b/,
    // Built-in Standard Library Functions & Mathematical Constants
    builtin: /\b(?:print|len|type|input|str|num|range|push|sin|cos|tan|cotan|cot|sind|cosd|tand|cotand|sin_rad|cos_rad|tan_rad|cotan_rad|circle_c|circle_C|cir_c|cir_C|circle_s|circle_S|cir_s|cir_S|circle_perimeter|circle_area|square_c|square_C|sq_c|sq_C|square_s|square_S|sq_s|sq_S|square_perimeter|square_area|cube_v|cube_V|cube_volume|sphere_v|sphere_V|sphere_volume|sphere_s|sphere_S|sphere_area|cylinder_v|cylinder_V|cylinder_volume|cone_v|cone_V|cone_volume|rect_c|rect_C|rect_s|rect_S|rectangle_c|rectangle_C|rectangle_s|rectangle_S|rect_perimeter|rect_area|cuboid_v|cuboid_V|cuboid_volume|trapezoid_c|trapezoid_C|trapezoid_s|trapezoid_S|polygon_c|polygon_C|polygon_s|polygon_S|tri_c|tri_C|tri_s|tri_S|triangle_c|triangle_C|triangle_s|triangle_S|sqrt|cbrt|root|pow|power|abs|round|floor|ceil|log|ln|log10|log2|PI|E|upper|lower|trim|replace|split|join|contains|sum|min_val|max_val|avg|reverse|time_now|random)\b/,
    // Numbers: floating point and integers
    number: /\b\d+(?:\.\d+)?\b/,
    // Operators
    operator: /[-+*\/%]=?|[!=]=?|<=?|>=?|&&|\|\||!|[=]/,
    // Punctuation
    punctuation: /[{}()\[\];,.:]/,
  };
}

/**
 * Highlights a BLang source string using Prism.js and returns HTML.
 */
export function highlightBLang(code: string): string {
  initBLangPrism();
  return Prism.highlight(code, Prism.languages.blang, 'blang');
}
