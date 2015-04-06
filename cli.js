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

'use strict';

var fs = require('fs');
var meow = require('meow');
var path = require('path');
var swPrecache = require('./');

function setDefaults(cli) {
  cli.flags.root = cli.flags.root || './';
  if (cli.flags.root.lastIndexOf('/') !== cli.flags.root.length - 1) {
    cli.flags.root += '/';
  }
  cli.flags.stripPrefix = cli.flags.stripPrefix || cli.flags.root;
  cli.flags.swFile = cli.flags.swFile || 'service-worker.js';
  cli.flags.swFilePath = path.join(cli.flags.root, cli.flags.swFile);
  cli.flags.staticFileGlobs = cli.flags.staticFileGlobs ? [cli.flags.staticFileGlobs] : [cli.flags.root + '/**/*.*'];
  cli.flags.cacheId = cli.flags.cacheId || cli.pkg.name;
  if (cli.flags.ignoreUrlParametersMatching) {
    cli.flags.ignoreUrlParametersMatching = cli.flags.ignoreUrlParametersMatching.split(',').map(function(s) {
      return new RegExp(s);
    });
  }
  if (cli.flags.importScripts) {
    cli.flags.importScripts = cli.flags.importScripts.split(',');
  }

  return cli.flags;
}

var cli = meow({
  help: 'Options from https://github.com/GoogleChrome/sw-precache#options are accepted as flags.'
});
var options = setDefaults(cli);

swPrecache(options, function(error, swFileContents) {
  if (error) {
    throw error;
  }
  fs.writeFile(options.swFilePath, swFileContents, function(error) {
    if (error) {
      throw error;
    }
    console.log(options.swFilePath, 'has been generated with the service worker contents.');
  });
});
