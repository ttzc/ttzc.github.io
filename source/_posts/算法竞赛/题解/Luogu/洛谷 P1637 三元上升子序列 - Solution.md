---
title: 洛谷 P1637 三元上升子序列 - Solution
category: 题解
platform: Luogu
tags:
  - Luogu
  - 树状数组
  - 离散化
description: >-
  给定长度为 $N$ 的序列，求满足 $i < j < k$ 且 $a[i] < a[j] < a[k]$ 的三元组个数。$N \le 10^5$，$a_i
  \le 10^9$。通过枚举中间位置 $j$，利用权值树状数组分别统计左右两侧的可行元素个数，$O(N \log N)$ 解决。
author: zaochen
abbrlink: 7c4f4089
date: 2026-07-30 20:23:00
---
## 1. 题目数据

- **题目类型**：传统题
- **题目链接**：[P1637 三元上升子序列 - 洛谷](https://www.luogu.com.cn/problem/P1637)
- **时间限制**：1.00s
- **内存限制**：128.00MB

## 2. 题意简述

给定长度为 $N$ 的序列 $a$，统计满足 $i < j < k$ 且 $a[i] < a[j] < a[k]$ 的三元组 $(i, j, k)$ 的个数。

- $1 \le N \le 10^5$
- $1 \le a_i \le 10^9$

## 3. 朴素解法

枚举中间位置 $j$，对每个 $j$ 扫描其左侧和右侧。记左侧满足 $a[i] < a[j]$ 的个数为 $L_j$，右侧满足 $a[k] > a[j]$ 的个数为 $R_j$，则以 $j$ 为中间的三元组个数为 $L_j \times R_j$。对每个 $j$ 扫描两侧需要 $O(N)$，总复杂度 $O(N^2)$，在 $N = 10^5$ 时不可行。

$$
\text{ans} = \sum_{j=1}^{N} L_j \times R_j
$$

## 4. 核心解法

朴素解法的计数框架是正确的——枚举中间位置 $j$，计算左侧小于 $a[j]$ 的个数 $L_j$ 和右侧大于 $a[j]$ 的个数 $R_j$。瓶颈在于对每个 $j$ 都需要 $O(N)$ 时间统计 $L_j$ 和 $R_j$。注意到 $L_j$ 只依赖于 $a[1..j-1]$ 中小于 $a[j]$ 的个数，这是一个典型的前缀计数问题，可以用权值树状数组（Fenwick Tree）在 $O(\log V)$ 时间内完成查询和更新。

### 离散化

由于 $a_i$ 可达 $10^9$，但 $N \le 10^5$，需要对值域进行离散化。将所有 $a_i$ 排序去重，映射到 $[1, M]$（$M \le N$）。离散化后，树状数组的大小为 $M$，所有操作在 $O(\log M) = O(\log N)$ 内完成。

### 计算 $L_j$

从左到右遍历，维护一个权值树状数组 $T_L$。遍历到 $j$ 时，$T_L$ 中已加入 $a[1], a[2], \ldots, a[j-1]$。$L_j = T_L.query(\text{rank}(a[j]) - 1)$，即查询值严格小于 $a[j]$ 的元素个数，然后将 $a[j]$ 加入 $T_L$。

### 计算 $R_j$

从右到左遍历，维护一个权值树状数组 $T_R$。遍历到 $j$ 时，$T_R$ 中已加入 $a[j+1], a[j+2], \ldots, a[N]$。查询 $T_R$ 中值 $\le a[j]$ 的元素个数为 $T_R.query(\text{rank}(a[j]))$（包含刚加入的 $a[j]$ 自身）。位置 $> j$ 的元素总数为 $N - j$，其中值 $\le a[j]$ 的元素有 $T_R.query(\text{rank}(a[j])) - 1$ 个，故右侧严格大于 $a[j]$ 的元素个数为：

$$
R_j = (N - j) - (T_R.query(\text{rank}(a[j])) - 1) = N - j - T_R.query(\text{rank}(a[j])) + 1
$$

然后将 $a[j]$ 加入 $T_R$。

### 推导过程

```python
ans = 0
for j = 1 to N:
    L_j = TL.query(rank(a[j]) - 1)
    TL.add(rank(a[j]), 1)

for j = N down to 1:
    TR.add(rank(a[j]), 1)
    R_j = N - j - TR.query(rank(a[j])) + 1
    ans += L_j * R_j
```

## 5. 正确性证明

### $L_j$ 的正确性

$T_L$ 在计算 $L_j$ 时恰好包含 $a[1..j-1]$。$T_L.query(\text{rank}(a[j])-1)$ 统计的是值域中映射到 $[1, \text{rank}(a[j])-1]$ 的元素个数。由于离散化保持大小关系，rank 越小对应原值越小，因此这恰好是值严格小于 $a[j]$ 的元素个数。$L_j$ 正确。

### $R_j$ 的正确性

$T_R$ 在计算 $R_j$ 时恰好包含 $a[j+1..N]$。$T_R.query(\text{rank}(a[j]))$ 统计的是值域中映射到 $[1, \text{rank}(a[j])]$ 的元素个数，包含所有值 $\le a[j]$ 的元素（包括刚加入的 $a[j]$ 自身）。因此，值 $\le a[j]$ 的元素个数（含 $a[j]$）为 $T_R.query(\text{rank}(a[j]))$，其中 $a[j]$ 自身占 1 个，剩余 $T_R.query(\text{rank}(a[j])) - 1$ 个是值 $\le a[j]$ 的其他元素（均在位置 $> j$ 处）。位置 $> j$ 的元素总数为 $N - j$，故值 $> a[j]$ 的元素个数：

$$
R_j = (N - j) - (T_R.query(\text{rank}(a[j])) - 1) = N - j - T_R.query(\text{rank}(a[j])) + 1
$$

### 乘法原理

对于固定的 $j$，左侧任意一个值 $< a[j]$ 的元素 $a[i]$ 与右侧任意一个值 $> a[j]$ 的元素 $a[k]$ 都能唯一确定一个满足条件的三元组 $(i, j, k)$，且不同 $(i, k)$ 对对应不同的三元组。因此以 $j$ 为中间元素的三元组总数恰为 $L_j \times R_j$。对所有 $j$ 求和即得总数。综上所述，整个计数过程正确。

## 6. 复杂度分析

- **时间复杂度**：$O(N \log N)$。离散化排序 $O(N \log N)$，两次遍历各 $N$ 次 BIT 操作，每次 $O(\log N)$。
- **空间复杂度**：$O(N)$，离散化数组 + 树状数组 + $L, R$ 数组。

$N = 10^5$ 时，$2 \times 10^5$ 次 $\log$ 级别的 BIT 操作完全在时间限制内。

## 7. 实现细节与避坑指南

| 坑点 | 说明 |
| :--- | :----------------------------------------------------------------- |
| **离散化去重** | `sort` + `unique` 去重，注意 `unique` 返回的迭代器与原起点的差值为新长度。 |
| **下标从 1 开始** | 树状数组下标从 1 开始，离散化后的 rank 也是从 1 开始，注意 `query(rank - 1)` 时 rank = 1 时 query(0) 返回 0，不越界。 |
| **long long** | $N = 10^5$ 时最坏情况下三元组个数可达 $\binom{10^5}{3} \approx 1.67 \times 10^{14}$，需要 `long long` 存储答案。 |
| **严格不等式** | 左侧用 `query(rank - 1)`（严格小于），右侧用上述公式（严格大于），相等值不构成三元组。 |

## 8. 参考代码

```cpp
// https://www.luogu.com.cn/problem/P1637
#include <bits/stdc++.h>
using namespace std;

#define int long long

int n;
int a[100005], b[100005], m;
int c[100005];
int L[100005], R[100005];

int lowbit(int x) { return x & (-x); }

void add(int id, int x) {
    for (int i = id; i <= m; i += lowbit(i))
        c[i] += x;
}

int query(int id) {
    int ret = 0;
    for (int i = id; i; i -= lowbit(i))
        ret += c[i];
    return ret;
}

signed main() {
    ios::sync_with_stdio(0);
#ifndef ONLINE_JUDGE
    freopen("data.in", "r", stdin);
    freopen("data.out", "w", stdout);
#endif

    cin >> n;
    for (int i = 1; i <= n; i++) {
        cin >> a[i];
        b[i] = a[i];
    }
    sort(b + 1, b + 1 + n);
    m = unique(b + 1, b + 1 + n) - b - 1;
    for (int i = 1; i <= n; i++)
        a[i] = lower_bound(b + 1, b + 1 + m, a[i]) - b;

    // 从左到右：计算 L[j]
    memset(c, 0, sizeof c);
    for (int j = 1; j <= n; j++) {
        L[j] = query(a[j] - 1);
        add(a[j], 1);
    }

    // 从右到左：计算 R[j]
    memset(c, 0, sizeof c);
    for (int j = n; j >= 1; j--) {
        add(a[j], 1);
        R[j] = n - j - query(a[j]) + 1;
    }

    int ans = 0;
    for (int j = 1; j <= n; j++)
        ans += L[j] * R[j];

    cout << ans << endl;
    return 0;
}
```

`#define int long long` 是 OI 中的常用习惯，统一处理可以避免中间过程溢出，本题最坏情况下答案约为 $1.67 \times 10^{14}$，用 `long long` 类型最稳妥。

## 9. 补充说明

- **相关题目**：类似思路可推广到统计满足 $a[i] < a[j] < a[k]$ 或 $a[i] > a[j] > a[k]$ 的三元组，也可用于统计四元组等更高维的组合计数问题。[P10589 楼兰图腾 - 洛谷](https://www.luogu.com.cn/problem/P10589) 是同一思路的变体。
- **学习笔记**：树状数组基础与权值树状数组详见 [[【数据结构】树状数组 学习笔记]]

这个方法在计数类问题中非常经典，思路清晰且巧妙，是树状数组的重要应用之一，值得掌握。
