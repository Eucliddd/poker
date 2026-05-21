// Placeholder for Phase 2
class DouDiZhuUI extends BaseGameUI {
  constructor() { super('doudizhu'); }
  render() { this.container.innerHTML = '<div style="color:#fff;text-align:center;padding:60px;">斗地主 - 即将推出</div>'; }
}
GameUIRegistry.register('doudizhu', DouDiZhuUI);
