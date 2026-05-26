const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const bcrypt = require('bcryptjs');

// 种子数据云函数 — 初次部署后手动调用一次即可
exports.main = async () => {
  try {
    const results = {};

    // 1. 创建商家账号
    const merchantExist = await db.collection('merchantUsers').where({ username: 'admin' }).get();
    if (merchantExist.data.length === 0) {
      const hash = await bcrypt.hash('dengshi2026', 10);
      await db.collection('merchantUsers').add({
        data: {
          username: 'admin',
          passwordHash: hash,
          displayName: '邓师',
          createdAt: new Date()
        }
      });
      results.merchant = '已创建: admin / dengshi2026';
    } else {
      results.merchant = '已存在，跳过';
    }

    // 2. 创建菜品分类
    const catExist = await db.collection('categories').count();
    if (catExist.total === 0) {
      const categories = [
        { name: '牛肉类', sortOrder: 1 },
        { name: '猪肉类', sortOrder: 2 },
        { name: '禽肉类', sortOrder: 3 },
        { name: '海鲜类', sortOrder: 4 },
        { name: '蔬菜类', sortOrder: 5 },
        { name: '主食类', sortOrder: 6 },
        { name: '酒水饮料', sortOrder: 7 }
      ];

      for (const cat of categories) {
        const res = await db.collection('categories').add({
          data: { ...cat, isAvailable: true, createdAt: new Date() }
        });
        results[`cat_${cat.name}`] = res._id;
      }
    } else {
      results.categories = '已存在，跳过';
    }

    // 3. 创建示例菜品
    const dishExist = await db.collection('dishes').count();
    if (dishExist.total === 0) {
      const cats = await db.collection('categories').orderBy('sortOrder', 'asc').get();
      const catMap = {};
      cats.data.forEach(c => { catMap[c.name] = c._id; });

      const dishes = [
        // 牛肉类
        { categoryId: catMap['牛肉类'], name: '烤牛肉串', description: '精选牛里脊，秘制酱料腌制', price: 3, unit: '串', sortOrder: 1 },
        { categoryId: catMap['牛肉类'], name: '烤牛板筋', description: 'Q弹有嚼劲，越嚼越香', price: 3, unit: '串', sortOrder: 2 },
        { categoryId: catMap['牛肉类'], name: '烤牛肚', description: '卤制入味，香辣可口', price: 4, unit: '串', sortOrder: 3 },
        // 猪肉类
        { categoryId: catMap['猪肉类'], name: '烤五花肉', description: '肥瘦相间，滋滋冒油', price: 3, unit: '串', sortOrder: 1 },
        { categoryId: catMap['猪肉类'], name: '烤排骨', description: '蒜香腌制，外焦里嫩', price: 6, unit: '串', sortOrder: 2 },
        { categoryId: catMap['猪肉类'], name: '烤猪蹄', description: '先卤后烤，软糯入味', price: 18, unit: '只', sortOrder: 3 },
        // 禽肉类
        { categoryId: catMap['禽肉类'], name: '烤鸡翅', description: '蜜汁腌制，皮脆肉嫩', price: 5, unit: '串', sortOrder: 1 },
        { categoryId: catMap['禽肉类'], name: '烤鸡胗', description: '脆嫩爽口，麻辣鲜香', price: 3, unit: '串', sortOrder: 2 },
        // 海鲜类
        { categoryId: catMap['海鲜类'], name: '烤大虾', description: '鲜活大虾，蒜蓉烤制', price: 8, unit: '只', sortOrder: 1 },
        { categoryId: catMap['海鲜类'], name: '烤鱿鱼', description: '整条鱿鱼，酱香浓郁', price: 15, unit: '条', sortOrder: 2 },
        { categoryId: catMap['海鲜类'], name: '烤生蚝', description: '蒜蓉粉丝蒸烤，鲜美多汁', price: 8, unit: '只', sortOrder: 3 },
        // 蔬菜类
        { categoryId: catMap['蔬菜类'], name: '烤韭菜', description: '新鲜韭菜，秘制酱料', price: 2, unit: '串', sortOrder: 1 },
        { categoryId: catMap['蔬菜类'], name: '烤土豆片', description: '薄切土豆，孜然飘香', price: 2, unit: '串', sortOrder: 2 },
        { categoryId: catMap['蔬菜类'], name: '烤茄子', description: '整条茄子，蒜蓉烤制', price: 10, unit: '条', sortOrder: 3 },
        { categoryId: catMap['蔬菜类'], name: '烤金针菇', description: '锡纸烤制，鲜嫩多汁', price: 8, unit: '份', sortOrder: 4 },
        // 主食类
        { categoryId: catMap['主食类'], name: '烤馒头', description: '外酥里软，蘸炼乳更佳', price: 2, unit: '串', sortOrder: 1 },
        { categoryId: catMap['主食类'], name: '蛋炒饭', description: '粒粒分明，锅气十足', price: 12, unit: '份', sortOrder: 2 },
        // 酒水饮料
        { categoryId: catMap['酒水饮料'], name: '冰镇啤酒', description: '青岛啤酒，冰爽解腻', price: 8, unit: '瓶', sortOrder: 1 },
        { categoryId: catMap['酒水饮料'], name: '王老吉', description: '怕上火喝王老吉', price: 6, unit: '罐', sortOrder: 2 },
        { categoryId: catMap['酒水饮料'], name: '矿泉水', description: '农夫山泉', price: 2, unit: '瓶', sortOrder: 3 }
      ];

      for (const dish of dishes) {
        await db.collection('dishes').add({
          data: { ...dish, image: '', isAvailable: true, salesCount: 0, createdAt: new Date() }
        });
      }
      results.dishes = `已创建 ${dishes.length} 道菜品`;
    } else {
      results.dishes = '已存在，跳过';
    }

    return { success: true, message: '种子数据初始化完成', data: results };
  } catch (err) {
    console.error('seedData error:', err);
    return { success: false, message: err.message };
  }
};
