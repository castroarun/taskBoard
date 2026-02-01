import type { OrbitBlock } from '../types/launchpad-block';

const ORBIT_START = '<!-- ORBIT:START -->';
const ORBIT_END = '<!-- ORBIT:END -->';

/**
 * Parse ORBIT block from README content
 *
 * @param readme - Raw README.md content
 * @returns Parsed OrbitBlock or null if not found
 */
export function parseOrbitBlock(readme: string): OrbitBlock | null {
  const startIndex = readme.indexOf(ORBIT_START);
  const endIndex = readme.indexOf(ORBIT_END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  const blockContent = readme.slice(
    startIndex + ORBIT_START.length,
    endIndex
  );

  // Extract JSON from markdown code block
  const jsonMatch = blockContent.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) {
    // Try without code block wrapper
    const trimmed = blockContent.trim();
    if (trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed) as OrbitBlock;
      } catch {
        return null;
      }
    }
    return null;
  }

  try {
    return JSON.parse(jsonMatch[1].trim()) as OrbitBlock;
  } catch {
    return null;
  }
}

/**
 * Convert OrbitBlock to markdown string for README
 *
 * @param block - OrbitBlock to stringify
 * @returns Markdown string with ORBIT block
 */
export function stringifyOrbitBlock(block: OrbitBlock): string {
  const json = JSON.stringify(block, null, 2);
  return `${ORBIT_START}
\`\`\`json
${json}
\`\`\`
${ORBIT_END}`;
}

/**
 * Update ORBIT block in README content
 *
 * @param readme - Original README content
 * @param block - New OrbitBlock data
 * @returns Updated README content
 */
export function updateOrbitBlock(
  readme: string,
  block: OrbitBlock
): string {
  const startIndex = readme.indexOf(ORBIT_START);
  const endIndex = readme.indexOf(ORBIT_END);

  const newBlock = stringifyOrbitBlock(block);

  if (startIndex === -1 || endIndex === -1) {
    // No existing block, append after first heading
    const headingMatch = readme.match(/^#\s+.+\n/m);
    if (headingMatch && headingMatch.index !== undefined) {
      const insertPos = headingMatch.index + headingMatch[0].length;
      return (
        readme.slice(0, insertPos) +
        '\n' +
        newBlock +
        '\n' +
        readme.slice(insertPos)
      );
    }
    // No heading found, prepend
    return newBlock + '\n\n' + readme;
  }

  // Replace existing block
  return (
    readme.slice(0, startIndex) + newBlock + readme.slice(endIndex + ORBIT_END.length)
  );
}
