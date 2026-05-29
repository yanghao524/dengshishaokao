const app = getApp();
const cartUtil = require('../../utils/cart');

Page({
  data: {
    categories: [],
    currentCatId: '',
    scrollToId: '',
    cartQtys: {},
    cartSummary: cartUtil.getCartSummary(),

    // 详情弹窗
    showDetailPopup: false,
    detailDish: {},
    detailQuantity: 1
  },

  onLoad() {
    this.loadMenu();
  },

  onShow() {
    if (app.globalData.silentLoginDone && app.globalData.needProfileSetup) {
      wx.switchTab({ url: '/pages/index/index' });
      return;
    }
    this.refreshCartState();
  },

  async loadMenu() {
    try {
      wx.showLoading({ title: '加载菜单...' });
      const res = await app.getMenu();
      wx.hideLoading();

      if (res && res.data && res.data.categories) {
        // 过滤掉空分类, 添加菜品计数
        const categories = res.data.categories
          .map(cat => ({
            ...cat,
            dishCount: cat.dishes ? cat.dishes.length : 0
          }))
          .filter(cat => cat.dishes && cat.dishes.length > 0);

        this.setData({
          categories,
          currentCatId: categories.length > 0 ? categories[0]._id : ''
        });
        this.refreshCartState();
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败，下拉刷新', icon: 'none' });
    }
  },

  // 切换分类
  switchCategory(e) {
    const catId = e.currentTarget.dataset.id;
    this.setData({
      currentCatId: catId,
      scrollToId: `cat-${catId}`
    });
  },

  // 右侧滚动联动左侧高亮
  onDishScroll(e) {
    // 简化处理：根据滚动位置匹配最近分类
    // 实际中可用 IntersectionObserver 或计算 scrollTop 匹配
  },

  // 增加数量
  increaseQty(e) {
    const dish = e.currentTarget.dataset.dish;
    cartUtil.addToCart(dish, 1);
    this.refreshCartState();
  },

  // 减少数量
  decreaseQty(e) {
    const dish = e.currentTarget.dataset.dish;
    const currentQty = cartUtil.getDishQuantity(dish._id);
    if (currentQty > 0) {
      cartUtil.updateQuantity(dish._id, currentQty - 1);
      this.refreshCartState();
    }
  },

  // 刷新购物车状态
  refreshCartState() {
    const cart = cartUtil.getCart();
    const cartQtys = {};
    cart.forEach(item => {
      cartQtys[item.dishId] = item.quantity;
    });
    this.setData({
      cartQtys,
      cartSummary: cartUtil.getCartSummary()
    });
  },

  // 显示菜品详情
  showDetail(e) {
    const dish = e.currentTarget.dataset.dish;
    const qty = cartUtil.getDishQuantity(dish._id);
    this.setData({
      showDetailPopup: true,
      detailDish: dish,
      detailQuantity: qty > 0 ? qty : 1
    });
  },

  // 关闭详情
  closeDetail() {
    this.setData({ showDetailPopup: false });
  },

  // 详情弹窗中增减
  detailIncrease() {
    this.setData({ detailQuantity: this.data.detailQuantity + 1 });
  },
  detailDecrease() {
    if (this.data.detailQuantity > 1) {
      this.setData({ detailQuantity: this.data.detailQuantity - 1 });
    }
  },

  // 从详情弹窗加入购物车
  addDetailToCart() {
    const { detailDish, detailQuantity } = this.data;
    cartUtil.addToCart(detailDish, detailQuantity);
    this.refreshCartState();
    this.setData({ showDetailPopup: false });
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1000 });
  },

  // 去购物车
  goCart() {
    wx.switchTab({ url: '/pages/cart/cart' });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadMenu().then(() => wx.stopPullDownRefresh());
  }
});
