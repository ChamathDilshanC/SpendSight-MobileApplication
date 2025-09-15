const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Fix for tslib compatibility issues with framer-motion/moti
config.resolver.platforms = ["native", "web", "ios", "android"];
config.resolver.alias = {
  ...config.resolver.alias,
  tslib: require.resolve("tslib"),
};

// Additional resolver configuration to handle ES modules
config.resolver.resolverMainFields = ["react-native", "browser", "main"];
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs"];

// Transformer configuration for handling different module types
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = withNativeWind(config, { input: "./global.css" });
