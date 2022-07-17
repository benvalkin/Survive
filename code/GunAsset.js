import {M_M4, Vector_45} from "../code/Main.js";

export class GunAsset
{
    name;

    damage;
    RPM;

    default_firing_mode;
    firing_modes;
    spread;
    recoil;
    capacity;

    model;
    shoot_sound;
    reload_sound;

    icon;

    constructor(name, damage, RPM, default_firing_mode, firing_modes, spread, recoil, capacity, model, shoot_sound, reload_sound, icon)
    {
        this.name = name;
        this.damage = damage;
        this.RPM = RPM;
        this.default_firing_mode = default_firing_mode;
        this.firing_modes = firing_modes;
        this.spread = spread;
        this.recoil = recoil;
        this.capacity = capacity;
        this.model = model;
        this.shoot_sound = shoot_sound;
        this.reload_sound = reload_sound;
        this.icon = icon;
    }
}