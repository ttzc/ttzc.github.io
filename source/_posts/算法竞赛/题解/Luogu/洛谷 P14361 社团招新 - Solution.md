---
title: 洛谷 P14361 社团招新 - Solution
category: 题解
platform: Luogu
tags:
  - Luogu
  - CSP-S
  - 贪心
  - 反悔贪心
  - 排序
author: zaochen
abbrlink: ac6e74e8
date: 2026-07-23
---
## 1. 题目数据 (Problem Metadata)

- **题目类型**：传统题
- **题目链接**：[P14361 [CSP-S 2025] 社团招新 - 洛谷](https://www.luogu.com.cn/problem/P14361)
- **时间限制**：1.00s
- **内存限制**：512.00MB

## 2. 题意简述 (Problem Summary)

给定 $n$（$n$ 为偶数，$2 \le n \le 10^5$）个新成员，每人对 $3$ 个部门的满意度 $a_{i,j} \in [0, 2 \times 10^4]$。为每个成员选择恰好一个部门 $d_i \in \{1,2,3\}$，最大化满意度之和 $\sum_{i=1}^{n} a_{i,d_i}$，且每个部门分配人数不超过 $\frac{n}{2}$。多组测试数据，$t \le 5$。

## 3. 朴素解法 (Brute-Force)

最直接的想法是枚举每个成员的部门选择，共 $3^n$ 种方案，对每种方案检查容量约束并计算满意度。$n = 10$ 时约 $6 \times 10^4$ 种，可过测试点 $1 \sim 4$；$n \ge 30$ 时 $3^{30} \approx 2 \times 10^{14}$，完全不可行。

另一种思路是 DP：设 $dp[i][c_1][c_2]$ 表示前 $i$ 人中部门 $1$ 有 $c_1$ 人、部门 $2$ 有 $c_2$ 人时的最大满意度（部门 $3$ 人数为 $i - c_1 - c_2$）。状态数 $O(n^3)$，$n = 10^5$ 时约 $10^{15}$，同样不可行。瓶颈在于容量约束使得状态空间与 $n$ 的幂次绑定，无法线性递推。

## 4. 核心解法 (Main Solution)

### 特殊性质

本题的关键观察在于 $3$ 个部门的容量约束具有特殊的结构。设 $\text{cnt}_j$ 为部门 $j$ 分配到的人数，则 $\text{cnt}_1 + \text{cnt}_2 + \text{cnt}_3 = n$，每个 $\text{cnt}_j \le \frac{n}{2}$。

**至多一个部门超员**：若两个部门同时超员（各 $> \frac{n}{2}$），则总人数 $> n$，矛盾。因此，无约束贪心解中至多有一个部门违反容量约束。

### 关键突破

从 $3^n$ 的枚举瓶颈出发，利用「至多一个部门超员」这一性质，将问题分解为两步：

1. **贪心**：忽略容量约束，每个成员选满意度最高的部门，得到无约束最优解 $\text{sum}$。
2. **反悔**：若唯一超员部门 $m$ 有 $\text{cnt}_m > \frac{n}{2}$，将 $\text{cnt}_m - \frac{n}{2}$ 人从部门 $m$ 改派到各自的次优部门，使容量满足约束。

### 推导过程

下面推导反悔策略的正确性。

**改派人数**：部门 $m$ 超员 $\text{cnt}_m - \frac{n}{2}$ 人，需恰好移出这么多。不能多移（不必要损失），不能少移（仍超员）。

**改派目标**：每个被移出的人应去自己的次优部门（满意度第二高的部门），而非第三优部门。因为次优满意度 $\ge$ 第三优满意度，改派到次优的损失 $\le$ 改派到第三优的损失。

**次优部门不会超员**：设其余两个部门共有 $n - \text{cnt}_m$ 人。最坏情况下所有被改派的人都去同一个次优部门，该部门人数上界为：
$$
(n - \text{cnt}_m) + \left(\text{cnt}_m - \frac{n}{2}\right) = n - \frac{n}{2} = \frac{n}{2}
$$
恰好等于容量上界，不会超员。

**选损失最小的人改派**：每个被改派成员 $i$ 的损失为 $a_{i, \max} - a_{i, \text{sub}}$（最优满意度与次优满意度之差）。将超员部门的成员按此损失升序排序，取前 $\text{cnt}_m - \frac{n}{2}$ 个改派，总损失最小。

最终答案为：
$$
\text{ans} = \text{sum} - \sum_{\text{改派的 } k \text{ 人}} \left(a_{i, \max} - a_{i, \text{sub}}\right)
$$
其中 $k = \text{cnt}_m - \frac{n}{2}$，取损失最小的 $k$ 人。

## 5. 正确性证明 (Proof of Correctness)

下面我们总结一下贪心策略的证明要点，共证明了三点：贪心解的无约束最优性、反悔策略的充分性、次优部门的安全性。

**引理 1（贪心最优）**：无容量约束时，每个成员独立选择满意度最高的部门，满意度之和取到全局最大。这是因为 $\sum_{i=1}^{n} a_{i,d_i}$ 中各项独立，$\max_{d_i} \sum a_{i,d_i} = \sum \max_{d_i} a_{i,d_i}$。

**引理 2（至多一个超员部门）**：若部门 $j$ 与 $j'$ 同时超员，$\text{cnt}_j + \text{cnt}_{j'} > n$，但 $\text{cnt}_1 + \text{cnt}_2 + \text{cnt}_3 = n$，矛盾。故至多一个部门超员。

