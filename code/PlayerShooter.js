import * as THREE from "../libraries/three.js-master/build/three.module.js";
import {playershoot, ASSET_VECTOR} from "../code/Main.js";
import {Tracer} from "../code/E_Tracer.js";

export class PlayerShooter
{
    _audioLoader;
    _audioListener;

    _is_firing;
    _is_reloading;
    _start_reload = false;

    _RPM;
    _reload_time; // reload duration in seconds
    _time_last_fired; // milisecond timestamp since last shot was fired
    _primed;

    _firing_mode; // firing mode of the player's weapon
    _firing_modes;
    _spread;

    _bursts; // 3-round burst counter if firing mode is set to 'BURST'

    _rounds; // current numbr of rounds in the magazine, weapon will stop firing if this reaches 0
    _capacity; // magazine capacity, weapon will stop firing if this reaches 0
    _reserve; // number of spare rounds we have to reload

    _player; // not used for anything directly, we just use its position Vector3  for raycasting

    _look_raycaster;

    _recoil;

    _shoot_sound;
    _reload_sound;

    _time_since_gameended;

    constructor(player)
    {
        this._audioLoader = new THREE.AudioLoader();
        this._audioListener = new THREE.AudioListener();
        player.camera3P._camera.add(this._audioListener);

        this._RPM = 850;

        this._is_firing = false;
        this._is_reloading = false; // boolean

        this._time_last_fired = Number.MIN_SAFE_INTEGER;

        this._rounds = 30;
        this._capacity = 30;
        this._reserve = 90;
        this._primed = true;
        this._reload_time = 6;

        this._bursts = 1;
        this._spread = 0.01;

        this._recoil = 0.01;

        this._firing_mode = 'SEMI';

        this._firing_modes = ['SEMI', 'BURST'];

        this._player = player;

        this._look_raycaster = new THREE.Raycaster();
        this._look_raycaster.near = 1;

        this._shoot_sound = './resources/sounds/M4_fire.mp3';
        this._reload_sound = './resources/sounds/M4_reload.mp3';

        document.getElementById("ammoCount").textContent = this._rounds + "/" + this._reserve;

        document.addEventListener('mousedown', (e) => this._onMouseDown(e), false);
        document.addEventListener('mouseup', (e) => this._onMouseUp(e), false);
        document.addEventListener('reload_pressed', (e) => this._onReloadPressed(e), false);
        document.addEventListener('firingmode_pressed', (e) => this._onFiringModePressed(e), false);
        document.addEventListener('hitmarker', (e) => this._onHitMarker(e), false);
        document.addEventListener('hitmarker_head', (e) => this._onHitMarkerHead(e), false);
    }

    _onHitMarker(event)
    {
        const hitmarker = new THREE.Audio(this._audioListener);
        this._audioLoader.load('./resources/sounds/hitmarker.mp3', function (buffer) {
            hitmarker.setBuffer(buffer);
            hitmarker.setLoop(false);
            hitmarker.setVolume(1.0);
            hitmarker.play();
        });
    }
    _onHitMarkerHead(event)
    {
        const hitmarker = new THREE.Audio(this._audioListener);
        this._audioLoader.load('./resources/sounds/hitmarker_head.mp3', function (buffer) {
            hitmarker.setBuffer(buffer);
            hitmarker.setLoop(false);
            hitmarker.setVolume(1.0);
            hitmarker.play();
        });
    }

    _onMouseDown(event)
    {
        if (event.button == 0)
        {
            if (!this._is_reloading)
            {
                this._is_firing = true;
            }
        }
    }
    _onMouseUp(event)
    {
        if (event.button == 0)
        {
            this._is_firing = false;
            if (this._firing_mode === 'BURST')
            {
                this._bursts = 1;
            }
        }
    }
    _onReloadPressed(event)
    {
        if (this._reserve == 0)
        {
            return;
        }
        if (!this._is_reloading)
        {
            this._start_reload = true;
            this._reload_finished = false;

            const reload_sound = new THREE.PositionalAudio(this._audioListener);

            this._player.model.add(reload_sound);
            this._audioLoader.load( './resources/sounds/M4_reload.mp3', function( buffer ) {
                reload_sound.setBuffer( buffer );
                reload_sound.setRefDistance(40);
                reload_sound.setLoop( false );
                reload_sound.setVolume( 1.0 );
                reload_sound.play();
            });
        }
    }
    _onFiringModePressed(event)
    {
        if (!this._is_reloading)
        {
            if (this._firing_modes.length == 1)
            {
                return;
            }
            let next;
            for (let i = 0; i < this._firing_modes.length; i++)
            {
                if (this._firing_modes[i] === this._firing_mode)
                {
                    next = i + 1;
                    if (next == this._firing_modes.length)
                    {
                        next = 0;
                    }
                    this._firing_mode = this._firing_modes[next];
                    break;
                }
            }

            const reload_sound = new THREE.PositionalAudio(this._audioListener);

                document.getElementById("firingMode").textContent = this._firing_mode;

                this._player.model.add(reload_sound);
                this._audioLoader.load( './resources/sounds/Vector_firing_mode.mp3', function( buffer ) {
                    reload_sound.setBuffer( buffer );
                    reload_sound.setRefDistance(40);
                    reload_sound.setLoop( false );
                    reload_sound.setVolume( 1.0 );
                    reload_sound.play();
                });
        }
    }

