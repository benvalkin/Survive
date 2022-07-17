import * as THREE from "../libraries/three.js-master/build/three.module.js";

import '../libraries/cannon/cannon.js';

import {hitmarker, hitmarker_head, M_tracer} from "../code/Main.js";
import {Effect} from "../code/E_Effect.js";
import {BloodSplatter} from "../code/E_BloodSplatter.js";
import {BulletHit} from "../code/E_BulletHit.js";

export class Tracer extends Effect
{
    model;
    body;

    hitfound;

    _shoot_raycaster;

    constructor(effectManager, lifetime, position, rotation, direction, damage)
    {
        super(effectManager, lifetime, position);

        this.manager = effectManager;

        this.model = new THREE.Object3D();
        this.model.copy(M_tracer);
        this.model.position.copy(position);
        this.model.setRotationFromQuaternion(rotation.normalize())

        const cubeShape = new CANNON.Box(new CANNON.Vec3(.25, 25, .25));
        this.body = new CANNON.Body({ mass: 1 });
        this.body.addShape(cubeShape);
        this.body.position.copy(this.model.position);
        this.body.quaternion.copy(this.model.quaternion);
        this.body.collisionFilterGroup = 10;

        let velocity = new CANNON.Vec3(0, 0, 0);
        velocity.copy(direction);
        velocity.scale(400, velocity);
        this.body.velocity.copy(velocity);

        this._shoot_raycaster = new THREE.Raycaster();
        this._shoot_raycaster.near = 0;
        this._shoot_raycaster.far = 9;

        this.hitfound = false;

        this.damage = damage;

        this.manager.world.physics_world.add(this.body);
        this.manager.world.scene.add(this.model);



        this.Raycast();

    }
    Update()
    {
        if (Date.now() - this._timeStarted > this.lifetime*1000)
        {
            this.isAlive = false;
            this.manager.world.scene.remove(this.model);
            this.manager.world.physics_world.remove(this.body);
        }
        if (this.hitfound)
        {
            this.isAlive = false;
        }
        if (!this.isAlive)
        {
            this.manager.world.scene.remove(this.model);
            this.manager.world.physics_world.remove(this.body);
            return;
        }
        else if (this.model != null)
        {
            this.model.position.copy(this.body.position);
            this.model.quaternion.copy(this.body.quaternion);
            this.Raycast();
        }
    }
    Raycast()
    {
        const global_pos = new THREE.Vector3();
        const global_dir = new THREE.Vector3();
        this.model.getWorldPosition(global_pos);
        this.model.getWorldDirection(global_dir);

        // const hit_arrow = new THREE.ArrowHelper(global_dir, global_pos, 2, 0xff975e );
        // this.manager.world.scene.add(hit_arrow);

        this._shoot_raycaster.set(global_pos, global_dir);

        let hit = [];
        let intersects = this._shoot_raycaster.intersectObjects(this.manager.world.scene.children, false, hit);

        //console.log(hit);

        for (let i = 0; i < hit.length; i++)
        {
            if (hit[i].face != null)
            {
                if (hit[i].object.name === 'zombie_head')
                {
                    hit[i].object.dispatchEvent({ type: 'zombiehit', damage: this.damage });
                    document.dispatchEvent(hitmarker_head);
                    let blood = new BloodSplatter(this.manager, hit[i].point, hit[i].face.normal);
                }
                else if (hit[i].object.name === 'zombie_body')
                {
                    hit[i].object.dispatchEvent({ type: 'zombiehit', damage: this.damage });
                    document.dispatchEvent(hitmarker);
                    let blood = new BloodSplatter(this.manager, hit[i].point, hit[i].face.normal);
                }
                else
                {
                    if (hit[i].object.name === "ground")
                    {
                        hit[i].face.normal.applyAxisAngle (new THREE.Vector3(1, 0, 0), -Math.PI/2);
                    }

                    let blood = new BulletHit(this.manager, hit[i].point, hit[i].face.normal);
                }

                //PlayBulletHitSound(this.manager.world.player._shooter._audioListener, this.model)

                //const hit_arrow = new THREE.ArrowHelper(hit[i].face.normal, hit[i].point, 2, 0xff975e );
                //this.manager.world.scene.add(hit_arrow);

                this.hitfound = true;

                break;
            }
        }
    }
}