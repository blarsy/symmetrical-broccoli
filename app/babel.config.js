module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './',
            'react-native-vector-icons': '@expo/vector-icons',
          },
        },
      ],
      // warning: the following plugin has to come last
      'react-native-reanimated/plugin'
    ],
  };
};
