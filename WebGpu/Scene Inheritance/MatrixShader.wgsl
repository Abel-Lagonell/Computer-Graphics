struct VertexData{
    @builtin(position) position: vec4f,
    @location(1) normal: vec4f,
    @location(2) worldSpace: vec4f,
    @interpolate(flat) @location(3) materialIndex: u32,
    @location(4) textCoord: vec2f,
};

struct UniformMatrix{
    clipSpaceMatrix: mat4x4<f32>,
    worldSpaceMatrix: mat4x4<f32>,
    normalMatrix: mat4x4<f32>,
    cameraPosition: vec4f,
}

struct Light{
    vector4: vec4f, // 16 bytes
    color : vec4f, // 16 bytes
}

struct SpotLight {
    light: Light, // 32 bytes
    direction: vec4f, // 16 bytes
}

struct LightSystem {
    numPoint: u32, // 4 bytes
    numSpot: u32, //4 bytes
    // 8 bytes padding
    ambientColor: vec4f, //16 bytes
    dirLight: Light, //32 bytes
    pointLights: array<Light, 10>, //32 bytes per
    spotLights: array<SpotLight, 10> //48 bytes per
}

struct Material { //48 bytes
    ambient: vec3f, //12 bytes
    transparency: f32, // 4 bytes
    diffuse: vec3f, //12 bytes
    refraction: f32, // 4 bytes
    specular: vec3f, // 12 bytes
    specularExponent: f32, // 4 bytes
}

@group(0) @binding(0) var<uniform> myMatrix: UniformMatrix;
@group(0) @binding(1) var<uniform> simpleLight: LightSystem;
@group(0) @binding(2) var<uniform> materials: array<Material, 20>;
@group(0) @binding(3) var textures: texture_2d_array<f32>;
@group(0) @binding(4) var normals: texture_2d_array<f32>;
@group(0) @binding(5) var ourSampler: sampler;

fn repeatTexCoord(coord: vec2f) -> vec2f {
    var wrapped = fract(coord);
    let epsilon = 0.001;
    wrapped = clamp(wrapped, vec2f(epsilon), vec2f(1.0 - epsilon));
    return wrapped;
}

@vertex
fn vertexMain(
    @location(0) position:vec3f, 
    @location(1) normal:vec3f,
    @location(2) material: f32,
    @location(3) textCoord: vec2f,
) -> VertexData {
    var vertex: VertexData;
    vertex.worldSpace = myMatrix.worldSpaceMatrix*vec4f(position, 1.0f);
    vertex.position = myMatrix.clipSpaceMatrix*vec4f(position, 1.0f);
    vertex.normal = myMatrix.normalMatrix*vec4f(normal, 0.0f);
    vertex.materialIndex = u32(material);
    vertex.textCoord = textCoord;
    return vertex;
}

