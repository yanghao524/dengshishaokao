const app = getApp();

Page({
  data: {
    featuredDishes: [],
    menuLoaded: false,
    showPrivacyPopup: false,
    showMerchantHint: false,
    logoPressCount: 0
  },

  onLoad() {
    this.loadMenu();
    // 检查隐私授权状态
    if (app.globalData.showPrivacyPopup) {
      this.setData({ showPrivacyPopup: true });
    }
  },

  onShow() {
    // 更新隐私弹窗状态
    if (app.globalData.showPrivacyPopup) {
      this.setData({ showPrivacyPopup: true });
    }
  },

  async loadMenu() {
    try {
      const res = await app.getMenu();
      if (res && res.data && res.data.allDishes) {
        // 取销量最高的6道菜作为推荐
        const sorted = [...res.data.allDishes].sort((a, b) => b.salesCount - a.salesCount).slice(0, 6);
        this.setData({ featuredDishes: sorted, menuLoaded: true });
      }
    } catch (err) {
      console.error('加载菜单失败:', err);
      this.setData({ menuLoaded: true });
    }
  },

  // 长按 logo 3次显示商家入口
  onLogoLongPress() {
    const count = this.data.logoPressCount + 1;
    this.setData({ logoPressCount: count });
    if (count >= 3) {
      this.setData({ showMerchantHint: true, logoPressCount: 0 });
    }
  },

  goMenu() {
    wx.switchTab({ url: '/pages/menu/menu' });
  },

  goMyOrders() {
    wx.switchTab({ url: '/pages/my-orders/my-orders' });
  },

  onAgreePrivacy() {
    app.agreePrivacy();
    this.setData({ showPrivacyPopup: false });
  },

  onDisagreePrivacy() {
    app.disagreePrivacy();
    this.setData({ showPrivacyPopup: false });
  }
});
