---
title: Codeforces 670C Cinema - Solution
category: 题解
platform: Codeforces
tags:
  - Codeforces
  - 离散化
  - 贪心
author: zaochen
abbrlink: a9a1b994
date: 2026-07-28 12:08:28
---
## 1. 题目数据 (Problem Metadata)

- **题目类型**：传统题
- **题目链接**：[Problem - 670C - Codeforces](https://codeforces.com/problemset/problem/670/C)
- **时间限制**：2 秒
- **内存限制**：256 MB

## 2. 题意简述 (Problem Summary)

给定 $n$（$1 \le n \le 2 \times 10^5$）位科学家的语言 $a_i$（$1 \le a_i \le 10^9$）及 $m$（$1 \le m \le 2 \times 10^5$）场电影，每场电影 $j$ 有配音语言 $b_j$ 与字幕语言 $c_j$（$1 \le b_j, c_j \le 10^9$，且 $b_j \neq c_j$）。所有科学家必须看同一场电影：能听懂配音者"愉悦"，能看懂字幕者"满意"。定义 $f_j = |\{i : a_i = b_j\}|$ 为看了场 $j$ 会愉悦的人数，$s_j = |\{i : a_i = c_j\}|$ 为会满意的人数。求使 $(f_j, s_j)$ 在字典序下最大（先最大化 $f_j$，再最大化 $s_j$）的电影编号 $j$（1-indexed）。

## 3. 朴素解法 (Brute-Force)

对每场电影 $j$，遍历全部 $n$ 位科学家逐一统计 $f_j$ 与 $s_j$，再取字典序最大。复杂度 $O(nm)$，当 $n = m = 2 \times 10^5$ 时约 $4 \times 10^{10}$ 次运算，远超时限。瓶颈在于：每评估一场电影都重复扫描全体科学家，同一语言的人数被反复统计。

## 4. 核心解法 (Main Solution)

- **特殊性质**：愉悦人数 $f_j$ 与满意人数 $s_j$ 只依赖于"有多少科学家会说语言 $b_j$（或 $c_j$）"，与科学家的排列顺序无关。因此可以预先统计每种语言的人数，之后每场电影的评估降为 $O(1)$ 查表。
- **关键突破**：语言编号高达 $10^9$，无法直接开下标数组。将所有出现过的语言（来自 $a_i, b_j, c_j$）收集、排序、去重，建立"语言 $\to$ 离散编号"的映射，把值域从 $10^9$ 压到 $O(n + m)$ 的连续区间。随后用 `cnt[离散编号]` 即可 $O(1)$ 查询任意语言的人数。
- **推导过程**：设离散化后语言 $x$ 对应的科学家人数为 $\text{cnt}[x]$。对每场电影 $j$，计算 $f_j = \text{cnt}[b_j]$、$s_j = \text{cnt}[c_j]$，在 $m$ 场电影中维护 $(f_j, s_j)$ 的字典序最大值即为答案。

## 5. 正确性证明 (Proof of Correctness)

算法分两步：离散化计数 + 字典序比较。

**离散化的正确性**：排序去重后，每个不同的原语言唯一映射到一个连续的离散编号，且 `query` 对该语言的二分查询稳定返回同一编号。因此 $\text{cnt}\left[\text{disc}(x)\right]$ 恰好等于会说语言 $x$ 的科学家人数，与直接用原编号做哈希计数完全等价。

**比较的正确性**：遍历全部 $m$ 场电影，维护当前最优答案 $\text{ans}$。对每场电影 $i$，仅当 $(f_i, s_i)$ 在字典序意义下严格优于当前最优 $(f_{\text{ans}}, s_{\text{ans}})$ 时才更新。由于遍历了所有候选，且每次更新都保证新答案不劣于旧答案，最终 $\text{ans}$ 必为全局字典序最大。

通俗地，这就像先按"愉悦人数"排座次、同座次再按"满意人数"排座次，扫一遍把排第一的那场选出来即可，不重不漏。综上所述，算法正确。

## 6. 复杂度分析 (Complexity)

- **时间复杂度**：离散化排序 $O((n + m) \log(n + m))$；计数与选优阶段共 $n + 2m$ 次 `query`（每次 `lower_bound` 查询 $O(\log(n + m))$）。总计 $O((n + m) \log(n + m))$。当 $n + m = 4 \times 10^5$ 时约 $10^7$ 量级，$2$ 秒时限充裕。
- **空间复杂度**：$O(n + m)$，存储语言数组、离散化数组与计数数组，远低于 256 MB。

## 7. 实现细节与避坑指南 (Implementation Details)

- **整数范围**：语言编号 $\le 10^9$，`int`（上界约 $2.1 \times 10^9$）即可容纳，计数 $\le n \le 2 \times 10^5$ 更无溢出风险，无需 `long long`。
- **离散化去重**：推荐写法 `if (i == 1 || lang[i] != lang[i-1])` 显式处理 $i = 1$（见 §8），比依赖 `lang[0]` 恰好为 $0$ 更稳妥；若改用 `std::unique` 也必须先 `sort`，且注意 `unique` 只去相邻重复。离散化后，也可以一口气把所有语言数据全部替换，减小反复二分带来的复杂度。
- **数组大小**：所有语言编号收集到 `lang[]` 共 $n + 2m$ 个，上界 $6 \times 10^5$，开 `3 * N` 即可；`uniq[]`、`cnt[]` 同规模。
- **`query` 的边界**：`query` 只会被 $a_i, b_j, c_j$ 调用，而这些值都已进入离散化数组，必能查到，无需处理"查不到"的情况。
- **字典序比较**：严格按"先比 $f$，相等再比 $s$"实现，用 `happy > bestHappy || (happy == bestHappy && sat > bestSat)` 即可；若缓存了当前最优的 `bestHappy/bestSat`，可避免每轮重复对 `b[ans], c[ans]` 做二分。

## 8. 参考代码 (Reference Code)

下面给出离散化做法，直接在我很久之前写的版本上改写：保留"收集语言 + 排序去重 + `query()` 二分"的框架，把变量名改为有意义的形式，去重循环改用模板里的 `if (i == 1 || lang[i] != lang[i-1])` 以显式处理首元素，并在选优时缓存 `bestHappy/bestSat` 减少冗余二分。

```cpp
#include <bits/stdc++.h>
using namespace std;

const int N = 2e5 + 5;
const int M = 3 * N;  // 最多 n + 2m 种不同语言

int n, m;
int a[N], b[N], c[N];   // a[]: 科学家语言; b[]/c[]: 电影配音/字幕语言
int lang[M];            // 所有出现过的语言编号
int uniq[M];            // 去重后的离散化数组
int cnt[M];             // 每种语言对应的科学家人数
int d;                  // uniq 的有效长度

// 查询原语言 x 的离散编号（1-indexed）
int query(int x) {
    return lower_bound(uniq + 1, uniq + d + 1, x) - uniq;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n;
    for (int i = 1; i <= n; i++) {
        cin >> a[i];
        lang[i] = a[i];
    }
    cin >> m;
    for (int i = 1; i <= m; i++) {
        cin >> b[i];
        lang[n + i] = b[i];
    }
    for (int i = 1; i <= m; i++) {
        cin >> c[i];
        lang[n + m + i] = c[i];
    }

    // 离散化：排序 + 去重
    int total = n + 2 * m;
    sort(lang + 1, lang + total + 1);
    d = 0;
    for (int i = 1; i <= total; i++) {
        if (i == 1 || lang[i] != lang[i - 1]) uniq[++d] = lang[i];
    }

    // 统计每种语言的科学家人数
    for (int i = 1; i <= n; i++) {
        cnt[query(a[i])]++;
    }

    // 选出 (愉悦人数, 满意人数) 字典序最大的电影
    int ans = 1;
    int bestHappy = cnt[query(b[1])], bestSat = cnt[query(c[1])];
    for (int i = 2; i <= m; i++) {
        int happy = cnt[query(b[i])], sat = cnt[query(c[i])];
        if (happy > bestHappy || (happy == bestHappy && sat > bestSat)) {
            ans = i;
            bestHappy = happy;
            bestSat = sat;
        }
    }

    cout << ans << endl;
    return 0;
}
```

## 9. 补充说明 (Additional Notes)

- **其他数据结构**：除手写离散化外，本题也能用 `std::map<int, int>` 统计人数（单次操作 $O(\log(n + m))$，复杂度与离散化 + `lower_bound` 相同，但省去排序去重样板），或用 `unordered_map` 降到期望 $O(n + m)$。手写离散化的优势在于常数更小、对值域压缩更显式，作为离散化套路的学习样本更合适，这也是本题被收录进离散化笔记的原因。
- **问题定位**：本题是"离散化 + 计数"最基础的应用，核心思想是把大值域、小数据量问题通过排序去重映射到连续下标，从而用数组替代哈希表。这是 OI 中的通用套路，值得熟练掌握。
