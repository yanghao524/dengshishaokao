const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { orderId, status: newStatus } = event;

  if (!orderId) return { success: false, message: '订单ID不能为空' };
  if (!['accepted', 'completed', 'cancelled'].includes(newStatus)) {
    return { success: false, message: '无效的状态值' };
  }

  try {
    const orderRes = await db.collection('orders').doc(orderId).get();
    if (!orderRes.data) {
      return { success: false, message: '订单不存在' };
    }

    const order = orderRes.data;
    const now = new Date();

    // 状态流转校验
    if (newStatus === 'accepted' && order.status !== 'pending') {
      return { success: false, message: '只能接待处理状态的订单' };
    }
    if (newStatus === 'completed' && order.status !== 'accepted') {
      return { success: false, message: '只能完成已接单状态的订单' };
    }
    if (newStatus === 'cancelled' && order.status !== 'pending') {
      return { success: false, message: '只能取消待处理状态的订单' };
    }

    // 更新订单状态
    const updateData = { status: newStatus };
    if (newStatus === 'completed') {
      updateData.completedAt = now;
    }
    await db.collection('orders').doc(orderId).update({ data: updateData });

    // 完成订单时更新记账
    if (newStatus === 'completed') {
      await updateAccounting(order);
    }

    return { success: true, data: { orderId, status: newStatus } };
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    return { success: false, message: err.message };
  }
};

// 更新每日记账
async function updateAccounting(order) {
  const date = new Date(order.completedAt || new Date()).toISOString().slice(0, 10);

  // 构建菜品统计
  const dishBreakdown = {};
  order.items.forEach(item => {
    dishBreakdown[item.dishId] = (dishBreakdown[item.dishId] || 0) + item.quantity;
  });

  const existing = await db.collection('dailyAccounting').where({ date }).get();

  if (existing.data.length > 0) {
    const record = existing.data[0];
    const oldBreakdown = record.dishBreakdown || {};
    const merged = { ...oldBreakdown };
    Object.keys(dishBreakdown).forEach(dishId => {
      merged[dishId] = (merged[dishId] || 0) + dishBreakdown[dishId];
    });

    await db.collection('dailyAccounting').doc(record._id).update({
      data: {
        totalOrders: record.totalOrders + 1,
        totalRevenue: +(record.totalRevenue + order.totalPrice).toFixed(2),
        dishBreakdown: merged,
        updatedAt: new Date()
      }
    });
  } else {
    await db.collection('dailyAccounting').add({
      data: {
        date,
        totalOrders: 1,
        totalRevenue: order.totalPrice,
        dishBreakdown,
        updatedAt: new Date()
      }
    });
  }

  // 更新菜品销量
  for (const item of order.items) {
    await db.collection('dishes').doc(item.dishId).update({
      data: { salesCount: db.command.inc(item.quantity) }
    }).catch(() => {}); // 忽略单个菜品更新失败
  }
}