    Update(scene)
    {

        if (this._is_reloading)
        {
            const anim_reload = this._player._anim_reload;
            const time = (this._player.animation_mixer.clipAction(anim_reload).time / anim_reload.duration).toFixed(2);
            if (time >= 0.9)
            {
                if (!this._reload_finished)
                {
                    if (this._reserve >= this._capacity)
                    {
                        this._reserve -= (this._capacity - this._rounds);
                        this._rounds = this._capacity;
                    }
                    else
                    {
                        this._rounds = this._reserve;
                        this._reserve = 0;
                    }
    
                    this._reload_finished = true;
                    
                    document.getElementById("ammoCount").textContent = this._rounds + "/" + this._reserve;
                }
            }
            return;
        }
        if (this._is_firing)
        {
            if (this._rounds > 0)
            {
                if (Date.now() - this._time_last_fired > (1 / (this._RPM / 60)) * 1000)
                {
                    const shoot_sound = new THREE.PositionalAudio(this._audioListener);

                    this._player.model.add(shoot_sound);
                    this._audioLoader.load(this._shoot_sound, function (buffer){
                        shoot_sound.setBuffer(buffer);
                        shoot_sound.setRefDistance(40);
                        shoot_sound.setLoop(false);
                        shoot_sound.setVolume(1.5);
                        shoot_sound.play();
                    });

                    this.Shoot(scene);

                    this._time_last_fired = Date.now();

                    this._rounds--;

                    document.getElementById("ammoCount").textContent = this._rounds + "/" + this._reserve;

                    if (this._firing_mode === 'SEMI')
                    {
                        this._is_firing = false;
                    }
                    if (this._firing_mode === 'BURST')
                    {
                        if (this._bursts == 3)
                        {
                            this._is_firing = false;
                            this._bursts = 1;
                        }
                        else {this._bursts++;}
                    }
                }
            }
            else if (this._primed)
            {
                const bolt_sound = new THREE.PositionalAudio(this._audioListener);
                this._player.model.add(bolt_sound);
                this._audioLoader.load( './resources/sounds/M4_boltclick.mp3', function( buffer ) {
                    bolt_sound.setBuffer( buffer );
                    bolt_sound.setRefDistance(40);
                    bolt_sound.setLoop( false );
                    bolt_sound.setVolume( 1.0 );
                    bolt_sound.play();
                });
                this._primed = false;
                this._is_firing = false;
            }
            else {
                const trigger_sound = new THREE.PositionalAudio(this._audioListener);
                this._player.model.add(trigger_sound);
                this._audioLoader.load('./resources/sounds/M4_trigger.mp3', function (buffer) {
                    trigger_sound.setBuffer(buffer);
                    trigger_sound.setRefDistance(40);
                    trigger_sound.setLoop(false);
                    trigger_sound.setVolume(1.0);
                    trigger_sound.play();
                });
                this._is_firing = false;
            }
        }
    }

    Shoot(scene)
    {
        console.log("shoot");

        const barrel = this._player._gun._barrel;

        document.dispatchEvent(playershoot);

        const global_pos = new THREE.Vector3();
        const global_dir = new THREE.Vector3();
        const global_rot = new THREE.Quaternion();
        barrel.getWorldPosition(global_pos);
        barrel.getWorldDirection(global_dir);
        barrel.getWorldQuaternion(global_rot);

        let randX = Math.random()*this._spread*2 - this._spread;
        let randY = Math.random()*this._spread*2 - this._spread;

        global_dir.applyAxisAngle (new THREE.Vector3(1, 0, 0), randY)
        global_dir.applyAxisAngle (new THREE.Vector3(0, 1, 0), randX)

        const tracer = new Tracer(this._player.world.effectManager, 5, global_pos, global_rot, global_dir, this._player._gun.damage);

        this._player._spine.rotation.y += this._recoil //recoil simulation?
        this._player._spine.rotation.x += THREE.MathUtils.randFloat(this._recoil*-1, this._recoil);
    }

    Look(scene)
    {
        let spine;

        if (this._is_reloading) { spine = this._player._spine; }
        else { spine = this._player.neck }

        if (spine == null)
        {
            return new THREE.Vector3(0, 0, 0);
        }

        const global_pos = new THREE.Vector3();
        const global_dir = new THREE.Vector3();
        const global_rot = new THREE.Quaternion();
        spine.getWorldPosition(global_pos);
        spine.getWorldDirection(global_dir);
        spine.getWorldQuaternion(global_rot);

        let randX = Math.random()*this._spread*2 - this._spread;
        let randY = Math.random()*this._spread*2 - this._spread;

        global_dir.applyAxisAngle (new THREE.Vector3(1, 0, 0), randY)
        global_dir.applyAxisAngle (new THREE.Vector3(0, 1, 0), randX)

        //const arrow = new THREE.ArrowHelper(global_rot, global_pos, 10, 0xffff00 );
        //scene.add( arrow );

        this._look_raycaster.set(global_pos, global_dir);

        // calculate objects intersecting the picking ray
        const hit = [];
        const intersects = this._look_raycaster.intersectObjects(scene.children, false, hit);


        if (hit[0] != null)
        {
            return hit[0].point;
        }
        else
        {
            return global_pos;
        }
    }
}