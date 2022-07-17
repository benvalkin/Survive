import * as THREE from "../libraries/three.js-master/build/three.module.js";
import {M_grass_tuft} from "../code/Main.js";

export class GrassTuft extends THREE.Object3D
{
    world;
    model;

    constructor(world, position)
    {
        super({position: position});

        this.world = world;

        this.model = new THREE.Group();
        this.model.copy(M_grass_tuft);
        this.model.position.copy(position);
        this.model.rotateY(THREE.MathUtils.randFloat(0, 2*Math.PI))

        this.add(this.model);
        this.world.scene.add(this);
    }
}