/**
 * Fix page.lang from ambiguous 'zh' to stable 'zh-CN'.
 *
 * 问题：Hexo 的 config.language: 'zh' 是合法的 2-letter ISO-639-1 code，
 * 但 'zh' 是 macro language，在不同 Node.js / ICU 环境下会被规范化为
 * zh-CN / zh-TW / en 等不同值，导致：
 *   - <html lang="..."> 随机变化
 *   - Hexo/Stellar 的 i18n 翻译找不到匹配，fallback 到英文
 *
 * 方案有两层保障：
 * 1. after_init: 尽早修改 config.language 和 theme.i18n.languages
 * 2. after_render:html: 最终兜底，确保输出 HTML 的 lang 属性正确
 */

'use strict'

// 第 1 层：尽早修正语言代码
hexo.extend.filter.register('after_init', () => {
  if (hexo.config.language === 'zh') {
    hexo.config.language = 'zh-CN'
  }

  // 同时更新主题 i18n 模块的语言列表
  if (hexo.theme && hexo.theme.i18n && hexo.theme.i18n.languages) {
    const langs = hexo.theme.i18n.languages
    const idx = langs.indexOf('zh')
    if (idx !== -1) {
      langs[idx] = 'zh-CN'
    }
  }
})

// 第 2 层：HTML 输出兜底，确保 <html lang="zh-CN">
hexo.extend.filter.register('after_render:html', (str) => {
  return str.replace(/<html([^>]*?)lang="[^"]*"([^>]*)>/, '<html$1lang="zh-CN"$2>')
})
