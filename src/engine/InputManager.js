export class InputManager {
    constructor() {
        this.keys = {};
        this.keysJustPressed = {};
        this.mouse = { dx: 0, dy: 0, left: false, right: false };
        this.locked = false;

        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        document.addEventListener('mousemove', (e) => {
            if (this.locked) {
                this.mouse.dx += e.movementX;
                this.mouse.dy += e.movementY;
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.left = true;
            if (e.button === 2) this.mouse.right = true;
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 2) this.mouse.right = false;
        });

        document.addEventListener('pointerlockchange', () => {
            this.locked = !!document.pointerLockElement;
        });

        // Prevent context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    isKey(code) {
        return !!this.keys[code];
    }

    isKeyJustPressed(code) {
        return !!this.keysJustPressed[code];
    }

    consumeMouse() {
        const dx = this.mouse.dx;
        const dy = this.mouse.dy;
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        return { dx, dy };
    }

    consumeClick(btn) {
        if (btn === 'left' && this.mouse.left) {
            this.mouse.left = false;
            return true;
        }
        if (btn === 'right' && this.mouse.right) {
            this.mouse.right = false;
            return true;
        }
        return false;
    }

    // Call at end of frame to clear just-pressed
    endFrame() {
        this.keysJustPressed = {};
    }
}
