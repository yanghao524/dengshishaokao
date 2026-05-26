const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { startDate, endDate, type } = event;

  try {
    if (type === 'dish-stats') {
      return await getDishStats(startDate, endDate);
    }
    return await getDailySummary(startDate, endDate);
  } catch (err) {
    console.error('getAccounting error:', err);
    return { success: false, message: err.message };
  }
};

// 每日营业额汇总
async function getDailySummary(startDate, endDate) {
  const now = new Date();
  const start = startDate || now.toISOString().slice(0, 10);
  const end = endDate || now.toISOString().slice(0, 10);

  const res = await db.collection('dailyAccounting')
    .where({
      date: db.command.gte(start).and(db.command.lte(end))
    })
    .orderBy('date', 'asc')
    .get();

  const list = res.data.map(item => ({
    date: item.date,
    totalOrders: item.totalOrders,
    totalRevenue: item.totalRevenue
  }));

  const summary = {
    totalRevenue: +list.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2),
    totalOrders: list.reduce((sum, item) => sum + item.totalOrders, 0),
    avgPerOrder: list.length > 0 && list.reduce((sum, item) => sum + item.totalOrders, 0) > 0
      ? +(list.reduce((sum, item) => sum + item.totalRevenue, 0) / list.reduce((sum, item) => sum + item.totalOrders, 0)).toFixed(2)
      : 0
  };

  return { success: true, data: { list, summary } };
}

// 菜品销量统计
async function getDishStats(startDate, endDate) {
  const now = new Date();
  const start = startDate || now.toISOString().slice(0, 10);
  const end = endDate || now.toISOString().slice(0, 10);

  // 直接统计已完成订单中的菜品
  const ordersRes = await db.collection('orders')
    .where({
      status: 'completed',
      completedAt: db.command.gte(new Date(start)).and(db.command.lte(new Date(end + 'T23:59:59.999Z')))
    })
    .get();

  const dishStats = {};
  ordersRes.data.forEach(order => {
    order.items.forEach(item => {
      if (!dishStats[item.dishId]) {
        dishStats[item.dishId] = { dishId: item.dishId, name: item.name, totalQty: 0, totalAmount: 0 };
      }
      dishStats[item.dishId].totalQty += item.quantity;
      dishStats[item.dishId].totalAmount += item.subtotal;
    });
  });

  const list = Object.values(dishStats)
    .map(item => ({ ...item, totalAmount: +item.totalAmount.toFixed(2) }))
    .sort((a, b) => b.totalQty - a.totalQty);

  return { success: true, data: { list } };
}
