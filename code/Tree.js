import * as THREE from "../libraries/three.js-master/build/three.module.js";
import {M_pine_1} from "../code/Main.js";

export class Tree extends THREE.Object3D
{
    world;

    model;
    body;

    leaves;
    trunk;

    constructor(world, position)
    {
        super({position: position});

        this.world = world;

        this.model = new THREE.Group();
        this.model.copy(M_pine_1);
        this.model.position.copy(position);
        this.model.rotateY(THREE.MathUtils.randFloat(0, 2*Math.PI))

        this.model.traverse(o => {
            if (o.isMesh)
            {
                if (o.name === 'pine_1_leaves')
                {
                    this.leaves = o;
                }
                if (o.name === 'pine_1_trunk')
                {
                    this.leaves = o;
                }
            }
        });

        this.add(this.model);
        this.world.scene.add(this);
    }
}