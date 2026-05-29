const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { role, status, page = 1, pageSize = 20 } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    const _ = db.command;
    const where = {};

    // 顾客只能查自己的
    if (role !== 'merchant') {
      where._openid = OPENID;
    }

    if (status && status !== 'all') {
      where.status = Array.isArray(status) ? _.in(status) : status;
    }

    const query = db.collection('orders').where(where);

    const total = await query.count();
    const res = await query
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return {
      success: true,
      data: {
        list: res.data,
        total: total.total,
        page,
        pageSize
      }
    };
  } catch (err) {
    console.error('getOrders error:', err);
    return { success: false, message: err.message };
  }
};
