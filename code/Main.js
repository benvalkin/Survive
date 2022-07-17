(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

import * as THREE from '../libraries/three.js-master/build/three.module.js';
import {GLTFLoader} from '../libraries/three.js-master/examples/jsm/loaders/GLTFLoader.js';
import {OBJLoader} from '../libraries/three.js-master/examples/jsm/loaders/OBJLoader.js';

import '../libraries/cannon/cannon.js';
import {World} from "../code/World.js";
import { GunAsset } from './GunAsset.js';

export let AUDIO_LISTENER;

export let ASSET_M4;
export let ASSET_VECTOR;

let loadingScreen, loadingManager;
let RESOURCES_LOADED = false;


let M_pine_1;
let M_grass_tuft;
let M_character;
let M_M4;
let Vector_45;
let M_tracer;
let M_casing;
let M_building;
let M_skybox;

export let S_M4_fire;

export let O_tree;

let T_gunflash;
let T_grass;

let A_character;
let A_zombie;

const playershoot = new Event('playershoot');
const hitmarker = new Event('hitmarker');
const hitmarker_head = new Event('hitmarker_head');



export class Cube
{
    mesh;
    cubeBody;

    constructor(scene, physics_world)
    {
        const material = new THREE.MeshNormalMaterial()
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
        this.mesh.position.x = 0
        this.mesh.position.y = 5
        this.mesh.position.z = 0
        this.mesh.castShadow = true
        scene.add(this.mesh)

        const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
        this.cubeBody = new CANNON.Body({ mass: 1 });
        this.cubeBody.addShape(cubeShape)
        this.cubeBody.position.x = this.mesh.position.x
        this.cubeBody.position.y = this.mesh.position.y
        this.cubeBody.position.z = this.mesh.position.z
        physics_world.add(this.cubeBody)
    }
    Update()
    {
        this.mesh.position.copy(this.cubeBody.position);
        this.mesh.quaternion.copy(this.cubeBody.quaternion);
    }
}

export function PlayBulletHitSound(listener, object3D)
{
    let sound = "";
    let rand = THREE.MathUtils.randInt(0, 6);
    switch(rand)
    {
        case 0: sound = './resources/sounds/bullet_hit_1.mp3'; break;
        case 1: sound = './resources/sounds/bullet_hit_2.mp3'; break;
        case 2: sound = './resources/sounds/bullet_hit_3.mp3'; break;
        case 3: sound = './resources/sounds/bullet_hit_4.mp3'; break;
        case 4: sound = './resources/sounds/bullet_hit_5.mp3'; break;
        case 5: sound = './resources/sounds/bullet_hit_6.mp3'; break;
        case 6: sound = './resources/sounds/bullet_hit_7.mp3'; break;
    }

    const hitsound = new THREE.PositionalAudio(listener);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(sound, function (buffer) {
        hitsound.setBuffer(buffer);
        hitsound.setMaxDistance(0.5);
        hitsound.setRefDistance(0.1)
        hitsound.setRolloffFactor(0.9)
        hitsound.setDistanceModel('linear')
        hitsound.setLoop(false);
        hitsound.setVolume(0.5);
        object3D.add(hitsound);
        hitsound.play();
    });
}

let _APP = null;

// initializes the world
export function loadWorld1() {
    _APP = new World();
    _APP.LoadLevel1();
}

export function loadWorld2() {
    _APP = new World();
    _APP.LoadLevel2();
}

// THE FIRST FUNCTION THAT IS CALLED WHEN THIS SCRIPT RUNS
export function init(levelName) {

    // An object to hold all the things needed for our loading screen
    loadingScreen = {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(90, 1280/720, 0.1, 100),

        /* this is the little blue box animation you'll see on the loading screen.
           it will be fancier in time
        */
        box: new THREE.Mesh(
            new THREE.BoxGeometry(0.5,0.5,0.5),
            new THREE.MeshBasicMaterial({ color:0x4444ff })
        )
    };

    // Set up the loading screen's scene. It can be treated just like our main scene.
    loadingScreen.box.position.set(0,0,5);
    loadingScreen.camera.lookAt(loadingScreen.box.position);
    loadingScreen.scene.add(loadingScreen.box);

    // then the loading manager
    loadingManager = new THREE.LoadingManager();
    const loader = new GLTFLoader(loadingManager);
    loader.load('./resources/models/Pine_1.glb', (gltf) => {

        M_pine_1 = gltf.scene;
        M_pine_1.traverse(o => {
            if (o.isMesh)
            {
                if (o.name === 'pine_1_leaves')
                {
                    o.castShadow = true;
                    o.receiveShadow = true;

                    const texture = new THREE.TextureLoader(loadingManager).load('./resources/models/pine_1_leaf.png');
                    texture.flipY = false; // we flip the texture so that its the right way up
                    const material = new THREE.MeshStandardMaterial({
                        map: texture,
                        color: 0xAAAAAA,
                        transparent: true,
                        skinning: true,
                        roughness: 1
                    });
                    o.material = material;
                }
                if (o.name === 'pine_1_trunk')
                {
                    o.castShadow = true;
                    o.receiveShadow = true;

                    const texture = new THREE.TextureLoader(loadingManager).load('./resources/models/pine_1_trunk.png');
                    texture.flipY = false; // we flip the texture so that its the right way up
                    const material = new THREE.MeshLambertMaterial({
                        map: texture,
                        color: 0xAAAAAA,
                        skinning: true
                    });
                    o.material = material;
                }
            }
        });
    });

    const objloader = new OBJLoader(loadingManager);
    objloader.load(
        // resource URL
        "./resources/models/Tree.obj",

        // onLoad callback
        // Here the loaded data is assumed to be an object
        function ( obj ) {
            // Add the loaded object to the scene
            O_tree = obj;
            console.log(obj)
        },

        // onProgress callback
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },

        // onError callback
        function ( err ) {
            console.error( 'An error happened' );
        }
    );




    loader.load('./resources/models/Grass_Tuft.glb', (gltf) => {

        M_grass_tuft = gltf.scene;
        M_grass_tuft.traverse(o => {
            if (o.isMesh)
            {
                o.castShadow = true;
                o.receiveShadow = true;

                const texture = new THREE.TextureLoader(loadingManager).load('./resources/models/grass_tuft.png');
                texture.flipY = false; // we flip the texture so that its the right way up
                const material = new THREE.MeshStandardMaterial({
                    map: texture,
                    color: 0xAAAAAA,
                    transparent: true,
                    skinning: true,
                    roughness: 1
                });
                o.material = material;
            }
        });
    });
    loader.load('./resources/models/Character.glb', (gltf) => {

        A_character = gltf.animations;
        A_zombie = gltf.animations;

        let texture = new THREE.TextureLoader(loadingManager).load('./resources/models/character.png');
        texture.flipY = false; // we flip the texture so that its the right way up
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            color: 0xffffff,
            skinning: true
        });


        M_character = gltf.scene;
        M_character.traverse(o => {
            if (o.isMesh)
            {
                o.castShadow = true;
                o.receiveShadow = true;
                o.material = material;
            }
        });

    });
    loader.load('./resources/models/Tracer.glb', (gltf) => {

        const material = new THREE.MeshLambertMaterial({
            color: 0xff9100,
            emissive: 0xff9100,
            skinning: true
        });

        M_tracer = gltf.scene;
        M_tracer.traverse(o => {
            if (o.isMesh)
            {
                o.material = material;
            }
        });
    });
    loader.load('./resources/models/Casing.glb', (gltf) => {

        const material = new THREE.MeshStandardMaterial({
            color: 0xffce47,
            skinning: true,
            roughness: 0.5,
            metalness: 0.7
        });

        M_casing = gltf.scene;
        M_casing.traverse(o => {
            if (o.isMesh)
            {
                o.material = material;
            }
        });
    });
    loader.load('./resources/models/Zombie', (gltf) => {

        const texture = new THREE.TextureLoader(loadingManager).load('./resources/models/M4A1.png');
        texture.flipY = false; // we flip the texture so that its the right way up
        const material = new THREE.MeshLambertMaterial({
            map: texture,
            color: 0xffffff,
            skinning: true,
        });

        M_M4 = gltf.scene;
        M_M4.position.x += 0.05;
        M_M4.traverse(o => {
            if (o.isMesh)
            {
                o.castShadow = true;
                o.receiveShadow = true;
                o.material = material;
            }
        });
    });
    // load Vector-45...
    loader.load('/resources/models/Vector_45.glb', (gltf) => {

        const texture = new THREE.TextureLoader(loadingManager).load('/resources/models/Vector_45.png');
        texture.flipY = false; // we flip the texture so that its the right way up
        const material = new THREE.MeshLambertMaterial({
            map: texture,
            color: 0xffffff,
            skinning: true,
        });

        Vector_45 = gltf.scene;
        Vector_45.position.x += 0.05;
        Vector_45.traverse(o => {
            if (o.isMesh)
            {
                o.castShadow = true;
                o.receiveShadow = true;
                o.material = material;
            }
        });

        let name = 'VECTOR .45';
        let damage = 30;
        let RPM = 1200;
        let default_firing_mode = 'AUTO';
        let firing_modes = ['SEMI', 'AUTO', 'BURST'];
        let spread = 0.005;
        let recoil = 0.01;
        let capacity = 25;
        let model = Vector_45;
        let shoot_sound = './resources/sounds/Vector_fire.mp3';
        let reload_sound = './resources/sounds/Vector_reload.mp3';
        let icon = '/resources/UI/icon_Vector.png';

        ASSET_VECTOR = new GunAsset(name, damage, RPM, default_firing_mode, firing_modes, spread, recoil, capacity, model, shoot_sound, reload_sound, icon);
        
    });

    loader.load('/resources/models/M4.glb', (gltf) => {

        const texture = new THREE.TextureLoader(loadingManager).load('/resources/models/M4A1.png');
        texture.flipY = false; // we flip the texture so that its the right way up
        const material = new THREE.MeshLambertMaterial({
            map: texture,
            color: 0xffffff,
            skinning: true,
        });

        M_M4 = gltf.scene;
        M_M4.position.x += 0.05;
        M_M4.traverse(o => {
            if (o.isMesh)
            {
                o.castShadow = true;
                o.receiveShadow = true;
                o.material = material;
            }
        });

        let name = 'M4 CARBINE';
        let icon = '/resources/UI/icon_M4.png';
        let damage = 40;
        let RPM = 800;
        let default_firing_mode = 'SEMI';
        let firing_modes = ['SEMI', 'BURST'];
        let spread = 0.005;
        let recoil = 0.01;
        let capacity = 30;
        let model = M_M4;
        let shoot_sound = './resources/sounds/M4_fire.mp3';
        let reload_sound = './resources/sounds/M4_reload.mp3';

        ASSET_M4 = new GunAsset(name, damage, RPM, default_firing_mode, firing_modes, spread, recoil, capacity, model, shoot_sound, reload_sound, icon);
        
    });

    loader.load('./resources/models/Skybox.glb', (gltf) => {

        const texture = new THREE.TextureLoader(loadingManager).load('./resources/models/sky.png');

        const material = new THREE.MeshLambertMaterial({
            map: texture,
            color: 0xffffff,
            emissive: 0x000000,
            skinning: true,
            fog: false
        });

        M_skybox = gltf.scene;
        M_skybox.traverse(o => {
            if (o.isMesh)
            {
                o.material = material;

                let mergedGeometry = mergeVertices(o.geometry, 1);
                mergedGeometry.computeVertexNormals();
                mergedGeometry.computeTangents();
                o.geometry = mergedGeometry;
            }
        });
    });


    ////////////////////////////////////////////////////////////////
    // AUDIO
    ////////////////////////////////////////////////////////////////

    AUDIO_LISTENER = new THREE.AudioListener();

    S_M4_fire = new THREE.PositionalAudio(AUDIO_LISTENER);
    let audioLoader = new THREE.AudioLoader(loadingManager);
    audioLoader.load('./resources/sounds/M4_fire.mp3', function (buffer){
        S_M4_fire.setBuffer(buffer);
        S_M4_fire.setRefDistance(40);
        S_M4_fire.setLoop(false);
        S_M4_fire.setVolume(1.5);
    });

    const textureLoader = new THREE.TextureLoader(loadingManager);
    T_gunflash = textureLoader.load('./resources/models/flash.png');
    T_gunflash.flipY = false; // we flip the texture so that its the right way up
    T_grass = textureLoader.load('./resources/models/grass.png');
    T_grass.flipY = false; // we flip the texture so that its the right way up

    loadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
        console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };
    loadingManager.onLoad = function(){
        console.log("loaded all resources");
        RESOURCES_LOADED = true;

        if (levelName === 'level1')
        {
            loadWorld1();
        }
        if (levelName === 'level2')
        {
            loadWorld2();
        }

        // make ammo UI invisible
        let ammoUI = document.getElementById("lowerUI")
        ammoUI.style.visibility = 'visible'
    };
}

