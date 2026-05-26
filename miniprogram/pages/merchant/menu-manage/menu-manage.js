const app = getApp();

Page({
  data: {
    currentTab: 'dishes',
    categories: [],
    dishes: [],
    filterCatId: '',
    filteredDishes: [],

    showEditPopup: false,
    editTarget: '',
    editTitle: '',
    editForm: {},
    editDishId: ''
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      const res = await app.getMenu(true);
      if (res && res.data) {
        const categories = res.data.categories;
        const dishes = res.data.allDishes;
        this.setData({ categories, dishes });
        this.applyFilter();
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  switchTab(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
  },

  // ===== 菜品过滤 =====
  filterCategory(e) {
    this.setData({ filterCatId: e.currentTarget.dataset.id || '' });
    this.applyFilter();
  },

  applyFilter() {
    const { filterCatId, dishes } = this.data;
    const filtered = filterCatId
      ? dishes.filter(d => d.categoryId === filterCatId)
      : dishes;
    this.setData({ filteredDishes: filtered });
  },

  // ===== 菜品操作 =====
  addDish() {
    this.setData({
      showEditPopup: true, editTarget: 'dish', editTitle: '添加菜品',
      editForm: { name: '', categoryIndex: 0, price: '', unit: '份', description: '', image: '' },
      editDishId: ''
    });
  },

  editDish(e) {
    const dish = e.currentTarget.dataset.dish;
    const catIndex = this.data.categories.findIndex(c => c._id === dish.categoryId);
    this.setData({
      showEditPopup: true, editTarget: 'dish', editTitle: '编辑菜品',
      editForm: {
        name: dish.name, categoryIndex: catIndex >= 0 ? catIndex : 0,
        price: String(dish.price), unit: dish.unit, description: dish.description || '', image: dish.image || ''
      },
      editDishId: dish._id
    });
  },

  async toggleDish(e) {
    const dishId = e.currentTarget.dataset.id;
    try {
      await wx.cloud.callFunction({
        name: 'manageMenu',
        data: { target: 'dish', action: 'toggleAvailability', data: { _id: dishId } }
      });
      this.loadData();
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  async deleteDish(e) {
    const dishId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除菜品',
      content: '确定要删除此菜品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'manageMenu',
              data: { target: 'dish', action: 'delete', data: { _id: dishId } }
            });
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadData();
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ===== 分类操作 =====
  addCategory() {
    this.setData({
      showEditPopup: true, editTarget: 'category', editTitle: '添加分类',
      editForm: { name: '', sortOrder: '0' }, editDishId: ''
    });
  },

  editCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    this.setData({
      showEditPopup: true, editTarget: 'category', editTitle: '编辑分类',
      editForm: { name: cat.name, sortOrder: String(cat.sortOrder) }, editDishId: cat._id
    });
  },

  async deleteCategory(e) {
    const catId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除分类',
      content: '删除分类将同时删除该分类下所有菜品，确定？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'manageMenu',
              data: { target: 'category', action: 'delete', data: { _id: catId } }
            });
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadData();
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ===== 编辑弹窗 =====
  closeEditPopup() { this.setData({ showEditPopup: false }); },
  onEditInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`editForm.${field}`]: e.detail.value });
  },
  onCategoryChange(e) {
    this.setData({ 'editForm.categoryIndex': +e.detail.value });
  },

  // 图片上传
  async uploadImage() {
    const { tempFiles } = await wx.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'] });
    if (!tempFiles.length) return;

    wx.showLoading({ title: '上传中...' });
    try {
      // 上传到云存储
      const cloudPath = `dishes/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFiles[0].tempFilePath
      });
      this.setData({ 'editForm.image': uploadRes.fileID });
      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  // 保存编辑
  async saveEdit() {
    const { editTarget, editForm, editDishId, categories } = this.data;

    if (editTarget === 'dish') {
      const { name, categoryIndex, price, unit, description, image } = editForm;
      if (!name || !price) {
        wx.showToast({ title: '请填写名称和价格', icon: 'none' }); return;
      }
      const action = editDishId ? 'update' : 'add';
      const data = {
        name, price: +price, unit: unit || '份', description: description || '', image: image || '',
        categoryId: categories[categoryIndex] ? categories[categoryIndex]._id : (categories[0] ? categories[0]._id : '')
      };
      if (editDishId) data._id = editDishId;

      try {
        await wx.cloud.callFunction({ name: 'manageMenu', data: { target: 'dish', action, data } });
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.setData({ showEditPopup: false });
        this.loadData();
      } catch (err) {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    } else if (editTarget === 'category') {
      const { name, sortOrder } = editForm;
      if (!name) {
        wx.showToast({ title: '请填写分类名称', icon: 'none' }); return;
      }
      const action = editDishId ? 'update' : 'add';
      const data = { name, sortOrder: +sortOrder || 0 };
      if (editDishId) data._id = editDishId;

      try {
        await wx.cloud.callFunction({ name: 'manageMenu', data: { target: 'category', action, data } });
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.setData({ showEditPopup: false });
        this.loadData();
      } catch (err) {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }
  }
});
