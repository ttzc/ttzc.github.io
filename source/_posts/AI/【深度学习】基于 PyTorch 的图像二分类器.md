---
title: 【深度学习】基于 PyTorch 的图像二分类器
categories:
  - AI
tags:
  - 深度学习
  - 神经网络
  - 图像分类
  - PyTorch
article:
  author: zaochen
abbrlink: fbd38f8b
date: 2026-11-02 22:56:00
description: 北邮《人工智能导论》课程作业记录：把课堂上的线性变换、卷积与池化、梯度下降落到代码里——从小规模爬取初音未来与洛天依插画、查重并按相似组划分数据集防泄漏，到用 PyTorch 搭 TinyCNN 完成图像二分类的训练与指标评估，附数据脚本、notebook 与开源仓库。
---

选修了北邮人工智能学院高升老师开设的《人工智能导论 Introduction to Artificial Intelligence》课程，第二节课《人工智能的数学本质 The Mathematical Essence of Artificial Intelligence》给我们介绍了神经网络的基本输入输出形式，以及线性变换、Sigmoid、ReLU、离散卷积、池化及其组合，监督学习、无监督学习、半监督学习、迁移学习、强化学习、对抗学习的基本概念，梯度下降法的训练方法，以及一个非常简单的图像二分类原理介绍。  
课后布置了一个分类器作业，要求我们利用大模型学习分类预测、回归分析、聚类分析等知识点，任意选择场景和技术栈，开发一个从数据生成、分类函数设计、到预测性能分析的分类器，提交一份相关工作报告，含分类器代码及运行结果。  
高老师要求，报告中要包括我们和大模型对话学习的完整过程，以及完整代码。本文将对作业报告作一个索引与分享，记录一些学习过程中自己的思考与困惑，并把实现的一些代码开源。

## 场景介绍

初音未来（Hatsune Miku）是日本 Crypton Future Media 以 Yamaha 的 Vocaloid 语音合成引擎为基础开发的“虚拟歌手”软件及其角色形象，通常被称为“虚拟歌姬”。洛天依是世界首位中文 Vocaloid 虚拟歌手，也是中国虚拟歌手文化中最具代表性的角色之一。与初音未来相比，她更强调中文发音和中国市场语境，是中文虚拟歌姬生态的核心起点之一。  
对于二次元文化了解不多的朋友或许会造成一些混淆，带来一些喜剧效果。对此，中文 Vocaloid 创作者 WOVOP 在愚人节创作了《我是初音未来》《我是洛天依》等作品。基于此场景，我打算训练一个对初音未来和洛天依的插画进行图像二分类的深度学习模型，来完成本次作业。  

