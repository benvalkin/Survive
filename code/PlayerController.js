const reload_pressed = new Event('reload_pressed');
const firingmode_pressed = new Event('firingmode_pressed');
const perspective_changed = new Event('perspective_changed');

export class PlayerController {

    keys;
    current_yaw;
    current_pitch;

    yaw_p = 0;
    pitch_p = 0;
    yaw_pp = 0;
    pitch_pp = 0;

    x_sensitivity = 0.8;
    y_sensitivity = 0.6;

    constructor() {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            space: false,
            shift: false,
        };

        this.current_yaw = 1;
        this.current_pitch = 1;
        this.x_previous = 0;
        this.y_previous = 0;

        document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
        document.addEventListener('mousemove', (e) => this._OnMouseMove(e), false);
        document.addEventListener('pointerlockchange', (e) => this._OnPointerLockStateChanged(e), false);
        document.addEventListener('pointerlockchange', (e) => this._OnPointerLockError(e), false);

        var havePointerLock = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;

        if (havePointerLock)
        {
            const element = document.getElementById('viewport');
            element.requestPointerLock = element.requestPointerLock
            // || element.mozRequestPointerLock
            // || element.webkitRequestPointerLock;
            element.requestPointerLock();
        }
    }

    _onKeyDown(event) {
        switch (event.keyCode) {
            case 87: // w
                this.keys.forward = true;
                break;
            case 65: // a
                this.keys.left = true;
                break;
            case 83: // s
                this.keys.backward = true;
                break;
            case 68: // d
                this.keys.right = true;
                break;
            case 32: // SPACE
                this.keys.space = true;
                break;
            case 16: // SHIFT
                this.keys.shift = true;
                break;
            case 82: // r
                document.dispatchEvent(reload_pressed);
                break;
            case 66: // b
                document.dispatchEvent(firingmode_pressed);
                break;
            case 72: // b
            document.dispatchEvent(perspective_changed);
            break;
        }
    }

    _onKeyUp(event) {
        switch(event.keyCode) {
            case 87: // w
                this.keys.forward = false;
                break;
            case 65: // a
                this.keys.left = false;
                break;
            case 83: // s
                this.keys.backward = false;
                break;
            case 68: // d
                this.keys.right = false;
                break;
            case 32: // SPACE
                this.keys.space = false;
                break;
            case 16: // SHIFT
                this.keys.shift = false;
                break;
        }
    }

    _OnMouseMove(event)
    {
        if (document.pointerLockElement === document.getElementById('viewport'))
        {
            this.current_yaw = event.movementX * -1 * this.x_sensitivity;
            this.current_pitch = event.movementY * -1 * this.y_sensitivity;

            this.current_yaw = (this.yaw_pp + this.yaw_p + this.current_yaw)/ 3;
            this.current_pitch = (this.pitch_pp + this.pitch_p + this.current_pitch)/ 3;

            if (Math.abs(this.current_yaw) < 0.009) {this.current_yaw = 0}
            if (Math.abs(this.current_pitch) < 0.009) {this.current_pitch = 0}

            this.yaw_pp = this.yaw_p;
            this.pitch_pp = this.pitch_p;

            this.yaw_p = this.current_yaw;
            this.pitch_p = this.current_pitch;

            // if (this.current_yaw > Math.PI/12) {this.current_yaw = Math.PI/12}
            // if (this.current_yaw < -Math.PI/12) {this.current_yaw = -Math.PI/12}
            // if (this.current_pitch > Math.PI/12) {this.current_pitch = Math.PI/12}
            // if (this.current_pitch < -Math.PI/12) {this.current_pitch = -Math.PI/12}
        }

    }
    _OnPointerLockStateChanged(event)
    {
        console.log("pointer lock state was changed")
    }
    _OnPointerLockError(event)
    {
        console.log("POINTER LOCK ERROR")
    }
};