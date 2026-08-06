---
title: LeetCode 3501 操作后最大活跃区段数 II  - Solution
category: 题解
platform: LeetCode
tags:
  - LeetCode
  - 字符串
  - ST表
  - 贪心
author: zaochen
description: LeetCode 3501「操作后最大活跃区段数 II」题解，基于 I 版结论将交易转化为相邻 0 块合并，用 Sparse Table 预处理相邻 0 块长度和的区间最大值，支持 O(log n) 单次查询。
abbrlink: 122ef01b
date: 2026-07-23
---
## 1. 题目数据 (Problem Metadata)

- **题目类型**：传统题
- **题目链接**：[3501. 操作后最大活跃区段数 II - 力扣（LeetCode）](https://leetcode.cn/problems/maximize-active-section-with-trade-ii/)

## 2. 题意简述 (Problem Summary)

给定长度为 $n$（$1 \le n \le 10^5$）的二进制字符串 $s$，$s[i] \in \{\texttt{'0'}, \texttt{'1'}\}$，以及 $q$ 个查询（$1 \le q \le 10^5$），每个查询给出区间 $[l_i, r_i]$。对每个查询，将子串 $s[l_i..r_i]$ 两端各补一个 $\texttt{'1'}$ 得到 $t = \texttt{'1'} + s[l_i..r_i] + \texttt{'1'}$，在 $t$ 上最多执行一次「交易」：

1. 选一个被 $\texttt{'0'}$ 包围的连续 $\texttt{'1'}$ 块，整体变 $\texttt{'0'}$；
2. 再选一个被 $\texttt{'1'}$ 包围的连续 $\texttt{'0'}$ 块，整体变 $\texttt{'1'}$。

求交易后 $s$ **全体**中 $\texttt{'1'}$ 的最大数量。各查询独立，两端补的 $\texttt{'1'}$ 不计入答案。

由 [I 版（3499）](https://leetcode.cn/problems/maximize-active-section-with-trade-i/) 的结论，一次交易的净效果是「选两个相邻的、被 $\texttt{1}$ 包围的 $\texttt{0}$ 块，连同中间的 $\texttt{1}$ 块一起变成 $\texttt{1}$」，增量恰为两个 $\texttt{0}$ 块长度之和。因此每个查询的答案为：

$$
\text{ans}_i = \text{cnt1} + \max_{\text{valid pairs in } [l_i, r_i]} \big(z_L.\text{len} + z_R.\text{len}\big)
$$

其中 $\text{cnt1}$ 表示 $s$ 中 $\texttt{'1'}$ 的总数。关键在于：两端的虚拟 $\texttt{'1'}$ 使得查询边界处的 $\texttt{0}$ 块（即使被截断）也能参与交易。

## 3. 朴素解法 (Brute-Force)

对每个查询，提取子串 $s[l_i..r_i]$，两端补 $\texttt{'1'}$ 后分段，枚举所有相邻 $\texttt{0}$ 块对取最大值。单次查询 $O(r_i - l_i + 1)$，总复杂度 $O(nq)$。$n = q = 10^5$ 时约 $10^{10}$ 次运算，远超时限。

瓶颈在于每个查询都重复分段和枚举。所有查询共享同一个字符串，$\texttt{0}$ 块分布是固定的，可以预处理分段信息后用区间最值数据结构加速查询。

## 4. 核心解法 (Main Solution)

### 特殊性质

交易增益只依赖两个相邻 $\texttt{0}$ 块的长度之和。查询边界的虚拟 $\texttt{'1'}$ 允许被截断的 $\texttt{0}$ 块也能作为交易的 $\texttt{0}$ 块——虚拟 $\texttt{'1'}$ 充当其外侧边界。因此只需在预处理好的 $\texttt{0}$ 块上做区间最值查询。

### 关键突破

从 $s$ 中提取所有 $\texttt{0}$ 块 $z_1, z_2, \dots, z_k$（按出现顺序），对相邻对预计算 $w_i = z_i.\text{len} + z_{i+1}.\text{len}$（$i = 1, \dots, k-1$），用稀疏表（Sparse Table）维护 $w_i$ 的区间最大值。对每个查询，二分定位查询边界处的 $\texttt{0}$ 块，分四种情况计算最大增益。

### 推导过程

**第 1 步：预处理。** 将 $s$ 按连续相同字符分段，提取所有 $\texttt{0}$ 段，记为 $z_1, \dots, z_k$。每个 $z_i$ 记录起始位置 $z_i.l$、结束位置 $z_i.r$ 和长度 $z_i.\text{len}$。对相邻对建立数组 $w[1..k-1]$：

$$
w[i] = z_i.\text{len} + z_{i+1}.\text{len}
$$

对 $w$ 建立 Sparse Table 支持 $O(1)$ 区间最大值查询。

**第 2 步：查询定位。** 对查询 $[l, r]$（转为 1-based），二分找到：

- $\text{fst}$：第一个 $z_i.l \ge l$ 的 $\texttt{0}$ 块；
- $\text{lst}$：最后一个 $z_i.r \le r$ 的 $\texttt{0}$ 块。

**第 3 步：分类计算增益。** 定义：

- $\text{left}_0 = f_0[z_{\text{fst}}.l - 1] - f_0[l - 1]$，即 $[l, z_{\text{fst}}.l - 1]$ 中的 $\texttt{0}$ 数（左侧被截断的 $\texttt{0}$ 块在查询范围内的部分）；
- $\text{right}_0 = f_0[r] - f_0[z_{\text{lst}}.r]$，即 $[z_{\text{lst}}.r + 1, r]$ 中的 $\texttt{0}$ 数（右侧被截断部分）。

增益来源有四种（取适用的最大值）：

| 情况       | 条件                                                                                                           | 增益公式                                       | 含义                                                     |
| :--------- | :------------------------------------------------------------------------------------------------------------- | :--------------------------------------------- | :------------------------------------------------------- |
| ① 左侧合并 | $z_{\text{fst}}$ 完全在 $[l, r]$ 内，且 $\text{left}_0 > 0$                                                    | $\text{left}_0 + z_{\text{fst}}.\text{len}$    | 左截断 $\texttt{0}$ + 第一个完整 $\texttt{0}$ 块         |
| ② 右侧合并 | $z_{\text{lst}}$ 完全在 $[l, r]$ 内，且 $\text{right}_0 > 0$                                                   | $\text{right}_0 + z_{\text{lst}}.\text{len}$   | 最后一个完整 $\texttt{0}$ 块 + 右截断 $\texttt{0}$       |
| ③ 两侧合并 | $\text{left}_0, \text{right}_0 > 0$ 且 $\text{left}_0 + \text{right}_0 + (区间内\ \texttt{1}\ 数) = r - l + 1$ | $\text{left}_0 + \text{right}_0$               | 左右两个截断 $\texttt{0}$ 合并（无完整 $\texttt{0}$ 块） |
| ④ 中间合并 | $z_{\text{fst}}$ 和 $z_{\text{lst}}$ 均完全在区间内，且 $\text{fst} < \text{lst}$                              | $\text{ST\_query}(\text{fst}, \text{lst} - 1)$ | 中间所有完整 $\texttt{0}$ 块中相邻对之和的最大值         |

最终答案 $= \text{cnt1} + \max(0, \text{四种增益的最大值})$。

## 5. 正确性证明 (Proof of Correctness)

需证四种情况不重不漏地覆盖了所有可能的交易。

在 $t = \texttt{'1'} + s[l..r] + \texttt{'1'}$ 中，一次交易选两个被 $\texttt{1}$ 包围的相邻 $\texttt{0}$ 块。这两个 $\texttt{0}$ 块在查询范围内的位置关系有以下几种：

**两个 $\texttt{0}$ 块都完全在 $[l, r]$ 内。** 它们对应 $z_{\text{fst}}, \dots, z_{\text{lst}}$ 中的某对相邻 $\texttt{0}$ 块，增益由 Sparse Table 覆盖（情况 ④）。

**左 $\texttt{0}$ 块被截断（起始 $\lt l$），右 $\texttt{0}$ 块完全在区间内。** 左 $\texttt{0}$ 块在区间内的部分为 $\text{left}_0$，虚拟 $\texttt{'1'}$ 在其左侧充当中间 $\texttt{1}$ 块的备选边界。左截断 $\texttt{0}$ 块必定结束于 $z_{\text{fst}}.l - 1$ 之前（否则与 $z_{\text{fst}}$ 合并为同一块），且 $z_{\text{fst}}.l - 1$ 位置是 $\texttt{'1'}$。因此 $\text{left}_0$ 个 $\texttt{0}$ 与 $z_{\text{fst}}$ 中的 $\texttt{0}$ 被至少一个 $\texttt{'1'}$ 隔开，满足交易条件。增益为 $\text{left}_0 + z_{\text{fst}}.\text{len}$（情况 ①）。

**右 $\texttt{0}$ 块被截断，左 $\texttt{0}$ 块完全在区间内。** 与上对称（情况 ②）。

**两个 $\texttt{0}$ 块都被截断。** 此时查询区间内没有完整的 $\texttt{0}$ 块（即 $\text{fst} > \text{lst}$），所有 $\texttt{0}$ 来自左右截断部分。区间内容恰好由 $\text{left}_0$ 个 $\texttt{0}$、一段 $\texttt{1}$、$\text{right}_0$ 个 $\texttt{0}$ 组成——条件 $\text{left}_0 + \text{right}_0 + (区间内\ \texttt{1}\ 数) = r - l + 1$ 恰好刻画了这一情况。若等式不成立，说明区间内存在完整 $\texttt{0}$ 块，应归入前面三种情况之一。增益为 $\text{left}_0 + \text{right}_0$（情况 ③）。

四种情况互斥（由 $\texttt{0}$ 块在区间内的位置关系决定）且完备（覆盖两个 $\texttt{0}$ 块的所有位置关系），不重不漏。最终答案在所有适用情况中取最大值加上 $\text{cnt1}$。综上所述，算法正确。

## 6. 复杂度分析 (Complexity)

- **时间复杂度**：预处理 $O(n + k\log k)$（分段 $O(n)$，ST 表 $O(k\log k)$，$k$ 为 $\texttt{0}$ 块数，$k \le n$）。每次查询 $O(\log k)$（二分）+ $O(1)$（ST 查询）。总复杂度 $O(n \log n + q \log n)$，$n = q = 10^5$ 时约 $2 \times 10^6$ 次运算，轻松通过。
- **空间复杂度**：$O(n \log n)$（ST 表 $O(k\log k)$ + 前缀和与分段数组 $O(k)$），未超典型内存限制。
- **常数优化**：ST 表查询 $O(1)$ 已是最优；$\lg$ 数组只初始化到 $k-1$ 而非 $N$，在多次测试用例场景中可减少不必要计算。线段树替代 ST 表会多一个 $\log$ 因子，常数也更大，不必引入。

## 7. 实现细节与避坑指南 (Implementation Details)

| 坑点                                 | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| :----------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1-based 索引**                     | 代码在 $s$ 前补空格（`s = " " + s`），数组下标从 $1$ 开始。查询传入的 0-based 下标需 $+1$ 转换（`ql = q[0] + 1, qr = q[1] + 1`）。前缀和数组 `f0[0]`、`f1[0]` 为全局变量自动初始化为 $0$。                                                                                                                                                                                                                                                                                         |
| **二分边界处理**                     | 当 $z_r = 1$ 且唯一 $\texttt{0}$ 块不完全在 $[l, r]$ 内时，二分不执行（$cl = cr$），`fst_chk` / `lst_chk` 可能指向不在区间内的 $\texttt{0}$ 块。后续的 `valid_fst` / `valid_lst` 检查（判断该块是否完全被 $[l, r]$ 包含）会过滤此情况，确保不会错误触发增益计算。                                                                                                                                                                                                                  |
| **$z_r = 0$ 的无 $\texttt{0}$ 情况** | 当 $s$ 全为 $\texttt{'1'}$ 时 $z_r = 0$（无 $\texttt{0}$ 块），代码未显式提前返回。此时二分搜索 $cr = 0$，$cl = cr$ 不执行循环，`fst_chk = 1, lst_chk = 0`。`zeros[1]` 为全局零初始化（`l = r = 0`），后续 `valid_fst`、`valid_lst` 均为 `false`，所有增益条件均不满足，答案退化为 `f1[n] = n`。虽然结果正确但 `f0[-1]` 一次越界访问属于 UB，建议在开头加 `if (zr == 0) return vector<int>(queries.size(), n);` 提前返回。首次写代码时忽略了这个问题，但是仍然通过了所有测试数据。 |
| **ST 表建表循环边界**                | 相邻对数组 $w$ 有 $k-1$ 个元素（下标 $1..k-1$）。建表时 `i < zr` 恰好覆盖 $i = 1..k-1$；`pow2(j) < zr` 确保 $2^j \le k-1$。查询条件 `fst_chk < lst_chk` 保证 $l \le r$（`ST_query(fst_chk, lst_chk - 1)` 中 $l \le r$）。                                                                                                                                                                                                                                                          |
| **$\lg$ 数组初始化范围**             | `lg[1] = 0; for i=2..zr-1` 只初始化到 $k-1$。ST 查询的最大区间长度为 $k-1$，$lg[k-1]$ 已包含。标准写法可初始化到 $N$，但当前范围已足够且避免多余计算。                                                                                                                                                                                                                                                                                                                             |
| **前缀和数组的 `f0` 与 `f1`**        | `f0[i]` = $s[1..i]$ 中 $\texttt{'0'}$ 的个数，`f1[i]` = $\texttt{'1'}$ 的个数。区间内 $\texttt{1}$ 数 = `f1[r] - f1[l-1]`，区间内 $\texttt{0}$ 数 = `f0[r] - f0[l-1]`。`f0` 同时用于计算截断部分的 $\texttt{0}$ 数。                                                                                                                                                                                                                                                               |
| **多测试用例**                       | LeetCode 上全局数组不会自动清零，但本代码会覆盖所有使用到的下标（`f0[0..n]`、`chks[1..chk]`、`zeros[1..zr]`、`st[1..zr-1][*]`、`lg[1..zr-1]`），无需手动清空。事实上，在写本题前，我不太了解 Leetcode 的多测机制，调试时发现把 `chk` 和 `zr` 两个全局变量放到函数中就可以实现清零的效果。                                                                                                                                                                                          |

## 8. 参考代码 (Reference Code)

我提交时使用的版本，采用「分段 + Sparse Table + 二分定位 + 四分类增益」的思路。

```cpp
#define pow2(x) (1 << (x))

const int N = 1e5 + 5;

int f0[N], f1[N]; // 前缀和：0 和 1 的个数
struct chunk {
    bool type;
    int l, r;
    chunk() {};
    chunk(bool _type, int _l, int _r) {
        type = _type;
        l = _l;
        r = _r;
    }
    int length() { return r - l + 1; }
} chks[N], zeros[N]; // 全部分段 / 仅 0 段

int st[N][20], // st[i][0] = zeros[i].length() + zeros[i + 1].length()
    lg[N];

int ST_query(int l, int r) {
    int k = lg[r - l + 1];
    return max(st[l][k], st[r - pow2(k) + 1][k]);
}

class Solution {
public:
    vector<int> maxActiveSectionsAfterTrade(string s,
                                            vector<vector<int>>& queries) {
        int chk = 0, zr = 0;

        int n = s.length();
        s = " " + s; // 转换为 1-based

        // 预处理前缀和与分段
        for (int i = 1; i <= n; i++) {
            f0[i] = f0[i - 1] + (s[i] == '0');
            f1[i] = f1[i - 1] + (s[i] == '1');

            if (s[i] != s[i - 1])
                chks[++chk] = chunk(s[i] - '0', i, i);
            else
                ++chks[chk].r;
        }

        // 提取 0 段
        for (int i = 1; i <= chk; i++)
            if (!chks[i].type)
                zeros[++zr] = chks[i];

        // 特判：无 0 段时没有交易可做
        if (zr == 0)
            return vector<int>(queries.size(), n);

        // 初始化 Sparse Table
        lg[1] = 0;
        for (int i = 2; i < zr; i++)
            lg[i] = lg[i >> 1] + 1;

        for (int i = 1; i < zr; i++)
            st[i][0] = zeros[i].length() + zeros[i + 1].length();
        for (int j = 1; pow2(j) < zr; j++)
            for (int i = 1; i + pow2(j) - 1 < zr; i++)
                st[i][j] = max(st[i][j - 1],
                               st[i + pow2(j - 1)][j - 1]);

        vector<int> answers;
        for (auto& q : queries) {
            int ql = q[0] + 1, qr = q[1] + 1; // 转为 1-based
            int cl = 1, cr = zr;
            int fst_chk, lst_chk;

            // 二分：第一个 l >= ql 的 0 段
            while (cl < cr) {
                int mid = (cl + cr) >> 1;
                if (zeros[mid].l >= ql)
                    cr = mid;
                else
                    cl = mid + 1;
            }
            fst_chk = cl;

            // 二分：最后一个 r <= qr 的 0 段
            cl = 1, cr = zr;
            while (cl < cr) {
                int mid = (cl + cr + 1) >> 1;
                if (zeros[mid].r <= qr)
                    cl = mid;
                else
                    cr = mid - 1;
            }
            lst_chk = cl;

            int ans = f1[n]; // 基线：不交易

            int valid_l0 = (f0[zeros[fst_chk].l - 1] - f0[ql - 1]),
                valid_r0 = (f0[qr] - f0[zeros[lst_chk].r]);

            bool valid_fst = zeros[fst_chk].r <= qr
                          && zeros[fst_chk].l >= ql,
                 valid_lst = zeros[lst_chk].l >= ql
                          && zeros[lst_chk].r <= qr;

            // ① 左侧截断 + 第一个完整 0 段
            if (valid_fst && valid_l0)
                ans = max(ans, f1[n] + valid_l0
                                 + zeros[fst_chk].length());

            // ② 最后一个完整 0 段 + 右侧截断
            if (valid_lst && valid_r0)
                ans = max(ans, f1[n] + valid_r0
                                 + zeros[lst_chk].length());

            // ③ 两侧截断合并（区间内无完整 0 段）
            if (valid_l0 > 0 && valid_r0 > 0 &&
                (f1[qr] - f1[ql - 1] + valid_l0 + valid_r0)
                    == (qr - ql + 1))
                ans = max(ans, f1[n] + valid_l0 + valid_r0);

            // ④ 中间完整相邻 0 段对
            if (valid_fst && valid_lst && fst_chk < lst_chk)
                ans = max(ans, f1[n]
                              + ST_query(fst_chk, lst_chk - 1));

            answers.push_back(ans);
        }
        return answers;
    }
};
```

## 9. 补充说明 (Additional Notes)

- **题目背景**：本题是 LeetCode 3501（难度分 2941，Hard），与 [I 版 3499](https://leetcode.cn/problems/maximize-active-section-with-trade-i/) 同属「操作后最大活跃区段数」系列。I 版是单次查询 $O(n)$ 线性扫描；II 版引入 $q \le 10^5$ 个查询，需要 ST 表（或线段树）将单次查询降至 $O(\log n)$。两者的核心思想一脉相承：交易的净效果是合并两个相邻 $\texttt{0}$ 块。
- **ST 表 vs 线段树**：本题无修改操作，ST 表 $O(1)$ 查询优于线段树 $O(\log n)$，且常数更小、实现更短。当 $q = 10^5$ 时，ST 表的优势更加明显。线段树实现可作为替代方案，思路相同：维护区间内相邻 $\texttt{0}$ 块长度之和的最大值，处理 RMQ。如果对 ST 表不够熟悉的读者，可以参考我的 ST 表笔记：[[【数据结构】ST 表 学习笔记]]。
- **官方 Hint**：此题官方给出了 5 条 Hint 作为解题引导——分段编号、答案公式为相邻段长度和、$\texttt{0}$ 段定义 $ans[i] = 0$、三段均需完全在区间内、用线段树做区间最值并单独处理首尾。我上面的实现正是这条路径的完整版本，只是我觉得用 ST 表处理本题更合适。
- **码风说明**：1-based 索引（字符串前补空格）、全局数组、`pow2` 宏是 OI 赛制下的常见习惯，避免频繁传参和重复计算。在 LeetCode 上使用全局数组时只需注意：每次调用会覆盖使用到的下标区域，无需额外清空。
