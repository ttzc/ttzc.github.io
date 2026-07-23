---
title: 洛谷 P2678 跳石头 - Solution
category: 题解
platform: Luogu
tags:
  - Luogu
  - 二分答案
  - 贪心
  - 最大化最小值
author: zaochen
abbrlink: 91d0
date: 2026-07-15 00:00:00
---
## 1. 题目数据 (Problem Metadata)

- **题目类型**：传统题
- **题目链接**：[P2678 [NOIP 2015 提高组] 跳石头 - 洛谷](https://www.luogu.com.cn/problem/P2678)
- **时间限制**：1.00s
- **内存限制**：128.00MB

## 2. 题意简述 (Problem Summary)

起点到终点距离为 $L$（$1 \le L \le 10^9$），中间有 $N$ 块岩石，第 $i$ 块距起点 $D_i$（按升序给出）。至多移走 $M$（$0 \le M \le N \le 50000$）块岩石（不含起点和终点），求移走后**最短跳跃距离的最大值**：

$$
\text{ans} = \max_{\text{移走} \le M \text{块}} \min_{\text{所有相邻跳跃}} \text{距离}
$$

## 3. 朴素解法 (Brute-Force)

枚举从 $N$ 块岩石中移走哪 $M$ 块（或不移），对每种方案计算相邻跳跃距离的最小值，取所有方案中的最大值。

- 方案数：$\binom{N}{M}$，$N = 50000$ 时完全不可行。
- $20\%$ 数据 $N \le 10$，$\binom{10}{5} = 252$，可过。

## 4. 核心解法 (Main Solution)

### 特殊性质

本题是经典的「最大化最小值」问题。设 $f(x)$ 表示「能否通过移走 $\le M$ 块岩石，使最短跳跃距离 $\ge x$」，则 $f$ 具有 **二段性**：若 $f(x)$ 为真，则 $\forall x' < x$，$f(x')$ 也为真。这是因为同一组移走方案如果保证了最小距离 $\ge x$，自然也 $\ge x'$。则存在临界值 $\text{ans}$，使得 $f(x)$ 在 $x \in [0, \text{ans}]$ 恒真、$x \in (\text{ans}, L]$ 恒假。

### 关键突破

从 $\binom{N}{M}$ 的枚举瓶颈出发，利用二段性（单调性）将「求最优解」转化为「判定某个 $x$ 是否可行」。判定可以用 **贪心** 在 $O(N)$ 内完成：从左到右扫描岩石，遇到与上一次落脚点距离 $< x$ 的岩石就移走，否则保留并更新落脚点。这样移走的岩石数即为使最小距离 $\ge x$ 所需的最少移走数，与 $M$ 比较即可判定。

### 推导过程

#### 二分

在 $[0, L]$ 上二分答案，找最大的 $x$ 使 $f(x)$ 为真，设答案最大值为 $\text{ans}$：

$$
\text{mid} = \left\lceil \frac{l + r}{2} \right\rceil
$$

- $f(\text{mid})$ 为真 $\Rightarrow l = \text{mid}$（ $\text{ans} \ge \text{mid}$ ）
- $f(\text{mid})$ 为假 $\Rightarrow r = \text{mid} - 1$（$\text{ans} < \text{mid}$）

#### 贪心

下面是判定函数 $f(x)$ （`bool check(int x)`）的过程，用伪代码描述：

```text
last = 0  #（起点）
cnt = 0   #（移走计数）
for i = 1 to N:
    if d[i] - last < x:
        cnt++        # 移走第 i 块岩石
    else:
        last = d[i]  # 保留，更新落脚点
if L - last < x:
    cnt++            # 最后一块保留的岩石离终点太近，移走
return cnt <= M
```

## 5. 正确性证明 (Proof of Correctness)

### 二段性

上文“特殊性质”证明了这个问题具有二段性，所以二分算法正确。

### 贪心最优性

需证：上述贪心策略移走的岩石数是所有合法方案中的**最小值**。

设贪心保留的岩石位置为 $g_0 = 0 < g_1 < g_2 < \cdots < g_k$（$g_0$ 为起点），任一合法方案保留的岩石位置为 $o_0 = 0 < o_1 < \cdots < o_j$。合法意味着 $o_{i+1} - o_i \ge x$。

