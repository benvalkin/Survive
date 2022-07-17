import * as THREE from "../libraries/three.js-master/build/three.module.js";
import {GLTFLoader} from "../libraries/three.js-master/examples/jsm/loaders/GLTFLoader.js";

import '../libraries/cannon/cannon.js';

export class Zombie
{
    manager;
    model;
    body;
    health;
    file_animations;
    animation_mixer;
    bone_neck;
    bone_spine;
    hitbox_head;
    hitbox_body;
    _start_die = false;
    _time_last_attack = 0;

    constructor(zombieManager, position, HP)
    {
        this.clock = new THREE.Clock();

        this.manager = zombieManager;

        this.health = HP;

        const loader = new GLTFLoader();
        loader.load('./resources/models/Zombie.glb', (gltf) => {

            let random = THREE.MathUtils.randInt(1, 4);

            let file = './resources/models/zombie1.png';

            switch (random)
            {
                case 1:
                    file = './resources/models/zombie1.png';
                    break;
                case 2:
                    file = './resources/models/zombie2.png';
                    break;
                case 3:
                    file = './resources/models/zombie3.png';
                    break;
                case 4:
                    file = './resources/models/zombie4.png';
                    break;
            }


            let texture = new THREE.TextureLoader().load(file);
            texture.flipY = false; // we flip the texture so that its the right way up
            const material = new THREE.MeshPhongMaterial({
                map: texture,
                color: 0xffffff,
                skinning: true
            });

            this.model = gltf.scene;
            this.model.position.copy(position);
            this.model.traverse(o => {
                if (o.isMesh)
                {
                    o.castShadow = true;
                    o.receiveShadow = true;
                    o.material = material;
                }

                const hitbox_material = new THREE.MeshNormalMaterial();
                hitbox_material.transparent = true;
                hitbox_material.opacity = 0;
                if (o.isBone && o.name === 'neck')
                {
                    this.bone_neck = o;

                    this.hitbox_head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), hitbox_material)

                    let global_pos = new THREE.Vector3();
                    let global_rot = new THREE.Quaternion();
                    this.bone_neck.getWorldPosition(global_pos);
                    this.bone_neck.getWorldQuaternion(global_rot);

                    this.hitbox_head.position.copy(global_pos)
                    this.hitbox_head.quaternion.copy(global_rot)

                    this.hitbox_head.castShadow = false
                    this.manager.world.scene.add(this.hitbox_head)

                    this.hitbox_head.geometry.computeBoundingBox()

                    this.hitbox_head.name = 'zombie_head'

                    this.hitbox_head.addEventListener('zombiehit', (e) => this._onHeadShot(e), false)
                }
                if (o.isBone && o.name === 'Spine')
                {
                    this.bone_spine = o;

                    this.hitbox_body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), hitbox_material)

                    let global_pos = new THREE.Vector3();
                    let global_rot = new THREE.Quaternion();
                    this.bone_spine.getWorldPosition(global_pos);
                    this.bone_spine.getWorldQuaternion(global_rot);

                    this.hitbox_body.position.copy(global_pos)
                    this.hitbox_body.quaternion.copy(global_rot)

                    this.hitbox_body.castShadow = false
                    this.manager.world.scene.add(this.hitbox_body)

                    this.hitbox_body.geometry.computeBoundingBox()

                    this.hitbox_body.name = 'zombie_body'

                    this.hitbox_body.addEventListener('zombiehit', (e) => this._onBodyShot(e), false)
                }
            });

            this.file_animations = gltf.animations

            this.animation_mixer = new THREE.AnimationMixer(this.model);

            this._anim_walk = THREE.AnimationClip.findByName(this.file_animations, 'ZombieWalk');
            this.animation_mixer.clipAction(this._anim_walk).play();

            this._anim_attack = THREE.AnimationClip.findByName(this.file_animations, 'ZombieAttack');
            this._anim_die = THREE.AnimationClip.findByName(this.file_animations, 'ZombieDie');

            this.manager.world.scene.add(this.model);
        });
    }
    AnimateAttack()
    {
        if (!this.animation_mixer) { return; }

        this.animation_mixer.clipAction(this._anim_walk).stop();
        this.animation_mixer.clipAction(this._anim_attack).play();

    }
    AnimateWalk()
    {
        if (!this.animation_mixer) { return; }

        this.animation_mixer.clipAction(this._anim_attack).stop();
        this.animation_mixer.clipAction(this._anim_walk).play();

    }
    AnimateDie()
    {
        if (!this.animation_mixer) { return; }
        

        this.animation_mixer.clipAction(this._anim_walk).stop();
        this.animation_mixer.clipAction(this._anim_attack).stop();
        this.animation_mixer.clipAction(this._anim_die).loop = THREE.LoopOnce;
        this.animation_mixer.clipAction(this._anim_die).clampWhenFinished = true;
        this.animation_mixer.clipAction(this._anim_die).play();
    }
    _onHeadShot(event)
    {
        let damage = event.damage*2;

        this.RecalculateHealth(damage);
    }
    _onBodyShot(event)
    {
        let damage = event.damage;

        this.RecalculateHealth(damage);
    }
    RecalculateHealth(damage)
    {
        if (this.health > 0 && this.health - damage <= 0)
        {
            this._start_die = true;
            this.health = 0;

            this.manager.world._kills = this.manager.world._kills + 1;
            
            document.getElementById("killCount").textContent = this.manager.world._kills + "/" + this.manager.world._max_kills;
            console.log(this.manager.world._kills)
        }
        else
        {
            this.health -= damage;
        }
    }
    Update()
    {
        if (this.animation_mixer)
        {
            this.animation_mixer.update(this.clock.getDelta());
        }
        if (this.model != null)
        {
            if (this.health > 0)
            {
                this.model.lookAt(this.manager.world.player.model.position);

                if (this.model.position.distanceToSquared(this.manager.world.player.model.position) > 4)
                {
                    this.model.translateZ(0.1);
                }
                if (this.model.position.distanceToSquared(this.manager.world.player.model.position) > 5 || this.manager.world.player.health <= 0)
                {
                    this.AnimateWalk();
                }
                else
                {
                    this.AnimateAttack();
                    const time = (this.animation_mixer.clipAction(this._anim_attack).time / this._anim_attack.duration).toFixed(2);
                    if (0.4 <= time && time <= 0.6 && Date.now() - this._time_last_attack > 0.25*1000)
                    {
                        this.manager.world.player.dispatchEvent({ type: 'playerdamaged', damage: 7});
                        this._time_last_attack = Date.now();
                    }
                }
            }
            else
            {
                this.AnimateDie();
            }
            let head_pos = new THREE.Vector3();
            let head_rot = new THREE.Quaternion();
            this.bone_neck.getWorldPosition(head_pos);
            this.bone_neck.getWorldQuaternion(head_rot);

            this.hitbox_head.quaternion.copy(head_rot);
            head_pos.y += 0.4;
            this.hitbox_head.position.copy(head_pos);
            this.hitbox_head.geometry.computeBoundingSphere();

            let spine_pos = new THREE.Vector3();
            let spine_rot = new THREE.Quaternion();
            this.bone_spine.getWorldPosition(spine_pos);
            this.bone_spine.getWorldQuaternion(spine_rot);

            this.hitbox_body.quaternion.copy(spine_rot);
            spine_pos.y += 0.4;
            this.hitbox_body.position.copy(spine_pos);
            this.hitbox_body.geometry.computeBoundingSphere();
        }
    }
}