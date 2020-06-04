module.exports = {
  url: 'https://lamnhan.com/testea',
  cleanOutput: true,
  fileRender: {
    'README.md': {
      cleanOutput: false,
      rendering: {
        head: true,
        installation: '@doc/installation.md',
        license: true
      }
    }
  },
  webRender: {
    files: {
      'terminology.html': {
        file: true,
        pageTitle: 'Terminology',
        autoTOC: true,
      },
      'installation.html': {
        file: true,
        pageTitle: 'Installation',
        autoTOC: true,
      },
      'overview.html': {
        file: true,
        pageTitle: 'API Overview',
        autoTOC: true,
      },
      'mocking.html': {
        file: true,
        pageTitle: 'Mocking',
        autoTOC: true,
      },
      'rewiring.html': {
        file: true,
        pageTitle: 'Rewiring',
        autoTOC: true,
      },
      'stubbing.html': {
        file: true,
        pageTitle: 'Stubbing',
        autoTOC: true,
      },
      'the-cli.html': {
        pageTitle: 'The CLI',
        topSecs: { toc: true },
        template: 'cli',
      }
    }
  }
};