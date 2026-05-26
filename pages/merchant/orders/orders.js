const app = getApp();
const db = wx.cloud.database();
let orderWatcher = null;

Page({
  data: {
    currentTab: 'pending',
    orders: [],
    pendingCount: 0,
    loaded: false,
    refreshing: false,
    wsConnected: false,
    soundOn: true
  },

  onShow() {
    if (!app.globalData.isMerchant) {
      wx.redirectTo({ url: '/pages/merchant/login/login' });
      return;
    }
    this.loadOrders();
    this.startWatcher();
  },

  onHide() {
    this.stopWatcher();
  },

  onUnload() {
    this.stopWatcher();
  },

  // ========== 数据加载 ==========
  async loadOrders() {
    try {
      const status = this.data.currentTab;
      const res = await wx.cloud.callFunction({
        name: 'getOrders',
        data: { role: 'merchant', status: status !== 'all' ? status : undefined }
      });

      if (res.result && res.result.success) {
        const orders = res.result.data.list.map(order => ({
          ...order,
          createdAt: formatTime(order.createdAt)
        }));
        this.setData({ orders, loaded: true });

        // 统计待接单数量
        if (status === 'pending') {
          this.setData({ pendingCount: orders.length });
        } else {
          // 另外查一下pending数量
          this.updatePendingCount();
        }
      }
    } catch (err) {
      this.setData({ loaded: true });
    }
  },

  async updatePendingCount() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrders',
        data: { role: 'merchant', status: 'pending' }
      });
      if (res.result && res.result.success) {
        this.setData({ pendingCount: res.result.data.total });
      }
    } catch (err) { /* ignore */ }
  },

  // ========== 实时监听 ==========
  startWatcher() {
    this.stopWatcher();
    orderWatcher = db.collection('orders')
      .where({ status: 'pending' })
      .watch({
        onChange: (snapshot) => {
          this.setData({ wsConnected: true });
          // 有新订单时刷新列表
          if (snapshot.docChanges && snapshot.docChanges.length > 0) {
            const hasNew = snapshot.docChanges.some(doc => doc.dataType === 'add');
            if (hasNew) {
              this.loadOrders();
              this.updatePendingCount();
              // 播放提示音
              if (this.data.soundOn) {
                wx.vibrateShort({ type: 'heavy' });
              }
            }
          }
        },
        onError: (err) => {
          console.error('Watcher error:', err);
          this.setData({ wsConnected: false });
          // 5秒后重试
          setTimeout(() => this.startWatcher(), 5000);
        }
      });
  },

  stopWatcher() {
    if (orderWatcher) {
      orderWatcher.close();
      orderWatcher = null;
      this.setData({ wsConnected: false });
    }
  },

  // ========== 操作 ==========
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.loadOrders();
    // 切换tab时重启watcher (只监听pending)
    this.stopWatcher();
    if (tab === 'pending') {
      this.startWatcher();
    }
  },

  viewOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/merchant/order-detail/order-detail?id=${id}` });
  },

  async quickAccept(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showLoading({ title: '接单中...' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateOrderStatus',
        data: { orderId, status: 'accepted' }
      });
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '已接单', icon: 'success' });
        this.loadOrders();
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  toggleSound() {
    this.setData({ soundOn: !this.data.soundOn });
  },

  goAccounting() {
    wx.navigateTo({ url: '/pages/merchant/accounting/accounting' });
  },

  goMenuManage() {
    wx.navigateTo({ url: '/pages/merchant/menu-manage/menu-manage' });
  },

  onRefresh() {
    this.setData({ refreshing: true });
    this.loadOrders().then(() => {
      this.setData({ refreshing: false });
    });
  }
});

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
