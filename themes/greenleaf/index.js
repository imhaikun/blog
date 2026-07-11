'use strict';

const path = require('path');

module.exports = {
  name: 'greenleaf',
  description: 'A fresh and clean Hexo blog theme',
  tags: ['blog', 'clean', 'minimal', 'responsive'],

  generate: function(locals) {
    // No extra generation needed - all pages handled by layout templates
    return [];
  }
};
