/**
 * markdown-it-raw-math
 *
 * 背景：本站 math 由浏览器端 MathJax 渲染（见 _config.stellar.yml plugins.mathjax），
 * 服务端没有 markdown 插件"认领"公式时，markdown-it 会把公式当普通文本处理：
 *   1. emphasis 规则把 $...$ 里的 `_` 跨公式配对成 <em>，破坏 $ 配对；
 *   2. 反斜杠转义吞掉 `\;`、`\,`、`\{`、矩阵换行的 `\\`。
 * 本插件只保护、不渲染：把 $...$ / $$...$$ 作为整体 token 消费掉
 * （emphasis 与转义规则因此看不到公式内部），再以原样文本输出，
 * 交给浏览器端 MathJax 渲染。Obsidian / VSCode 预览不受影响。
 */

'use strict';

function isSpace(ch) { return ch === 0x20 || ch === 0x09; }
function isDigit(ch) { return ch >= 0x30 && ch <= 0x39; }

/* 行内公式：$...$ 与 $$...$$（同一行内闭合，不跨行） */
function math_inline(state, silent) {
    var src = state.src, pos = state.pos, max = state.posMax, ch;

    if (src.charCodeAt(pos) !== 0x24 /* $ */) { return false; }

    var dbl = src.charCodeAt(pos + 1) === 0x24;
    var openLen = dbl ? 2 : 1;

    function consumeAsText(n) {
        if (!silent) { state.pending += src.slice(pos, pos + n); }
        state.pos += n;
        return true;
    }

    // 开定界符后不能紧跟空白
    var nextChar = src.charCodeAt(pos + openLen);
    if (isNaN(nextChar) || isSpace(nextChar)) { return consumeAsText(1); }

    // 同一行内寻找闭定界符
    var scan = pos + openLen, found = -1;
    while (scan < max) {
        ch = src.charCodeAt(scan);
        if (ch === 0x0A /* \n */) { break; }
        if (ch === 0x5C /* \ */ && src.charCodeAt(scan + 1) === 0x24) { scan += 2; continue; } // \$ 不是定界符
        if (ch === 0x24) {
            if (dbl) {
                if (src.charCodeAt(scan + 1) === 0x24) { found = scan; break; }
                scan += 1; continue;
            }
            found = scan; break;
        }
        scan += 1;
    }
    if (found === -1) { return consumeAsText(1); }

    // 闭定界符前不能是空白；单 $ 的闭定界符后不能紧跟数字（防 "$...$1" 误配对）
    if (isSpace(src.charCodeAt(found - 1))) { return consumeAsText(1); }
    if (!dbl && isDigit(src.charCodeAt(found + 1))) { return consumeAsText(1); }

    if (!silent) {
        var token = state.push('raw_math', '', 0);
        token.markup = dbl ? '$$' : '$';
        token.content = src.slice(pos + openLen, found);
    }
    state.pos = found + openLen;
    return true;
}

/* 独立成块的 $$...$$（可跨行），逻辑同 @iktakahiro/markdown-it-katex 的块规则 */
function math_block(state, start, end, silent) {
    var firstLine, lastLine, next, lastPos, found = false, token,
        pos = state.bMarks[start] + state.tShift[start],
        max = state.eMarks[start];

    if (pos + 2 > max) { return false; }
    if (state.src.slice(pos, pos + 2) !== '$$') { return false; }

    pos += 2;
    firstLine = state.src.slice(pos, max);

    if (silent) { return true; }
    if (firstLine.trim().slice(-2) === '$$') {
        firstLine = firstLine.trim().slice(0, -2);
        found = true;
    }

    for (next = start; !found;) {
        next++;
        if (next >= end) { break; }

        pos = state.bMarks[next] + state.tShift[next];
        max = state.eMarks[next];

        if (pos < max && state.tShift[next] < state.blkIndent) { break; }

        if (state.src.slice(pos, max).trim().slice(-2) === '$$') {
            lastPos = state.src.slice(0, max).lastIndexOf('$$');
            lastLine = state.src.slice(pos, lastPos);
            found = true;
        }
    }

    if (!found) { return false; }

    state.line = next + 1;

    token = state.push('raw_math_block', '', 0);
    token.block = true;
    token.content = (firstLine && firstLine.trim() ? firstLine + '\n' : '')
        + state.getLines(start + 1, next, state.tShift[start], true)
        + (lastLine && lastLine.trim() ? lastLine : '');
    token.map = [start, state.line];
    token.markup = '$$';
    return true;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

module.exports = function raw_math_plugin(md) {
    // 输出原样定界符，MathJax 在浏览器端读取 textContent 后自行渲染
    md.renderer.rules.raw_math = function (tokens, idx) {
        var t = tokens[idx];
        return escapeHtml(t.markup + t.content + t.markup);
    };
    md.renderer.rules.raw_math_block = function (tokens, idx) {
        return escapeHtml('$$\n' + tokens[idx].content + '\n$$') + '\n';
    };

    md.inline.ruler.after('escape', 'math_inline', math_inline);
    md.block.ruler.after('blockquote', 'math_block', math_block, {
        alt: ['paragraph', 'reference', 'blockquote', 'list']
    });
};
