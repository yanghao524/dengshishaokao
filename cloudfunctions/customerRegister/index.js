const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, nickname, phone, address } = event;
  const { OPENID } = cloud.getWXContext();

  if (!OPENID) {
    return { success: false, message: '无法获取用户身份' };
  }

  try {
    if (action === 'silentLogin') {
      // 静默登录：查找已有顾客
      const res = await db.collection('customers').where({ _openid: OPENID }).get();
      if (res.data.length > 0) {
        return { success: true, data: res.data[0] };
      }
      // 不存在则返回 null，等用户下单时再注册
      return { success: true, data: null };
    }

    if (action === 'updateInfo') {
      // 注册或更新顾客信息
      if (!phone) {
        return { success: false, message: '手机号不能为空' };
      }
      if (!/^1\d{10}$/.test(phone)) {
        return { success: false, message: '手机号格式不正确' };
      }

      const existing = await db.collection('customers').where({ _openid: OPENID }).get();

      const now = new Date();
      if (existing.data.length > 0) {
        await db.collection('customers').doc(existing.data[0]._id).update({
          data: {
            nickname: nickname || '',
            phone,
            address: address || '',
            updatedAt: now
          }
        });
        const updated = await db.collection('customers').doc(existing.data[0]._id).get();
        return { success: true, data: updated.data };
      }

      const insertRes = await db.collection('customers').add({
        data: {
          _openid: OPENID,
          nickname: nickname || '',
          phone,
          address: address || '',
          createdAt: now,
          updatedAt: now
        }
      });

      const newCustomer = await db.collection('customers').doc(insertRes._id).get();
      return { success: true, data: newCustomer.data };
    }

    return { success: false, message: '未知操作' };
  } catch (err) {
    console.error('customerRegister error:', err);
    return { success: false, message: err.message };
  }
};
