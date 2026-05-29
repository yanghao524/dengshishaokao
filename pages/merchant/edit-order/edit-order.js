const app = getApp();

Page({
  data: {
    orderId: '',
    items: [],
    remark: '',
    originalTotal: 0,
    totalPrice: 0,
    loaded: false,
    menuDishes: [],
    showPicker: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ orderId: options.id });
      this.loadOrder();
      this.loadMenu();
    }
  },

  async loadOrder() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrderDetail',
        data: { orderId: this.data.orderId }
      });
      if (res.result && res.result.success) {
        const order = res.result.data;
        this.setData({
          items: order.items.map(item => ({ ...item })),
          remark: order.remark || '',
          originalTotal: order.totalPrice,
          totalPrice: order.totalPrice,
          loaded: true
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async loadMenu() {
    try {
      const res = await app.getMenu();
      if (res && res.data && res.data.allDishes) {
        this.setData({ menuDishes: res.data.allDishes.filter(d => d.isAvailable) });
      }
    } catch (err) { /* ignore */ }
  },

  // 计算总价
  recalc() {
    const total = +this.data.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
    this.setData({ totalPrice: total });
  },

  increaseQty(e) {
    const idx = e.currentTarget.dataset.index;
    this.data.items[idx].quantity++;
    this.setData({ items: this.data.items });
    this.recalc();
  },

  decreaseQty(e) {
    const idx = e.currentTarget.dataset.index;
    if (this.data.items[idx].quantity > 0) {
      this.data.items[idx].quantity--;
      if (this.data.items[idx].quantity === 0) {
        this.data.items.splice(idx, 1);
      }
      this.setData({ items: this.data.items });
      this.recalc();
    }
  },

  removeItem(e) {
    const idx = e.currentTarget.dataset.index;
    this.data.items.splice(idx, 1);
    this.setData({ items: this.data.items });
    this.recalc();
  },

  // 菜品选择器
  showDishPicker() { this.setData({ showPicker: true }); },
  closePicker() { this.setData({ showPicker: false }); },

  selectDish(e) {
    const dish = e.currentTarget.dataset.dish;
    const existing = this.data.items.find(item => item.dishId === dish._id);
    if (existing) {
      existing.quantity++;
    } else {
      this.data.items.push({
        dishId: dish._id,
        name: dish.name,
        price: dish.price,
        image: dish.image || '',
        quantity: 1,
        subtotal: dish.price
      });
    }
    this.setData({ items: this.data.items, showPicker: false });
    this.recalc();
  },

  // 保存修改
  async saveChanges() {
    if (this.data.items.length === 0) {
      wx.showToast({ title: '订单不能为空', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'editOrder',
        data: {
          orderId: this.data.orderId,
          items: this.data.items.map(item => ({
            dishId: item.dishId,
            quantity: item.quantity
          }))
        }
      });
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '已保存', icon: 'success' });
        wx.navigateBack();
      } else {
        wx.showToast({ title: res.result.message || '保存失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  }
});
