import * as THREE from '../libraries/three.js-master/build/three.module.js';

import {hitmarker, hitmarker_head, M_tracer} from "../code/Main.js";
import {Effect} from "../code/E_Effect.js";


export class GunItem extends Effect
{
    model;
    asset;

    constructor(effectManager, position, gunAsset)
    {
        super(effectManager, 10000, position);

        this.model = new THREE.Group();
        this.model.copy(gunAsset.model);
        this.model.position.copy(this.position);
        this.model.position.y += 0.5

        this.manager.world.scene.add(this.model);

        this.asset = gunAsset;
        
    }
    Update()
    {
        this.model.rotateY(0.02)

        let player_pos = new THREE.Vector3();
        this.manager.world.player.model.getWorldPosition(player_pos)

        if (this.isAlive && this.position.distanceToSquared(player_pos) < 1)
        {
            this.manager.world.scene.remove(this.model);
            this.manager.world.player.ChangeWeapon(this.asset);
            this.isAlive = false;
        }
    }
}