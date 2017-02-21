import manifest from '../dist/manifest.js';
import swLib from 'sw-lib';

swLib.cacheRevisionedAssets(manifest);
