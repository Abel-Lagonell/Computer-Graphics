import {Vector3} from ".\Scene Inheritance\Vector3.js";
import {DirectionalLight} from ".\Scene Inheritance\Light\DirectionalLight.js"

class Shadows extends DirectionalLight
{
    constructor(options = {})
    {
        this.distance = 0.5
        this.center = [0, 0, 0]


        const {
            name = "Shadows",
            color = [0.5,0.5,0.5,1],
            rotation = new Vector3(-Math.PI/4, Math.PI, 0)
        } = options;

        super({...options, name: name, color: color, rotation: rotation})
    } 

    ShadowLookAt(pos,forward,up)
    {
        if(Math.abs(Vector3.dot(forward, up)) > 0.999)
        {
            var newUp = Math.abs(forward[1]) < 0.999 ? up : forward;
        }

        return this.getLookAtLH(pos,forward,newUp)
    }
}