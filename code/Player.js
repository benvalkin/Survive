import * as THREE from "../libraries/three.js-master/build/three.module.js";
import {ASSET_M4, A_character, M_character, M_M4} from "../code/Main.js";

import '../libraries/cannon/cannon.js';
import {PlayerController} from "../code/PlayerController.js";
import {Camera3P} from "../code/Camera3P.js";
import {PlayerShooter} from "../code/PlayerShooter.js";
import {Gun} from "../code/Gun.js";

export class Player extends THREE.Object3D
{

    world;

    model;

    file_animations;
    animation_mixer;
    controller;
    _clock;
    camera3P;

    _shooter;

    _body;

    _spine;
    _righthand;

    animation_mixer;
    _anim_running;
    _anim_idle;
    _anim_reload;

    _gun;

    health = 100;

    constructor(world)
    {
        super();

        this.world = world;
        this.controller = new PlayerController();

        this.model = M_character;

        this.model.traverse(o => {
            if (o.isMesh)
            {
                this.geometry = o.geometry;
            }
            if (o.isBone && o.name === 'Spine') {
                this._spine = o;
            }
            if (o.isBone && o.name === 'left_hand')
            {
                this._righthand = o;
            }
            if (o.isBone && o.name === 'neck')
            {
                this.neck = o;
            }
        });

        this.geometry.computeBoundingBox();

        const cubeShape = new CANNON.Box(new CANNON.Vec3(.5, 1, .5))
        this._body = new CANNON.Body({ mass: 1 });
        this._body.addShape(cubeShape, new CANNON.Vec3(0, 1, 0))
        //this.model.translateY(1);
        this._body.position.copy(this.model.position)
        this.world.physics_world.add(this._body)

        this.file_animations = [];
        console.log(A_character);
        for (let i = 0; i < A_character.length; i++)
        {
            this.file_animations.push(A_character[i]);
        }

        this.animation_mixer = new THREE.AnimationMixer(this.model);

        this._anim_idle = THREE.AnimationClip.findByName(this.file_animations, 'Idle');
        this.animation_mixer.clipAction(this._anim_idle).play();

        this._anim_running = THREE.AnimationClip.findByName(this.file_animations, 'Run');
        this._anim_holdgun = THREE.AnimationClip.findByName(this.file_animations, 'HoldGun');
        this._anim_reload = THREE.AnimationClip.findByName(this.file_animations, 'Reload');
        this._anim_die = THREE.AnimationClip.findByName(this.file_animations, 'ZombieDie');

        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000.0;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(1, 2,-3);
        this._camera.lookAt(new THREE.Vector3(this.model.position.x, this.model.position.y + 2, this.model.position.z));

        this.camera3P = new Camera3P(this, this.model.position);
        this.world.scene.add(this.camera3P._camera);

        this.world.scene.add(this.model);

        this._shooter = new PlayerShooter(this);

        this._gun = new Gun(this, 40);

        this.ChangeWeapon(ASSET_M4);

        this.addEventListener('playerdamaged', (e) => this._onDamaged(e), false)
    }
    _onDamaged(event)
    {
        this.health -= event.damage;

        if (this.health < 0)
        {
            this.health = 0;
        }

        document.getElementById("healthBar").textContent = this.health.toString();
    }
    AnimateRun()
    {
        if (!this.animation_mixer) { return; }

        this.animation_mixer.clipAction(this._anim_idle).stop();
        this.animation_mixer.clipAction(this._anim_running).play()
    }
    AnimateIdle()
    {
        if (!this.animation_mixer) { return; }

        this.animation_mixer.clipAction(this._anim_running).stop();
        this.animation_mixer.clipAction(this._anim_idle).play()
    }
    AnimateHoldGun()
    {
        if (!this.animation_mixer) { return; }

        this.animation_mixer.clipAction(this._anim_reload).stop();
        this.animation_mixer.clipAction(this._anim_holdgun).play();
    }
    AnimateReload()
    {
        if (!this.animation_mixer) { return; }

        this.animation_mixer.clipAction(this._anim_holdgun).stop();
        this.animation_mixer.clipAction(this._anim_reload).loop = THREE.LoopOnce;
        this.animation_mixer.clipAction(this._anim_reload).play();
    }
    AnimateDie()
    {
        if (!this.animation_mixer) { return; }

        this.animation_mixer.clipAction(this._anim_running).stop();
        this.animation_mixer.clipAction(this._anim_idle).stop();
        this.animation_mixer.clipAction(this._anim_holdgun).stop();
        this.animation_mixer.clipAction(this._anim_reload).stop();
        this.animation_mixer.clipAction(this._anim_die).loop = THREE.LoopOnce;
        this.animation_mixer.clipAction(this._anim_die).clampWhenFinished = true;
        this.animation_mixer.clipAction(this._anim_die).play();
    }