**归纳证明 $g_i \le o_i$（$\forall i \le \min(k, j)$）**：

- 基础：$g_0 = 0 = o_0$（起点必保留）。
- 归纳：设 $g_i \le o_i$。贪心保留 $g_{i+1}$ 为**第一个**满足 $d \ge g_i + x$ 的岩石。而合法方案中 $o_{i+1} \ge o_i + x \ge g_i + x$，所以 $o_{i+1}$ 本身就满足 $d \ge g_i + x$，即 $o_{i+1}$ 是一个候选位置。贪心取最早的候选，故 $g_{i+1} \le o_{i+1}$。

由 $g_i \le o_i$ 可知贪心保留的岩石数 $k \ge j$，即贪心移走的岩石数 $N - k \le N - j$。贪心移走数 $\le$ 任一合法方案移走数，故为最小。

**终点处理**：循环结束后若 $L - g_k < x$，需移走 $g_k$。此时 $L - g_{k-1} = (L - g_k) + (g_k - g_{k-1})$，其中 $g_k - g_{k-1} \ge x$（贪心性质），故 $L - g_{k-1} \ge x$，移走 $g_k$ 即可，无需连锁移走。这样既能构造出一种合法方案，又保证需要移走的石头最少。

通俗地，核心思想非常简单：贪心算法从不回头。它每次都选第一个满足距离限制的石头落脚，把后面的路留到最长，因此它移走的石头数量自然就是最少的。

## 6. 复杂度分析 (Complexity)

- **时间复杂度**：$O(N \log L)$。每次 $\text{check}$ 为 $O(N)$，二分 $\lceil \log_2(10^9) \rceil = 30$ 轮。$50000 \times 30 = 1.5 \times 10^6$，1s 内轻松通过。
- **空间复杂度**：$O(N)$，存储岩石位置数组。

## 7. 实现细节与避坑指南 (Implementation Details)

| 坑点 | 说明 |
| :---------- | :-------------------------------------------------------------------------------------------------- |
| **$L$ 的范围** | $0 \le L \le 10^9$，`int` 足够（`INT_MAX` $\approx 2.1 \times 10^9$）。二分中 `l + r + 1` 最大约 $2 \times 10^9$，不溢出。 |
| **$M = 0$** | 不能移走任何岩石，答案为相邻跳跃距离的最小值，贪心自然处理。 |
| **$M = N$** | 可移走所有岩石，答案为 $L$（直接从起点跳到终点）。 |
| **$N = 0$** | 无中间岩石，答案为 $L$。 |
| **二分相关** | 使用 `mid = (l + r + 1) >> 1` 配合 `l = mid, r = mid - 1` 实现向上取整，避免死循环。 |

### Bug 分析

- **Bug 描述**：我最早实现的版本的 `check` 函数采用三趟扫描策略（起点侧 → 终点侧 → 中间贪心），因为当时没想到末端点怎么处理，没有证明出来贪心最优性的“终点处理”。其中第二趟和第三趟内层循环（具体见注释）在标记岩石时执行 `flag[i] = 1, res++`，**均未检查 `flag[i]` 是否已为 1**。当一块岩石被多趟扫描覆盖时（例如同时靠近起点和终点，或同时靠近终点和另一块保留的岩石），`res` 被重复累加，导致 `res` 虚高，`check(x)` 误返回 `false`，最终答案偏小。
- **官方数据覆盖情况**：代码通过了洛谷全部官方测试数据并 AC。两个 bug 的触发条件较为特殊（需要单块岩石同时满足两个距离约束），官方数据未覆盖。

- **Hack 数据**：

  **Hack 1**（触发第二趟 bug）：

  ```input
  4 1 1
  2
  ```
  
  正确输出：4
  代码实际输出：2

  追踪：$L=4, d_1=2$。$\text{check}(3)$ 时，第一趟标记 $d_1=2 < 3$（$\text{res}=1$），第二趟发现 $L-d_1=2 < 3$ 再次累加（$\text{res}=2 > M=1$），误返回 `false`。正确结果应为移走唯一岩石，跳跃距离 $4$。

  **Hack 2**（代码审查发现，触发第三趟 bug）：

  ```input
  10 2 1
  4
  7
  ```
  
  正确输出：4
  代码实际输出：3

  追踪：$\text{check}(4)$ 时，第二趟标记 $d_2=7$（$L-7=3 < 4$，$\text{res}=1$），第三趟中 $d_1=4$ 未被标记，内层循环发现 $d_2-d_1=3 < 4$，再次累加（$\text{res}=2 > M=1$），误返回 `false`。正确结果应为移走岩石 $7$，跳跃距离序列 $0 \to 4 \to 10$，最小距离 $4$。

