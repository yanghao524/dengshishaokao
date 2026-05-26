# 邓师烧烤 - 微信小程序点餐系统

扫码点餐，无需排队。顾客浏览菜品、下单预订；商家实时接单、管理订单、记账统计。基于微信云开发，免服务器运维。

## 功能模块

### 顾客端

| 功能 | 说明 |
|------|------|
| 首页 | 餐厅品牌展示、推荐菜品、隐私授权弹窗 |
| 菜单浏览 | 双栏布局（左分类/右菜品），无需登录即可浏览 |
| 购物车 | 加减菜品数量、滑动删除、实时计算总价 |
| 下单预订 | 填写称呼/手机号/桌号，提交订单 |
| 订单跟踪 | 查看订单状态变化（待接单→已接单→已完成） |

### 商家端（长按首页 logo 3 次进入）

| 功能 | 说明 |
|------|------|
| 订单看板 | 实时监听新订单（数据库 watch），振动提示，一键接单 |
| 订单详情 | 顾客信息展示、一键拨打电话、复制手机号 |
| 编辑订单 | 修改菜品和数量、添加菜品（适配沽清/数量不足场景） |
| 完成出餐 | 确认出餐完成，数据自动计入当日记账 |
| 记账看板 | 按日期查看营业额、订单数、均单消费、菜品销量排行 |
| 菜品管理 | 分类和菜品的增删改查、图片上传到云存储、沽清开关 |

## 技术架构

```
mini program (WXML/WXSS/JS + Vant WeApp)
        │
        │  wx.cloud.callFunction()
        ▼
cloud functions (Node.js) ─── cloud database (文档型 DB)
        │                       ├── customers
        │                       ├── categories
        │                       ├── dishes
        │                       ├── orders
        │                       ├── merchantUsers
        │                       └── dailyAccounting
        │
        └── cloud storage (菜品图片 CDN)
```

- **前端**：微信原生开发 + Vant WeApp UI 组件库
- **后端**：微信云开发 CloudBase（云函数 + 云数据库 + 云存储）
- **实时通知**：数据库监听器 `db.collection.watch()` 替代 WebSocket
- **认证**：云函数自动获取 `OPENID`，手机号由用户手动填写（非微信授权，降低审核门槛）

## 目录结构

```
dengshishaokao/
├──                      # 小程序前端
│   ├── app.js/json/wxss             # 入口 + 全局配置 + 主题样式
│   ├── pages/
│   │   ├── index/                   # 顾客首页
│   │   ├── menu/                    # 菜单浏览 + 点菜
│   │   ├── cart/                    # 购物车
│   │   ├── order-confirm/           # 订单确认（填写信息）
│   │   ├── order-success/           # 下单成功
│   │   ├── order-detail/            # 订单详情
│   │   ├── my-orders/               # 我的订单列表
│   │   ├── dish-detail/             # 菜品详情
│   │   ├── privacy/                 # 隐私政策（审核必需）
│   │   └── merchant/                # 商家端
│   │       ├── login/               #   登录
│   │       ├── orders/              #   订单看板（实时 watch）
│   │       ├── order-detail/        #   订单详情 + 操作按钮
│   │       ├── edit-order/          #   编辑订单
│   │       ├── accounting/          #   记账看板
│   │       └── menu-manage/         #   菜品管理
│   ├── components/                  # 复用组件
│   ├── utils/cart.js                # 购物车状态管理
│   └── images/                      # 静态资源
│
└── cloudfunctions/                  # 云函数
    ├── customerRegister/            # 顾客注册（静默登录 + 更新信息）
    ├── getMenu/                     # 获取菜单（分类 + 菜品）
    ├── placeOrder/                  # 下单（快照价格 + 生成订单号）
    ├── getOrders/                   # 订单列表（顾客/商家 + 状态筛选）
    ├── getOrderDetail/              # 订单详情
    ├── updateOrderStatus/           # 状态变更（接单/完成/取消 + 自动记账）
    ├── editOrder/                   # 商家修改订单
    ├── merchantLogin/               # 商家登录（bcrypt）
    ├── getAccounting/               # 记账统计（每日 + 菜品排行）
    ├── manageMenu/                  # 菜品/分类 CRUD
    └── seedData/                    # 种子数据（7分类 + 20道菜 + 商家账号）
```

## 快速开始

### 前置条件

- 微信小程序账号（企业或个体工商户主体）
- 已开通云开发环境

### 1. 克隆项目

```bash
git clone https://github.com/yanghao524/dengshishaokao.git
```

### 2. 修改配置

| 文件 | 配置项 | 说明 |
|------|--------|------|
| `project.config.json` | `appid` | 替换为你的小程序 AppID |
| `app.js` | `env` | 替换为你的云开发环境 ID |

### 3. 导入、构建、部署

1. 打开**微信开发者工具**，导入项目根目录
2. 在开发者工具中：工具 → 构建 npm（构建 Vant WeApp）
3. 依次右键 `cloudfunctions/` 下每个云函数目录 → 上传并部署
4. 在开发者工具中手动调用一次 `seedData` 云函数，初始化种子数据

### 4. 添加 TabBar 图标

在 `images/` 下放置以下图片（建议 81×81px PNG）：

```
tab-home.png / tab-home-active.png    # 首页
tab-menu.png / tab-menu-active.png    # 菜单
tab-cart.png / tab-cart-active.png    # 购物车
tab-mine.png / tab-mine-active.png    # 我的
```

### 5. 提交审核

- 分类选择「餐饮 > 点餐预订」
- 附测试账号：商家后台 `admin` / 密码 `dengshi2026`（可通过 seedData 生成）
- 确保隐私政策页面可访问、未登录可浏览菜单

## 默认商家账号

| 用户名 | 密码 | 说明 |
|--------|------|------|
| admin | dengshi2026 | 种子数据创建，部署后可修改 |

## 云数据库权限配置

| 集合 | 读权限 | 写权限 |
|------|--------|--------|
| customers | 仅创建者可读 | 仅创建者可写 |
| categories | 所有用户可读 | 仅云函数可写 |
| dishes | 所有用户可读 | 仅云函数可写 |
| orders | 创建者可读 | 仅云函数可写 |
| merchantUsers | 仅云函数 | 仅云函数 |
| dailyAccounting | 仅云函数 | 仅云函数 |

## 审核合规要点

- **无支付功能**：纯点餐预订，不涉及任何支付 API
- **无强制登录**：浏览菜单不需要提供任何个人信息
- **手机号自填**：使用 `<input>` 手动输入，不走微信手机号授权
- **隐私政策**：`app.json` 配置 `__usePrivacyCheck__: true`，首次启动弹出隐私授权

## License

MIT
