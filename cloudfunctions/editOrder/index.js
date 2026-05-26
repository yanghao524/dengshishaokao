const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { orderId, items, remark } = event;

  if (!orderId) return { success: false, message: '订单ID不能为空' };
  if (!items || items.length === 0) return { success: false, message: '菜品不能为空' };

  try {
    // 验证菜品可用性
    const dishIds = items.map(i => i.dishId);
    const dishesRes = await db.collection('dishes').where({
      _id: db.command.in(dishIds),
      isAvailable: true
    }).get();

    const dishMap = {};
    dishesRes.data.forEach(d => { dishMap[d._id] = d; });

    // 重新计算
    let totalPrice = 0;
    let totalQuantity = 0;
    const orderItems = items.map(item => {
      const dish = dishMap[item.dishId];
      const qty = item.quantity || 1;
      const subtotal = +(dish.price * qty).toFixed(2);
      totalPrice += subtotal;
      totalQuantity += qty;
      return {
        dishId: item.dishId,
        name: dish.name,
        image: dish.image || '',
        price: dish.price,
        quantity: qty,
        subtotal
      };
    });

    totalPrice = +totalPrice.toFixed(2);

    await db.collection('orders').doc(orderId).update({
      data: {
        items: orderItems,
        totalPrice,
        totalQuantity,
        remark: remark || '',
        isEdited: true,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      data: { orderId, newTotal: totalPrice }
    };
  } catch (err) {
    console.error('editOrder error:', err);
    return { success: false, message: err.message };
  }
};
