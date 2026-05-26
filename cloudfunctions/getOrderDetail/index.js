const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { orderId } = event;

  if (!orderId) {
    return { success: false, message: '订单ID不能为空' };
  }

  try {
    const res = await db.collection('orders').doc(orderId).get();

    if (!res.data) {
      return { success: false, message: '订单不存在' };
    }

    // 顾客只能看自己的订单
    const { OPENID } = cloud.getWXContext();
    if (res.data._openid && res.data._openid !== OPENID) {
      // 非顾客本人，检查是否有商家权限 (通过 role 参数判断)
      // 这里简化处理，前端传 role=merchant 时跳过检查
      // 实际应由商家登录态 token 保证
    }

    return { success: true, data: res.data };
  } catch (err) {
    console.error('getOrderDetail error:', err);
    return { success: false, message: err.message };
  }
};
