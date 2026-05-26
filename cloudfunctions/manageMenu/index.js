const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { action, target, data } = event;

  try {
    // ========== 分类管理 ==========
    if (target === 'category') {
      if (action === 'add') {
        const res = await db.collection('categories').add({
          data: {
            name: data.name,
            sortOrder: data.sortOrder || 0,
            isAvailable: true,
            createdAt: new Date()
          }
        });
        return { success: true, data: { _id: res._id } };
      }

      if (action === 'update') {
        await db.collection('categories').doc(data._id).update({ data: data });
        return { success: true };
      }

      if (action === 'delete') {
        // 删除分类的同时删除关联菜品
        const dishes = await db.collection('dishes').where({ categoryId: data._id }).get();
        for (const dish of dishes.data) {
          await db.collection('dishes').doc(dish._id).remove();
        }
        await db.collection('categories').doc(data._id).remove();
        return { success: true };
      }
    }

    // ========== 菜品管理 ==========
    if (target === 'dish') {
      if (action === 'add') {
        const res = await db.collection('dishes').add({
          data: {
            categoryId: data.categoryId,
            name: data.name,
            image: data.image || '',
            description: data.description || '',
            price: data.price,
            unit: data.unit || '份',
            isAvailable: true,
            salesCount: 0,
            sortOrder: data.sortOrder || 0,
            createdAt: new Date()
          }
        });
        return { success: true, data: { _id: res._id } };
      }

      if (action === 'update') {
        const { _id, ...updateData } = data;
        await db.collection('dishes').doc(_id).update({ data: updateData });
        return { success: true };
      }

      if (action === 'toggleAvailability') {
        const dish = await db.collection('dishes').doc(data._id).get();
        await db.collection('dishes').doc(data._id).update({
          data: { isAvailable: !dish.data.isAvailable }
        });
        return { success: true, data: { isAvailable: !dish.data.isAvailable } };
      }

      if (action === 'delete') {
        await db.collection('dishes').doc(data._id).remove();
        return { success: true };
      }
    }

    return { success: false, message: '无效的操作' };
  } catch (err) {
    console.error('manageMenu error:', err);
    return { success: false, message: err.message };
  }
};
