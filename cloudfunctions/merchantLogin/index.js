const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const bcrypt = require('bcryptjs');

exports.main = async (event) => {
  const { username, password } = event;

  if (!username || !password) {
    return { success: false, message: '用户名和密码不能为空' };
  }

  try {
    const res = await db.collection('merchantUsers').where({ username }).get();

    if (res.data.length === 0) {
      return { success: false, message: '用户名或密码错误' };
    }

    const user = res.data[0];
    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return { success: false, message: '用户名或密码错误' };
    }

    return {
      success: true,
      data: {
        merchantId: user._id,
        username: user.username,
        displayName: user.displayName
      }
    };
  } catch (err) {
    console.error('merchantLogin error:', err);
    return { success: false, message: err.message };
  }
};
