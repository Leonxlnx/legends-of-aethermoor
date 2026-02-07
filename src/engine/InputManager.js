// Input Manager - Tracks keyboard/mouse state
export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, dx: 0, dy: 0, left: false, right: false };
        this.locked = false;
        this._onKeyDown = (e) => { this.keys[e.code] = true; };
        this._onKeyUp = (e) => { this.keys[e.code] = false; };
        this._onMouseMove = (e) => {
            if (this.locked) {
                this.mouse.dx += e.movementX;
                this.mouse.dy += e.movementY;
            }
        };
        this._onMouseDown = (e) => {
            if (e.button === 0) this.mouse.left = true;
            if (e.button === 2) this.mouse.right = true;
        };
        this._onMouseUp = (e) => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 2) this.mouse.right = false;
        };
        this._onContext = (e) => e.preventDefault();

        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mousedown', this._onMouseDown);
        document.addEventListener('mouseup', this._onMouseUp);
        document.addEventListener('contextmenu', this._onContext);

        document.addEventListener('pointerlockchange', () => {
            this.locked = !!document.pointerLockElement;
        });
    }

    isKey(code) { return !!this.keys[code]; }
    consumeMouse() {
        const dx = this.mouse.dx;
        const dy = this.mouse.dy;
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        return { dx, dy };
    }
    consumeClick(btn) {
        if (btn === 'left' && this.mouse.left) { this.mouse.left = false; return true; }
        if (btn === 'right' && this.mouse.right) { this.mouse.right = false; return true; }
        return false;
    }
}
