import * as THREE from "../libraries/three.js-master/build/three.module.js";
import {Effect} from "../code/E_Effect.js";
import {PhysiParticle} from "../code/PhysiParticle.js";

export class BloodSplatter extends Effect
{
    children = [];

    constructor(effectManager, position, direction)
    {
        super(effectManager, 2, position);

        for (let i = 0; i < 9; i++)
        {
            let spread_position = position;

            spread_position.x += THREE.MathUtils.randFloat(-0.2, 0.2);
            spread_position.t += THREE.MathUtils.randFloat(-0.2, 0.2);
            spread_position.z += THREE.MathUtils.randFloat(-0.2, 0.2);
            let particle = new PhysiParticle(this, position, direction,  5, Math.PI/12,0.15, 0.3, 0xbf0000);
            this.children.push(particle);
        }
    }
    Update()
    {
        if (Date.now() - this._timeStarted > this.lifetime*1000 && this.isAlive)
        {
            for (let i = 0; i < this.children.length; i++)
            {
                this.manager.world.scene.remove(this.children[i].point);
                this.manager.world.physics_world.remove(this.children[i].body);
            }
            this.isAlive = false;
            return;
        }
        if (!this.isAlive)
        {
            return;
        }
        for (let i = 0; i < this.children.length; i++)
        {
            this.children[i].Update();
        }
    }
}