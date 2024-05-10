const path = require('path')
const {getDefaultConfig} = require('@react-native/metro-config')

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname)

const { transformer, resolver } = config

//const { generate } = require('@storybook/react-native/scripts/generate')

// generate({
//   configPath: path.resolve(__dirname, './.storybook'),
// })

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false
    }
  }),
  unstable_allowRequireContext: true
}
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg", "mjs"]
}

module.exports = config