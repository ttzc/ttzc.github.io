---
title: LeetCode 4003 交替方向的最小路径代价 III - Solution
category: 题解
platform: LeetCode
tags:
  - LeetCode
  - 最短路
  - Dijkstra
  - 堆（优先队列）
author: zaochen
abbrlink: 94489eec
description: 本题给出 $m \times n$ 网格，每个格子有入口代价和罚金。从 $(0,0)$ 出发，第 $k$ 步移动方向由 $k$ 的奇偶性决定（奇数步只能右/下，偶数步只能左/上），违反规则或原地等待需支付罚金。分析指出朴素 DFS 因方向奇偶交替导致搜索空间巨大，进而将「位置 + 步数奇偶性」纳入状态，转化为 $2mn$ 个节点的隐式图，每条合法移动（含等待）建有权边，跑 Dijkstra 即可求解。文章详细推导了状态设计、转移规则，给出了 C++ 参考实现，并总结了 vis 标记时机、罚金归属、整数溢出等避坑要点。
date: 2026-07-30 15:00:00
---
## 1. 题目数据 (Problem Metadata)

- **题目类型**：传统题
- **题目链接**：[4003. 交替方向的最小路径代价 III - 力扣（LeetCode）](https://leetcode.cn/problems/minimum-cost-path-with-alternating-directions-iii/description/)

## 2. 题意简述 (Problem Summary)

已知 $m \times n$ 网格（$1 \le m, n \le 10^5$，$2 \le m \cdot n \le 10^5$），每个单元格 $(i,j)$ 有入口代价 $\text{entry}(i,j) = (i+1)(j+1)$ 和罚金 $\text{penalty}[i][j]$（$0 \le \text{penalty}[i][j] \le 10^5$）。从 $(0,0)$ 出发，初始已付入口代价 $1$。第 $k$ 步移动遵循奇偶交替方向规则：$k$ 为奇数时只能向右或向下，$k$ 为偶数时只能向左或向上。若违反规则移动，需额外支付离开格子 $(i,j)$ 的 $\text{penalty}[i][j]$；也可原地等待（步数 $+1$、方向切换）并支付 $\text{penalty}[i][j]$。求从 $(0,0)$ 到达 $(m-1,n-1)$ 的最小总代价。

## 3. 朴素解法 (Brute-Force)

对每一步做 DFS 枚举四个方向加等待，每条路径的状态数最多为总移动次数。由于网格大小 $m \cdot n \le 10^5$，且方向每步在切换，最坏情况下的路径长度远超网格大小（可能在相邻格子间反复横跳跳板等待），搜索空间指数级增长，无法通过。

更实际的问题是：每个格子的最优代价不仅取决于位置，还取决于到达该位置时当前步数的奇偶性——奇偶性不同，下一步能走的方向不同，后续代价也不同。朴素 DFS 必须同时记住位置和奇偶性才能避免重复搜索，这自然引出带状态的最短路。

## 4. 核心解法 (Main Solution)

### 特殊性质

本题的核心性质是「到达每个格子时，步数的奇偶性决定后续可走方向」。因此状态不能只用位置 $(i,j)$ 表示——同一格子、不同奇偶性对应两个不同的节点。将奇偶性纳入状态后，转化为标准的单源最短路问题，每条合法移动（含等待）对应一条有向边，边权为入口代价加上可能的罚金，跑 Dijkstra 即可。

### 关键突破

从 DFS 暴搜的瓶颈出发：位置 + 奇偶性恰好构成一个隐式图，节点数为 $2mn \le 2 \times 10^5$，每个节点最多 5 条出边（四个方向 + 等待），总边数 $O(mn)$。在这个规模上 Dijkstra（$O(E \log V)$）完全可行。

### 推导过程

**状态设计。** 将节点定义为 $(i, j, \text{oe})$，其中 $\text{oe}$ 为到达 $(i,j)$ 后已完成的移动次数（含进入 $(0,0)$ 算第 $1$ 步）。$\text{oe}$ 为奇数时下一步只能右/下，$\text{oe}$ 为偶数时下一步只能左/上。用 $\text{dist}[i][j][\text{oe}]$ 表示从起点到该状态的最小代价。

**转移。** 从状态 $(i,j,\text{oe})$ 出发，有 $5$ 种选择：

- **符合规则的移动**（奇偶方向匹配）：支付目标格子的入口代价 $\text{entry}(i',j')$，转移至 $(i',j',\text{oe}+1)$。
- **违反规则的移动**（奇偶方向不匹配）：除目标入口代价外，还需支付离开格子 $(i,j)$ 的 $\text{penalty}[i][j]$。
- **原地等待**：支付 $\text{penalty}[i][j]$，转移至 $(i,j,\text{oe}+1)$。

四条方向移动是否合法由奇偶性判定：

| $\text{oe}$ 奇偶 | 合法方向                         | 违规方向（加罚金）               |
| :--------------- | :------------------------------- | :------------------------------- |
| 奇数             | $(i+1,j)$（下）、$(i,j+1)$（右） | $(i-1,j)$（上）、$(i,j-1)$（左） |
| 偶数             | $(i-1,j)$（上）、$(i,j-1)$（左） | $(i+1,j)$（下）、$(i,j+1)$（右） |

Dijkstra 从初始状态 $(0,0,1)$（已付入口 $1$）开始松弛，直到首次弹出终点状态 $(m-1,n-1,\text{oe})$ 时返回当前 $\text{dist}$。

## 5. 正确性证明 (Proof of Correctness)

**状态空间完整性。** 本题中移动方向完全由已走步数的奇偶性决定，与路径历史中具体经过了哪些格子无关。因此 $(i,j,\text{oe})$ 足以唯一刻画一个节点在未来所有可能转移中的行为，满足无后效性。所有合法移动（含等待、违规移动）均已作为有向边建模，状态空间不重不漏。

**边权非负性。** 入口代价 $(i+1)(j+1) \ge 1$，罚金 $\text{penalty}[i][j] \ge 0$，所有边权均非负。因此在非负权图上运行 Dijkstra 能正确求出单源最短路。

**终点条件。** 题目要求到达 $(m-1,n-1)$，不限制到达时的 $\text{oe}$ 奇偶性。Dijkstra 在首次弹出任意 $\text{oe}$ 的终点状态时，该 $\text{dist}$ 即为所有可能 $\text{oe}$ 中的最小值——因为堆顶总是当前所有未处理节点中 $\text{dist}$ 最小的，而终点状态一旦弹出就不可能被更短的路径更新。

综上所述，算法正确。

## 6. 复杂度分析 (Complexity)

- **时间复杂度**：$O(mn \log(mn))$。节点数 $V = 2mn$，每个节点最多 $5$ 条出边，总边数 $E = O(mn)$。Dijkstra 在堆上的操作为 $O((V+E) \log V) = O(mn \log(mn))$。$mn \le 10^5$ 时约 $10^5 \times \log_2(2\times10^5) \approx 1.8 \times 10^6$ 次堆操作，轻松通过。
- **空间复杂度**：$O(mn)$。堆中最多同时容纳 $O(mn)$ 个状态，`vis` 集合同样 $O(mn)$。$2mn \le 2\times 10^5$，远未超标。

## 7. 实现细节与避坑指南 (Implementation Details)

| 坑点                            | 说明                                                                                                                                                                                                                |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`vis` 标记的位置**            | 必须在 `pop()` 后标记，不能在 `push()` 时标记。堆中同一节点可能有多条路径记录，只有首次弹出才是最短距离，后面的直接 `continue` 跳过。若 `push` 时就标记，后面更短的路径会被拦下。                                   |
| **`continue` 与终点判断的顺序** | `pop` → `if (vis) continue` → 判断是否到终点 → 扩展邻居。若先判断终点再判重，同一终点可能被多次处理（不同 $\text{oe}$ 第一次弹出即为该 $\text{oe}$ 下的最优，重复弹出会被 `continue` 安全跳过，但顺序正确更清晰）。 |
| **状态必须包含奇偶性**          | `vis` 的键必须同时编码位置 $(i,j)$ 和奇偶性 $\text{oe}$。我的实现用 `hsh` 函数将 $(i,j,\text{oe})$ 映射到整数值：`n*i + j` 编码位置，`oe` 为奇数时偏移 $+mn$。若只编码位置，不同奇偶性会被错误视为同一节点。        |
| **罚金归属**                    | $\text{penalty}[i][j]$ 是「从 $(i,j)$ 违规移动」或「在 $(i,j)$ 等待」的代价，应加到当前所在格子，而非目标格子。违规移动的边权 = $\text{entry}(i',j') + \text{penalty}[i][j]$，不是 $\text{penalty}[i'][j']$。       |
| **等待状态不能漏**              | 原地等待是改变奇偶性的唯一「无位移」手段。当目标方向与当前奇偶性冲突时，等待一步切换方向后出发可能比违规移动代价更低。漏写等待会导致某些路径无法遍历。                                                              |
| **整数溢出**                    | 入口代价 $(i+1)(j+1)$ 最大 $10^5\times10^5 = 10^{10}$，超过 `int` 上限。`val` 必须用 `long long`。我的实现中 `f(i,j)` 返回 `ll`，`state.val` 为 `ll`，避免隐式类型转换溢出。                                        |
| **堆的比较器**                  | C++ `priority_queue` 默认大顶堆，取 `val` 最小的需重载 `operator<` 返回 `val > s.val`（反直觉但正确：让 `val` 小的元素排在堆顶）。第一次写时容易写成 `val < s.val` 变成大顶堆。                                     |

## 8. 参考代码 (Reference Code)

下面是我赛后的实现，「奇偶性维度编码 + Dijkstra + 等待状态」的思路。用 `unordered_set<int>` 做 `vis`，`hsh` 函数将 $(i,j,\text{oe})$ 映射到一维整数避免手写哈希。

```cpp
class Solution {
public:
    using ll = long long;

    ll f(int i, int j) { return ((ll)i + 1) * (j + 1); }

    struct state {
        int i, j;
        ll val, oe; // oe: 已走步数（进入(0,0)算1），奇偶决定下一步方向
        state(int _i = 0, int _j = 0, ll _val = 0, ll _oe = 0)
            : i(_i), j(_j), val(_val), oe(_oe) {}

        int hsh(int m, int n) {
            int res = n * i + j;  // 位置编码到 [0, mn)
            if (oe & 1)
                res += m * n;     // 奇数oe偏移到 [mn, 2mn)
            return res;
        }

        bool operator<(const state& s) const {
            return val > s.val;   // 小顶堆
        }
    };

    bool check(int i, int j, int m, int n) {
        return i >= 0 && j >= 0 && i < m && j < n;
    }

    ll minCost(int m, int n, vector<vector<int>>& penalty) {
        priority_queue<state> q;
        unordered_set<int> vis;

        q.emplace(0, 0, 1, 1); // 入口(0,0)已付代价1
        while (!q.empty()) {
            state s = q.top(); q.pop();

            if (vis.count(s.hsh(m, n)))
                continue;
            vis.insert(s.hsh(m, n));

            int i = s.i, j = s.j;
            ll val = s.val, oe = s.oe;

            if (i == m - 1 && j == n - 1)
                return val;

            // 扩展邻居：四方向 + 等待
            // 奇偶性为真（奇数步）：合法→下/右；违规→上/左（加罚）
            // 奇偶性为假（偶数步）：合法→上/左；违规→下/右（加罚）
            int dirs[4][2] = {{1,0}, {-1,0}, {0,1}, {0,-1}};
            bool legal[4]; // legal[k] = 该方向是否合法
            if (oe & 1) {
                // 奇数步：下(0)、右(2) 合法；上(1)、左(3) 违规
                legal[0] = legal[2] = true;
                legal[1] = legal[3] = false;
            } else {
                // 偶数步：上(1)、左(3) 合法；下(0)、右(2) 违规
                legal[1] = legal[3] = true;
                legal[0] = legal[2] = false;
            }

            for (int k = 0; k < 4; k++) {
                int ni = i + dirs[k][0], nj = j + dirs[k][1];
                if (!check(ni, nj, m, n)) continue;
                ll cost = val + f(ni, nj);
                if (!legal[k]) cost += penalty[i][j]; // 违规加罚金
                state nxt(ni, nj, cost, oe + 1);
                if (!vis.count(nxt.hsh(m, n)))
                    q.push(nxt);
            }

            // 原地等待
            state wait(i, j, val + penalty[i][j], oe + 1);
            if (!vis.count(wait.hsh(m, n)))
                q.push(wait);
        }
        return -1; // 不应到达
    }
};
```

## 9. 补充说明 (Additional Notes)

- **题目定位**：本题是一道比较板的 Dijkstra 应用题，核心在于将「奇偶性决定方向」编码为状态维度。类似技巧在竞赛中常见：当移动规则由步数/层数/颜色等属性决定时，把该属性纳入状态空间即可转化为标准最短路。其实相当于把每个位置根据奇偶性拆点转化为分层图最短路，我们接下来详细讨论一下这个等价建模，但是状态转移的写法更直观。可以用 Dijkstra 的核心依据是边权非负。
- **等价建模**：本题本质上是一个**分层图最短路**。将状态拆分为第 0 层（奇数步）和第 1 层（偶数步）。奇数层：只能向“下/右”走到偶数层。偶数层：只能向“上/左”走到奇数层。等待边：从本层连向另一层，边权为罚金。  
- **Dijkstra 通用注意**：`vis` 必须在 `pop` 后标记、`continue` 在扩展前执行、堆比较器需反转——这几个坑在写 Dijkstra 时反复出现。我在 §7 中逐一标注了它们的位置和原因，后面遇到类似的 Dijkstra 题直接套这个框架就行。赛时因为这些细节反复提交错误代码，比较可惜。
- **vis 用 set vs. 数组**：本题 $2mn \le 2 \times 10^5$，用 `unordered_set` 或 `vector<bool> dist` 均可。我选 `unordered_set` 是因为 `hsh` 映射到整数后直接 `.count()` 很自然；若用 `dist` 数组，需要一维大小 $2mn$ 的 `vector<bool>` 或者 `bitset`，空间略大但常数更优，写法也很清晰。
- **原版实现**：我比赛时八个方向逐条展开写了一遍（奇数步和偶数步各写四条 `if`），逻辑冗长但最直观。上面 §8 的版本用 `dirs` 数组 + `legal` 布尔数组做了一次重构，将方向合法性判断集中到奇偶性分支中，代码行数从 60 缩到 20。两种写法的思路完全一致，重构版同样直观，思路清晰且巧妙。
