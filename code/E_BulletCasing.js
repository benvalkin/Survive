import * as THREE from "../libraries/three.js-master/build/three.module.js";
import {Effect} from "../code/E_Effect.js";
import {M_casing} from "../code/Main.js";

export class BulletCasing extends Effect
{
    parentEffect

    point;
    body;

    _soundPlayed = false;

    constructor(effectManager, position, rotation, direction)
    {
        super(effectManager, 10, position);

        // rotation.x += THREE.MathUtils.randFloat(-0.5, 0.5);
        // rotation.y += THREE.MathUtils.randFloat(-0.5, 0.5);
        // rotation.z += THREE.MathUtils.randFloat(-0.5, 0.5);
        // rotation.w += THREE.MathUtils.randFloat(-0.5, 0.5);

        this.model = new THREE.Object3D();
        this.model.copy(M_casing);
        this.model.position.copy(position);
        this.model.setRotationFromQuaternion(rotation.normalize())

        const cubeShape = new CANNON.Box(new CANNON.Vec3(0.05, 0.05, 0.05));
        this.body = new CANNON.Body({ mass: 1 });
        this.body.addShape(cubeShape);
        this.body.position.copy(this.model.position);
        this.body.quaternion.copy(this.model.quaternion);
        const rand = THREE.MathUtils.randFloat(5, 20)
        this.body.angularVelocity = new CANNON.Vec3(rand, rand, rand)
        //this.body.collisionFilterGroup = 10;

        direction.applyAxisAngle (new THREE.Vector3(1, 0, 0), THREE.MathUtils.randFloat(-0.3, 0.3));
        direction.applyAxisAngle (new THREE.Vector3(0, 1, 0), THREE.MathUtils.randFloat(-0.3, 0.3));
        direction.applyAxisAngle (new THREE.Vector3(0, 0, 1), THREE.MathUtils.randFloat(-0.3, 0.3));

        this.body.velocity.copy(direction);
        this.body.velocity.scale(10, this.body.velocity);

        this.manager.world.physics_world.add(this.body);
        this.manager.world.scene.add(this.model);

        this.body.addEventListener("collide", (e) => this._onCollide(e), false);
    }
    _onCollide(event)
    {
        if (!this._soundPlayed)
        {
            PlayCasingDropSound(this.manager.world.player._shooter._audioListener, this.model)
            this._soundPlayed = true;
        }
    }
    Update()
    {
        if (Date.now() - this._timeStarted > this.lifetime * 1000 && this.isAlive) {
            this.manager.world.scene.remove(this.model);
            this.manager.world.physics_world.remove(this.body);
            this.isAlive = false;
            return;
        }
        if (!this.isAlive) {
            return;
        }
        this.model.position.copy(this.body.position);
        this.model.quaternion.copy(this.body.quaternion);
    }
}

export function PlayCasingDropSound(listener, object3D)
{
    let sound = "";
    let rand = THREE.MathUtils.randInt(0, 5);
    switch(rand)
    {
        case 0: sound = './resources/sounds/casing_1.wav'; break;
        case 1: sound = './resources/sounds/casing_2.wav'; break;
        case 2: sound = './resources/sounds/casing_3.wav'; break;
        case 3: sound = './resources/sounds/casing_4.wav'; break;
        case 4: sound = './resources/sounds/casing_5.wav'; break;
        case 5: sound = './resources/sounds/casing_6.wav'; break;
    }

    const hitsound = new THREE.PositionalAudio(listener);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(sound, function (buffer) {
        hitsound.setBuffer(buffer);
        hitsound.setMaxDistance(20);
        hitsound.setRefDistance(0.1)
        hitsound.setRolloffFactor(0.9)
        hitsound.setDistanceModel('linear')
        hitsound.setLoop(false);
        hitsound.setVolume(1);
        object3D.add(hitsound);
        hitsound.play();
    });
}