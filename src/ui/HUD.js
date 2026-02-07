export class HUD {
    constructor() {
        this.createElements();
    }

    createElements() {
        // Container
        this.container = document.createElement('div');
        this.container.id = 'hud';
        this.container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      pointer-events: none;
      z-index: 40;
      opacity: 0;
      transition: opacity 1s ease;
    `;

        // Health bar (thin, bottom center)
        const healthWrap = document.createElement('div');
        healthWrap.style.cssText = `
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      width: 260px;
      height: 4px;
      background: rgba(30, 25, 20, 0.6);
      border-radius: 2px;
      overflow: hidden;
      backdrop-filter: blur(4px);
    `;

        this.healthBar = document.createElement('div');
        this.healthBar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #8b3a3a, #c45050);
      border-radius: 2px;
      transition: width 0.3s ease;
    `;
        healthWrap.appendChild(this.healthBar);
        this.container.appendChild(healthWrap);

        // Stamina dots (below health)
        const staminaWrap = document.createElement('div');
        staminaWrap.style.cssText = `
      position: absolute;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;
    `;

        this.staminaDots = [];
        for (let i = 0; i < 5; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(120, 160, 140, 0.8);
        transition: background 0.2s ease, transform 0.2s ease;
      `;
            staminaWrap.appendChild(dot);
            this.staminaDots.push(dot);
        }
        this.container.appendChild(staminaWrap);

        // Enemy health bar (top center, hidden by default)
        this.enemyHealthWrap = document.createElement('div');
        this.enemyHealthWrap.style.cssText = `
      position: fixed;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
      width: 320px;
      opacity: 0;
      transition: opacity 0.5s ease;
      text-align: center;
      pointer-events: none;
      z-index: 40;
    `;

        const enemyName = document.createElement('div');
        enemyName.style.cssText = `
      font-family: 'Cinzel', serif;
      font-size: 0.75rem;
      color: rgba(220, 200, 170, 0.7);
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: 6px;
    `;
        this.enemyNameEl = enemyName;
        this.enemyHealthWrap.appendChild(enemyName);

        const enemyBarBg = document.createElement('div');
        enemyBarBg.style.cssText = `
      width: 100%;
      height: 3px;
      background: rgba(40, 30, 25, 0.5);
      border-radius: 2px;
      overflow: hidden;
    `;

        this.enemyBar = document.createElement('div');
        this.enemyBar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #8a4444, #bb5555);
      transition: width 0.3s ease;
    `;
        enemyBarBg.appendChild(this.enemyBar);
        this.enemyHealthWrap.appendChild(enemyBarBg);

        document.body.appendChild(this.container);
        document.body.appendChild(this.enemyHealthWrap);
    }

    show() {
        this.container.style.opacity = '1';
    }

    hide() {
        this.container.style.opacity = '0';
    }

    update(player, enemies) {
        // Health
        const healthPct = (player.health / player.maxHealth) * 100;
        this.healthBar.style.width = `${healthPct}%`;

        // Change color when low
        if (healthPct < 30) {
            this.healthBar.style.background = 'linear-gradient(90deg, #aa2222, #dd3333)';
        } else {
            this.healthBar.style.background = 'linear-gradient(90deg, #8b3a3a, #c45050)';
        }

        // Stamina dots
        const staminaPct = player.stamina / player.maxStamina;
        const litDots = Math.ceil(staminaPct * 5);
        for (let i = 0; i < 5; i++) {
            if (i < litDots) {
                this.staminaDots[i].style.background = 'rgba(120, 160, 140, 0.8)';
                this.staminaDots[i].style.transform = 'scale(1)';
            } else {
                this.staminaDots[i].style.background = 'rgba(60, 55, 45, 0.4)';
                this.staminaDots[i].style.transform = 'scale(0.7)';
            }
        }

        // Enemy health (show nearest alive non-dummy enemy)
        const activeEnemy = enemies.find(e => e.alive && !e.isDummy);
        if (activeEnemy) {
            this.enemyHealthWrap.style.opacity = '1';
            this.enemyNameEl.textContent = activeEnemy.name;
            const pct = (activeEnemy.health / activeEnemy.maxHealth) * 100;
            this.enemyBar.style.width = `${pct}%`;
        } else {
            this.enemyHealthWrap.style.opacity = '0';
        }
    }

    destroy() {
        this.container?.remove();
        this.enemyHealthWrap?.remove();
    }
}
