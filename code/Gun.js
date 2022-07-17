import * as THREE from "../libraries/three.js-master/build/three.module.js";
// new weapon Vector_45 loaded correctly
import {M_M4, Vector_45, T_gunflash} from "../code/Main.js";
import {BulletCasing} from "../code/E_BulletCasing.js";

export class Gun extends THREE.Object3D
{
    _player;
    model;
    damage;
    _barrel;
    _eject;
    _time_since_flash;
    light;
    // receive gun_name from player 
    gun_name;
    flashMaterial;

    constructor(player, gun_name, damage)
    {
        super();
        this._player = player;
        this.gun_name = gun_name;
        this.damage = damage;

        this.model = new THREE.Group();

        this.model.copy(M_M4);

        this.model.traverse(o => {
            if (o.isMesh)
            {
                if (o.name === 'barrel')
                {
                    this._barrel = o;
                }
                if (o.name === 'eject')
                {
                    this._eject = o;
                }
            }
        });

        this.add(this.model);
        this._player._righthand.add(this.model);

        this._player.world.scene.add(this);

        this._flash_texture = T_gunflash;

        this.flashMaterial = new THREE.PointsMaterial( { color: 0xffffff } );
        this.flashMaterial.size = THREE.MathUtils.randFloat(1.25, 1.75);
        this.flashMaterial.sizeAttenuation = true
        this.flashMaterial.map = this._flash_texture;
        this.flashMaterial.transparent = true;

        const vertices = [0, 0, 0];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

        this._flashPoint = new THREE.Points(geometry, this.flashMaterial);
        this.light = new THREE.PointLight( 0xfcc96a, 3, 8 );

        document.addEventListener('playershoot', (e) => this._onShoot(e), false)

        this._time_since_flash = Date.now();
    }


    // unchanged...
    _onShoot(event)
    {
        let global_pos = new THREE.Vector3();
        this._barrel.getWorldPosition(global_pos)

        this._flashPoint.position.copy(global_pos);
        this.light.position.copy(global_pos);

        this._player.world.scene.add(this._flashPoint);
        this._player.world.scene.add(this.light);

        this._eject.getWorldPosition(global_pos);
        let global_dir = new THREE.Vector3();
        let global_rot = new THREE.Quaternion();
        this._eject.getWorldDirection(global_dir);
        this._eject.getWorldQuaternion(global_rot);
        const casing = new BulletCasing(this._player.world.effectManager, global_pos, global_rot, global_dir)

        this._time_since_flash = Date.now();
    }

    Update()
    {
        if (this._flashPoint != null && Date.now() - this._time_since_flash > 0.02*1000)
        {
            this._player.world.scene.remove(this._flashPoint)
            this._player.world.scene.remove(this.light)
        }
    }
}