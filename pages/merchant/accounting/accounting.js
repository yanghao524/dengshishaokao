Page({
  data: {
    dateRange: { start: '', end: '' },
    summary: { totalRevenue: 0, totalOrders: 0, avgPerOrder: 0 },
    dailyList: [],
    dishRank: [],
    loaded: false
  },

  onLoad() {
    // 默认最近7天
    const end = new Date();
    const start = new Date(end - 6 * 86400000);
    this.setData({
      dateRange: {
        start: formatDate(start),
        end: formatDate(end)
      }
    });
    this.loadData();
  },

  async loadData() {
    wx.showNavigationBarLoading();
    try {
      const { start, end } = this.data.dateRange;

      // 并行查询
      const [dailyRes, dishRes] = await Promise.all([
        wx.cloud.callFunction({ name: 'getAccounting', data: { startDate: start, endDate: end } }),
        wx.cloud.callFunction({ name: 'getAccounting', data: { startDate: start, endDate: end, type: 'dish-stats' } })
      ]);

      wx.hideNavigationBarLoading();

      if (dailyRes.result && dailyRes.result.success) {
        const d = dailyRes.result.data;
        this.setData({
          summary: d.summary,
          dailyList: d.list,
          loaded: true
        });
      }

      if (dishRes.result && dishRes.result.success) {
        const list = dishRes.result.data.list;
        const maxQty = list.length > 0 ? list[0].totalQty : 1;
        const dishRank = list.map(item => ({
          ...item,
          percent: Math.round((item.totalQty / maxQty) * 100)
        }));
        this.setData({ dishRank });
      }
    } catch (err) {
      wx.hideNavigationBarLoading();
      this.setData({ loaded: true });
    }
  },

  prevDate() {
    const { start, end } = this.data.dateRange;
    const diff = new Date(end) - new Date(start);
    const newEnd = new Date(new Date(start) - 86400000);
    const newStart = new Date(newEnd - diff);
    this.setData({ dateRange: { start: formatDate(newStart), end: formatDate(newEnd) } });
    this.loadData();
  },

  nextDate() {
    const { start, end } = this.data.dateRange;
    const today = formatDate(new Date());
    if (end >= today) return;

    const diff = new Date(end) - new Date(start);
    const newStart = new Date(new Date(end) + 86400000);
    const newEnd = new Date(newStart.getTime() + diff);
    this.setData({ dateRange: { start: formatDate(newStart), end: formatDate(newEnd) } });
    this.loadData();
  }
});

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
