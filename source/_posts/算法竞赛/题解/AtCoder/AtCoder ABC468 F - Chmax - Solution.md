---
title: AtCoder ABC468 F - Chmax - Solution
category: 题解
platform: AtCoder
tags:
  - AtCoder
  - 贪心
  - LIS
author: zaochen
abbrlink: 776526af
date: 2026-08-03 19:59:00
description: 将 1~N 的排列依次分配到两个变量上，最大化"当前值小于新值"的计数。核心结论：前缀最大值必贡献，剩余元素的最大贡献数为其 LIS 长度，答案 = 前缀最大值个数 + LIS(剩余序列)，时间复杂度 O(N log N)。
---
## 1. 题目数据 (Problem Metadata)

- **题目类型**：传统题
- **题目链接**：[F - Chmax - AtCoder Beginner Contest 468](https://atcoder.jp/contests/abc468/tasks/abc468_f)
- **时间限制**：2 秒
- **内存限制**：1024 MB

## 2. 题意简述 (Problem Summary)

给定正整数 $N$（$1\le N\le5\times10^5$）与一个 $1\sim N$ 的排列 $P=(P_1,P_2,\dots,P_N)$。维护变量 $x,y$ 与计数器 $c$，初始均为 $0$。依次处理 $k=1,\dots,N$，每步把 $P_k$ 分给 $x$ 或 $y$ 之一，若该变量当前值小于 $P_k$ 则 $c$ 加 $1$，再令该变量更新为 $\max(\cdot,P_k)$。求最终 $c$ 的最大可能值。

## 3. 朴素解法 (Brute-Force)

枚举每个元素分给 $x$ 还是 $y$，共 $2^N$ 种方案。$N=5\times10^5$ 时不可能枚举完，且决策之间相互影响（先到的大元素会"堵住"后续小元素），无法简单剪枝。需要先找到结构的本质。

## 4. 核心解法 (Main Solution)

### 特殊性质

先观察两个事实：

- **前缀最大值必贡献**。若 $P_i$ 大于此前所有元素，则时刻 $i$ 时 $x,y$ 的当前值都小于 $P_i$，无论分给谁，$c$ 必加 $1$。
- **同一变量内的贡献位置值严格上升**。某位置贡献后，该变量变为 $P_i$，下一个贡献位置的值必须更大。

### 关键突破

把贡献位置分成两类：前缀最大值（必贡献）与非前缀最大值。可以证明：**非前缀最大值的贡献位置按时间序，其值必然严格上升**，于是它们构成"删除全部前缀最大值后的序列 $R$"的一个上升子序列，数量至多为 $\mathrm{LIS}(R)$。反过来，构造一组方案恰好达到"前缀最大值个数 $p$ 加上 $\mathrm{LIS}(R)$"。由此得出答案

$$\text{ans}=p+\mathrm{LIS}(R)$$

### 推导过程

删除所有前缀最大值，剩下按原顺序排成 $R$，任取 $R$ 的一条最长上升子序列 $S$。构造如下分配方案：

- 所有前缀最大值分给 $x$。由引理 1，它们恰好贡献 $p$ 次；
- $S$ 中的元素分给 $y$。$S$ 严格上升，$y$ 的当前值恒等于上一个 $S$ 元素，故 $S$ 中每个元素都贡献，共 $|S|=\mathrm{LIS}(R)$ 次；
- $R$ 中其余元素分给 $x$。时刻 $k$ 时 $x$ 的当前值等于此前前缀最大值中的最大者，即 $\max_{j<k}P_j$；而 $P_k$ 非前缀最大值意味着 $\max_{j<k}P_j>P_k$，故它们不产生贡献。

于是该方案总贡献恰为 $p+\mathrm{LIS}(R)$，达到上界。

## 5. 正确性证明 (Proof of Correctness)

**引理 1（前缀最大值必贡献）**：设所有前缀最大值构成的集合为$\mathrm{PM}$，对 $i\in\mathrm{PM}$，$P_i$ 大于所有 $j<i$ 的 $P_j$，即 $\mathrm{PM}=\{i|\forall j < i,P_j<P_i\}$，而 $x,y$ 在时刻 $i$ 前的值只能来自某个 $P_j$（$j<i$）或 $0$，故均小于 $P_i$。无论分给谁，该变量当前值小于 $P_i$，$c$ 必加 $1$。

**引理 2（非前缀最大值的贡献位置值严格上升）**：设 $i<j$ 均为非前缀最大值的贡献位置，且 $i$ 分给 $x$、$j$ 分给 $y$（同变量时由基本事实直接得 $P_i<P_j$）。反设 $P_i>P_j$。因 $i\notin\mathrm{PM}$，存在 $k<i$ 使 $P_k>P_i$。若 $k$ 分给 $x$，则 $x$ 在时刻 $i$ 前已不小于 $P_k>P_i$，$i$ 不贡献，矛盾；故 $k$ 必分给 $y$，但 $k<j$，于是 $y$ 在时刻 $j$ 前已不小于 $P_k>P_i>P_j$，$j$ 不贡献，矛盾。所以 $P_i<P_j$。

**上界**：任意策略的贡献 $=|\mathrm{PM}|+|\text{非 }\mathrm{PM}\text{ 贡献}|\le p+\mathrm{LIS}(R)$。由引理 2，非前缀最大值的贡献位置构成 $R$ 的上升子序列，其长度不超过 $\mathrm{LIS}(R)$。

**构造可达**：§4 已给出达到 $p+\mathrm{LIS}(R)$ 的方案。综上所述，$\text{ans}=p+\mathrm{LIS}(R)$，贪心策略正确。

通俗地，前缀最大值是"怎么分都躲不掉"的贡献，必须全部计入；剩下的元素里，只有能形成一条严格上升链的那些才有机会额外贡献，而两条变量链不可能同时占便宜——跨链的下降会被某一边的前驱大元素堵死，这正是引理 2 反证抓住的本质。

## 6. 复杂度分析 (Complexity)

- **时间复杂度**：扫描一遍统计前缀最大值并构造 $R$，$O(N)$；对 $R$ 求 $\mathrm{LIS}$ 用二分优化，$O(N\log N)$。总复杂度 $O(N\log N)$，$N=5\times10^5$ 可轻松通过。
- **空间复杂度**：$O(N)$。全局数组存 $P$，$R$ 与 LIS 辅助数组长度不超过 $N$，远低于内存限制。

## 7. 实现细节与避坑指南 (Implementation Details)

- **$R$ 的顺序**：非前缀最大值的元素要按原顺序压入 $R$，LIS 依赖子序列的相对顺序，打乱顺序会错。
- **二分细节**：$P$ 是排列（元素互异），严格上升 LIS 用 $\texttt{lower\_bound}$ 与 $\texttt{upper\_bound}$ 等价；若 $P$ 允许重复值，则求非降子序列需要用 $\texttt{upper\_bound}$。
- **边界情况**：$N=1$ 时 $P_1$ 是前缀最大值，答案 $1$；全递增序列所有元素都是前缀最大值，答案 $N$；全递减序列答案恰为 $2$（首元素加任意一个剩余元素）。
- **整数范围**：答案不超过 $N\le5\times10^5$，$32$ 位整数足够，无需 $\texttt{long long}$。

| 坑点     | 说明                         |
| :----- | :------------------------- |
| $R$ 顺序 | 必须按原序列顺序收集，否则 LIS 结果无意义    |
| 答案上限   | 每个位置至多贡献一次，答案 $\le N$，不会溢出 |

## 8. 参考代码 (Reference Code)

下列代码按上述前缀最大值 + LIS 的思路实现，已经通过 AtCoder 评测。

```cpp
#include <bits/stdc++.h>
using namespace std;

const int N = 5e5 + 5;

int n, p[N];

// 求序列 a 的最长严格上升子序列长度；tails[k] 表示长度为 k+1 的 LIS 的最小末尾值
int lis(const vector<int> &a)
{
    vector<int> tails;
    for (int val : a)
    {
        auto it = lower_bound(tails.begin(), tails.end(), val);
        if (it == tails.end())
            tails.push_back(val);
        else
            *it = val;
    }
    return tails.size();
}

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
#ifdef DEBUG
    clock_t t0 = clock();
    freopen("data.in", "r", stdin);
    freopen("data.out", "w", stdout);
#endif

    // Don't stop. Don't hide. Follow the light, and you'll find tomorrow.

    cin >> n;
    for (int i = 1; i <= n; i++)
        cin >> p[i];

    vector<int> rest; // 删除全部前缀最大值后剩下的序列，保持原顺序
    int ans = 0;      // 先统计前缀最大值个数，它们无论怎么分配都必贡献

    for (int i = 1, maxv = 0; i <= n; i++)
    {
        if (p[i] > maxv) // p[i] 是前缀最大值
        {
            maxv = p[i];
            ans++;
        }
        else // 非前缀最大值，留给 LIS
            rest.push_back(p[i]);
    }

    ans += lis(rest); // 剩余序列中最多还能贡献 LIS 长度次

    cout << ans << endl;

#ifdef DEBUG
    cerr << "Time used:" << clock() - t0 << "ms" << endl;
#endif
    return 0;
}
```

## 9. 补充说明 (Additional Notes)

- 本题属于"把排列划分为两条链、每条链的贡献等于其内部记录数（前缀最大/最小值）"的问题族。知识关联较强的类似题：
  - [P11106 [ROI 2023 Day 1] 峰值](https://www.luogu.com.cn/problem/P11106)：最接近的变种，同样把排列分成两个子序列，一条数峰值（前缀最大值）、一条数反峰值（前缀最小值），区别是"最大+最小"两条链而非"最大+最大"两条链，解法落到枚举断点 + LIS/LDS + 树状数组优化。
  - [Codeforces 1801C Music Festival](https://codeforces.com/contest/1801/problem/C)：多个序列拼成一个大序列，最大化前缀最大值个数，本质是把每个序列压缩成有效上升子序列再做 DP。
  - [P9307 [DTOI-5] 进行一个排的重](https://www.luogu.com.cn/problem/P9307)：对两个排列的二元组重排，同时最大化两条链的前缀最大值计数，最优解结构与按一维排序后的 LIS 相关。
- 这一族题的核心都是"记录只沿上升链产生，把贡献拆到链上后归约为 LIS/LDS 类结构"，方法经典，具有学习的价值。
- 此 $O(N\log N)$ 算法是较为高效的 LIS 算法，也可以使用代码略复杂的树状数组优化 DP 求 LIS，
各种 LIS 方法对比详见 [[【动态规划】线性 DP 学习笔记#最长上升子序列（LIS）]]。