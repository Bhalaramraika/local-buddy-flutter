const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add path alias resolution for @/ and @store/
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @/ alias (e.g., @/store/uiStore -> /project/root/store/uiStore)
  if (moduleName.startsWith('@/')) {
    const newModuleName = path.join(__dirname, moduleName.replace('@/', './'));
    return context.resolveRequest(context, newModuleName, platform);
  }
  // Handle @store/ alias (e.g., @store/uiStore -> /project/root/store/uiStore)
  if (moduleName.startsWith('@store/')) {
    const newModuleName = path.join(__dirname, moduleName.replace('@store/', './store/'));
    return context.resolveRequest(context, newModuleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });