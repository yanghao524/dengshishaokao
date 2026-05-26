const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { items, remark, nickname, phone, address } = event;
  const { OPENID } = cloud.getWXContext();

  if (!OPENID) {
    return { success: false, message: '无法获取用户身份' };
  }
  if (!phone) {
    return { success: false, message: '手机号不能为空' };
  }
  if (!/^1\d{10}$/.test(phone)) {
    return { success: false, message: '手机号格式不正确' };
  }
  if (!items || items.length === 0) {
    return { success: false, message: '请选择菜品' };
  }

  try {
    // 先更新/创建顾客信息
    const existingCustomer = await db.collection('customers').where({ _openid: OPENID }).get();
    const now = new Date();
    let customerId;

    if (existingCustomer.data.length > 0) {
      customerId = existingCustomer.data[0]._id;
      await db.collection('customers').doc(customerId).update({
        data: { nickname: nickname || '', phone, address: address || '', updatedAt: now }
      });
    } else {
      const customerRes = await db.collection('customers').add({
        data: {
          _openid: OPENID, nickname: nickname || '', phone, address: address || '',
          createdAt: now, updatedAt: now
        }
      });
      customerId = customerRes._id;
    }

    // 验证菜品存在且可用
    const dishIds = items.map(i => i.dishId);
    const dishesRes = await db.collection('dishes').where({
      _id: db.command.in(dishIds),
      isAvailable: true
    }).get();

    if (dishesRes.data.length !== new Set(dishIds).size) {
      return { success: false, message: '部分菜品已售罄，请刷新后重试' };
    }

    const dishMap = {};
    dishesRes.data.forEach(d => { dishMap[d._id] = d; });

    // 构建订单行项 (快照价格和名称)
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
        subtotal: subtotal
      };
    });

    totalPrice = +totalPrice.toFixed(2);

    // 生成订单号
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const countRes = await db.collection('orders')
      .where({ createdAt: db.command.gte(new Date(now.toDateString())) })
      .count();
    const seq = String(countRes.total + 1).padStart(4, '0');
    const orderNo = `BBQ${dateStr}${seq}`;

    // 创建订单
    const orderRes = await db.collection('orders').add({
      data: {
        _openid: OPENID,
        orderNo,
        customerNickname: nickname || '',
        customerPhone: phone,
        customerAddress: address || '',
        status: 'pending',
        items: orderItems,
        totalPrice,
        totalQuantity,
        remark: remark || '',
        isEdited: false,
        createdAt: now,
        completedAt: null
      }
    });

    return {
      success: true,
      data: {
        orderId: orderRes._id,
        orderNo,
        totalPrice,
        totalQuantity,
        createdAt: now
      }
    };
  } catch (err) {
    console.error('placeOrder error:', err);
    return { success: false, message: err.message };
  }
};
