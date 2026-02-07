export class Tutorial {
    constructor() {
        this.steps = [
            {
                id: 'look',
                text: 'Move your mouse to look around',
                condition: (input, player, data) => {
                    data.totalMouse = (data.totalMouse || 0) + Math.abs(input.mouse.dx) + Math.abs(input.mouse.dy);
                    return data.totalMouse > 300;
                },
                onStart: (player) => { player.canMove = false; player.canAttack = false; },
            },
            {
                id: 'move',
                text: 'Use  W A S D  to move',
                condition: (input, player, data) => {
                    data.moveTime = (data.moveTime || 0);
                    if (input.isKey('KeyW') || input.isKey('KeyA') || input.isKey('KeyS') || input.isKey('KeyD')) {
                        data.moveTime += 0.016;
                    }
                    return data.moveTime > 1.5;
                },
                onStart: (player) => { player.canMove = true; },
            },
            {
                id: 'attack',
                text: 'Left click to attack the dummy',
                condition: (input, player, data) => {
                    data.attacks = (data.attacks || 0);
                    if (player.attacking && player.attackTimer < 0.05) data.attacks++;
                    return data.attacks >= 3;
                },
                onStart: (player) => { player.canAttack = true; },
                spawnDummy: true,
            },
            {
                id: 'combo',
                text: 'Chain 3 attacks for a combo',
                condition: (input, player) => {
                    return player.comboStep === 2 && player.attacking;
                },
            },
            {
                id: 'dodge',
                text: 'Right click to dodge roll',
                condition: (input, player, data) => {
                    data.dodges = (data.dodges || 0);
                    if (player.dodging && player.dodgeTimer < 0.05) data.dodges++;
                    return data.dodges >= 2;
                },
                onStart: (player) => { player.canDodge = true; },
            },
            {
                id: 'ready',
                text: 'You are ready, warrior.',
                condition: (input, player, data) => {
                    data.readyTime = (data.readyTime || 0) + 0.016;
                    return data.readyTime > 3;
                },
                final: true,
            },
        ];

        this.currentStep = 0;
        this.stepData = {};
        this.active = false;
        this.completed = false;
        this.opacity = 0;
        this.displayText = '';
        this.showTime = 0;
        this.dummySpawned = false;

        // Create DOM element
        this.el = document.createElement('div');
        this.el.id = 'tutorial-prompt';
        this.el.style.cssText = `
      position: fixed;
      bottom: 25%;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(220, 210, 190, 0.9);
      font-family: 'Cinzel', serif;
      font-size: 1.1rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      text-align: center;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.8s ease;
      text-shadow: 0 0 20px rgba(180, 160, 120, 0.3);
      z-index: 50;
    `;
        document.body.appendChild(this.el);

        // Subtitle for key hint
        this.keySub = document.createElement('div');
        this.keySub.style.cssText = `
      margin-top: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      letter-spacing: 0.3em;
      color: rgba(180, 170, 150, 0.5);
      text-transform: uppercase;
    `;
        this.el.appendChild(this.keySub);
    }

    start() {
        this.active = true;
        this.currentStep = 0;
        this.stepData = {};
        this.loadStep(0);
    }

    loadStep(index) {
        if (index >= this.steps.length) {
            this.completed = true;
            this.active = false;
            this.el.style.opacity = '0';
            return;
        }

        const step = this.steps[index];
        this.el.textContent = step.text;
        this.el.appendChild(this.keySub);
        this.el.style.opacity = '1';
        this.stepData = {};
        this.showTime = 0;
    }

    update(dt, input, player) {
        if (!this.active || this.completed) return null;

        this.showTime += dt;

        const step = this.steps[this.currentStep];

        if (step.onStart && this.showTime < 0.05) {
            step.onStart(player);
        }

        // Check completion
        if (step.condition(input, player, this.stepData)) {
            // Fade out current
            this.el.style.opacity = '0';

            // Move to next step after delay
            setTimeout(() => {
                this.currentStep++;
                this.loadStep(this.currentStep);
            }, 800);

            // Disable condition checking until next step loads
            this.active = false;
            setTimeout(() => {
                if (!this.completed) this.active = true;
            }, 1000);
        }

        // Return if we need to spawn dummy
        if (step.spawnDummy && !this.dummySpawned) {
            this.dummySpawned = true;
            return 'spawnDummy';
        }

        return null;
    }

    destroy() {
        if (this.el && this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
    }
}
