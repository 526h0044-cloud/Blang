/**
 * BLang Source Code Formatter
 * Automatically adjusts indentation and spacing for BLang (*.bl) source code.
 */

export function formatBLang(source: string): string {
  if (!source) return '';

  const rawLines = source.replace(/\r\n/g, '\n').split('\n');
  const formattedLines: string[] = [];
  let indentLevel = 0;
  const indentStr = '    '; // 4 spaces per standard BLang convention
  let inMultiLineComment = false;
  let previousWasBlank = false;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();

    // Preserve block comments
    if (inMultiLineComment) {
      formattedLines.push(indentStr.repeat(indentLevel) + trimmed);
      if (trimmed.includes('*/')) {
        inMultiLineComment = false;
      }
      previousWasBlank = false;
      continue;
    }

    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inMultiLineComment = true;
      }
      formattedLines.push(indentStr.repeat(indentLevel) + trimmed);
      previousWasBlank = false;
      continue;
    }

    // Blank line handling: max 1 consecutive blank line
    if (!trimmed) {
      if (!previousWasBlank && formattedLines.length > 0) {
        formattedLines.push('');
        previousWasBlank = true;
      }
      continue;
    }
    previousWasBlank = false;

    // Full-line comments: keep indent level and preserve comment text
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      formattedLines.push(indentStr.repeat(indentLevel) + trimmed);
      previousWasBlank = false;
      continue;
    }

    // Protect strings and comments on this line
    const { protectedCode, restore } = protectStringsAndComments(trimmed);

    // Format spaces in code
    let formatted = formatCodeSpacing(protectedCode);

    // Adjust indent level for closing braces/brackets at line start
    const leadingCloseMatch = formatted.match(/^(\}|\]|\))/);
    let effectiveIndent = indentLevel;
    if (leadingCloseMatch) {
      effectiveIndent = Math.max(0, indentLevel - 1);
    }

    // Count net brace/bracket balance on this line
    const openBraces = countOccurrences(formatted, '{') + countOccurrences(formatted, '[');
    const closeBraces = countOccurrences(formatted, '}') + countOccurrences(formatted, ']');

    // Special case for "} else {" or "} elseif (...) {"
    if (/^\}\s*(else|elseif)/.test(formatted)) {
      effectiveIndent = Math.max(0, indentLevel - 1);
    }

    // Restore strings and inline comments
    const restored = restore(formatted);

    // Add formatted line with proper indentation
    formattedLines.push(indentStr.repeat(effectiveIndent) + restored);

    // Update ongoing indent level
    indentLevel = Math.max(0, indentLevel + openBraces - closeBraces);
  }

  // Ensure single trailing newline
  let result = formattedLines.join('\n');
  if (!result.endsWith('\n')) {
    result += '\n';
  }
  return result;
}

/**
 * Protects string literals and inline comments by replacing them with unique placeholders.
 */
function protectStringsAndComments(line: string) {
  const placeholders: Array<{ token: string; value: string }> = [];
  let index = 0;
  let result = '';
  let inString: string | null = null;
  let stringStart = -1;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    const next = i + 1 < line.length ? line[i + 1] : '';

    if (inString) {
      if (ch === '\\') {
        // Skip escape sequence
        i += 2;
        continue;
      }
      if (ch === inString) {
        // String ended
        const strVal = line.slice(stringStart, i + 1);
        const token = `__BL_STR_${index++}__`;
        placeholders.push({ token, value: strVal });
        result += token;
        inString = null;
        i++;
        continue;
      }
      i++;
      continue;
    }

    // Check for inline comment //
    if (ch === '/' && next === '/') {
      const commentVal = line.slice(i);
      const token = `__BL_CMT_${index++}__`;
      placeholders.push({ token, value: commentVal });
      result += ' ' + token;
      break;
    }

    // Check for string start
    if (ch === '"' || ch === "'") {
      inString = ch;
      stringStart = i;
      i++;
      continue;
    }

    result += ch;
    i++;
  }

  if (inString) {
    // Unclosed string, restore rest as-is
    const strVal = line.slice(stringStart);
    const token = `__BL_STR_${index++}__`;
    placeholders.push({ token, value: strVal });
    result += token;
  }

  return {
    protectedCode: result,
    restore: (formattedText: string) => {
      let res = formattedText;
      for (const p of placeholders) {
        res = res.replace(p.token, p.value);
      }
      return res;
    },
  };
}

/**
 * Formats spacing around operators, commas, control keywords, and braces.
 */
function formatCodeSpacing(code: string): string {
  let s = code;

  // Semicolons: no space before, space after if not at end
  s = s.replace(/\s*;\s*/g, '; ');
  s = s.replace(/;\s*$/, ';');

  // Commas: no space before, single space after
  s = s.replace(/\s*,\s*/g, ', ');

  // Colons in dict/objects: no space before, space after
  s = s.replace(/\s*:\s*/g, ': ');

  // Multi-char operators: ==, !=, <=, >=, +=, -=, *=, /=, %=, &&, ||
  s = s.replace(/\s*([!=<>]=|\+=|-=|\*=|\/=|%=|&&|\|\|)\s*/g, ' $1 ');

  // Single-char assignment: = (not followed or preceded by =, !, <, >, +, -, *, /, %)
  s = s.replace(/([^!=<>+\-*\/%&|])\s*=\s*([^=])/g, '$1 = $2');

  // Comparison < and > (not part of <=, >=, <<, >>)
  s = s.replace(/([^\s<>=])\s*([<>])\s*([^\s<>=])/g, '$1 $2 $3');

  // Binary operators +, -, *, /, % (when between alphanumeric/sigils)
  s = s.replace(/([@$_\w\)\]])\s*([\+\*\/%])\s*([@$_\w\(\[])/g, '$1 $2 $3');
  // Binary minus: between operands (not unary negation)
  s = s.replace(/([@$_\w\)\]])\s*-\s*([@$_\w\(\[])/g, '$1 - $2');

  // Control structures spacing:
  // if (...), while (...), for (...)
  s = s.replace(/\b(if|while|for|elseif)\s*\(/g, '$1 (');

  // "for (item in list)"
  s = s.replace(/\bfor\s*\(\s*([@$_\w]+)\s+in\s+([@$_\w]+|\S+)\s*\)/g, 'for ($1 in $2)');

  // Function definitions: function name(param1, param2) {
  s = s.replace(/\bfunction\s+([a-zA-Z_]\w*)\s*\(/g, 'function $1(');

  // Closing paren before opening brace: ) {
  s = s.replace(/\)\s*\{/g, ') {');

  // Else spacing: } else { and } elseif (...) {
  s = s.replace(/\}\s*else\s*\{/g, '} else {');
  s = s.replace(/\}\s*else\s+if\s*\(/g, '} elseif (');
  s = s.replace(/\}\s*elseif\s*\(/g, '} elseif (');
  s = s.replace(/\belse\s*\{/g, 'else {');

  // Normalize duplicate spaces (outside placeholders)
  s = s.replace(/[ \t]{2,}/g, ' ');

  return s.trim();
}

function countOccurrences(str: string, char: string): number {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === char) count++;
  }
  return count;
}
