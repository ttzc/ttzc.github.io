/**
 * Align wikilink anchor slugs with the heading ids.
 *
 * 问题：双链 href 与标题 id 由两套不同的 slugify 生成——
 *   - 链接端：hexo-filter-titlebased-link 用 hexo-util 的 slugize，
 *     其 rSpecial 只覆盖 ASCII 标点，全角标点（如（）、：等）原样保留；
 *   - 标题端：markdown-it-toc-and-anchor 用 uslug，NFKC 归一化后
 *     剥除一切标点。
 * 于是指向含全角标点标题的双链，其 href fragment 与 heading id
 * 不一致，点击只能跳到页顶（旧版部署上即如此，非主题升级引入）。
 *
 * 方案：after_render:html 阶段，对 fragment 含非 ASCII 字符的站内
 * 链接做 uslug 等价归一化（NFKC → 只保留字母/数字/Mark 与 -_~
 * → 空白与连续横线并为单个 - → 小写），与标题 id 对齐。
 * 纯 ASCII fragment（含 %xx 百分号编码的）一律不动，避免误伤
 * 外部链接与 TOC 等正常链接。
 */

'use strict'

// 与 heading id 的生成规则（uslug）保持一致
const normalizeFragment = (str) => str
  .normalize('NFKC')                                  // 全角（）：，等 → 半角形式
  .replace(/[　-。！-＂]/g, '-')                      // 与 uslug 相同：中日韩句读 → 分隔符
  .replace(/[^\p{L}\p{N}\p{M}\-~_]/gu, '')            // 剥除标点/符号，保留字母、数字、组合符与 -_~
  .replace(/[\s-]+/g, '-')                            // 空白与连续横线并为单个 -
  .toLowerCase()
  .replace(/^-+|-+$/g, '')

hexo.extend.filter.register('after_render:html', (str) => {
  return str.replace(/(href=["'])(\/[^"'#<>\s]*)#([^"'<>]*)(["'])/g, (match, pre, path, frag, quote) => {
    if (!/[^\x00-\x7f]/.test(frag)) return match      // 纯 ASCII，不动
    const fixed = normalizeFragment(frag)
    if (!fixed || fixed === frag) return match
    return pre + path + '#' + fixed + quote
  })
})