![相关音乐作品](https://bee-reg-ab.imagency.cn/mr/202611/02/6ae8ad56f17ca.png)

## 数据准备

[MIKUPARA](https://www.mikupara.com/) 这个网站提供了一个随机初音未来插画图的 HTTP API 接口，于是我借助 Agent 工具实现了一份网络爬虫相关脚本 `01_crawl_miku.py`，下载了约 1200 张。然后在 QQ 群内下载了一份别人整理的天依的插画和官方图片，约 1600 张。随后我借助 Agent 工具实现了查重脚本 `02_dedup.py`，相似的图片必须放到同一组，若跨越了 训练集/验证集/测试集 或许会让准确率偏高，所以 `03_split.py` 根据查重结果和此原则对图片进行了分组，用 `04_copy_to_process.py` 把对应分组复制成了如下的目录结构：  

```text
process/
    ├── train/{luo,miku}/...
    ├── val/{luo,miku}/...
    └── test/{luo,miku}/...
```

然后 `05_preprocess.py` 的功能是，统一了图片格式为 jpg，把长边分辨率使用 pillow 模块缩放到 1024。  
至此数据准备与分组工作完成，把过程中用到的相关脚本上传到了 GitHub。  

## 模型训练

正式开始训练前，我创建了一个 jupyter notebook，运行下面脚本片段，学习相关原理和模块的使用。这个 notebook 也发布到 GitHub 仓库了。  

### 环境准备

我习惯使用 `uv` 工具来管理 Python 环境，我的轻薄本没有 GPU，需要配置 PyTorch CPU 环境，于是在 `pyproject.toml` 里写入了如下内容：

```toml
[[tool.uv.index]]
name = "pytorch-cpu"
url = "https://download.pytorch.org/whl/cpu"
explicit = true

[tool.uv.sources]
torch = { index = "pytorch-cpu" }
torchvision = { index = "pytorch-cpu" }
```

接下来使用下面的命令配置了环境：

```bash
uv init
# 然后编辑 pyproject.toml，加入上面的 [[tool.uv.index]] 和 [tool.uv.sources]
uv add torch torchvision
uv add matplotlib numpy pandas pillow
uv sync
```

```python
>>> import torch
>>> torch.cuda.is_available() # cpu 版本
False
```

### transforms

```python
from torchvision import transforms

MEAN = [0.5, 0.5, 0.5]
STD = [0.5, 0.5, 0.5]

# 训练集：随机增强 + 转张量 + 标准化
train_tf = transforms.Compose([
    # 从原图随机裁剪一块区域再缩放到 224x224：
    # - 保持正方形输出，便于 batch 堆叠
    # - scale=(0.7, 1.0) 表示裁剪面积占原图 70%~100%，避免裁得太狠
    transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
    # 水平翻转：图像二分类最安全、最常用的增强
    transforms.RandomHorizontalFlip(p=0.5),    
    # HWC uint8 [0,255] -> CHW float [0,1]
    # PIL Image -> FloatTensor，形状 [C,H,W]，取值范围 [0,1]
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD),  # 值域大致变为 [-1, 1]
])

# 验证/测试集：只做确定性 resize + 转张量 + 标准化，不能有随机增强
eval_tf = transforms.Compose([
    # 只给一个数 256：短边缩到 256，长边按比例缩放，保持长宽比
    transforms.Resize(256),
    # 中心裁剪 224x224：与训练输出尺寸一致
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD),
])
```

### Dataset

```python
train_ds = ImageFolder(root=str(TRAIN_DIR), transform=train_tf)
val_ds   = ImageFolder(root=str(VAL_DIR),   transform=eval_tf)
test_ds  = ImageFolder(root=str(TEST_DIR),  transform=eval_tf)
```

`ImageFolder` 会自动按照我设计的子目录名称（`luo`，`miku`）对数据进行标注。  

### DataLoader

```python
# ============================================================
# 单元格 6：构建 DataLoader
# 关键参数：
#   batch_size  : CPU 轻薄本建议 8/16/32，先用 16
#   shuffle     : 训练集 True，验证/测试 False
#   num_workers : Jupyter + Windows 建议先 0；稳定后再试 2
#   pin_memory  : 只对 CUDA 有意义，CPU 环境设 False
# ============================================================
BATCH_SIZE = 16

train_loader = DataLoader(
    train_ds,
    batch_size=BATCH_SIZE,
    shuffle=True,        # 训练集打乱，提升随机性
    num_workers=0,       # Jupyter 下先用 0，避免 spawn 相关卡住
    pin_memory=False,
)
val_loader = DataLoader(
    val_ds,
    batch_size=BATCH_SIZE,
    shuffle=False,       # 验证集不打乱，便于逐样本对齐分析
    num_workers=0,
    pin_memory=False,
)
test_loader = DataLoader(
    test_ds,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0,
    pin_memory=False,
)

print("batches:", len(train_loader), len(val_loader), len(test_loader))
```

### CNN

借助大模型设计了如下的神经网络：

```python
# ============================================================
# 单元格 8：最小 CNN 骨架（详细注释版）
#
# 设计约定：
#   1) 输出"单 logit"，不在 forward 里加 Sigmoid；
#      交给 nn.BCEWithLogitsLoss，它内部做 Sigmoid+BCE，数值更稳。
#   2) 网络拆成 features（卷积特征提取）和 classifier（分类头）两段，
#      便于后续换分类头做迁移学习。
#   3) 所有层都是 nn.Module 的子模块，model.to(device) 会递归搬运。
#
# 维度流（B 为 batch size）：
#   [B,3,224,224]
#     -> Conv2d(3->16,k3,p1)   [B,16,224,224]   尺寸不变：k=3,p=1,s=1
#     -> ReLU                  [B,16,224,224]   逐元素，不变形
#     -> MaxPool2d(2)          [B,16,112,112]   k=2,s=2 默认，H/W 减半
#     -> Conv2d(16->32,k3,p1)  [B,32,112,112]   尺寸不变
#     -> ReLU                  [B,32,112,112]
#     -> MaxPool2d(2)          [B,32,56,56]     H/W 再减半
#     -> AdaptiveAvgPool2d(1)  [B,32,1,1]       每通道全局平均
#     -> Flatten               [B,32]           保留 batch，拉平其余维
#     -> Linear(32->1)         [B,1]            单 logit
# ============================================================
class TinyCNN(nn.Module):
    def __init__(self, num_classes=1):
        # 必须最先调用父类初始化：
        # 它建立子模块/参数的注册表，之后 self.xxx = nn.Xxx(...)
        # 才能被 parameters()、to()、state_dict() 正确识别。
        super().__init__()

        # ---------- 特征提取段：卷积 + 激活 + 池化 交替 ----------
        self.features = nn.Sequential(
            # 第 1 个卷积：3 通道 RGB -> 16 个特征图
            # kernel_size=3, padding=1, stride=1(默认)
            # 输出尺寸 = floor((224 + 2*1 - 3)/1) + 1 = 224，尺寸不变
            # 权重形状 [16, 3, 3, 3]，偏置 [16]
            nn.Conv2d(in_channels=3, out_channels=16,
                      kernel_size=3, padding=1),

            # 逐元素 max(0,x)，不改变形状，无参数，引入非线性
            # inplace=True：原地修改输入，省一份中间内存；
            # 该输出只往下传，不会影响别的分支，所以安全。
            nn.ReLU(inplace=True),

            # 2x2 最大池化，stride 默认等于 kernel_size=2（非重叠）
            # 每个通道独立：通道数 16 不变，H/W 各减半
            # 输出 = floor((224-2)/2)+1 = 112 -> [B,16,112,112]
            # 无参数；反向时梯度只回传给窗口内最大值位置
            nn.MaxPool2d(kernel_size=2),

            # 第 2 个卷积：16 -> 32 通道
            # k=3,p=1,s=1，H/W 保持 112 不变
            # 权重形状 [32, 16, 3, 3]，偏置 [32]
            nn.Conv2d(in_channels=16, out_channels=32,
                      kernel_size=3, padding=1),

            # 同上，逐元素 ReLU
            nn.ReLU(inplace=True),

            # 再次 2x2 非重叠池化
            # 输出 = floor((112-2)/2)+1 = 56 -> [B,32,56,56]
            nn.MaxPool2d(kernel_size=2),
        )

        # ---------- 分类头段：全局池化 + 展平 + 线性 ----------
        self.classifier = nn.Sequential(
            # 自适应全局平均池化：输出空间尺寸固定为 1x1
            # 对每个通道在整张 HxW 上取平均
            # [B,32,56,56] -> [B,32,1,1]
            # "自适应"= 窗口大小由输入尺寸自动决定，
            # 换输入分辨率时这一层不用改。
            # 相比"Flatten 后接大 Linear"，它参数少、更不易过拟合。
            nn.AdaptiveAvgPool2d(output_size=1),

            # 展平：默认 start_dim=1，保留第 0 维 batch
            # [B,32,1,1] -> [B,32]
            # 不能从 dim=0 展平，否则会把 batch 内样本混在一起。
            nn.Flatten(),

            # 线性变换 y = x @ W.T + b
            # 输入 [B,32]，输出 [B,num_classes]=[B,1]
            # 权重 [1,32]，偏置 [1]
            # 输出是"单 logit"（未归一化分数），不是概率。
            # 概率 = sigmoid(logit)，但不在 forward 里做，
            # 因为 BCEWithLogitsLoss 内部会做，数值更稳定。
            nn.Linear(in_features=32, out_features=num_classes),
        )

    def forward(self, x):
        # x: [B,3,224,224]
        # 前向即按 features -> classifier 顺序执行；
        # PyTorch 会自动记录计算图用于反向传播。
        x = self.features(x)    # [B,32,56,56]
        x = self.classifier(x)  # [B,1] 单 logit
        return x

# 实例化并搬到设备（CPU）。
# .to(device) 递归搬运所有子模块参数；
# 训练时数据也要 .to(device)，模型与数据必须同设备。
model = TinyCNN(num_classes=1).to(device)
```

### 训练效果指标

```python
# ============================================================
# 单元格 9：损失函数、优化器、二分类指标（详细注释版）
#
# 职责划分：
#   criterion  : 定义"预测有多错"，产出标量 loss，驱动反向传播
#   optimizer  : 定义"如何用梯度更新参数"
#   metrics    : 定义"如何把 logit 读成可解释指标"，只用于评估
#
# 形状契约（最重要）：
#   模型输出 logit : [B,1] float32
#   损失用 target  : [B,1] float32，值 {0.0,1.0}
#   指标用 target  : [B]   int64，值 {0,1}
#   损失和指标的 target 形状不同，转换在训练/评估函数里做。
# ============================================================

# ---------- 损失函数 ----------
# BCEWithLogitsLoss = 内部 Sigmoid + BCE，合并成一个数值稳定的算子。
# 输入必须是 logit，不是概率；不要在外面先 sigmoid。
# 数学上 loss(z,y) = max(z,0) - z*y + log(1+exp(-|z|))，
# 避免直接算 log(sigmoid(z)) 在 z 很大/很小时的 inf/NaN。
# 形状要求：input 与 target 形状一致，target 为 float。
criterion = nn.BCEWithLogitsLoss()

# ---------- 优化器 ----------
# Adam 是梯度下降的自适应变体：每个参数维护一阶矩(梯度均值)
# 和二阶矩(梯度平方均值)，按参数维度缩放有效学习率。
# 优点：收敛快、对 lr 不那么敏感，适合快速跑通基线。
# model.parameters() 只包含可学习参数；MaxPool/ReLU 无参数，不参与。
# lr=1e-3 是 Adam 常用起点；后续根据 train/val 曲线再调。
# weight_decay 默认 0，等观察到过拟合再加。
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

# ---------- 指标函数 ----------
def binary_metrics_from_logits(logits, targets, threshold=0.5):
    """
    从 logit 计算 acc / precision / recall / f1。

    参数：
        logits   : [B,1] 或 [B]，模型原始输出（未过 sigmoid）
        targets  : [B]    int64 或 float，值 {0,1}
        threshold: 概率阈值，默认 0.5；不平衡时应扫描调优

    返回：
        dict，四个 Python float。注意这是"传入这批数据"的 batch 级指标；
        跨 batch 汇总应先累积 TP/TN/FP/FN 再算比率。
    """
    # logit -> 概率。squeeze(1) 把 [B,1] 压成 [B]；
    # 指定维度 1，避免 batch=1 时 squeeze() 误删 batch 维。
    probs = torch.sigmoid(logits.squeeze(1))

    # 阈值二值化：布尔 [B] -> int64 {0,1}，与 targets 同 dtype 便于逻辑运算。
    preds = (probs >= threshold).long()

    # 统一 targets 为 int64；调用方需保证 targets 是 [B]，
    # 若是 [B,1] 会与 preds 广播成 [B,B]，指标全错。
    targets = targets.long()

    # 混淆矩阵四元素：逐元素布尔与，再求和计数。
    # .item() 把张量取成 Python int，脱离计算图；指标不需反传。
    tp = ((preds == 1) & (targets == 1)).sum().item()  # 正类判对
    tn = ((preds == 0) & (targets == 0)).sum().item()  # 负类判对
    fp = ((preds == 1) & (targets == 0)).sum().item()  # 负类误判为正
    fn = ((preds == 0) & (targets == 1)).sum().item()  # 正类误判为负

    # 比率指标；分母用 max(.,1) 防除零（某类为空时结果为 0 而非 NaN）。
    acc       = (tp + tn) / max(tp + tn + fp + fn, 1)
    precision = tp / max(tp + fp, 1)
    recall    = tp / max(tp + fn, 1)
    # F1 是 P/R 调和平均；分母极小值兜底，避免 0/0。
    f1        = 2 * precision * recall / max(precision + recall, 1e-8)

    # 返回 Python float 的 dict：便于打印、记录、画曲线。
    return {"acc": acc, "precision": precision, "recall": recall, "f1": f1}
```

### 训练与评估

```python
# ============================================================
# 单元格 10：单 epoch 训练与验证函数
# 训练循环五步：zero_grad -> forward -> loss -> backward -> step
# 验证循环：model.eval() + torch.no_grad()
# ============================================================
def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()  # 训练模式：影响 Dropout/BatchNorm 行为
    total_loss, total_n = 0.0, 0
    for images, labels in loader:
        images = images.to(device)
        # BCEWithLogitsLoss 要求 target 为 float 且形状与 logit 一致 [B,1]
        labels = labels.to(device).float().unsqueeze(1)
        optimizer.zero_grad()
        logits = model(images)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * images.size(0)  # 按样本数加权
        total_n += images.size(0)
    return total_loss / total_n

@torch.no_grad()
def evaluate(model, loader, criterion, device, threshold=0.5):
    model.eval()   # 评估模式
    total_loss, total_n = 0.0, 0
    all_logits, all_labels = [], []
    for images, labels in loader:
        images = images.to(device)
        labels_dev = labels.to(device).float().unsqueeze(1)
        logits = model(images)
        loss = criterion(logits, labels_dev)
        total_loss += loss.item() * images.size(0)
        total_n += images.size(0)
        all_logits.append(logits.cpu())
        all_labels.append(labels.cpu())
    all_logits = torch.cat(all_logits, dim=0)
    all_labels = torch.cat(all_labels, dim=0)
    metrics = binary_metrics_from_logits(all_logits, all_labels, threshold)
    metrics["loss"] = total_loss / total_n
    return metrics

# 跑 3 个 epoch，观察 train loss 是否下降、val 指标是否合理
EPOCHS = 3
for epoch in range(1, EPOCHS + 1):
    train_loss = train_one_epoch(model, train_loader, criterion, optimizer, device)
    val_metrics = evaluate(model, val_loader, criterion, device)
    print(f"epoch {epoch}: train_loss={train_loss:.4f}, val={val_metrics}")
```

首次运行效果：

```py
epoch 1: train_loss=0.6818, val={'acc': 0.6416666666666667, 'precision': 0.646551724137931, 'recall': 0.625, 'f1': 0.635593220338983, 'loss': 0.6612473169962565}
epoch 2: train_loss=0.6339, val={'acc': 0.6541666666666667, 'precision': 0.6390977443609023, 'recall': 0.7083333333333334, 'f1': 0.6719367588932806, 'loss': 0.6231722255547841}
epoch 3: train_loss=0.6093, val={'acc': 0.6583333333333333, 'precision': 0.6319444444444444, 'recall': 0.7583333333333333, 'f1': 0.6893939393939393, 'loss': 0.6312589685122172}
```

（未完待续）