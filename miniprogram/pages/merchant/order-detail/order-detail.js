Page({
  data: {
    orderId: '',
    order: {},
    loaded: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ orderId: options.id });
      this.loadOrder();
    }
  },

  onShow() {
    if (this.data.orderId) this.loadOrder();
  },

  async loadOrder() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrderDetail',
        data: { orderId: this.data.orderId }
      });
      if (res.result && res.result.success) {
        const order = res.result.data;
        order.createdAt = formatTime(order.createdAt);
        if (order.completedAt) order.completedAt = formatTime(order.completedAt);
        this.setData({ order, loaded: true });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 拨打电话
  callCustomer() {
    const phone = this.data.order.customerPhone;
    if (!phone) {
      wx.showToast({ title: '无手机号', icon: 'none' });
      return;
    }
    wx.makePhoneCall({ phoneNumber: phone });
  },

  // 复制手机号
  copyPhone() {
    const phone = this.data.order.customerPhone;
    if (!phone) {
      wx.showToast({ title: '无手机号', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: phone,
      success: () => wx.showToast({ title: '已复制手机号', icon: 'success' })
    });
  },

  // 接单
  async acceptOrder() {
    wx.showModal({
      title: '确认接单',
      content: '接单后将开始准备菜品',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'updateOrderStatus',
              data: { orderId: this.data.orderId, status: 'accepted' }
            });
            if (result.result && result.result.success) {
              wx.showToast({ title: '已接单', icon: 'success' });
              this.loadOrder();
            } else {
              wx.showToast({ title: result.result.message, icon: 'none' });
            }
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 完成出餐
  async completeOrder() {
    wx.showModal({
      title: '确认完成',
      content: '确认出餐完成？数据将计入当日记账',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'updateOrderStatus',
              data: { orderId: this.data.orderId, status: 'completed' }
            });
            if (result.result && result.result.success) {
              wx.showToast({ title: '出餐完成', icon: 'success' });
              this.loadOrder();
            } else {
              wx.showToast({ title: result.result.message, icon: 'none' });
            }
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 编辑订单
  editOrder() {
    wx.navigateTo({
      url: `/pages/merchant/edit-order/edit-order?id=${this.data.orderId}`
    });
  }
});

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
