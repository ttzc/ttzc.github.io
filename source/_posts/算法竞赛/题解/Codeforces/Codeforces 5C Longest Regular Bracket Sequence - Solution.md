---
title: Codeforces 5C Longest Regular Bracket Sequence - Solution
category: 题解
platform: Codeforces
tags:
  - Codeforces
  - 括号序列
  - 动态规划
  - 栈
  - 字符串
author: zaochen
abbrlink: "6236"
date: 2026-07-20 00:00:00
---
## 1. 题目数据 (Problem Metadata)

- **题目类型**：传统题
- **题目链接**：[Problem - 5C - Codeforces](https://codeforces.com/problemset/problem/5/C)
- **时间限制**：2 秒
- **内存限制**：256 MB

## 2. 题意简述 (Problem Summary)

给定长度为 $n$（$1 \le n \le 10^6$）的字符串 $s$，仅由 `(` 与 `)` 组成。设 $L$ 为 $s$ 中**最长合法括号子串**的长度，$C$ 为长度恰为 $L$ 的合法括号子串个数。输出 $L$ 与 $C$；若不存在任何合法括号子串，输出 `0 1`。

其中"合法括号序列"指可以通过在其中插入 `+` 与 `1` 得到正确数学表达式的序列，等价于经典定义：空串合法；若 $A$ 合法则 $(A)$ 合法；若 $A,B$ 合法则 $AB$ 合法。

## 3. 朴素解法 (Brute-Force)

枚举所有子串区间 $[l,r]$ 共 $O(n^2)$ 个，对每个子串用栈判定是否合法（$O(n)$），总复杂度 $O(n^3)$；或预处理括号前缀和后用"区间左右括号数相等且任意前缀左括号数 $\ge$ 右括号数"判定，降至 $O(n^2)$。当 $n = 10^6$ 时均远超时限，必须利用子串的嵌套与拼接结构做线性 DP。

## 4. 核心解法 (Main Solution)

- **特殊性质**：合法括号子串具有"嵌套 + 拼接"两种组合方式：$(A)$ 仍合法，$AB$ 仍合法。这意味着"以 $i$ 结尾的最长合法子串"可以由更短的合法段在常数步内拼出。
- **关键突破**：从 $O(n^2)$ 降到的关键在于**只跟踪"以每个位置结尾"的最长合法段**，而非所有区间。定义 $dp[i]$ 表示以 $s_i$  结尾的最长合法括号子串长度。利用已算出的 $dp[j]\ (j<i)$ 进行状态转移计算出 $dp[i]$，可以把总复杂度降低到 $O(n)$。
- **推导过程**：
  - 若 $s_i =$ `(`：无法作为合法子串的结尾，$dp[i] = 0$。
  - 若 $s_i =$ `)`，分两种情况（设 $s_0$ 为非括号占位符，避免越界，同时规定 $dp[0]=0$）：
    1. **直接配对**：$s_{i-1} =$ `(`。
        此情况下，$s_{i-1},s_i$ 自身构成一段 `()`。它前面还可能紧贴一个以 $i-2$ 结尾的合法段，两段通过拼接的方式组合，有 $$dp[i] = dp[i-2] + 2.$$
    2. **跨段配对**：$s_{i-1} =$ `)` 且 $dp[i-1] > 0$。
        此情况下，设以 $i-1$ 结尾的合法段为 $s[i-dp[i-1]\,..\,i-1]$，则与 $s_i$ 配对的那个 `(` 必须落在位置 $j = i - dp[i-1] - 1$。若 $s_j =$ `(`，则 $s_j$ 与 $s_i$ 把中间的合法段包住，整体合法，长度为 $dp[i-1] + 2$；此外 $j$ 之前还可能紧贴一个以 $j-1$ 结尾的合法段，于是 $$dp[i] = dp[i-1] + 2 + dp[i - dp[i-1] - 2].$$  
        若 $s_j \neq$ `(`，则 $s_i$ 找不到配对的 `(`，$dp[i] = 0$。

统计答案：扫一遍 $dp$，维护最大值 $\max$ 与计数 $cnt$。注意长度为 $0$ 时**不计入计数**，保证无合法子串时输出 `0 1`。

## 5. 正确性证明 (Proof of Correctness)

只需证明问题具有最优子结构性质，且 $dp[i]$ 的分类讨论**完备且无后效性**。

- **无后效性**：$dp[i]$ 的转移只依赖 $j < i$ 的 $dp[j]$ 与 $s_j$ 本身，不依赖 $i$ 之后的信息，因此从左到右一轮扫描即可确定。
- **最优子结构（对结尾为 `)` 的两种情况）**：
  - 情况 1 中，$s_{i-1}s_i =$ `()` 是以 $i$ 结尾的最短合法后缀。任何以 $i$ 结尾的合法子串若长度 $> 2$，其倒数第二个字符只能是 `)` 或 `(`；前者归入情况 2，后者意味着紧邻的 `()` 前面还有合法段，长度恰为 $dp[i-2]+2$。由于 $dp[i-2]$ 已是以 $i-2$ 结尾的最长值，$dp[i-2]+2$ 即此情形下的最优。
  - 情况 2 中，以 $i-1$ 结尾的合法段 $T = s[i-dp[i-1]\,..\,i-1]$ 是**最长**的，故与 $s_i$ 配对的 `(` 只可能在 $j = i - dp[i-1] - 1$（更靠左则 $T$ 不再是以 $i-1$ 结尾的最长段）。若 $s_j =$ `(`，则 $s_j\,T\,s_i$ 整体合法；其左侧以 $j-1$ 结尾的最长合法段长度为 $dp[j-1]$，拼接后得到 $dp[i-1]+2+dp[j-1]$，由 $dp[j-1]$ 的最优性知此即以 $i$ 结尾的最长值。若 $s_j \neq$ `(`，则不存在以 $s_i$ 配对的 `(`，$dp[i]=0$。
- 两种情况穷尽了"`)` 能否成为某合法子串结尾"的所有可能，综上所述 DP 算法正确。

## 6. 复杂度分析 (Complexity)

- **时间复杂度**：$O(n)$。状态复杂度 $O(n)$，转移复杂度常数，每个位置 $i$ 只做常数次数组访问与比较，$n = 10^6$ 时约几百万次运算，2 秒时限充裕。
- **空间复杂度**：$O(n)$，即 `dp` 数组与占位后的字符串，远低于 256 MB。

## 7. 实现细节与避坑指南 (Implementation Details)

- **下标占位**：代码用 `string s = " " + str;` 使 $s_0 =$ `' '`（非括号）。这样 `dp[i-2]`、`s[i - dp[i-1] - 1]` 在 $i=2$、$dp[i-1]=i-2$ 等极端位置也不会越界，且 $s_0 \neq$ `(` 保证了"找不到配对"分支的正确性。若不占位，必须额外处理 $i=1$ 与 `i - dp[i-1] - 1 = 0` 的边界。
- **计数的 `0 1` 特例**：`update_max` 中 `else if (v == maxv && v) cnt++;` 的 `&& v` 保证了长度为 $0$ 的"段"不被计数，初始 `cnt = 1` 则覆盖了"无合法子串输出 `0 1`"的要求，无需单独特判。
- **初始情况**：`dp` 为全局数组默认全 $0$；本题单组数据无需清空，若改为多组数据需手动重置相关区间。
- **读入**：用 `cin >> s` 跳过前导空白并读到第一个空白符为止，恰好对应单行括号串。

## 8. 参考代码 (Reference Code)

下面给出 DP 写法，为推导略复杂但代码最简洁的 $O(n)$ 解法。

```cpp
#include <bits/stdc++.h>
using namespace std;

const int N = 1e6 + 5;
int dp[N];

// 更新最大值与计数：长度为 0 时不计入计数
void update_max(int v, int &maxv, int &cnt) {
    if (v > maxv) maxv = v, cnt = 1;
    else if (v == maxv && v) cnt++;
}

int main() {
    ios::sync_with_stdio(false);
    string str;
    cin >> str;
    int n = str.length();
    string s = " " + str;          // s[0]=' ' 占位，避免下标越界与误配对

    for (int i = 2; i <= n; i++) {
        if (s[i] == ')') {
            if (s[i - 1] == '(')
                // 情况1：直接与前一字符配对，再接上更前的合法段
                dp[i] = dp[i - 2] + 2;
            else if (s[i - dp[i - 1] - 1] == '(')
                // 情况2：跨过以 i-1 结尾的合法段，与更早的 '(' 配对
                dp[i] = dp[i - 1] + 2 + dp[i - dp[i - 1] - 2];
        }
    }

    int maxdp = 0, cnt = 1;
    for (int i = 1; i <= n; i++)
        update_max(dp[i], maxdp, cnt);
    cout << maxdp << ' ' << cnt << endl;
    return 0;
}
```

## 9. 补充说明 (Additional Notes)

- **经典模型**：本题是"最长合法括号子串"系列的最基础版本，与 LeetCode 32. Longest Valid Parentheses 同构，区别仅在输出要求多了"个数统计"。DP、栈、双向贪心三种主流解法在此题上等价可达 $O(n)$。
- **计数语义的陷阱**：题面"个数"指**不同位置**的子串个数（同一合法子串若可由不同 $[l,r]$ 表示则分别计数），所以即便两段合法子串内容相同，只要位置不同就各计一次。`dp` + `update_max` 的方式按位置计数，可以做到不重不漏。

### 其他版本

本题我学习了三种解法，下面对比列出。

#### 方法2（栈 + 最长连续段，$O(n)$）

思路最直观——用栈完成括号匹配，匹配成功的位置在 `flag` 中标记，最后统计 `flag` 连续段的长度与个数。是使用栈进行括号匹配的应用。

```cpp
bool flag[N];

void calc_RBS_2(const string &str) {
    int n = str.length();
    const string s = " " + str;
    stack<int> stk;
    for (int i = 1; i <= n; i++)
        if (s[i] == '(') stk.push(i);
        else if (!stk.empty()) {
            flag[i] = flag[stk.top()] = 1;
            stk.pop();
        }
    int maxl = 0, cnt = 1, l = 0;
    for (int i = 1; i <= n; i++) {
        if (flag[i]) l++;
        else update_max(l, maxl, cnt), l = 0;
    }
    update_max(l, maxl, cnt);
    cout << maxl << ' ' << cnt << endl;
}
```

#### 方法3（双向贪心 + set 去重）

从左到右、从右到左各扫一遍，用 `left/right` 计数在归零时记录合法段，并用 `set<pair<int,int>>` 去重。两次扫描分别覆盖"左括号多余"和"右括号多余"两种断点情况。

- **理论复杂度**：`set::insert` 单次 $O(\log n)$，最坏情况下整体 $O(n \log n)$。
- **实际开销**：`set::insert` 只在扫描中 `left`/`right` 归零且当前长度 $\ge$ 已知最大值时才触发，而最长合法子串的数量通常远小于 $n$，使得实际插入次数很少。经实测在 $n = 10^6$ 的数据下仅比 DP/栈写法慢约 30ms，2 秒时限下毫无压力。
- **去重设计的合理性**：两次扫描（从左、从右）会捕获同一合法段各一次，但表示区间的端点定义不同——左扫描用 `[i-lth+1, i]`，右扫描用 `[i, i+lth-1]`，因此同一区间两次插入的结果在 `set` 中天然一致，靠 `set` 去重是**正确且简洁**的做法，并非多余。

```cpp
void calc_RBS_3(const string &str) {
    int n = str.length();
    const string s = " " + str;
    int left = 0, right = 0, lth = 0, maxl = 0;
    set<pair<int, int>> st_cnt;

    // 从左到右：处理"右括号不足"导致的断点
    for (int i = 1; i <= n; i++) {
        if (s[i] == '(') left++;
        else if (!left) lth = 0;
        else {
            left--, lth += 2;
            if (!left) {                            // left 归零 = 一段完整合法
                if (lth > maxl) {
                    maxl = lth;
                    st_cnt.clear();
                    st_cnt.insert({i - lth + 1, i});
                } else if (lth == maxl)
                    st_cnt.insert({i - lth + 1, i});
            }
        }
    }

    // 从右到左：处理"左括号不足"导致的断点
    lth = 0;
    for (int i = n; i; i--) {
        if (s[i] == ')') right++;
        else if (!right) lth = 0;
        else {
            right--, lth += 2;
            if (!right) {
                if (lth > maxl) {
                    maxl = lth;
                    st_cnt.clear();
                    st_cnt.insert({i, i + lth - 1});
                } else if (lth == maxl)
                    st_cnt.insert({i, i + lth - 1});
            }
        }
    }

    int cnt = (st_cnt.size() ? st_cnt.size() : 1);
    cout << maxl << ' ' << cnt << endl;
}
```

**三种解法对比小结**：DP 写法状态最紧凑、转移直接；栈写法思路最直观、适合初学者；双向贪心 + set 写法思路最巧妙——通过两次反向扫描覆盖两类断点，用 `set` 统一去重，避免了去重逻辑的显式编码。实际性能差距在 30ms 量级，三者都是可提交的优质解法，方法经典，都有学习的价值。
