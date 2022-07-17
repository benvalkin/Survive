export class EffectManager
{
    world;
    _effects; // list of effects

    constructor(world)
    {
        this.world = world;
        this._effects = [];
    }
    AddNewEffect(effect)
    {
        this._effects.push(effect)
    }
    Update()
    {
        for(let i = 0; i < this._effects.length; i++)
        {
            this._effects[i].Update();
        }
    }
}