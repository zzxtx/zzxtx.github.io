/**
 * 自定义注入器：不动主题文件，把自定义 CSS / JS 挂到每个页面上
 * Hexo 启动时会自动执行 scripts/ 目录下的所有 .js 文件
 * 文档: https://hexo.io/api/injector
 */
hexo.extend.injector.register('head_end', '<link rel="stylesheet" href="/css/custom.css">', 'default');
hexo.extend.injector.register('body_end', '<script src="/js/custom.js" defer></script>', 'default');
