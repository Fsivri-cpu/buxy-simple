module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        // Zustand için import.meta polyfill'ini etkinleştir
        unstable_transformImportMeta: true,
        // Component auth hatası için (expo-router/babel yerine)
        router: {
          origin: 'auto',
        }
      }]
    ],
    plugins: [
      // React Native ve Expo uygulamaları için önerilen eklentiler
      'react-native-reanimated/plugin',
      
      // Path alias'ları için module-resolver yapılandırma
      ['module-resolver', {
        root: ['.'],
        extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@': './',
          '@/lib': './lib',
          '@/components': './components',
          '@/constants': './constants',
          '@/store': './store',
          '@/types': './types',
          '@/utils': './utils',
          '@/app': './app'
        }
      }],
      // Ayrıca Expo Router'a yapılandırmayı manuel olarak ileterek daha fazla kontrol sağlar
      ["expo-router/babel", { "ignorePatterns": ["node_modules"] }]
    ]
  };
};