    Update()
    {
        let spine_rot = this._spine.rotation.y;

        if (this.animation_mixer)
        {
            this.animation_mixer.update(this.world.clock.getDelta());
        }
        if (this.health <= 0)
        {
            this.AnimateDie();
            if (this.camera3P != null)
            {
                document.getElementById("killCount").style.backgroundImage = 'died.jpg';

                this.controller.current_yaw = 0;
                this.controller.current_pitch = 0;

                const global_rot = new THREE.Quaternion();
                this._spine.getWorldQuaternion (global_rot);

                this.camera3P.Update(this.world.clock.getDelta(), this.model.position, global_rot, this.model.position);
            }
            return;
        }

        if (this.controller == null)
        {
            console.log("controller was null");
        }
        if (this.controller.keys.forward)
        {
            this.AnimateRun();
            this.model.translateZ(0.15);
            //console.log("forward");
        }
        else if (this.controller.keys.backward)
        {
            this.AnimateRun();
            this.model.translateZ(-0.09);
            //console.log("forward");
        }
        else if (this.controller.keys.left)
        {
            this.AnimateRun();
            this.model.translateX(0.07);
            //console.log("forward");
        }
        else if (this.controller.keys.right)
        {
            this.AnimateRun();
            this.model.translateX(-0.07);
            //console.log("forward");
        }
        else
        {
            this.AnimateIdle();
        }

        if (this._shooter._start_reload || this.animation_mixer.clipAction(this._anim_reload).isRunning())
        {
            this.AnimateReload();
            this._shooter._is_reloading = true;
            this._shooter._start_reload = false;
        }
        else
        {
            this.AnimateHoldGun();
            this._shooter._is_reloading = false;
        }

        let targetPitch = new THREE.Vector3();
        targetPitch.copy(this._spine.rotation);
        targetPitch.y += this.controller.current_pitch;
        let nextPitch = this._spine.rotation.toVector3().lerp(targetPitch, 0.01)
        this._spine.rotation.setFromVector3(nextPitch);

        let targetYaw = new THREE.Vector3()
        targetYaw.copy(this.model.rotation);
        targetYaw.y += this.controller.current_yaw;
        let nextYaw = this.model.rotation.toVector3().lerp(targetYaw, 0.01)
        this.model.rotation.setFromVector3(nextYaw);

        // this.model.rotation.y += this.controller.current_yaw;
        // this._spine.rotation.y += this.controller.current_pitch;

        this._gun.rotation.copy(this.neck.rotation);

        this._body.position.copy(this.model.position);
        this._body.quaternion.copy(this.model.quaternion);

        if (this.camera3P != null)
        {
            this.controller.current_yaw = 0;
            this.controller.current_pitch = 0;

            const global_rot = new THREE.Quaternion();
            this._spine.getWorldQuaternion (global_rot);

            this.camera3P.Update(this.world.clock.getDelta(), this.model.position, global_rot, this._shooter.Look(this.world.scene, this._spine));
        }

        this._shooter.Update(this.world.scene, this._spine);

        this._gun.Update();

        //const arrow = new THREE.ArrowHelper(this._righthand.direction, this._righthand.position, 5, 0xfc5a03 );
        //scene.add( arrow );
    }
    ChangeWeapon(gunAsset)
    {
        console.log(gunAsset)

        document.getElementById("weaponName").textContent = gunAsset.name;
        document.getElementById("ammoCount").textContent = gunAsset.capacity + "/" + this._shooter._reserve;
        document.getElementById("firingMode").textContent = gunAsset.default_firing_mode;

        document.getElementById("weaponIcon").src = gunAsset.icon;

        this._gun.damage = gunAsset.damage;
        this._shooter._RPM = gunAsset.RPM;
        this._shooter._firing_mode = gunAsset.default_firing_mode;
        this._shooter._firing_modes = gunAsset.firing_modes;
        this._shooter._spread = gunAsset.spread;
        this._shooter._recoil = gunAsset.recoil;
        this._shooter._capacity = gunAsset.capacity;
        this._shooter._rounds = gunAsset.capacity;
        this._shooter._shoot_sound = gunAsset.shoot_sound;
        this._shooter._reload_sound = gunAsset._reload_sound;
        this._righthand.clear();

        let newModel = new THREE.Group();
        newModel.copy(gunAsset.model);

        this.world.scene.remove(this._gun.model);

        newModel.traverse(o => {
            if (o.isMesh)
            {
                if (o.name === 'barrel')
                {
                    this._gun._barrel = o;
                }
                if (o.name === 'eject')
                {
                    this._gun._eject = o;
                }
            }
        });

        this._gun.model = newModel;

        this.world.scene.add(this._gun.model);

        this._righthand.add(this._gun.model);

        this._shooter._is_firing = false;
    }
}