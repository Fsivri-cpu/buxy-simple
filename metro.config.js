// metro.config.js: React Native bundler için yapılandırma
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Varsayılan Expo yapılandırmasını al
const config = getDefaultConfig(__dirname);

// Metro'nun çözümlemek için arayacağı ek yolları belirle
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname),
  '@/lib': path.resolve(__dirname, 'lib'),
  '@/components': path.resolve(__dirname, 'components'),
  '@/constants': path.resolve(__dirname, 'constants'),
  '@/store': path.resolve(__dirname, 'store'),
  '@/types': path.resolve(__dirname, 'types'),
  '@/utils': path.resolve(__dirname, 'utils'),
  '@/app': path.resolve(__dirname, 'app'),
};

// Başlangıç dosyası için watchFolders değerini ayarlama
// Bu, projenin kök dizinindeki değişiklikleri izlemeyi sağlar
config.watchFolders = [path.resolve(__dirname)];

module.exports = config;
