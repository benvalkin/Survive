import * as THREE from '../libraries/three.js-master/build/three.module.js';
import {GLTFLoader} from "../libraries/three.js-master/examples/jsm/loaders/GLTFLoader.js";


export let model_dir = [
    './resources/models/Buildings/Building_1.glb',
    './resources/models/Buildings/Building_2.glb',
    './resources/models/Buildings/Building_3.glb',
    './resources/models/Buildings/Building_4.glb',
    './resources/models/Buildings/Building_5.glb',
    './resources/models/Buildings/Building_6.glb',
    './resources/models/Buildings/Building_7.glb'
]
export let material_dir = [
    './resources/models/Buildings/Building_1.png',
    './resources/models/Buildings/Building_2.png',
    './resources/models/Buildings/Building_3.png',
    './resources/models/Buildings/Building_4.png',
    './resources/models/Buildings/Building_5.png',
    './resources/models/Buildings/Building_6.png',
    './resources/models/Buildings/Building_7.png'
]

export class Building
{
    mesh;
    model;
    scene;
    world;

    constructor(world, model_dir, material_dir,x,y,z, angle){
        this.world = world
        const loader = new GLTFLoader();
        loader.load(model_dir, (gltf) => {

            let texture = new THREE.TextureLoader().load(material_dir);
            texture.flipY = false; // we flip the texture so that its the right way up
            const material = new THREE.MeshPhongMaterial({
                map: texture,
                color: 0xffffff,
                skinning: true
            });

            this.model = gltf.scene;
            this.model.traverse(o => {
                if (o.isMesh)
                {
                    o.castShadow = true;
                    o.receiveShadow = true;
                    o.material = material;
                    o.geometry.computeBoundingBox()
                    this.geometry = o.geometry;
                }
            });
            this.model.position.set(x,y+0.01,z);
            this.model.rotateY(angle);

            this.world.scene.add(this.model);
        });
    }

    getMaterial(directory){
        let texture = new THREE.TextureLoader().load(directory);
        texture.flipY = false; // we flip the texture so that its the right way up
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            color: 0xffffff,
            skinning: true
        });
        return material;
    }
}