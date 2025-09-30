struct VertexData{
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) normal: vec4f,
    @location(2) worldSpace: vec4f,
};

struct UniformMatrix{
    clipSpaceMatrix: mat4x4<f32>,
    worldSpaceMatrix: mat4x4<f32>
}

struct PointLight{
    position: vec4f,
    color : vec4f,
}

struct pointLightSystem {
    numPoint: u32,
    pointLights: array<PointLight, 10>
}

@group(0) @binding(0) var<uniform> myMatrix: UniformMatrix;
@group(0) @binding(1) var<uniform> simpleLight: pointLightSystem;

@vertex
fn vertexMain(@location(0) position:vec3f, @location(1) color:vec4f, @location(2) normal:vec3f) -> VertexData {
    var vertex: VertexData;
    vertex.worldSpace = myMatrix.worldSpaceMatrix*vec4f(position, 1.0f);
    vertex.position = myMatrix.clipSpaceMatrix*vec4f(position, 1.0f);
    vertex.color = color;
    vertex.normal = myMatrix.worldSpaceMatrix*vec4f(normal,0.0f);
    return vertex;
}

@fragment
fn fragmentMain(fsInput: VertexData) -> @location(0) vec4f {
    var lightPower: vec3f = vec3<f32>(0.0);
    lightPower = vec3f(0,0,0);
    var light: PointLight;
    var lRaw : vec3<f32>;
    var l : vec3<f32>;
    var L : vec3<f32>;
    var IL : f32;
    var end = min(simpleLight.numPoint, 10u);
    
    for (var i =0u; i < end; i++){
        light = simpleLight.pointLights[i];
        l = (light.position-fsInput.worldSpace).xyz;
        lRaw = normalize(l);
        L = select(vec3<f32>(0.0,0.0,1.0), lRaw, all(lRaw != vec3<f32>(0.0)));
        //Light intensity goes here multiplied
        IL = max(dot(normalize(fsInput.normal.xyz),L),0.0)/length(l);
        lightPower += light.color.xyz*IL;
    }
    //0.1f is ambient Light
    return vec4f(fsInput.color.xyz*.1f+lightPower, 1);
}