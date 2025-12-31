module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
        [
            'module-resolver',
            {
                root: ['./src'],
                extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
                alias: {
                    '@app': './src/app',
                    '@presentation': './src/presentation',
                    '@domain': './src/domain',
                    '@data': './src/data',
                    '@core': './src/core',
                },
            },
        ],
        'react-native-reanimated/plugin',
    ],
};
