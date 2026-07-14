hexo.extend.helper.register('is_current', function(path) {
  return this.page.path === path;
});