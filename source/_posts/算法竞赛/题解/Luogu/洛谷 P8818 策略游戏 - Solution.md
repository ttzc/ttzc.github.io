---
title: 洛谷 P8818 策略游戏 - Solution
category: 题解
platform: Luogu
tags:
  - Luogu
  - min-max博弈
  - ST表
  - 区间最值
  - 博弈论
author: zaochen
abbrlink: 2983d0b1
date: 2026-07-22
description: CSP-S 2022 min-max 博弈题，利用符号分类与 ST 表预处理区间极值，将 O(qnm) 枚举优化至 O(q log n)，实现双方最优策略下的乘积值查询。
---
## 1. 题目数据 (Problem Metadata)

- **题目类型**：传统题
- **题目链接**：[P8818 [CSP-S 2022] 策略游戏 - 洛谷](https://www.luogu.com.cn/problem/P8818)
- **时间限制**：1.00s
- **内存限制**：512.00MB

## 2. 题意简述 (Problem Summary)

给定长度为 $n$ 的数组 $A$ 和长度为 $m$ 的数组 $B$（$1 \le n, m, q \le 10^5$，$|a_i|, |b_i| \le 10^9$）。共 $q$ 轮游戏，每轮给定 $l_1, r_1, l_2, r_2$：小 L 先从 $A[l_1..r_1]$ 中选一个数 $a$，小 Q 再从 $B[l_2..r_2]$ 中选一个数 $b$。小 L 要让 $a \cdot b$ 尽可能大，小 Q 要让 $a \cdot b$ 尽可能小。求每轮在双方最优策略下的乘积值：

$$
\text{ans} = \max_{a \in A[l_1..r_1]}\; \min_{b \in B[l_2..r_2]}\; a \cdot b
$$

## 3. 朴素解法 (Brute-Force)

最直接的想法是对每个查询枚举 $A[l_1..r_1]$ 中每个 $a$，对每个 $a$ 枚举 $B[l_2..r_2]$ 中每个 $b$ 计算 $a \cdot b$ 取最小值，再对 $a$ 取最大值。

- 每次查询需 $O\big((r_1-l_1+1)(r_2-l_2+1)\big)$，最坏 $O(nm)$。
- $q$ 次查询总计 $O(qnm) \approx 10^{15}$，完全不可行。

即使优化为「先扫描 $B$ 求得 $b_{\min}, b_{\max}$，再枚举 $A$ 中每个 $a$ 根据 $a$ 的符号选 $b_{\min}$ 或 $b_{\max}$」，每次查询仍需 $O(n+m)$，总计 $O\big(q(n+m)\big) \approx 2 \times 10^{10}$，仍然超时。瓶颈在于每次查询都要重新扫描数组求极值。

## 4. 核心解法 (Main Solution)

### 特殊性质

这是一个 **min-max 博弈**：小 L 先手最大化，小 Q 后手最小化。关键观察在于，给定小 L 选定的 $a$ 后，小 Q 的最优选择只取决于 $a$ 的符号，而与 $B$ 区间的正负组成无关。

### 关键突破

固定 $a$，小 Q 要选 $b$ 使 $a \cdot b$ 最小：

- 若 $a > 0$：$a \cdot b$ 随 $b$ 单调递增，小 Q 选 $b_{\min}$。
- 若 $a < 0$：$a \cdot b$ 随 $b$ 单调递减，小 Q 选 $b_{\max}$。
- 若 $a = 0$：乘积恒为 $0$。

因此无论 $B$  区间是全正、全负还是混合，小 Q 的选择都统一为「$a$ 负选 $b_{\max}$，$a$ 正选 $b_{\min}$」。这就是为什么代码只需要维护 $B$ 的区间最大值与最小值，而不必像后文分析 $A$  那样细分 $B$  的正负。

下面分析小 L 的选数策略。定义小 L 选定 $a$ 后的最终结果为：
$$
g(a) = \begin{cases} a \cdot b_{\min} & a > 0 \\ a \cdot b_{\max} & a < 0 \\ 0 & a = 0 \end{cases}
$$

小 L 要求 $\max g(a)$。注意到 $g(a)$ 在 $a > 0$ 和 $a < 0$ 两段上分别是关于 $a$ 的线性函数（系数 $b_{\min}$ 或 $b_{\max}$ 固定），而线性函数在区间上的最大值只在端点取得。因此小 L 只需考虑 $A$ 区间中的几个极值候选。接下来我们推导各种选择时的结果，以及选择策略。

### 推导过程

| 小 L 选 | 前提 | 小 Q 选 | 结果 |
| :----------------------- | :-------- | :--------- | :-------------------------- |
| 最小负数 $a_n^{\min}$（绝对值最大） | $A$ 含负数 | $b_{\max}$ | $a_n^{\min} \cdot b_{\max}$ |
| 最大负数 $a_n^{\max}$（绝对值最小） | $A$ 含负数 | $b_{\max}$ | $a_n^{\max} \cdot b_{\max}$ |
| 最小正数 $a_p^{\min}$ | $A$ 含正数 | $b_{\min}$ | $a_p^{\min} \cdot b_{\min}$ |
| 最大正数 $a_p^{\max}$ | $A$ 含正数 | $b_{\min}$ | $a_p^{\max} \cdot b_{\min}$ |
| $0$ | $A$ 含 $0$ | 任意 | $0$ |

之所以正数和负数各取两个端点，是因为 $b_{\min}$、$b_{\max}$ 的符号事先未知：当 $b_{\min} > 0$ 时正数段越大越好（选 $a_p^{\max}$），当 $b_{\min} < 0$ 时正数段越小越好（选 $a_p^{\min}$）；负数段同理。把所有存在的候选算一遍取 $\max$，即可覆盖所有情况。

至此问题归结为 $O(1)$ 查询 $A$ 的上述极值与 $B$ 的 $b_{\min}, b_{\max}$，用 **ST 表** 预处理即可。小 L 会在这些所有候选结果中选出一个最大的作为答案。

## 5. 正确性证明 (Proof of Correctness)

需证两点：小 Q 的最优策略，以及小 L 的候选集充分性。

**引理（小 Q 的最优选择）**：设小 L 已选 $a$，小 Q 在 $B$ 中选 $b$ 使 $a \cdot b$ 最小。当 $a > 0$ 时 $a \cdot b$ 关于 $b$ 单调递增，最小值在 $b = b_{\min}$ 取得；当 $a < 0$ 时关于 $b$ 单调递减，最小值在 $b = b_{\max}$ 取得；当 $a = 0$ 时乘积恒为 $0$。这与 $b_{\min}, b_{\max}$ 本身的正负无关，因为 $b_{\min}$ 始终是 $B$ 中最小的、$b_{\max}$ 始终是最大的。

**定理（小 L 候选集充分性）**：小 L 的最优 $a$ 一定在 $\{a_p^{\max}, a_p^{\min}, a_n^{\max}, a_n^{\min}, 0\}$（若存在）之中。对于 $a > 0$ 的部分，$g(a) = a \cdot b_{\min}$ 是关于 $a$ 的一次函数，$b_{\min}$ 为常数，一次函数在区间上的最大值在端点取得，故只需检查最小正数与最大正数。$a < 0$ 的部分，$g(a) = a \cdot b_{\max}$ 同理只需检查最小负数与最大负数。$a = 0$ 时 $g(0) = 0$。三类候选的并集不重不漏地覆盖了 $a$ 的所有取值，取 $\max$ 即得全局最优。

综上所述，算法正确。

## 6. 复杂度分析 (Complexity)

- **时间复杂度**：$O\big((n+m) \log n + q\big)$。ST 表建表 $5$ 个 $A$ 表加 $2$ 个 $B$ 表，每个 $O(n \log n)$，约 $7 \times 10^5 \times 17 \approx 1.2 \times 10^7$ 次运算；每次查询 $O(1)$，$q$ 次共 $10^5$。1s 时限内轻松通过。
- **空间复杂度**：$O(n \log n)$。$7$ 个 ST 表，每个表 $10^5 \times 20 \times 8$ 字节 $\approx 16$ MB，共约 $112$ MB，低于 $512$ MB 限制。

## 7. 实现细节与避坑指南 (Implementation Details)

| 坑点 | 说明 |
| :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **整数溢出** | $\|a_i\|, \|b_i\| \le 10^9$，乘积最大 $10^{18}$，必须用 `long long`。代码用 `#define int long long` 统一处理，是 OI 常用习惯。 |
| **哨兵值设计** | `inf = 2e9` 大于所有合法 $a_i$，`-inf` 小于所有合法 $a_i$，用作「不存在」标记。乘积不会触及 $\pm 2 \times 10^{18}$，`ans` 初始化为 $-2 \times 10^{18}$ 安全。 |
| **正/负数表的哨兵混用** | `a_max_p` 用 `max(a[i], 0)`（无正数时返回 $0$，配合 `L > 0` 判定）；`a_min_p` 用 `inf` 哨兵（无正数时返回 `inf`，配合 `L != inf` 判定）。两种风格混用但逻辑自洽：夹 $0$ 的表靠符号判定，`inf` 哨兵的表靠显式比较。 |
| **判定候选有效性** | 每个候选取出后必须检查是否「真的存在」：负数候选查 `L < 0 && L != -inf`，正数候选查 `L > 0 && L != inf`，避免用哨兵值参与乘法。 |
| **$\log_2$ 预处理** | 代码预处理 `lg2` 数组到 $10^5$，查询时 $O(1)$ 取 $k$，避免每次调用库函数。 |

## 8. 参考代码 (Reference Code)

下面是我按「先分析小 L 的选数策略，再推导小 Q 的最优反应」这一直觉顺序写出的 ST 表解法。维护 $A$ 的五个区间量（最大/最小正数、最大/最小负数、是否含 $0$）与 $B$ 的最大/最小值，每次查询枚举四个极值候选加 $0$ 取 $\max$。

```cpp
#include <bits/stdc++.h>
using namespace std;
#define int long long

const int N = 1e5 + 5, inf = 2e9;

int n, m, q;

int a[N], b[N];

int a_max_p[N][20], a_min_p[N][20], a_min_n[N][20], a_max_n[N][20];
int b_max[N][20], b_min[N][20];
int a_0[N][20];

int lg2[N];

#define pow2(x) (1<<(x))

void ST_init() {
    for (int i = 1;i <= n;i++) {
        a_max_p[i][0] = max(a[i], 0LL);
        a_min_p[i][0] = ((a[i] > 0) ? a[i] : inf);
        a_max_n[i][0] = ((a[i] < 0) ? a[i] : -inf);
        a_min_n[i][0] = min(a[i], 0LL);
        a_0[i][0] = (a[i] == 0);
    }
    for (int j = 1;j <= lg2[n];j++) {
        for (int i = 1;i + pow2(j) - 1 <= n;i++) {
            a_max_p[i][j] = max(a_max_p[i][j - 1], a_max_p[i + pow2(j - 1)][j - 1]);
            a_min_p[i][j] = min(a_min_p[i][j - 1], a_min_p[i + pow2(j - 1)][j - 1]);
            a_max_n[i][j] = max(a_max_n[i][j - 1], a_max_n[i + pow2(j - 1)][j - 1]);
            a_min_n[i][j] = min(a_min_n[i][j - 1], a_min_n[i + pow2(j - 1)][j - 1]);
            a_0[i][j] = a_0[i][j - 1] | a_0[i + pow2(j - 1)][j - 1];
        }
    }
    for (int i = 1;i <= m;i++) {
        b_max[i][0] = b_min[i][0] = b[i];
    }
    for (int j = 1;j <= lg2[m];j++) {
        for (int i = 1;i + pow2(j) - 1 <= m;i++) {
            b_max[i][j] = max(b_max[i][j - 1], b_max[i + pow2(j - 1)][j - 1]);
            b_min[i][j] = min(b_min[i][j - 1], b_min[i + pow2(j - 1)][j - 1]);
        }
    }
}

int ST_query_max(int st[][20], int l, int r) {
    int k = lg2[r - l + 1];
    return max(st[l][k], st[r - pow2(k) + 1][k]);
}

int ST_query_min(int st[][20], int l, int r) {
    int k = lg2[r - l + 1];
    return min(st[l][k], st[r - pow2(k) + 1][k]);
}

signed main() {
    // Don't stop. Don't hide. Follow the light, and you'll find tomorrow.

    scanf("%lld %lld %lld\n", &n, &m, &q);
    for (int i = 2;i <= 100000;i++) {
        lg2[i] = lg2[i / 2] + 1;
    }

    for (int i = 1;i <= n;i++) scanf("%lld ", &a[i]);
    for (int i = 1;i <= m;i++) scanf("%lld ", &b[i]);

    ST_init();

    for (int i = 1;i <= q;i++) {
        int l1, r1, l2, r2;
        scanf("%lld %lld %lld %lld\n", &l1, &r1, &l2, &r2);
        int ans = -2e18, L, Q;
        if (ST_query_max(a_0, l1, r1)) ans = 0;
        // L 选一个最小的负数
        L = ST_query_min(a_min_n, l1, r1);
        if (L < 0 && L != -inf) {
            Q = ST_query_max(b_max, l2, r2);
            ans = max(ans, L * Q);
        }
        // L 选一个最大的正数
        L = ST_query_max(a_max_p, l1, r1);
        if (L > 0 && L != inf) {
            Q = ST_query_min(b_min, l2, r2);
            ans = max(ans, L * Q);
        }
        // L 选一个最大的负数
        L = ST_query_max(a_max_n, l1, r1);
        if (L < 0 && L != -inf) {
            Q = ST_query_max(b_max, l2, r2);
            ans = max(ans, L * Q);
        }
        // L 选一个最小的正数
        L = ST_query_min(a_min_p, l1, r1);
        if (L > 0 && L != inf) {
            Q = ST_query_min(b_min, l2, r2);
            ans = max(ans, L * Q);
        }
        printf("%lld\n", ans);
    }
    return 0;
}
```

## 9. 补充说明 (Additional Notes)

- **题目渊源**：本题出自 **CSP-S 2022 第二轮** 第二题，是「min-max 博弈 + ST 表」的经典结合。这类「先手最大化、后手最小化」的零和博弈在竞赛中很常见，核心识别信号是双层 $\max\text{-}\min$ 嵌套——出现时先固定先手选择，分析后手的最优反应函数，往往能将后手的连续选择域压缩到少数极值上。
- **思路与代码的简化**：我在初步分析时曾想细分 $B$ 区间的正负组成（只含负数、只含正数、含 $0$、正负混合），对应维护 $B$ 的最大正数、最大非正数、最小负数、最小非负数。但推导后发现，小 Q 的最优 $b$ 选择只取决于 $a$ 的符号——$a$ 负选 $b_{\max}$，$a$ 正选 $b_{\min}$——与 $B$ 的正负组成无关。因此代码只需要 $b_{\max}$ 和 $b_{\min}$ 两个量，初步分析中的复杂分类是推导过程的中间产物，最终被统一掉了。这种「分析时多想几步、实现时只保留必要部分」是常见的解题节奏。ST 表作为静态区间极值查询的经典工具，在这类需要 $O(1)$ 查询多个极值的问题中几乎是首选，方法经典，有学习的价值。
- **其他方法**：线段树等区间数据结构也可以解决 RMQ 问题，但在此类场景中 ST 表更优。
