import type { LaunchpadBlock } from '../types/launchpad-block';

const LAUNCHPAD_START = '<!-- LAUNCHPAD:START -->';
const LAUNCHPAD_END = '<!-- LAUNCHPAD:END -->';

/**
 * Parse LAUNCHPAD block from README content
 *
 * @param readme - Raw README.md content
 * @returns Parsed LaunchpadBlock or null if not found
 */
export function parseLaunchpadBlock(readme: string): LaunchpadBlock | null {
  const startIndex = readme.indexOf(LAUNCHPAD_START);
  const endIndex = readme.indexOf(LAUNCHPAD_END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  const blockContent = readme.slice(
    startIndex + LAUNCHPAD_START.length,
    endIndex
  );

  // Extract JSON from markdown code block
  const jsonMatch = blockContent.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) {
    // Try without code block wrapper
    const trimmed = blockContent.trim();
    if (trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed) as LaunchpadBlock;
      } catch {
        return null;
      }
    }
    return null;
  }

  try {
    return JSON.parse(jsonMatch[1].trim()) as LaunchpadBlock;
  } catch {
    return null;
  }
}

/**
 * Convert LaunchpadBlock to markdown string for README
 *
 * @param block - LaunchpadBlock to stringify
 * @returns Markdown string with LAUNCHPAD block
 */
export function stringifyLaunchpadBlock(block: LaunchpadBlock): string {
  const json = JSON.stringify(block, null, 2);
  return `${LAUNCHPAD_START}
\`\`\`json
${json}
\`\`\`
${LAUNCHPAD_END}`;
}

/**
 * Update LAUNCHPAD block in README content
 *
 * @param readme - Original README content
 * @param block - New LaunchpadBlock data
 * @returns Updated README content
 */
export function updateLaunchpadBlock(
  readme: string,
  block: LaunchpadBlock
): string {
  const startIndex = readme.indexOf(LAUNCHPAD_START);
  const endIndex = readme.indexOf(LAUNCHPAD_END);

  const newBlock = stringifyLaunchpadBlock(block);

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
    readme.slice(0, startIndex) + newBlock + readme.slice(endIndex + LAUNCHPAD_END.length)
  );
}
