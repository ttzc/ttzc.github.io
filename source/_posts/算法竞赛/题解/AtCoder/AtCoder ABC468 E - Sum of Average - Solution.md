---
title: AtCoder ABC468 E - Sum of Average - Solution
category: 题解
platform: AtCoder
tags:
  - AtCoder
  - 前缀和
  - 贡献拆分
  - 数学
  - 模逆元
author: zaochen
abbrlink: a12f0831
date: 2026-07-26
---


## 1. 题目数据 (Problem Metadata)

- **题目类型**：传统题
- **题目链接**：[E - Sum of Average - AtCoder Beginner Contest 468](https://atcoder.jp/contests/abc468/tasks/abc468_e)
- **时间限制**：2 秒
- **内存限制**：1024 MB

## 2. 题意简述 (Problem Summary)

给定正整数 $N$ 和长度-$N$ 的整数序列 $A=(A_1,A_2,\dots,A_N)$，定义子数组 $A_l,A_{l+1},\dots,A_r$ 的算术平均值为 $f(l,r)=\frac{1}{r-l+1}\sum_{i=l}^{r}A_i$。要求计算

$$\text{Ans}=\sum_{1\le l\le r\le N} f(l,r) \pmod{998244353}$$

其中模 $998244353$ 下的分数 $\frac{P}{Q}$（$Q\not\equiv0\pmod{998244353}$）转化为 $P\cdot Q^{-1}\pmod{998244353}$ 输出，其中 $Q^{-1}$ 表示在模意义下的逆元 。$1\le N\le 5\times10^5$，$0\le A_i<998244353$。

## 3. 朴素解法 (Brute-Force)

枚举所有 $O(N^2)$ 个子数组，对每个子数组计算平均值并累加。$N=5\times10^5$ 时子数组数量级为 $10^{11}$，完全无法在规定时间内完成。

瓶颈在于重复计算平均值的分母。所有子数组的平均值之和可以交换求和顺序，拆分为每个元素的独立贡献，从而将问题降维。

## 4. 核心解法 (Main Solution)

### 特殊性质

平均值之和可以交换求和顺序，拆分为每个元素的独立贡献。位置 $i$ 的贡献仅由 $i$ 与 $N$ 的相对关系决定，与 $A_i$ 的具体值无关。通过逆元，平均数求和操作可以转化为对取模有分配律的加法和乘法。

### 关键突破

从 $O(N^2)$ 的瓶颈出发，利用"每个元素的贡献可分离"这一性质，将问题转化为对每个位置计算一个仅依赖下标的系数 $W_i$，最终答案为 $\text{Ans}=\sum_{i=1}^N A_i\cdot W_i$。

### 推导过程

**第 1 步：枚举区间长度，合并分子求和。**
对每个固定的长度 $k$，先计算所有长度为 $k$ 的子数组的分子之和，再乘以 $k^{-1}$ 得到该长度下所有子数组的平均值之和：

$$\frac1k\text{res}(k)=\frac{1}{k}\sum_{l=1}^{N-k+1}\sum_{i=l}^{l+k-1}A_i$$
**第 2 步：固定位置 $i$，分析包含它的子数组。** 对固定的 $i$ 与 $k$，满足 $l\le i\le l+k-1$ 的左端点个数为

$$cnt(i,k)=\min(k,\;i,\;N-i+1,\;N-k+1)$$
该公式可由区间 $l\in[\max(1,i-k+1),\,\min(i,N-k+1)]$ 的长度直接得到。

交换求和顺序，固定位置 $i$，统计 $i$ 在多少个长度为 $k$ 的子数组中出现：
$$\frac{1}{k}\sum_{i=1}^{N}A_i\cdot \min(k,i,N-i+1,N-k+1)$$
对所有 $k$ 累加即得最终答案：
$$\text{Ans}=\sum_{k=1}^{N}\frac{1}{k}\sum_{i=1}^{N}A_i\cdot \min(k,i,N-i+1,N-k+1)$$
再交换内外层求和，拆出每个位置 $i$ 的独立贡献 $A_i\cdot W_i$：

$$\text{Ans}=\sum_{i=1}^{N}A_i\cdot \sum_{k=1}^{N}\frac{\min(k,i,N-i+1,N-k+1)}{k}$$

**第 3 步：定义系数 $W_i$。**
$$W_i=\sum_{k=1}^{N}\frac{cnt(i,k)}{k}$$

**第 4 步：对称性简化。** 注意到 $W_i=W_{N-i+1}$，且 $cnt(i,k)$ 关于 $i$ 与 $k$ 均呈"三段线性"结构。通过枚举 $k$，令 $tp=\min(k,N-k+1)$，可将 $W_i$ 的求和转化为

$$W_i=\sum_{k=1}^{N}\frac{\min(i,N-i+1,\,tp,\,N-tp+1)}{k}$$

**第 5 步：前缀和优化。** 对枚举变量 $k$，分子部分 $\sum_{j=1}^{N}\min(j,N-j+1,tp,N-tp+1)\cdot A_j$ 可按三段拆分为：

- 左段 $[1,tp]$：系数为 $j$，即 $\sum_{j=1}^{tp}j\cdot A_j$
- 中段 $[tp+1,N-tp]$：系数为 $tp$，即 $tp\cdot\sum_{j=tp+1}^{N-tp}A_j$
- 右段 $[N-tp+1,N]$：系数为 $N-j+1$，即 $\sum_{j=N-tp+1}^{N}(N-j+1)\cdot A_j$

预处理三个前缀和数组 $f$（普通前缀和）、$g$（左段加权和）、$h$（右段加权和），即可在 $O(1)$ 内算出当前 $k$ 对应的分子值 $\text{res}(k)$。对于 $\sum_{j=1}^{tp}j\cdot A_j$ 这种加权和，我们在使用差分树状数组实现区间修改区间查询时见过，详见：[[【数据结构】树状数组 学习笔记#树状数组与差分]]。最终答案：
$$\text{Ans}=\sum_{k=1}^{N}\text{res}(k)\cdot k^{-1}\pmod{998244353}$$

## 5. 正确性证明 (Proof of Correctness)

**交换求和顺序**：所有项均为有限值，且模意义下分母 $Q\not\equiv0\pmod{998244353}$，故逆元存在。由求和交换律，先对 $i$ 求和或先对 $l,r$ 求和结果相同。

**$cnt(i,k)$ 公式**：对固定 $i,k$，左端点 $l$ 需满足 $l\le i\le l+k-1$ 且 $1\le l\le N-k+1$，即 $l\in[\max(1,i-k+1),\,\min(i,N-k+1)]$。该区间长度恰为 $\min(k,i,N-i+1,N-k+1)$，证毕。

**前缀和公式**：对枚举变量 $k$，令 $tp=\min(k,N-k+1)$。将数组按 $tp$ 分为左、中、右三段，各段系数分别为下标 $j$、$tp$、$N-j+1$。因此 $\text{res}(k)=\sum_{j=1}^{N}c_j\cdot A_j$，其中

$$c_j=\begin{cases}j & j\le tp\\tp & tp<j\le N-tp\\N-j+1 & j>N-tp\end{cases}$$

该系数恰好等于 $\min(j,N-j+1,tp,N-tp+1)$。预处理 $g$ 与 $h$ 后，$\text{res}(k)$ 的每一段均可 $O(1)$ 合并。综上所述，整个算法正确。

通俗地，每个位置 $i$ 的贡献权重 $W_i$ 可以看作"以 $i$ 为中心的对称衰减"，而前缀和 $g$ 和 $h$ 分别维护了从左到右和从右到左的加权累积，使得每一轮 $k$ 的分子计算只需三次数组访问。

## 6. 复杂度分析 (Complexity)

- **时间复杂度**：预处理三个前缀和数组 $O(N)$。主循环 $N$ 次，每次需 $O(\log MOD)$ 计算模逆元（快速幂），总计 $O(N \log MOD)$。$\log_2 998244353 \approx 30$，$N=5\times10^5$ 时约 $1.5\times10^7$ 次运算，可轻松通过。若预处理逆元数组，可降至严格 $O(N)$。
- **空间复杂度**：$O(N)$。存储原数组及三个前缀和数组，每个数组长度 $N+5$，总计约 $4\times 5\times10^5\times 8\text{ bytes}\approx 16\text{ MB}$，远低于内存限制。

## 7. 实现细节与避坑指南 (Implementation Details)

- **模逆元**：使用快速幂计算 $k^{-1}\equiv k^{998244353-2}\pmod{998244353}$。$998244353$ 是素数，逆元恒存在。
- **整数范围**：$f$ 数组存储真实前缀和（未取模），其差值 $f[N-tp]-f[tp]$ 最大约为 $N\cdot 998244353\approx 5\times10^{14}$，取模后小于 $998244353$，再乘以 $tp\le 5\times10^5$，乘积仍在 $64$ 位整数范围内，不会溢出。
- **非负性**：由于 $tp=\min(k,N-k+1)$，总有 $N-tp\ge tp$，故 $f[N-tp]-f[tp]\ge0$，无需额外处理负数取模问题。这也是我对原始前缀和不取模，并计算这个 $tp$ 的原因。
- **奇偶分类**：
  - $N$ 为偶数：中间位置不存在，所有 $k$ 统一使用左段+右段+中段公式；当 $tp=N/2$ 时中段为空，跳过中间段累加。
  - $N$ 为奇数：中间位置 $mid=(N+1)/2$ 需要特殊处理，因为此时中段为空，需拆分为左段前缀 $g[mid-1]$ + 右段后缀 $h[mid+1]$ + 中间元素 $A_{mid}\cdot mid$。
- **下标习惯**：数组下标从 $1$ 开始，与题目描述一致，避免 $0$ 下标带来的边界混淆。

| 坑点 | 说明 |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **模逆元计算** | 快速幂每次 $O(\log MOD)$，主循环 $N$ 次，总复杂度 $O(N \log MOD)$。$\log_2 998244353 \approx 30$，$N=5\times10^5$ 时约 $1.5\times10^7$ 次运算，可轻松通过。若需严格 $O(N)$，可预处理逆元数组 `inv[i] = mod - mod/i * inv[mod%i] % mod`（$i=1..N$），$O(N)$ 初始化后每次 $O(1)$ 查询。 |
| **中间位置处理** | $N$ 为奇数时，$tp=(N+1)/2$ 对应中间元素，此时中段 $[tp+1,N-tp]$ 为空。代码中通过 `if (tp != (n+1)/2)` 分支避免访问空区间，否则会重复计入中间元素。 |
| **负数取模** | `f[n-tp]-f[tp]` 理论上非负，但 C++ 中 `%` 对负数的行为取决于编译器。为保险起见，可以在参考代码中加了 `if (ans < 0) ans += MOD;` 和 `(pref[n - tp] - pref[tp] + MOD) % MOD`。实际上由于 $n-tp \ge tp$，该差值始终非负，不加也正确。 |

## 8. 参考代码 (Reference Code)

基本上是我最早实现的赛时代码，采用「前缀和 $f,g,h$ + 分类讨论 $N$ 奇偶」的思路。思路完全正确，已通过 AtCoder 评测。

```cpp
#include <bits/stdc++.h>
using namespace std;
#define int long long

const int N = 5e5 + 5, mod = 998244353;

int n;
int a[N], f[N], g[N], h[N];
int ans = 0;

// 快速幂求模逆元：计算 base^(mod-2) % mod
int qmi(int p, int r)
{
    int res = 1;
    while (r)
    {
        if (r & 1)
            res = res * p % mod;
        p = p * p % mod;
        r >>= 1;
    }
    return res;
}

signed main()
{
    ios::sync_with_stdio(false);
#ifdef DEBUG
    clock_t t0 = clock();
    freopen("data.in", "r", stdin);
    freopen("data.out", "w", stdout);
#endif

    // Don't stop. Don't hide. Follow the light, and you'll find tomorrow.

    cin >> n;
    for (int i = 1; i <= n; i++)
        cin >> a[i], f[i] = f[i - 1] + a[i];       // 真实前缀和（未取模，避免相减后产生负数）
    for (int i = 1; i <= n; i++)
        g[i] = (g[i - 1] + i * a[i]) % mod;         // 左段加权前缀和
    for (int i = n; i; i--)
        h[i] = (h[i + 1] + (n - i + 1) * a[i]) % mod; // 右段加权后缀和

    if ((n & 1) == 0)
    {
        // N 为偶数：遍历所有区间长度 k，计算当前长度的贡献
        for (int k = 1; k <= n; k++)
        {
            int inv_k = qmi(k, mod - 2);            // 当前 k 的模逆元，即 1/k
            int tp = min(k, n - k + 1);              // tp = min(k, n-k+1)，确定当前对称段的边界
            int res = (g[tp] + h[n - tp + 1]) % mod; // 左段 + 右段贡献

            // 中段贡献：当 tp < n/2 时中段非空，否则中段为空跳过
            if (tp < n / 2)
                res = (res + (f[n - tp] - f[tp]) % mod * tp) % mod;

            ans = (ans + res * inv_k) % mod;
        }
    }
    else
    {
        // N 为奇数：中间位置需要单独处理
        int mid = (n + 1) / 2;
        for (int k = 1; k <= n; k++)
        {
            int inv_k = qmi(k, mod - 2);
            int tp = min(k, n - k + 1);
            int res = 0;

            if (tp == mid)
            {
                // tp 恰好等于 mid：中段为空，拆分为左段前缀 + 右段后缀 + 中间元素
                res = (g[tp - 1] + h[tp + 1]) % mod;
                res = (res + a[tp] * tp) % mod;
            }
            else
            {
                // 一般情况：左段 + 右段 + 中段
                res = (g[tp] + h[n - tp + 1]) % mod;
                res = (res + (f[n - tp] - f[tp]) % mod * tp) % mod;
            }

            ans = (ans + res * inv_k) % mod;
        }
    }

    cout << ans << endl;
    return 0;
}
```

## 9. 补充说明 (Additional Notes)

- 本题是**子数组平均值和**（Sum of Subarray Averages）的经典变种，核心技巧是"贡献拆分 + 前缀和优化"，将 $O(N^2)$ 的枚举压缩至 $O(N)$。方法经典，具有学习的价值。
- 若 $N$ 更大（如 $10^6$），此 $O(N)$ 算法依然高效。模逆元部分可进一步用线性预处理优化常数，但非必需。
- 赛时代码采用全局数组与 `#define int long long` 的典型竞赛写法，思路清晰且已通过验证。全局数组是 OI 赛制下的常见习惯，本题中主要是计算前（后）缀和利用了头（尾）默认值为 $0$；`#define int long long` 统一处理溢出问题，也是算法竞赛中常用的写法。参考代码相比赛时代码，调整了变量命名与边界条件的可读性，添加了详细注释，算法本质完全一致，也提交 AtCoder 进行测试。
- 本题与 [AtCoder ABC268 F - SST](https://atcoder.jp/contests/abc268/tasks/abc268_f) 等"子数组贡献拆分"类题目思路一脉相承，核心都是将 $O(N^2)$ 的枚举转化为每个元素的独立系数计算。本题独特的点是需要使用具有对称性的前缀和分段实现区间求和。
