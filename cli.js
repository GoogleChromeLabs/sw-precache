#!/usr/bin/env node
/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-env node */
'use strict';

var meow = require('meow');
var path = require('path');
var swPrecache = require('./');

function setDefaults(cli, configFileFlags) {
  var compositeFlags = cli.flags;

  compositeFlags.root = compositeFlags.root || configFileFlags.root || './';
  if (compositeFlags.root.lastIndexOf('/') !== compositeFlags.root.length - 1) {
    compositeFlags.root += '/';
  }

  compositeFlags.stripPrefix = compositeFlags.stripPrefix ||
    configFileFlags.stripPrefix || compositeFlags.root;

  compositeFlags.swFile = compositeFlags.swFile || configFileFlags.swFile ||
    'service-worker.js';
  compositeFlags.swFilePath = path.join(compositeFlags.root,
    compositeFlags.swFile);

  compositeFlags.cacheId = compositeFlags.cacheId ||
    configFileFlags.cacheId || cli.pkg.name;

  compositeFlags.staticFileGlobs = compositeFlags.staticFileGlobs ||
    configFileFlags.staticFileGlobs;
  if (compositeFlags.staticFileGlobs) {
    if (typeof compositeFlags.staticFileGlobs === 'string') {
      compositeFlags.staticFileGlobs = [compositeFlags.staticFileGlobs];
    }
  } else {
    compositeFlags.staticFileGlobs = [compositeFlags.root + '/**/*.*'];
  }

  compositeFlags.ignoreUrlParametersMatching =
    compositeFlags.ignoreUrlParametersMatching ||
    configFileFlags.ignoreUrlParametersMatching;
  if (compositeFlags.ignoreUrlParametersMatching &&
      typeof compositeFlags.ignoreUrlParametersMatching === 'string') {
    compositeFlags.ignoreUrlParametersMatching =
      compositeFlags.ignoreUrlParametersMatching.split(',').map(function(s) {
        return new RegExp(s);
      });
  }

  compositeFlags.importScripts = compositeFlags.importScripts ||
    configFileFlags.importScripts;
  if (compositeFlags.importScripts &&
      typeof compositeFlags.importScripts === 'string') {
    compositeFlags.importScripts = compositeFlags.importScripts.split(',');
  }

  compositeFlags.runtimeCaching = compositeFlags.runtimeCaching ||
    configFileFlags.runtimeCaching;

  compositeFlags.maximumFileSizeToCacheInBytes = compositeFlags.maximumFileSizeToCacheInBytes ||
    configFileFlags.maximumFileSizeToCacheInBytes;

  return compositeFlags;
}

var cli = meow({
  help: 'Options from https://github.com/GoogleChrome/sw-precache#options ' +
        'are accepted as flags.\nAlternatively, use --config <file>, where ' +
        '<file> is the path to the JSON data representing the same options.\n' +
        'When both a config file and command line option is given, the ' +
        'command line option takes precedence.'
});

// If the --config option is used, then read the options from an external
// JSON configuration file. Options from the --config file can be overwritten
// by any command line options.
var configFileFlags = cli.flags.config ?
  require(path.resolve(cli.flags.config)) : {};
var options = setDefaults(cli, configFileFlags);

swPrecache.write(options.swFilePath, options, function(error) {
  if (error) {
    console.error(error.stack);
    process.exit(1);
  }

  console.log(options.swFilePath,
    'has been generated with the service worker contents.');
});
