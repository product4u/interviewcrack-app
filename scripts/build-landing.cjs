process.env.NODE_ENV = 'production';
const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const experience = require('../src/constants/experience.json');
const palette = experience.themes.home;
const defaults = ':root{' + Object.entries(palette).filter(([key]) => key !== 'name').map(([key,value]) => '--' + key + ':' + value).join(';') + ';--line:' + palette.ink + '26;--lime:' + palette.primary + '}';
fs.writeFileSync(path.resolve(__dirname, '../landing-assets/theme.css'), defaults + '\n' + fs.readFileSync(path.resolve(__dirname, '../src/constants/shared-theme.css'), 'utf8'));
// Keep readable static fallback copy in sync with the same definitions as React.
const landingPath = path.resolve(__dirname, '../index.html');
let landing = fs.readFileSync(landingPath, 'utf8');
landing = landing.replace(/(<article class="benefit" data-benefit="(\d+)">)([\s\S]*?)(<\/article>)/g, (match, start, index, body, end) => {
  const item = experience.benefits[Number(index)];
  return start + body.replace(/<h3>.*?<\/h3>/, '<h3>' + item.title + '</h3>').replace(/<p>.*?<\/p>/, '<p>' + item.body + '</p>') + end;
});
landing = landing.replace(/<p data-key-trust>.*?<\/p>/g, '<p data-key-trust>' + experience.keyTrust + '</p>');
fs.writeFileSync(landingPath, landing);

// Reuse the app's room component in the standalone HTML landing page.
webpack({
  mode: 'production',
  entry: { room: path.resolve(__dirname, '../src/landing.tsx'), site: path.resolve(__dirname, '../src/site.ts') },
  output: { path: path.resolve(__dirname, '../landing-assets'), filename: '[name].js' },
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: {
    loader: require.resolve('babel-loader'),
    options: { presets: [require.resolve('babel-preset-react-app')] }
  } }] },
  performance: { hints: false },
}, (error, stats) => {
  if (error || stats.hasErrors()) {
    console.error(error || stats.toString({ all: false, errors: true }));
    process.exitCode = 1;
    return;
  }
  console.log(stats.toString({ all: false, assets: true, timings: true }));
});
