import {DirectionalLight} from ".\Scene Inheritance\Light\DirectionalLight.js"

class Shadows extends DirectionalLight
{
    constructor(options = {})
    {
        const {
            name = "Shadows",
            color = [0.5,0.5,0.5,1],
            rotation = new Vector3(-Math.PI/4, Math.PI, 0)
        } = options;

        super({...options, name: name, color: color, rotation: rotation})
    } 
}