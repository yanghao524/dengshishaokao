const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { role, status, page = 1, pageSize = 20 } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    let query = db.collection('orders');

    // 商家查全部，顾客查自己的
    if (role === 'merchant') {
      // 商家权限由调用方自己保证 (前端隐藏+云函数校验可加token)
    } else {
      query = query.where({ _openid: OPENID });
    }

    if (status && status !== 'all') {
      query = query.where({ status });
    }

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
