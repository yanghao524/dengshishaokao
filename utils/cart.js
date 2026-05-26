// 购物车管理 (本地存储)

const CART_KEY = 'bbq_cart';

function getCart() {
  try {
    return wx.getStorageSync(CART_KEY) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  wx.setStorageSync(CART_KEY, cart);
}

// 计算购物车汇总
function getCartSummary() {
  const cart = getCart();
  let totalQuantity = 0;
  let totalPrice = 0;
  cart.forEach(item => {
    totalQuantity += item.quantity;
    totalPrice += item.price * item.quantity;
  });
  return {
    items: cart,
    totalQuantity,
    totalPrice: +totalPrice.toFixed(2),
    isEmpty: cart.length === 0
  };
}

// 获取某道菜品在购物车中的数量
function getDishQuantity(dishId) {
  const cart = getCart();
  const item = cart.find(i => i.dishId === dishId);
  return item ? item.quantity : 0;
}

// 添加菜品到购物车
function addToCart(dish, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.dishId === dish._id || item.dishId === dish.dishId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      dishId: dish._id || dish.dishId,
      name: dish.name,
      image: dish.image || '',
      price: dish.price,
      quantity
    });
  }
  saveCart(cart);
  return getCartSummary();
}

// 更新菜品数量
function updateQuantity(dishId, quantity) {
  if (quantity <= 0) {
    return removeFromCart(dishId);
  }
  const cart = getCart();
  const item = cart.find(i => i.dishId === dishId);
  if (item) item.quantity = quantity;
  saveCart(cart);
  return getCartSummary();
}

// 从购物车移除
function removeFromCart(dishId) {
  const cart = getCart().filter(item => item.dishId !== dishId);
  saveCart(cart);
  return getCartSummary();
}

// 清空购物车
function clearCart() {
  wx.removeStorageSync(CART_KEY);
}

// 检查购物车中菜品是否都可用
function validateCart(availableDishMap) {
  const cart = getCart();
  const unavailable = [];
  cart.forEach(item => {
    const dish = availableDishMap[item.dishId];
    if (!dish || !dish.isAvailable) {
      unavailable.push(item.name);
    }
  });
  return unavailable;
}

module.exports = {
  getCart,
  saveCart,
  getCartSummary,
  getDishQuantity,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  validateCart
};
