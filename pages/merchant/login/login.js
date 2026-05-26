const app = getApp();

Page({
  data: {
    username: '',
    password: '',
    loading: false
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value }); },

  async login() {
    const { username, password } = this.data;
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await wx.cloud.callFunction({
        name: 'merchantLogin',
        data: { username, password }
      });

      this.setData({ loading: false });

      if (res.result && res.result.success) {
        app.setMerchantInfo(res.result.data);
        wx.redirectTo({ url: '/pages/merchant/orders/orders' });
      } else {
        wx.showToast({ title: res.result.message || '登录失败', icon: 'none' });
      }
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  }
});