export
{
    M_pine_1,
    M_grass_tuft,
    M_character,
    M_M4,
    Vector_45,
    M_tracer,
    M_casing,
    M_building,
    M_skybox,

    T_gunflash,
    T_grass,

    A_character,
    A_zombie,

    playershoot,
    hitmarker,
    hitmarker_head
}

function mergeVertices( geometry, tolerance = 1e-4 ) {

    tolerance = Math.max( tolerance, Number.EPSILON ); // Generate an index buffer if the geometry doesn't have one, or optimize it
    // if it's already available.

    const hashToIndex = {};
    const indices = geometry.getIndex();
    const positions = geometry.getAttribute( 'position' );
    const vertexCount = indices ? indices.count : positions.count; // next value for triangle indices

    let nextIndex = 0; // attributes and new attribute arrays

    const attributeNames = Object.keys( geometry.attributes );
    const attrArrays = {};
    const morphAttrsArrays = {};
    const newIndices = [];
    const getters = [ 'getX', 'getY', 'getZ', 'getW' ]; // initialize the arrays

    for ( let i = 0, l = attributeNames.length; i < l; i ++ ) {

        const name = attributeNames[ i ];
        attrArrays[ name ] = [];
        const morphAttr = geometry.morphAttributes[ name ];

        if ( morphAttr ) {

            morphAttrsArrays[ name ] = new Array( morphAttr.length ).fill().map( () => [] );

        }

    } // convert the error tolerance to an amount of decimal places to truncate to


    const decimalShift = Math.log10( 1 / tolerance );
    const shiftMultiplier = Math.pow( 10, decimalShift );

    for ( let i = 0; i < vertexCount; i ++ ) {

        const index = indices ? indices.getX( i ) : i; // Generate a hash for the vertex attributes at the current index 'i'

        let hash = '';

        for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

            const name = attributeNames[ j ];
            const attribute = geometry.getAttribute( name );
            const itemSize = attribute.itemSize;

            for ( let k = 0; k < itemSize; k ++ ) {

                // double tilde truncates the decimal value
                hash += `${~ ~ ( attribute[ getters[ k ] ]( index ) * shiftMultiplier )},`;

            }

        } // Add another reference to the vertex if it's already
        // used by another index


        if ( hash in hashToIndex ) {

            newIndices.push( hashToIndex[ hash ] );

        } else {

            // copy data to the new index in the attribute arrays
            for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

                const name = attributeNames[ j ];
                const attribute = geometry.getAttribute( name );
                const morphAttr = geometry.morphAttributes[ name ];
                const itemSize = attribute.itemSize;
                const newarray = attrArrays[ name ];
                const newMorphArrays = morphAttrsArrays[ name ];

                for ( let k = 0; k < itemSize; k ++ ) {

                    const getterFunc = getters[ k ];
                    newarray.push( attribute[ getterFunc ]( index ) );

                    if ( morphAttr ) {

                        for ( let m = 0, ml = morphAttr.length; m < ml; m ++ ) {

                            newMorphArrays[ m ].push( morphAttr[ m ][ getterFunc ]( index ) );

                        }

                    }

                }

            }

            hashToIndex[ hash ] = nextIndex;
            newIndices.push( nextIndex );
            nextIndex ++;

        }

    } // Generate typed arrays from new attribute arrays and update
    // the attributeBuffers


    const result = geometry.clone();

    for ( let i = 0, l = attributeNames.length; i < l; i ++ ) {

        const name = attributeNames[ i ];
        const oldAttribute = geometry.getAttribute( name );
        const buffer = new oldAttribute.array.constructor( attrArrays[ name ] );
        const attribute = new THREE.BufferAttribute( buffer, oldAttribute.itemSize, oldAttribute.normalized );
        result.setAttribute( name, attribute ); // Update the attribute arrays

        if ( name in morphAttrsArrays ) {

            for ( let j = 0; j < morphAttrsArrays[ name ].length; j ++ ) {

                const oldMorphAttribute = geometry.morphAttributes[ name ][ j ];
                const buffer = new oldMorphAttribute.array.constructor( morphAttrsArrays[ name ][ j ] );
                const morphAttribute = new THREE.BufferAttribute( buffer, oldMorphAttribute.itemSize, oldMorphAttribute.normalized );
                result.morphAttributes[ name ][ j ] = morphAttribute;

            }

        }

    } // indices


    result.setIndex( newIndices );
    return result;

}