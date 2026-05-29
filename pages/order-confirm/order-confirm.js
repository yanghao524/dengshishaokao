const cartUtil = require('../../utils/cart');
const app = getApp();

Page({
  data: {
    cartSummary: null,
    form: { nickname: '', phone: '', address: '' },
    remark: '',
    submitting: false
  },

  onLoad() {
    this.refreshCart();
    // 预填已有信息
    const info = app.globalData.customerInfo;
    if (info) {
      this.setData({
        form: {
          nickname: info.nickname || '',
          phone: info.phone || '',
          address: info.address || ''
        }
      });
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onShow() {
    this.refreshCart();
  },

  refreshCart() {
    this.setData({ cartSummary: cartUtil.getCartSummary() });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  async submitOrder() {
    const { form, remark, cartSummary } = this.data;

    // 校验手机号
    if (!form.phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!/^1\d{10}$/.test(form.phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    if (cartSummary.isEmpty) {
      wx.showToast({ title: '购物车为空', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      const res = await wx.cloud.callFunction({
        name: 'placeOrder',
        data: {
          items: cartSummary.items.map(item => ({
            dishId: item.dishId,
            quantity: item.quantity
          })),
          remark,
          nickname: form.nickname,
          phone: form.phone,
          address: form.address
        }
      });

      this.setData({ submitting: false });

      if (res.result.success) {
        // 清空购物车
        cartUtil.clearCart();
        // 跳转成功页
        wx.redirectTo({
          url: `/pages/order-success/order-success?orderNo=${res.result.data.orderNo}&orderId=${res.result.data.orderId}`
        });
      } else {
        wx.showToast({ title: res.result.message || '下单失败', icon: 'none' });
      }
    } catch (err) {
      this.setData({ submitting: false });
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    }
  }
});
