Page({
  data: {
    orderNo: '',
    orderId: ''
  },

  onLoad(options) {
    this.setData({
      orderNo: options.orderNo || '',
      orderId: options.orderId || ''
    });
  },

  viewOrder() {
    wx.redirectTo({
      url: `/pages/order-detail/order-detail?id=${this.data.orderId}`
    });
  },

  goMenu() {
    wx.switchTab({ url: '/pages/menu/menu' });
  }
});
