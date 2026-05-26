// 邓师烧烤 - 小程序入口
App({
  globalData: {
    customerInfo: null,      // 当前顾客信息
    isMerchant: false,       // 是否商家模式
    merchantInfo: null,      // 商家登录信息
    menuCache: null,         // 菜单缓存 (分类+菜品)
    menuCacheTime: 0         // 缓存时间戳
  },

  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d7gquglo1e623f79f',     // 云开发环境 ID, 需替换
        traceUser: true
      });
    }

    // 处理隐私授权
    wx.onNeedPrivacyAuthorization((resolve) => {
      this.globalData._privacyResolve = resolve;
      this.globalData.showPrivacyPopup = true;
    });

    // 静默登录
    this._silentLogin();

    // 检查是否保存了商家登录态
    const merchantInfo = wx.getStorageSync('merchantInfo');
    if (merchantInfo) {
      this.globalData.merchantInfo = merchantInfo;
      this.globalData.isMerchant = true;
    }
  },

  async _silentLogin() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'customerRegister',
        data: { action: 'silentLogin' }
      });
      if (res.result && res.result.data) {
        this.globalData.customerInfo = res.result.data;
      }
    } catch (err) {
      console.log('静默登录延迟:', err.message);
    }
  },

  // 顾客注册/更新信息
  async registerCustomer(info) {
    const res = await wx.cloud.callFunction({
      name: 'customerRegister',
      data: { action: 'updateInfo', ...info }
    });
    if (res.result && res.result.data) {
      this.globalData.customerInfo = res.result.data;
    }
    return res.result;
  },

  // 同意隐私协议
  agreePrivacy() {
    if (this.globalData._privacyResolve) {
      this.globalData._privacyResolve({
        event: 'agree',
        buttonId: 'privacy-agree-btn'
      });
      this.globalData._privacyResolve = null;
      this.globalData.showPrivacyPopup = false;
    }
  },

  // 拒绝隐私协议
  disagreePrivacy() {
    if (this.globalData._privacyResolve) {
      this.globalData._privacyResolve({
        event: 'disagree'
      });
      this.globalData._privacyResolve = null;
      this.globalData.showPrivacyPopup = false;
    }
  },

  // 商家登录
  setMerchantInfo(info) {
    this.globalData.merchantInfo = info;
    this.globalData.isMerchant = true;
    wx.setStorageSync('merchantInfo', info);
  },

  // 商家退出
  logoutMerchant() {
    this.globalData.merchantInfo = null;
    this.globalData.isMerchant = false;
    wx.removeStorageSync('merchantInfo');
  },

  // 获取菜单 (带缓存, 5分钟有效)
  async getMenu(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.globalData.menuCache && (now - this.globalData.menuCacheTime < 300000)) {
      return this.globalData.menuCache;
    }
    const res = await wx.cloud.callFunction({ name: 'getMenu' });
    if (res.result && res.result.data) {
      this.globalData.menuCache = res.result.data;
      this.globalData.menuCacheTime = now;
    }
    return res.result;
  }
});