- **修复方案**：
  - **最小改动**：在第二趟和第三趟内层循环中加 `if (!flag[...])` 守卫（见 §9）。
  - **推荐替代**：用单趟贪心替换整个三趟逻辑（见 §8），从根本上消除多趟扫描的边界问题。

## 8. 参考代码 (Reference Code)

证明了终点处理的正确性后，采用单趟贪心判定，避免多趟扫描的重叠计数问题：

```cpp
#include <bits/stdc++.h>
using namespace std;

const int N = 5e4 + 5;

int L, n, m;
int d[N];

bool check(int x) {
    int cnt = 0, last = 0;
    for (int i = 1; i <= n; i++) {
        if (d[i] - last < x)
            cnt++;        // 移走当前岩石
        else
            last = d[i];  // 保留，更新落脚点
    }
    if (L - last < x)
        cnt++;            // 最后一块岩石离终点太近，移走
    return cnt <= m;
}

int main() {
    ios::sync_with_stdio(false);
    cin >> L >> n >> m;
    for (int i = 1; i <= n; i++)
        cin >> d[i];

    int l = 0, r = L;
    while (l < r) {
        int mid = (l + r + 1) >> 1;
        if (check(mid))
            l = mid;
        else
            r = mid - 1;
    }
    cout << l << endl;
    return 0;
}
```

## 9. 补充说明 (Additional Notes)

- **题目渊源**：本题出自 **NOIP 2015 Day2 T1**，是「二分答案 + 贪心判定」的经典入门题。这类「最大化最小值 / 最小化最大值」的模型在竞赛中极为常见，核心识别信号是「最大化最小」或「最小化最大」——出现这类表述时，应优先考虑二分答案。
- **同类问题**：见二分笔记，通过 Obsidian 反向链接关联。

### 替代版本

以下是我第一次对这个问题代码（可 AC 官方数据，但存在已知 double-counting bug，仅 Hack 数据会触发错误）：

```cpp
#include <bits/stdc++.h>
using namespace std;

const int N = 5e4 + 5;

int L, n, m;
int d[N];

bool check(int x);

signed main() {
    ios::sync_with_stdio(false);
    cin >> L >> n >> m;
    for (int i = 1; i <= n; i++)
        cin >> d[i];

    int l = 0, r = L;
    while (l < r) {
        int mid = (l + r + 1) >> 1;
        if (check(mid))
            l = mid;
        else
            r = mid - 1;
    }
    cout << l << endl;
    return 0;
}

bool flag[N];

// ⚠️ 已知 bug：第 54-55 行和第 61-62 行缺少 if (!flag[...]) 守卫，
//    导致同时满足两个距离约束的岩石被重复计入 res。
//    可 AC 洛谷和官方的数据，但针对性的 Hack 数据（如 "4 1 1 / 2"）会输出错误结果。
bool check(int x) {
    int res = 0;
    memset(flag, 0, sizeof(flag));
    for (int i = 1; i <= n && d[i] < x; i++)
        flag[i] = 1, res++;
    for (int i = n; i && L - d[i] < x; i--)
        flag[i] = 1, res++;  // BUG: 未检查 flag[i] 是否已为 1

    for (int i = 1; i <= n; i++) {
        if (flag[i])
            continue;
        for (int j = i + 1; j <= n && d[j] - d[i] < x; j++)
            flag[j] = 1, res++;  // BUG: 未检查 flag[j] 是否已为 1
    }
    return res <= m;
}
```

**最小修复**（保留三趟结构）：将第 54–55 行改为 `if (!flag[i]) { flag[i] = 1; res++; }`，将第 61–62 行内层循环改为 `if (!flag[j]) { flag[j] = 1; res++; }`。或者直接写进 `for` 循环的条件。但更推荐直接使用 §8 的单趟贪心。
