const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Only watch the shared package, NOT the entire monorepo root
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages', 'shared'),
];

// Resolve modules from the project's own node_modules only
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

module.exports = config;