**引理 3（次优部门安全）**：改派 $k = \text{cnt}_m - \frac{n}{2}$ 人到次优部门后，任一次优部门的人数上界为 $\frac{n}{2}$（见 §4 推导），不超员。

**定理（反悔最优）**：在全局贪心解的基础上，从唯一超员部门 $m$ 移出恰好 $k$ 人，每人移到次优部门，选损失最小的 $k$ 人，所得方案是容量约束下的最优解。

设贪心解为 $S^*$（无约束最优），任一合法解 $T$ 的满意度 $\le S^*$（因为 $S^*$ 是无约束最大值）。合法解必须在 $S^*$ 基础上调整超员部门 $m$ 的分配：将至少 $k$ 人从部门 $m$ 移出。每人移出后，去次优部门的损失 $\le$ 去第三优部门的损失（$a_{i, \text{sub}} \ge a_{i, \text{third}}$），故最优调整中每人都去次优部门。在所有「移 $k$ 人到次优部门」的方案中，选损失最小的 $k$ 人总损失最小。由引理 3，次优部门不超员，方案合法。因此该反悔策略得到的解是合法解中的最优。

综上所述，算法正确。

## 6. 复杂度分析 (Complexity)

- **时间复杂度**：$O(n \log n)$。每人对 $3$ 个满意度排序 $O(1)$（常数大小），收集超员部门成员 $O(n)$，按损失排序 $O(n \log n)$。$n \le 10^5$ 时约 $1.7 \times 10^6$ 次运算，1s 内轻松通过。

- **空间复杂度**：$O(n)$。存储 $n$ 个成员的满意度数组与临时向量，约几 MB，远低于 512 MB 限制。

## 7. 实现细节与避坑指南 (Implementation Details)

| 坑点                                | 说明                                                                                                                                                                                                                                                     |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **整数范围**                        | $\text{sum}$ 最大 $n \times \max a_{i,j} = 10^5 \times 2 \times 10^4 = 2 \times 10^9$，`int` 上限约 $2.147 \times 10^9$，够用。                                                                                                                          |
| **多组数据清空**                    | `cnt`、`delta` 在 `solve()` 内部声明，每次调用自动初始化，无需手动清空。全局数组 `s[]` 每次被读入覆盖，也不会残留。                                                                                                                                      |
| **pair 排序的稳定性**               | 代码用 `pii{满意度, 部门号}` 存储，`sort` 对 `pair` 按 `first` 升序、`first` 相同时按 `second` 升序。当满意度相同时，部门号小的排前面，`a[2]` 的 `second` 为部门号较小的次优部门。这一行为确定性的，不影响正确性（满意度相同时去哪个次优部门损失相同）。 |
| **$n = 2$ 的边界**                  | $\frac{n}{2} = 1$，每部门最多 $1$ 人。若两人最优部门相同，需改派 $1$ 人到次优部门。逻辑自然处理。                                                                                                                                                        |
| **特殊性质 A（仅部门 1 有满意度）** | 所有成员 $a_{i,2} = a_{i,3} = 0$，贪心全选部门 1，$\text{cnt}_1 = n > \frac{n}{2}$。改派损失 $= a_{i,1} - 0 = a_{i,1}$，取损失最小的 $\frac{n}{2}$ 人改派，其余留部门 1。正确。                                                                          |

## 8. 参考代码 (Reference Code)

下面是我用 `pair` 排序同时解决「选最优部门」和「找次优部门」的写法。每人将 $3$ 个满意度连同部门号存为 `pii`，排序后 `a[3]` 即最优、`a[2]` 即次优，改派时只需取 `a[3].first - a[2].first` 作为损失。

