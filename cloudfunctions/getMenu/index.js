const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  try {
    // 获取所有可用分类
    const catRes = await db.collection('categories')
      .where({ isAvailable: true })
      .orderBy('sortOrder', 'asc')
      .get();

    // 获取所有可用菜品
    const dishRes = await db.collection('dishes')
      .where({ isAvailable: true })
      .orderBy('sortOrder', 'asc')
      .get();

    // 按分类组织菜品
    const categories = catRes.data.map(cat => ({
      ...cat,
      dishes: dishRes.data.filter(d => d.categoryId === cat._id)
    }));

    return {
      success: true,
      data: {
        categories,
        allDishes: dishRes.data,
        totalCount: dishRes.data.length
      }
    };
  } catch (err) {
    console.error('getMenu error:', err);
    return { success: false, message: err.message };
  }
};
