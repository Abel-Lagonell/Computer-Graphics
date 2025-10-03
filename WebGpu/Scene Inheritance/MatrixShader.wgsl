struct VertexData{
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) normal: vec4f,
    @location(2) worldSpace: vec4f,
    @location(3) specExp: f32,
    @location(4) spec: vec4f
};

struct UniformMatrix{
    clipSpaceMatrix: mat4x4<f32>,
    worldSpaceMatrix: mat4x4<f32>,
    normalMatrix: mat4x4<f32>,
    cameraPosition: vec4f,
}

struct PointLight{
    position: vec4f, // 16 bytes
    color : vec4f, // 16 bytes
}

struct pointLightSystem {
    numPoint: u32, // 4 bytes
    ka: f32, // 4 bytes
    // 8 bytes padding
    ia: vec3f, //12 bytes
    // 4 bytes padding

    dirLightDir: vec4f,
    dirLightCol: vec4f,
    pointLights: array<PointLight, 10> //32 bytes per
}

@group(0) @binding(0) var<uniform> myMatrix: UniformMatrix;
@group(0) @binding(1) var<uniform> simpleLight: pointLightSystem;

@vertex
fn vertexMain(
    @location(0) position:vec3f, 
    @location(1) color:vec4f, 
    @location(2) normal:vec3f,
    @location(3) specExp:f32,
    @location(4) spec: vec4f,
) -> VertexData {
    var vertex: VertexData;
    vertex.worldSpace = myMatrix.worldSpaceMatrix*vec4f(position, 1.0f);
    vertex.position = myMatrix.clipSpaceMatrix*vec4f(position, 1.0f);
    vertex.color = color;
    vertex.normal = myMatrix.normalMatrix*vec4f(normal, 0.0f);
    vertex.specExp = specExp;
    vertex.spec = spec;
    return vertex;
}

@fragment
fn fragmentMain(fsInput: VertexData) -> @location(0) vec4f {
    var diffusePower: vec3f = vec3<f32>(0.0);
    var specPower: vec3f = vec3<f32>(0.0);
    var light: PointLight;
    var lRaw : vec3<f32>;
    var vRaw : vec3<f32>;
    var l : vec3<f32>;
    var v : vec3<f32>;
    var L : vec3<f32>;
    var V : vec3<f32>;
    var N : vec3<f32>;
    var R : vec3<f32>;
    var IL : f32;
    var IS : f32;
    var attenuation : f32;
    var end = min(simpleLight.numPoint, 10u);

    let ambient = simpleLight.ka * simpleLight.ia;
    //Normal
    N = normalize(fsInput.normal).xyz;
    //View
    v = (myMatrix.cameraPosition - fsInput.worldSpace).xyz;
    vRaw = normalize(v);
    V = select(vec3<f32>(0.0,0.0,1.0), vRaw, all(vRaw != vec3<f32>(0.0)));

    // Directional light
    lRaw = normalize(simpleLight.dirLightDir).xyz;
    L = select(vec3<f32>(0.0, 0.0, 1.0), lRaw, all(lRaw != vec3<f32>(0.0)));
    R = normalize(2.0 * dot(N, L) * N - L);

    IL = max(dot(N, L), 0.0);
    IS = pow(max(dot(R, V), 0.0), fsInput.specExp);

    var intensity = simpleLight.dirLightCol.w;
    var dirPower = simpleLight.dirLightCol.xyz * IL * intensity;
    specPower += simpleLight.dirLightCol.xyz * fsInput.spec.xyz * IS * intensity;

    for (var i =0u; i < end; i++){
        light = simpleLight.pointLights[i];
        l = (light.position-fsInput.worldSpace).xyz;
        attenuation = 2.0/(length(l)*length(l));
        lRaw = normalize(l);
        L = select(vec3<f32>(0.0,0.0,1.0), lRaw, all(lRaw != vec3<f32>(0.0)));
        R = normalize( 2*(dot(N,L))*N-L);

        //Light intensity goes here multiplied
        IL = max(dot(N,L),0.0)*attenuation;
        IS = pow(max(dot(R,V),0.0),fsInput.specExp)* attenuation;
        intensity = light.color.w;
        diffusePower += light.color.xyz * IL * intensity;
        specPower += light.color.xyz*fsInput.spec.xyz*IS * intensity;
    }
    return vec4f(fsInput.color.xyz* (ambient+ diffusePower)+specPower+dirPower, 1);
}