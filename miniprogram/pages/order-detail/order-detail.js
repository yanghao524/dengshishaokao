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

  // 取消订单
  cancelOrder() {
    wx.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'updateOrderStatus',
              data: { orderId: this.data.orderId, status: 'cancelled' }
            });
            if (result.result && result.result.success) {
              wx.showToast({ title: '已取消', icon: 'success' });
              this.loadOrder();
            } else {
              wx.showToast({ title: result.result.message || '取消失败', icon: 'none' });
            }
          } catch (err) {
            wx.showToast({ title: '网络异常', icon: 'none' });
          }
        }
      }
    });
  }
});

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
