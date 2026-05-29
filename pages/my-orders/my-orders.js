const app = getApp();

Page({
  data: {
    currentTab: 'all',
    orders: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loaded: false
  },

  onShow() {
    if (app.globalData.silentLoginDone && app.globalData.needProfileSetup) {
      wx.switchTab({ url: '/pages/index/index' });
      return;
    }
    this.setData({ page: 1, orders: [], hasMore: true });
    this.loadOrders();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab, page: 1, orders: [], hasMore: true });
    this.loadOrders();
  },

  async loadOrders() {
    wx.showNavigationBarLoading();
    try {
      const { currentTab, page, pageSize } = this.data;
      const params = { page, pageSize };

      if (currentTab === 'pending') {
        params.status = ['pending', 'accepted'];
      } else if (currentTab === 'completed') {
        params.status = 'completed';
      }

      const res = await wx.cloud.callFunction({
        name: 'getOrders',
        data: params
      });

      wx.hideNavigationBarLoading();

      if (res.result && res.result.success) {
        const list = res.result.data.list.map(order => ({
          ...order,
          createdAt: formatTime(order.createdAt)
        }));
        this.setData({
          orders: page === 1 ? list : this.data.orders.concat(list),
          hasMore: list.length >= pageSize,
          loaded: true
        });
      }
    } catch (err) {
      wx.hideNavigationBarLoading();
      this.setData({ loaded: true });
    }
  },

  loadMore() {
    if (!this.data.hasMore) return;
    this.setData({ page: this.data.page + 1 });
    this.loadOrders();
  },

  viewOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });
  },

  onPullDownRefresh() {
    this.setData({ page: 1, orders: [], hasMore: true });
    this.loadOrders().then(() => wx.stopPullDownRefresh());
  }
});

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
