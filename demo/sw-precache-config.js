module.exports = {
  dynamicUrlToDependencies: {
    'dynamic/page1': [
      'app/views/layout.jade',
      'app/views/page1.jade'
    ],
    'dynamic/page2': [
      'app/views/layout.jade',
      'app/views/page2.jade'
    ]
  },
  staticFileGlobs: [
    'app/css/**.css',
    'app/**.html',
    'app/images/**.*',
    'app/js/**.js'
  ],
  stripPrefix: 'app/',
  verbose: true,
  runtimeCaching: [{
    urlPattern: /this\\.is\\.a\\.regex/,
    handler: 'networkFirst'
  }]
};
