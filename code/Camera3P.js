import * as THREE from "../libraries/three.js-master/build/three.module.js";

export class Camera3P
{
    player

    _camera;
    controls;
    look_position;

    FirstPersonEnabled = false;

    constructor(player, lookPosition)
    {
        this.player = player;

        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 0.4;
        const far = 3000.0;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(3, 2,-3);
        this._camera.lookAt(new THREE.Vector3(lookPosition.x, lookPosition.y + 2, lookPosition.z));

        this._currentPosition = new THREE.Vector3();
        this._currentLookat = new THREE.Vector3();

        if (this.FirstPersonEnabled)
        {
            this.player.controller.x_sensitivity = 0.2;
            this.player.controller.y_sensitivity = 0.1;
        }

        document.addEventListener('perspective_changed', (e) => this._onPerspectiveChanged(e), false);

        //const controls = new OrbitControls( this._camera, renderer.domElement );
        //controls.update();
    }
    _onPerspectiveChanged(event)
    {
        this.FirstPersonEnabled = !this.FirstPersonEnabled;
    }
    Update(deltaTime, position, rotation, lookPos)
    {
        let global_pos = new THREE.Vector3();
        let global_rot = new THREE.Quaternion();
        this.player.neck.getWorldPosition(global_pos);
        this.player.neck.getWorldQuaternion(global_rot);

        let idealOffset = new THREE.Vector3(-2, 0,-3);
        if (this.FirstPersonEnabled)
        {
            idealOffset = new THREE.Vector3(0, 0.35, -0.1);

        }

        idealOffset.applyQuaternion(global_rot);
        idealOffset.add(global_pos);

        lookPos = this.player.neck.worldToLocal(global_pos);
        lookPos.z += 5000;
        global_pos = this.player.neck.localToWorld(lookPos)

        if (this.FirstPersonEnabled)
        {
            this._currentPosition.copy(idealOffset)
            this._currentLookat.lerp(global_pos, 0.2)
        }
        else
        {
            this._currentPosition.lerp(idealOffset, 0.4);
            this._currentLookat.lerp(global_pos, 0.4);
        }


        this._camera.position.copy(this._currentPosition);
        this._camera.lookAt(this._currentLookat);
    }
}