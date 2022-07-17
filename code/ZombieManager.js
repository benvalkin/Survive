import * as THREE from "../libraries/three.js-master/build/three.module.js";
import {Zombie} from "../code/Zombie.js";

export class ZombieManager {
    world;
    _zombies; // list of zombies in the world right now
    _time_started;
    _level_HP;

    constructor(world, HP) {
        this.world = world;
        this._zombies = [];
        this._time_started = Date.now();
        this._level_HP = HP;
    }

    AddNewZombie(position) {
        let zombie = new Zombie(this, position, this._level_HP);
        this._zombies.push(zombie);
    }

    Update() {
        if (Date.now() - this._time_started > 1 * 1000) {
            let rand = THREE.MathUtils.randInt(0, 300);
            if (rand == 1) {
                const position = new THREE.Vector3(THREE.MathUtils.randInt(-50, 50), 0, THREE.MathUtils.randInt(-50, 50))
                this.AddNewZombie(position);
            }
        }
        for (let i = 0; i < this._zombies.length; i++) {
            this._zombies[i].Update();
            // if (!this._zombies[i].isAlive)
            // {
            //     this._zombies.splice(i);
            // }
        }
    }

    _onKeyDown(event) {
        if (event.key === "P") // reload
        {
            this.AddNewZombie();
        }
    }
}