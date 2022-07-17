import * as THREE from '../libraries/three.js-master/build/three.module.js';
import '../libraries/cannon/cannon.js';
import {Cube, init, T_grass, M_skybox, ASSET_M4, ASSET_VECTOR, M_M4, Vector_45} from "../code/Main.js";
import {Player} from "../code/Player.js";
import {ZombieManager} from "../code/ZombieManager.js";
import {EffectManager} from "../code/EffectManager.js";
import {GrassTuft} from "../code/GrassTuft.js";
import {Tree} from "../code/Tree.js";
import {Building, model_dir, material_dir} from "../code/Building.js";
import {GunItem} from "../code/GunItem.js";
import '../libraries/jquery-3.6.0.js'

// vertex and fragment shaders
const _VS = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;

export class World {

    renderer; // the renderer that renders the world on screen
    scene // the graphics component of our scene
    clock;
    player;
    physics_world;
    _zombie_HP;
    zombieManager;
    effectManager;

    skybox;

    // new variables...
    _runAnim = true; // ypu'll find it in RAF. it determines if running the animations should continue or not, e.g when you pause the game
    _kills = 0; // how many zombies you've killed in the current level
    _max_kills; // is set by each level. if you kill _max_kills zombies, you proceed to next level
    _current_level = ""; // will hold the name of the level you're in
    _health_cube; 
    _last_health_pickup; // the point in time when you picked up the last health cube
    _num_clips = 5; // or magazines you have left. you start off each level with 5
    _ammo_cube;
    _last_ammo_pickup;
    _weapon_cube; // if you pick it up, you get the new weapon
    _have_new_weapon = false; // will be set to true when you pick up the _weapon_cube
    _default_gun_name; // default weapon name you start each level with

    game_over = false;

    weapon_counter = 0;
    
