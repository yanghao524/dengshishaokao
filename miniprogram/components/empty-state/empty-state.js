Component({
  properties: {
    image: { type: String, value: '' },
    description: { type: String, value: '暂无数据' },
    showButton: { type: Boolean, value: false },
    buttonText: { type: String, value: '' }
  },
  methods: {
    onTap() { this.triggerEvent('tapbutton'); }
  }
});
