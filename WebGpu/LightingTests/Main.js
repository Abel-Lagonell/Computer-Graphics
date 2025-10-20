import {WebGPU} from "../WebGPU.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {Camera} from "../Scene Inheritance/Camera.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {Color} from "../Scene Inheritance/Color.js";
import {SpotLight} from "../Scene Inheritance/Light/SpotLight.js";
import {PointLight} from "../Scene Inheritance/Light/PointLight.js";
import {Logger} from "../Logger.js";
import {OBJParser} from "../Scene Inheritance/OBJParser.js";
import {SixAxisController} from "../Scene Inheritance/SixAxisController.js";
import {AmbientLight} from "../Scene Inheritance/Light/AmbientLight.js";
import {DirectionalLight} from "../Scene Inheritance/Light/DirectionalLight.js";

class Main {
    constructor() {
        this.web = new WebGPU;
        this.parser = new OBJParser();
        this.BufferObject();
    }

    async BufferObject() {
        await this.web.WaitForReady();

        let ambient = new AmbientLight();
        let direction = new DirectionalLight();
        let camera = new Camera({
            position: new Vector3(0,0,0),
        });
        Transform.setCameraReference(camera);

        let plane = await this.parser.parseObj("../STARWARS/", "Hangar");
        plane.position = new Vector3(25, -10,25)
        plane.rotation = new Vector3(0,Math.PI,0)


        //Blue Lights
        let pLight1 = new PointLight({
            position: new Vector3(15.5,0.25,3),
            color: [0.5,0.5,1,2],
        });

        let pLight2 = new PointLight({
            position: new Vector3(26.5,0.25,3),
            color: [0.5,0.5,1,2],
        });

        let pLight3 = new PointLight({
            position: new Vector3(37.5,0.25,3),
            color: [0.5,0.5,1,2],
        });

        let pLight4 = new PointLight({
            position: new Vector3(4.5,0.25,3),
            color: [0.5,0.5,1,2],
        });

        plane.AddChild(pLight1)
        plane.AddChild(pLight2)
        plane.AddChild(pLight3)
        plane.AddChild(pLight4)

        var currentTime = 0;
        //White Lights
        let pLight5 = new PointLight({
            position: new Vector3(15.5,10,3),
            color: [1,1,1,2],
        });
        pLight5.Update = () => {
            currentTime += this.web.deltaTime
            pLight5.position = new Vector3(15.5, 10 + 5*Math.sin(currentTime), 3)
        }

        let pLight6 = new PointLight({
            position: new Vector3(26.5,10,3),
            color: [1,1,1,2],
        });
        pLight6.Update = () => {
            pLight6.position = new Vector3(26.5, 10 + 5*Math.sin(currentTime), 3)
        }

        let pLight7 = new PointLight({
            position: new Vector3(37.5,10,3),
            color: [1,1,1,2],
        });
        pLight7.Update = () => {
            pLight7.position = new Vector3(37.5, 10 + 5*Math.sin(currentTime), 3)
        }

        let pLight8 = new PointLight({
            position: new Vector3(4.5,10,3),
            color: [1,1,1,2],
        });
        pLight8.Update = () => {
            pLight8.position = new Vector3(4.5, 10 + 5*Math.sin(currentTime), 3)
        }

        let pLight9 = new PointLight({
            position: new Vector3(46,10,3),
            color: [1,1,1,1],
        });
        pLight9.Update = () => {
            pLight9.position = new Vector3(46, 10 + 5*Math.sin(currentTime), 3)
        }

        plane.AddChild(pLight5)
        plane.AddChild(pLight6)
        plane.AddChild(pLight7)
        plane.AddChild(pLight8)
        plane.AddChild(pLight9)

        //Last Light
        let pLight10 = new PointLight({
            position: new Vector3(25,0.25,20),
            color: [1,0.5,0.5,2],
        })

        plane.AddChild(pLight10)

        let cube = await this.parser.parseObj("../STARWARS/", "TieFighterRemastered");
        cube.position = new Vector3(25,10,20);
        cube.scale = new Vector3(1,1,1).scale(3);
        plane.AddChild(cube) ;

        //Landing Lights
        let sLight1 = new SpotLight({
            position: new Vector3(0,10,5),
            color: [1,1,1,10],
            rotation: new Vector3(-Math.PI/2,0,0),
            focus: 0.95,
        })

        let sLight2 = new SpotLight({
            position: new Vector3(-15,10,5),
            color: [1,1,1,10],
            rotation: new Vector3(-Math.PI/2,0,0),
            focus: 0.95,
        })

        let sLight3 = new SpotLight({
            position: new Vector3(15,10,5),
            color: [1,1,1,10],
            rotation: new Vector3(-Math.PI/2,0,0),
            focus: 0.95,
        })


        let controller = new SixAxisController({
            position: new Vector3(0,3,-5),
            linearSpeed: 50,
            localSpace: true,
        });
        controller.AddChild(camera)

        await this.web.AddShape([plane, controller]);
        await this.web.AddShape([sLight1, sLight2, sLight3]);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main");
    let m = new Main();
})