    constructor()
    {
        // graphics world setup stuff
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this._OnWindowResize();
        }, false);

        this.clock = new THREE.Clock();

        this.physics_world = new CANNON.World();
        this.physics_world.gravity.set(0, -15, 0);
        this.physics_world.broadphase = new CANNON.NaiveBroadphase();
        this.physics_world.solver.iterations = 40;

    }

    LoadLevel1() {

        this._last_health_pickup = Date.now();
        this._current_level = "level1";
        this._zombie_HP = 100; // each level determines how strong the zombies in it are
        // lower max kills to make testing faster, but for level 1, _max_kills is 15
        this._max_kills = 20;
        document.getElementById("killCount").textContent = this._kills + "/" + this._max_kills;

        this._last_ammo_pickup = Date.now();
        this._default_gun_name = "M_M4";

        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000.0;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xFFFFFF);
        this.scene.fog = new THREE.FogExp2(0xbccdd1, 0.01);
        //this.scene.fog = new THREE.Fog(0x8d99a6, 0, 80);

        let light = new THREE.DirectionalLight(0xffefbf, 1.0);
        light.position.set(20, 20, 1);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.left = 100;
        light.shadow.camera.right = -100;
        light.shadow.camera.top = 100;
        light.shadow.camera.bottom = -100;
        this.scene.add(light);

        const axesHelper = new THREE.AxesHelper( 5 );
        this.scene.add( axesHelper );

        light = new THREE.AmbientLight(0xffffff);
        light.intensity = 1;
        this.scene.add(light);

        const plane_geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
        plane_geometry.computeVertexNormals()
        plane_geometry.computeTangents()

        const texture = T_grass;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(128, 128);

        const plane = new THREE.Mesh(
            plane_geometry,
            new THREE.MeshStandardMaterial({
                map: texture,
                color: 0xAAAAAA
            }));
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        plane.name = "ground";
        this.scene.add(plane);

        const planeShape = new CANNON.Plane();
        const planeBody = new CANNON.Body({ mass: 0 });
        planeBody.addShape(planeShape);
        planeBody.position.x = plane.position.x;
        planeBody.position.y = plane.position.y;
        planeBody.position.z = plane.position.z;
        planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.physics_world.add(planeBody);

        // added gun_name as a parameter to the player class, to be passed on to the gun class
        this.player = new Player(this, this._default_gun_name);

        this.GenerateTrees();
        this.GenerateGrass();

        // added zombie_HP as a parameter to zombie manager
        this.zombieManager = new ZombieManager(this, this._zombie_HP);
        this.effectManager = new EffectManager(this);

        // for when you press P to pause the game
        document.addEventListener('keypress', (e) => this.onKeyPress(e), false);

        this.LoadSky();
        this.RAF();
    }

    LoadLevel2() {

        this._last_health_pickup = Date.now();
        this._current_level = "level2";
        this._zombie_HP = 150;
        this._max_kills = 25;
        document.getElementById("killCount").textContent = this._kills + "/" + this._max_kills;

        this._last_ammo_pickup = Date.now();
        this._default_gun_name = "M_M4";

        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000.0;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xFFFFFF);
        this.scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

        let light = new THREE.DirectionalLight(0xffefbf, 1.0);
        light.position.set(20, 20, 1);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.left = 100;
        light.shadow.camera.right = -100;
        light.shadow.camera.top = 100;
        light.shadow.camera.bottom = -100;
        this.scene.add(light);

        light = new THREE.AmbientLight(0xffffff);
        light.intensity = 1;
        this.scene.add(light);

        const plane_geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
        plane_geometry.computeVertexNormals()
        plane_geometry.computeTangents()
        const plane = new THREE.Mesh(
            plane_geometry,
            new THREE.MeshPhongMaterial({
                color: 0x333333
            }));
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        plane.name = "ground";
        this.scene.add(plane);

        const planeShape = new CANNON.Plane();
        const planeBody = new CANNON.Body({ mass: 0 });
        planeBody.addShape(planeShape)
        planeBody.position.x = plane.position.x;
        planeBody.position.y = plane.position.y;
        planeBody.position.z = plane.position.z;
        planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
        this.physics_world.add(planeBody)

        this.player = new Player(this, this._default_gun_name);

        //SIDE ONE
        this.b1 = new Building(this,model_dir[0],material_dir[0],25,0,0, 0);
        this.b2 = new Building(this,model_dir[1],material_dir[1],25,0,42, 0);
        this.b3 = new Building(this, model_dir[2], material_dir[2], 25, 0, -42, 0);
        this.b4 = new Building(this,model_dir[1],material_dir[1],30,0,-82, 0);
        this.b16 = new Building(this, model_dir[5], material_dir[5], 35, 0, -125, Math.PI);

        //SIDE TWO
        this.b5 = new Building(this, model_dir[3], material_dir[3], -25,0,0,0);
        this.b6 = new Building(this, model_dir[4], material_dir[4], -25, 0, 26, 0);
        this.b7 = new Building(this, model_dir[0], material_dir[0], -25, 0, -30, 0);
        this.b8 = new Building(this, model_dir[5], material_dir[5], -25, 0, -69, 0);
        this.b9 = new Building(this, model_dir[6], material_dir[6], -20, 0, -103, 0);
        this.b10 = new Building(this, model_dir[6], material_dir[6], -20, 0, 55, 0);
        this.b17 = new Building(this, model_dir[1], material_dir[1], -20, 0, -148, 0);

        //SIDE THREE
        this.b11 = new Building(this, model_dir[1], material_dir[1], 0, 0, -160, Math.PI/2);
        this.b12 = new Building(this, model_dir[3], material_dir[3], 43, 0, -160, -Math.PI/2);
        this.b13 = new Building(this, model_dir[2], material_dir[2], -43, 0, -160, Math.PI/2);

        //SIDE FOUR
        this.b14 = new Building(this, model_dir[0], material_dir[0],0, 0, 82, -Math.PI/2);
        this.b15 = new Building(this, model_dir[1], material_dir[1], -42, 0, 82, -Math.PI/2);

        this.zombieManager = new ZombieManager(this, this._zombie_HP);
        this.effectManager = new EffectManager(this);

        document.addEventListener('keypress', (e) => this.onKeyPress(e), false);

        this.LoadSky();
        this.RAF();
    }

    // unchanged
    LoadSky() {
        const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        this.scene.add(hemiLight);

        const uniforms = {
            "topColor": { value: new THREE.Color(0x869eba) },
            "bottomColor": { value: new THREE.Color(0xbccdd1) },
            "offset": { value: 33 },
            "exponent": { value: 0.6 }
        };
        uniforms["topColor"].value.copy(hemiLight.color);

        this.scene.fog.color.copy(uniforms["bottomColor"].value);

        // const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
        // const skyMat = new THREE.ShaderMaterial({
        //     uniforms: uniforms,
        //     vertexShader: _VS,
        //     fragmentShader: _FS,
        //     side: THREE.BackSide,
        // });

        // const sky = new THREE.Mesh(skyGeo, skyMat);

        this.sky = M_skybox;

        this.scene.add(M_skybox);
    }

    // for pausing the game
    onKeyPress(event) 
    {
        if (event.key === "p") 
        {
            if (this._runAnim == true) { 
                // when thid is false, RAF stops and the game pauses
                this._runAnim = false;
            }
            else if (this._runAnim == false) {
                // set it back to true and start RAF again
                this._runAnim = true;
                this.RAF();
            }
        }
    }

    // when you die, respawn
    Respawn() {
        // reset level variables
        let this_level = this._current_level;
        let new_health = 100;
        let new_kills = 0;
        let new_clips = 5;

        document.getElementById("link").href = "css/died.css"
        document.getElementById("lowerUI").style.visibility = 'hidden'
        document.getElementById("level1").style.visibility = 'visible'
        document.getElementById("level2").style.visibility = 'visible'

        // some jQuery for resetting the level
        $(this.renderer.domElement).fadeOut();
        $('#intro').fadeIn();
		$('#intro').html("YOU'VE BEEN CHOWED! CLICK TO RESTART");
		$('#intro').one('click', function() {
		    $(this).fadeOut();
            document.getElementById("healthBar").textContent = new_health;
            document.getElementById("killCount").textContent = new_kills;
            document.getElementById("clipCount").textContent = new_clips;
            document.getElementById("ammoCount").textContent = "30/30";
            // re-initialize the current level
		    init(this_level);
		});
    }

    Proceed() 
    {
        this.game_over = true;

        document.getElementById("link").href = "css/win.css"
        document.getElementById("lowerUI").style.visibility = 'hidden'
        document.getElementById("level1").style.visibility = 'visible'
        document.getElementById("level2").style.visibility = 'visible'

        let this_level = this._current_level;

        $(this.renderer.domElement).fadeOut();
        $('#intro').fadeIn();

        let message = "";
        if (this_level == "level1") { message = "LEVEL 1 CLEARED! CLICK TO START LEVEL 2"; }
        else if (this_level == "level2") { message = "LEVEL 2 CLEARED! CLICK TO START LEVEL 3"; }
		            
        $('#intro').html(message);
		$('#intro').one('click', function() {
            $(this).fadeOut();
            if (this_level == "level1") { init("level2"); }
            // when level 3 is complete, then it should be init("level3")
            else if (this_level == "level2") { init("level2"); }
		});
    }

    CalculateKills(zombies) 
    {
        if (this._kills >= this._max_kills) {
            this.Proceed();
        }
    }

    SpawnHealthCube() 
    {
        let check_health_cube = this.scene.getObjectByName("health_cube");
        let player_pos = this.player.model.position;

        // if the cube is not in the scene...
        if (check_health_cube == undefined) 
        {
            // health cube spawns every 10 seconds
            if ((Date.now() - this._last_health_pickup) > 10*1000) 
            {
                this._health_cube = new THREE.Mesh(
                    new THREE.BoxGeometry(1,1,1),
                    new THREE.MeshBasicMaterial({
                        map: new THREE.TextureLoader().load("/resources/UI/health.png")
                    })
                );

                const random = (min = 10, max = 20) => {
                    let num = Math.random() * (max - min) + min;
                    return Math.round(num);
                };
                
                let x = player_pos.x, z = player_pos.z;  
                // pick random position near player to spawn              
                this._health_cube.position.set((x+random(10,20)), 1 ,(z+random(10,20)));
                this._health_cube.name = "health_cube";
                this.scene.add(this._health_cube);
            }
        } 
        
        else 
        {
            let dist_to_cube = this._health_cube.position.distanceToSquared(player_pos); 
            if ((dist_to_cube < 2.0) && (this.player.health < 100)) {
                this.player.health = Math.min(this.player.health+50, 100);
                document.getElementById("healthBar").textContent = this.player.health.toString();
                this._last_health_pickup = Date.now();
                this.scene.remove(check_health_cube);
            }
        }
    }

    // these will be used by gun when the player reloads to subtract number of magazines left
    setClipCount(new_clip_count) { 
        this._num_clips += new_clip_count; 
    }

    getClipCount() { 
        return this._num_clips; 
    }

    SpawnAmmoCube() {
        let check_ammo_cube = this.scene.getObjectByName("ammo_cube");
        let player_pos = this.player.model.position;

        // if its not in the scene already
        if (check_ammo_cube == undefined) 
        {
            // define it
            if ((Date.now() - this._last_ammo_pickup) > 15000) 
            {
                this._ammo_cube = new THREE.Mesh(
                    new THREE.BoxGeometry(1,1,1),
                    new THREE.MeshBasicMaterial({
                        map: new THREE.TextureLoader().load("/resources/UI/ammo.png")
                    })
                );

                // randomise spawning position near player
                const random = (min = 10, max = 20) => {
                    let num = Math.random() * (max - min) + min;
                    return Math.round(num);
                };
                
                let x = player_pos.x, z = player_pos.z;                
                this._ammo_cube.position.set((x+random(10,20)), 1 ,(z+random(10,20)));
                // then add it to the scene
                this._ammo_cube.name = "ammo_cube";
                this.scene.add(this._ammo_cube);
            }
            
        } 
        
        // if its already in the scene...
        else 
        {
            // if the player gets close to it... 
            let dist_to_cube = this._ammo_cube.position.distanceToSquared(player_pos); 
            if (dist_to_cube < 1.5) {
                // update number of clips...
                this._num_clips += 1;
                //document.getElementById("clipCount").textContent = this._num_clips.toString();
                // then remove it from the scene
                this.player._shooter._reserve += this.player._shooter._capacity;
                document.getElementById("ammoCount").textContent = this.player._shooter._rounds + "/" + this.player._shooter._reserve;
                this._last_ammo_pickup = Date.now();
                this.scene.remove(check_ammo_cube);
            }
        }
    }

    RAF() 
    {
        if (this.game_over)
        {
            return;
        }

        // if this is true, run the animation
        if (this._runAnim == true) 
        {
            requestAnimationFrame(() => 
            {
                if (this.player.camera3P != null) 
                {
                    // if player dies, stop current animation and respawn
                    if (this.player.health == 0) {
                        this._runAnim = false;
                        this.Respawn();
                    }

                    this.renderer.render(this.scene, this.player.camera3P._camera);
                    this.player.Update();
                }

                this.physics_world.step(1 / 60);
                this.zombieManager.Update();
                this.effectManager.Update();
                // if you've killed x zombies, proceed to next level
                this.CalculateKills(this.zombieManager._zombies);
                this.SpawnHealthCube();
                this.SpawnAmmoCube();
                this.TrySpawnGun()

                this.RAF();
            });
        }
        
        else if (this._runAnim == false) 
        {
            if (this.player.camera3P != null) {
                this.renderer.render(this.scene, this.player.camera3P._camera);
            }
        }
    }
    TrySpawnGun()
    {

        let x = THREE.MathUtils.randFloat(this.player.model.position.x - 50, this.player.model.position.x + 50);
        let z = THREE.MathUtils.randFloat(this.player.model.position.z - 50, this.player.model.position.z + 50);

        let chance = THREE.MathUtils.randInt(1, 1000)

        if (this._kills >= this._max_kills*0.1 && this.weapon_counter == 0)
        {
            this.weapon_counter++;

            
            let gun = new GunItem(this.effectManager, new THREE.Vector3(x, 0, z), ASSET_M4)
        }

        if (this._kills >= this._max_kills*0.2 && this.weapon_counter == 1)
        {
            this.weapon_counter++;
            
            let gun = new GunItem(this.effectManager, new THREE.Vector3(x, 0, z), ASSET_VECTOR)
        }
    }

    _OnWindowResize() {
        // this._player.camera3P._camera.aspect = window.innerWidth / window.innerHeight;
        // this._player.camera3P._camera.updateProjectionMatrix();
        // this._renderer.setSize(window.innerWidth, window.innerHeight);
    }

    GenerateTrees()
    {
        for (let i = 0; i < 150; i++)
        {
            let position = new THREE.Vector3(THREE.MathUtils.randInt(-100, 100), THREE.MathUtils.randInt(-3, -1), THREE.MathUtils.randInt(-100, 100))
            let tree = new Tree(this, position);
        }
    }
    GenerateGrass()
    {
        for (let i = 0; i < 100; i++)
        {
            let position = new THREE.Vector3(THREE.MathUtils.randInt(-80, 80), 0, THREE.MathUtils.randInt(-80, 80))
            let grass = new GrassTuft(this, position);
        }
    }
}