```cpp
#include <bits/stdc++.h>
using namespace std;
// #define int long long

const int N = 1e5 + 5;
using pii = pair<int, int>;
using vi = vector<int>;

struct student
{
    pii a[4];
} s[N];

int n;

int solve()
{
    int sum = 0;
    vi cnt(4, 0);
    cin >> n;
    for (int i = 1; i <= n; i++)
    {
        for (int j = 1; j <= 3; j++)
            cin >> s[i].a[j].first, s[i].a[j].second = j;
        sort(s[i].a + 1, s[i].a + 4);
        sum += s[i].a[3].first;
        cnt[s[i].a[3].second]++;
    }
    int max_ci = max_element(cnt.begin(), cnt.end()) - cnt.begin(), max_cv = *max_element(cnt.begin(), cnt.end());
    if (max_cv <= n / 2)
        return sum;

    int ans = sum;
    vector<student> delta;
    for (int i = 1; i <= n; i++)
        if (s[i].a[3].second == max_ci)
            delta.push_back(s[i]);

    sort(delta.begin(), delta.end(), [&](student s1, student s2)
         { return s1.a[3].first - s1.a[2].first < s2.a[3].first - s2.a[2].first; });
    for (int i = 0; i < (max_cv - n / 2); i++)
        ans -= delta[i].a[3].first - delta[i].a[2].first;

    return ans;
}

signed main()
{
    ios::sync_with_stdio(false);
#ifdef DEBUG
    clock_t t0 = clock();
    freopen("club2.in", "r", stdin);
    freopen("data.out", "w", stdout);
#endif

    // Don't stop. Don't hide. Follow the light, and you'll find tomorrow.

    int t;
    cin >> t;
    while (t--)
        cout << solve() << endl;

#ifdef DEBUG
    cerr << "Time used:" << clock() - t0 << "ms" << endl;
#endif
    return 0;
}
```

## 9. 补充说明 (Additional Notes)

- **题目渊源**：本题出自 **CSP-S 2025 第二轮**，是「贪心 + 反悔」的经典入门题。这类「先贪心求无约束最优，再对违反约束的部分做最小代价调整」的思路在竞赛中很常见，核心识别信号是约束结构简单（如至多一个维度违约）、且调整代价可排序取最小。本题 $3$ 个部门与 $\frac{n}{2}$ 限制的设定使得「至多一个超员」这一性质很容易发现，是反悔策略成立的基础。
- **数据范围与测试点**：测试点按 $n$ 规模分档，最小 $n = 2$（测试点 1），最大 $n = 10^5$（测试点 12 起）。特殊性质 A（仅部门 1 有满意度）和 B（仅部门 1、2 有满意度）是贪心 + 反悔的退化场景，C 为随机数据。$O(n \log n)$ 的排序解法可过全部测试点。

### 其他版本

下面是一个不依赖 `pair` 排序的写法，直接用比较找最优和次优部门。思路相同，但省去了排序 $3$ 个元素的步骤，常数更小：

```cpp
#include <bits/stdc++.h>
using namespace std;

const int N = 1e5 + 5;

struct student
{
    int a[4]; // a[1..3] = 满意度
    int best, sub; // 最优/次优部门号
} s[N];

int n;

int solve()
{
    int sum = 0;
    int cnt[4] = {0};
    cin >> n;
    for (int i = 1; i <= n; i++)
    {
        cin >> s[i].a[1] >> s[i].a[2] >> s[i].a[3];
        // 找最优和次优部门
        if (s[i].a[1] >= s[i].a[2]) { s[i].best = 1; s[i].sub = (s[i].a[2] >= s[i].a[3]) ? 2 : 3; }
        else { s[i].best = 2; s[i].sub = (s[i].a[1] >= s[i].a[3]) ? 1 : 3; }
        // 修正：需保证 best 是最大的
        if (s[i].a[s[i].sub] > s[i].a[s[i].best]) swap(s[i].best, s[i].sub);
        sum += s[i].a[s[i].best];
        cnt[s[i].best]++;
    }
    int max_ci = max_element(cnt + 1, cnt + 4) - cnt;
    int max_cv = *max_element(cnt + 1, cnt + 4);
    if (max_cv <= n / 2)
        return sum;

    // 收集超员部门成员的改派损失
    vector<int> loss;
    for (int i = 1; i <= n; i++)
        if (s[i].best == max_ci)
            loss.push_back(s[i].a[s[i].best] - s[i].a[s[i].sub]);
    sort(loss.begin(), loss.end());
    for (int i = 0; i < max_cv - n / 2; i++)
        sum -= loss[i];
    return sum;
}

signed main()
{
    ios::sync_with_stdio(false);
    int t;
    cin >> t;
    while (t--)
        cout << solve() << '\n';
    return 0;
}
```

两种写法的复杂度相同，均为 $O(n \log n)$。`pair` 排序写法利用 `sort` 同时确定最优与次优部门，代码更紧凑；显式比较写法不依赖排序，但需要处理比较逻辑。本题每人只有 $3$ 个元素，排序常数极小，两种写法的实际运行时间差异可忽略。我觉得用 `pair` 排序的写法更清晰，因为它把「选最优」和「找次优」统一到了一次排序中。
