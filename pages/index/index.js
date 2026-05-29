const app = getApp();

Page({
  data: {
    featuredDishes: [],
    menuLoaded: false,
    showPrivacyPopup: false,
    showMerchantHint: false,
    showAuthPopup: false,
    authAvatarUrl: '',
    authNickname: '',
    authTarget: ''
  },

  onLoad() {
    this.loadMenu();
    if (app.globalData.showPrivacyPopup) {
      this.setData({ showPrivacyPopup: true });
    }
    // 轮询等待静默登录完成
    this._checkProfileTimer = setInterval(() => {
      if (app.globalData.silentLoginDone) {
        clearInterval(this._checkProfileTimer);
        this._checkProfileTimer = null;
        this.tryShowAuthPopup();
      }
    }, 200);
  },

  onShow() {
    if (app.globalData.showPrivacyPopup) {
      this.setData({ showPrivacyPopup: true });
    }
    if (app.globalData.silentLoginDone) {
      this.tryShowAuthPopup();
    }
  },

  onHide() {
    if (this._checkProfileTimer) {
      clearInterval(this._checkProfileTimer);
      this._checkProfileTimer = null;
    }
  },

  tryShowAuthPopup() {
    console.log('[auth] tryShowAuthPopup:', { needProfileSetup: app.globalData.needProfileSetup, showPrivacyPopup: this.data.showPrivacyPopup });
    if (app.globalData.needProfileSetup && !this.data.showPrivacyPopup) {
      console.log('[auth] showing auth popup');
      this.setData({ showAuthPopup: true });
    }
  },

  async loadMenu() {
    try {
      const res = await app.getMenu();
      if (res && res.data && res.data.allDishes) {
        const sorted = [...res.data.allDishes].sort((a, b) => b.salesCount - a.salesCount).slice(0, 6);
        this.setData({ featuredDishes: sorted, menuLoaded: true });
      }
    } catch (err) {
      console.error('加载菜单失败:', err);
      this.setData({ menuLoaded: true });
    }
  },

  goMenu() {
    if (app.globalData.needProfileSetup) {
      this.setData({ showAuthPopup: true, authTarget: 'menu' });
      return;
    }
    wx.switchTab({ url: '/pages/menu/menu' });
  },

  goMyOrders() {
    if (app.globalData.needProfileSetup) {
      this.setData({ showAuthPopup: true, authTarget: 'my-orders' });
      return;
    }
    wx.switchTab({ url: '/pages/my-orders/my-orders' });
  },

  onAgreePrivacy() {
    app.agreePrivacy();
    this.setData({ showPrivacyPopup: false });
    if (app.globalData.needProfileSetup) {
      this.setData({ showAuthPopup: true });
    }
  },

  onDisagreePrivacy() {
    app.disagreePrivacy();
    this.setData({ showPrivacyPopup: false });
  },

  // 授权弹窗 — 选择头像
  onChooseAvatar(e) {
    this.setData({ authAvatarUrl: e.detail.avatarUrl });
  },

  // 授权弹窗 — 输入昵称
  onAuthNicknameInput(e) {
    this.setData({ authNickname: e.detail.value });
  },

  // 授权弹窗 — 确认
  async onAuthConfirm() {
    wx.showLoading({ title: '保存中...', mask: true });
    try {
      let avatarUrl = '';
      if (this.data.authAvatarUrl) {
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath: `avatars/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`,
          filePath: this.data.authAvatarUrl
        });
        avatarUrl = uploadRes.fileID;
      }

      await app.setupProfile({
        nickname: this.data.authNickname || '',
        avatarUrl
      });

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success', duration: 1500 });
      this.setData({ showAuthPopup: false });
      setTimeout(() => this.navigateToTarget(), 800);
    } catch (err) {
      wx.hideLoading();
      console.error('保存用户信息失败:', err);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },

  // 授权弹窗 — 跳过
  onAuthSkip() {
    wx.setStorageSync('bbq_profile_setup_done', true);
    app.globalData.needProfileSetup = false;
    this.setData({ showAuthPopup: false });
    this.navigateToTarget();
  },

  // 导航到目标页面
  navigateToTarget() {
    const target = this.data.authTarget;
    this.setData({ authTarget: '' });
    if (target === 'menu') {
      wx.switchTab({ url: '/pages/menu/menu' });
    } else if (target === 'my-orders') {
      wx.switchTab({ url: '/pages/my-orders/my-orders' });
    }
  }
});
