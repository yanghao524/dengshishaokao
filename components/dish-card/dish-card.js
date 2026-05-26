Component({
  properties: {
    dish: { type: Object, value: {} },
    quantity: { type: Number, value: 0 },
    showStepper: { type: Boolean, value: true },
    cardStyle: { type: String, value: 'default' }
  },
  methods: {
    onTap() { this.triggerEvent('tapdish', { dish: this.data.dish }); },
    onIncrease() { this.triggerEvent('quantitychange', { dish: this.data.dish, quantity: (this.data.quantity || 0) + 1 }); },
    onDecrease() {
      if (this.data.quantity > 0) {
        this.triggerEvent('quantitychange', { dish: this.data.dish, quantity: this.data.quantity - 1 });
      }
    }
  }
});
