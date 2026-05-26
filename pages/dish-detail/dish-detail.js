const cartUtil = require('../../utils/cart');
const app = getApp();

Page({
  data: {
    dish: {},
    quantity: 1
  },

  onLoad(options) {
    if (options.id) {
      this.loadDish(options.id);
    }
  },

  async loadDish(id) {
    try {
      const res = await app.getMenu();
      if (res && res.data && res.data.allDishes) {
        const dish = res.data.allDishes.find(d => d._id === id);
        if (dish) {
          const existingQty = cartUtil.getDishQuantity(id);
          this.setData({
            dish,
            quantity: existingQty > 0 ? existingQty : 1
          });
        }
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  increase() {
    this.setData({ quantity: this.data.quantity + 1 });
  },

  decrease() {
    if (this.data.quantity > 1) {
      this.setData({ quantity: this.data.quantity - 1 });
    }
  },

  addToCart() {
    const { dish, quantity } = this.data;
    cartUtil.addToCart(dish, quantity);
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1200 });
    setTimeout(() => wx.navigateBack(), 1200);
  }
});
