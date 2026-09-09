module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@presentation': './src/presentation',
            '@domain': './src/domain',
            '@data': './src/data',
            '@shared': './src/shared',
          },
        },
      ],
    ],
  };
};
