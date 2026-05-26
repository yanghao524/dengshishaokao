const cartUtil = require('../../utils/cart');

Page({
  data: {
    cartSummary: cartUtil.getCartSummary()
  },

  onShow() {
    this.setData({ cartSummary: cartUtil.getCartSummary() });
  },

  changeQty(e) {
    const { id, qty } = e.currentTarget.dataset;
    cartUtil.updateQuantity(id, qty);
    this.setData({ cartSummary: cartUtil.getCartSummary() });
  },

  removeItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '移除菜品',
      content: '确定要移除此菜品吗？',
      success: (res) => {
        if (res.confirm) {
          cartUtil.removeFromCart(id);
          this.setData({ cartSummary: cartUtil.getCartSummary() });
        }
      }
    });
  },

  goOrderConfirm() {
    if (this.data.cartSummary.isEmpty) return;
    wx.navigateTo({ url: '/pages/order-confirm/order-confirm' });
  }
});
