import * as THREE from "../libraries/three.js-master/build/three.module.js";

import '../libraries/cannon/cannon.js';

export class PhysiParticle
{
    parentEffect

    point;
    body;

    constructor(parentEffect, position, direction, velocity, coneSpread, minSize, maxSize, color)
    {
        this.parentEffect = parentEffect;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute([0, 0, 0], 3 ) );

        const material = new THREE.PointsMaterial( { color: color } );
        material.size = THREE.MathUtils.randFloat(minSize, maxSize);
        material.sizeAttenuation = true

        this.point = new THREE.Points(geometry, material);
        this.point.position.copy(position)
        this.parentEffect.manager.world.scene.add(this.point);

        const cubeShape = new CANNON.Box(new CANNON.Vec3(0.05, 0.05, 0.05));
        this.body = new CANNON.Body({ mass: 1});
        this.body.addShape(cubeShape);
        this.body.position.copy(position);

        direction.applyAxisAngle (new THREE.Vector3(1, 0, 0), THREE.MathUtils.randFloat(-coneSpread, coneSpread));
        direction.applyAxisAngle (new THREE.Vector3(0, 1, 0), THREE.MathUtils.randFloat(-coneSpread, coneSpread));
        direction.applyAxisAngle (new THREE.Vector3(0, 0, 1), THREE.MathUtils.randFloat(-coneSpread, coneSpread));

        direction.addScalar(velocity/10);
        this.body.velocity.copy(direction);

        this.parentEffect.manager.world.physics_world.add(this.body);
    }
    Update()
    {
        this.point.position.copy(this.body.position);
    }
}