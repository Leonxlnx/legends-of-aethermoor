export class HUD {
    constructor() {
        this.healthBar = document.getElementById('health-bar');
        this.healthText = document.getElementById('health-text');
        this.staminaBar = document.getElementById('stamina-bar');
        this.minimap = document.getElementById('minimap');
        this.minimapCtx = this.minimap.getContext('2d');
        this.enemyHud = document.getElementById('enemy-hud');
        this.enemyName = document.getElementById('enemy-name');
        this.enemyHealthBar = document.getElementById('enemy-health-bar');
        this.damageFlash = document.getElementById('damage-flash');
        this.comboCounter = document.getElementById('combo-counter');
        this.comboNumber = document.getElementById('combo-number');
        this.objectiveDisplay = document.getElementById('objective-display');
        this.objectiveText = document.getElementById('objective-text');
        this.dialogueBox = document.getElementById('dialogue-box');
        this.dialogueSpeaker = document.getElementById('dialogue-speaker');
        this.dialogueTextEl = document.getElementById('dialogue-text');
        this.crosshair = document.getElementById('crosshair');

        this.lastDamageTime = 0;
        this.currentObjective = '';
        this.dialogueQueue = [];
        this.dialogueActive = false;
    }

    update(player, enemies, lockedEnemy) {
        // Health
        const hp = Math.max(0, player.health / player.maxHealth * 100);
        this.healthBar.style.width = hp + '%';
        this.healthText.textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;

        // Low health warning
        if (hp < 25) {
            this.healthBar.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
            this.healthBar.style.animation = 'pulse 0.5s ease-in-out infinite';
        } else {
            this.healthBar.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c, #ff6b6b)';
            this.healthBar.style.animation = 'none';
        }

        // Stamina
        this.staminaBar.style.width = (player.stamina / player.maxStamina * 100) + '%';

        // Damage flash
        if (player.lastDamageTime > this.lastDamageTime) {
            this.lastDamageTime = player.lastDamageTime;
            this.damageFlash.style.opacity = '1';
            setTimeout(() => { this.damageFlash.style.opacity = '0'; }, 200);
        }

        // Enemy HUD (locked enemy)
        if (lockedEnemy && lockedEnemy.alive) {
            this.enemyHud.classList.remove('hidden');
            this.enemyName.textContent = lockedEnemy.name;
            this.enemyHealthBar.style.width = (lockedEnemy.health / lockedEnemy.maxHealth * 100) + '%';
            this.crosshair.classList.remove('hidden');
        } else {
            this.enemyHud.classList.add('hidden');
            this.crosshair.classList.add('hidden');
        }

        // Combo counter
        if (player.comboCount > 0 && player.attackState !== 'idle') {
            this.comboCounter.classList.remove('hidden');
            this.comboNumber.textContent = player.comboCount;
        } else {
            this.comboCounter.classList.add('hidden');
        }

        // Minimap
        this.drawMinimap(player, enemies);
    }

    drawMinimap(player, enemies) {
        const ctx = this.minimapCtx;
        const w = 180, h = 180;
        const scale = 2.5;

        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = 'rgba(10, 15, 10, 0.8)';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
        ctx.fill();

        // Grid
        ctx.strokeStyle = 'rgba(100, 100, 80, 0.15)';
        ctx.lineWidth = 0.5;
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(w / 2 + i * 20, 0);
            ctx.lineTo(w / 2 + i * 20, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, h / 2 + i * 20);
            ctx.lineTo(w, h / 2 + i * 20);
            ctx.stroke();
        }

        // Enemies
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const dx = (enemy.position.x - player.position.x) * scale;
            const dz = (enemy.position.z - player.position.z) * scale;
            const ex = w / 2 + dx;
            const ey = h / 2 + dz;
            if (ex < 5 || ex > w - 5 || ey < 5 || ey > h - 5) continue;

            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(ex, ey, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Player (arrow)
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-player.rotation);
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(-4, 4);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Border circle
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, w / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();
    }

    showObjective(text) {
        this.objectiveDisplay.classList.remove('hidden');
        this.objectiveText.textContent = text;
    }

    hideObjective() {
        this.objectiveDisplay.classList.add('hidden');
    }

    showDialogue(speaker, text) {
        return new Promise(resolve => {
            this.dialogueBox.classList.remove('hidden');
            this.dialogueSpeaker.textContent = speaker;
            this.dialogueTextEl.textContent = '';
            this.dialogueActive = true;

            // Typewriter effect
            let i = 0;
            const interval = setInterval(() => {
                if (i < text.length) {
                    this.dialogueTextEl.textContent += text[i];
                    i++;
                } else {
                    clearInterval(interval);
                    const handler = (e) => {
                        if (e.code === 'KeyE') {
                            document.removeEventListener('keydown', handler);
                            this.dialogueBox.classList.add('hidden');
                            this.dialogueActive = false;
                            resolve();
                        }
                    };
                    document.addEventListener('keydown', handler);
                }
            }, 30);
        });
    }
}