@fragment
fn fragmentMain(fsInput: VertexData) -> @location(0) vec4f {
    var diffusePower: vec3f = vec3<f32>(0.0);
    var specPower: vec3f = vec3<f32>(0.0);
    var light: Light;
    var spotLight : SpotLight;
    var focus : f32;
    var l : vec3<f32>;
    var attenuation : f32;
    var pointEnd = min(simpleLight.numPoint, 10u);
    var spotEnd = min(simpleLight.numSpot, 10u);

    var material = materials[fsInput.materialIndex];
    
    var baseColor: vec3f;
    var normalDir: vec3f;

    // Use texture - the negative value encodes the texture index
    let texIndex = u32(-material.diffuse.x - 1.0);

    var textCoord = repeatTexCoord(fsInput.textCoord);
    textCoord = vec2f((textCoord.x*material.diffuse.y)/640, ((1-textCoord.y)*material.diffuse.y)/640);

    let sampledColor = textureSample(textures, ourSampler, textCoord, texIndex);
    let normalColor = textureSample(normals, ourSampler, textCoord, texIndex);

    if (material.diffuse.x < 0.0) {
        baseColor = sampledColor.rgb;
    } else {
        baseColor = material.diffuse;
    }


    let pos_dx = dpdx(fsInput.worldSpace.xyz);

    if (material.diffuse.z == 1){
        // Get normal map sample and convert from [0,1] to [-1,1]
        let normalSample = normalColor.xyz * 2.0 - 1.0;

        let N = normalize(fsInput.normal.xyz);
        let B = normalize(cross(N, pos_dx));
        let T = normalize(cross(B, N));
        
       normalDir = normalize(
           T * normalSample.x +
           B * normalSample.y +
           N * normalSample.z
       ); 
    } else {
        normalDir = fsInput.normal.xyz;
    }


    //Ambient
    let ambient = (simpleLight.ambientColor.xyz * simpleLight.ambientColor.w) * material.ambient;
        
    //Normal
    var N : vec3f = normalize(normalDir).xyz;
    //View
    var v : vec3f = (myMatrix.cameraPosition - fsInput.worldSpace).xyz;
    var vRaw : vec3f = normalize(v);
    var V : vec3f = select(vec3<f32>(0.0,0.0,1.0), vRaw, all(vRaw != vec3<f32>(0.0)));

    // Directional light
    var lRaw: vec3f = -normalize(simpleLight.dirLight.vector4.xyz);
    var L: vec3f = select(vec3<f32>(0.0, 0.0, 1.0), lRaw, any(lRaw != vec3<f32>(0.0)));
    
    var R: vec3f = normalize(2.0 * dot(N, L) * N - L);

    var IL: f32 = max(dot(N, L), 0.0);
    var IS: f32 = pow(max(dot(R, V), 0.0), material.specularExponent);

    var intensity = simpleLight.dirLight.color.w;
    diffusePower += simpleLight.dirLight.color.xyz * IL * intensity;
    specPower += material.specular.xyz * IS * (intensity * 0.1);

    // Point Lights
    for (var i = 0u; i < pointEnd; i++) {
        light = simpleLight.pointLights[i];
        l = (light.vector4 - fsInput.worldSpace).xyz;
        attenuation = 0.1 + 1.0 / (length(l) * length(l));
        lRaw = normalize(l);
        L = select(vec3<f32>(0.0, 0.0, 1.0), lRaw, any(lRaw != vec3<f32>(0.0)));
        R = normalize(2.0 * (dot(N, L)) * N - L);

        IL = max(dot(N, L), 0.0) * attenuation;
        IS = pow(max(dot(R, V), 0.0), material.specularExponent) * attenuation;
        intensity = light.color.w;
        diffusePower += (light.color.xyz * IL * intensity);
        specPower += material.specular.xyz * IS * intensity * IL;
    }
    
    // Spot Lights
    for (var i = 0u; i < spotEnd; i++) {
        spotLight = simpleLight.spotLights[i];
        light = spotLight.light;

        l = (light.vector4 - fsInput.worldSpace).xyz;
        attenuation = 0.1 + 1.0 / (length(l) * length(l));
            
        lRaw = normalize(l);
        L = select(vec3<f32>(0.0, 0.0, 1.0), lRaw, any(lRaw != vec3<f32>(0.0)));
            
        focus = dot(L, -normalize(spotLight.direction.xyz));
        if (focus >= spotLight.direction.w) {
            R = normalize(2.0 * dot(N, L) * N - L);
                
            intensity = light.color.w;
            IL = max(dot(N, L), 0.0) * attenuation;
            IS = pow(max(dot(R, V), 0.0), material.specularExponent) * attenuation;
            
            diffusePower += (light.color.xyz * IL * intensity);
            specPower += material.specular * IS * intensity * IL;
        }
    }
    
    // Apply lighting to base color (texture or diffuse)
    return vec4f(baseColor * (ambient + diffusePower + specPower), material.transparency);
}