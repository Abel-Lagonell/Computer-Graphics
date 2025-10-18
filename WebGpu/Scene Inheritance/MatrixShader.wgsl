struct VertexData{
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) normal: vec4f,
    @location(2) worldSpace: vec4f,
    @location(3) specExp: f32,
    @location(4) spec: vec4f,
    @location(5) lightSpacePos: vec4f,
};

struct UniformMatrix{
    clipSpaceMatrix: mat4x4<f32>,
    worldSpaceMatrix: mat4x4<f32>,
    normalMatrix: mat4x4<f32>,
    cameraPosition: vec4f,
    lightSpaceMatrix: mat4x4<f32>,
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

@group(0) @binding(0) var<uniform> myMatrix: UniformMatrix;
@group(0) @binding(1) var<uniform> simpleLight: LightSystem;
@group(0) @binding(2) var shadowMap: texture_depth_2d;
@group(0) @binding(3) var shadowSampler: sampler_comparison;

fn calculateShadow(lightSpacePos: vec4f) -> f32 {
    // Perspective divide
    var projCoords = lightSpacePos.xyz / lightSpacePos.w;
    
    // Transform to [0,1] range for texture sampling
    projCoords.x = projCoords.x * 0.5 + 0.5;
    projCoords.y = projCoords.y * 0.5 + 0.5;
    // Y is flipped in texture coordinates
    projCoords.y = 1.0 - projCoords.y;
    
    // Get current fragment depth
    let currentDepth = projCoords.z;
    
    // Bias to prevent shadow acne
    let bias = 0.01;
    
    // PCF (Percentage Closer Filtering) for softer shadows
    var shadow = 0.0;
    let texelSize = 1.0 / 2048.0; // Match your shadow map size
    
    for (var x = -1; x <= 1; x++) {
        for (var y = -1; y <= 1; y++) {
            let offset = vec2<f32>(f32(x), f32(y)) * texelSize;
            let sampleCoord = projCoords.xy + offset;
            
            // Sample shadow map and compare
            shadow += textureSampleCompare(
                shadowMap, 
                shadowSampler, 
                sampleCoord, 
                currentDepth - bias
            );
        }
    }
    shadow /= 9.0; // Average of 9 samples
    
    return shadow;
}

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
    vertex.lightSpacePos = myMatrix.lightSpaceMatrix * vec4f(position, 1.0f);
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
    
    //Ambient
    let ambient = simpleLight.ambientColor.xyz * simpleLight.ambientColor.w;
        
    //Normal
    var N : vec3f = normalize(fsInput.normal).xyz;
    //View
    var v : vec3f = (myMatrix.cameraPosition - fsInput.worldSpace).xyz;
    var vRaw : vec3f = normalize(v);
    var V : vec3f = select(vec3<f32>(0.0,0.0,1.0), vRaw, all(vRaw != vec3<f32>(0.0)));

    // Directional light
    var lRaw : vec3f = -normalize(simpleLight.dirLight.vector4.xyz);
    var L : vec3f = select(vec3<f32>(0.0, 0.0, 1.0), lRaw, any(lRaw != vec3<f32>(0.0)));
    
    var R : vec3f = normalize(2.0 * dot(N, L) * N - L);

    var IL : f32 = max(dot(N, L), 0.0);
    var IS : f32 = pow(max(dot(R, V), 0.0), fsInput.specExp);

    let shadow = calculateShadow(fsInput.lightSpacePos);

    var intensity = simpleLight.dirLight.color.w;
    diffusePower += simpleLight.dirLight.color.xyz * IL * intensity *shadow ;
    specPower +=  fsInput.spec.xyz * IS * (intensity *0.1) * shadow ;

    //Point Lights
    for (var i =0u; i < pointEnd; i++){
        light = simpleLight.pointLights[i];
        l = (light.vector4-fsInput.worldSpace).xyz;
        attenuation = 0.1 + 1.0/(length(l)*length(l));
        lRaw = normalize(l);
        L = select(vec3<f32>(0.0,0.0,1.0), lRaw, any(lRaw != vec3<f32>(0.0)));
        R = normalize( 2*(dot(N,L))*N-L);

        //Light intensity goes here multiplied
        IL = max(dot(N,L),0.0)*attenuation;
        IS = pow(max(dot(R,V),0.0),fsInput.specExp)* attenuation;
        intensity = light.color.w;
        diffusePower += (light.color.xyz * IL * intensity);
        specPower += fsInput.spec.xyz * IS * intensity * IL;
    }
    
    for (var i =0u; i < spotEnd; i++){
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
            IS = pow(max(dot(R, V), 0.0), fsInput.specExp) * attenuation;
            
            diffusePower += (light.color.xyz * IL * intensity);
            specPower += fsInput.spec.xyz * IS * intensity * IL;
        }
    }
    return vec4f(fsInput.color.xyz* (ambient + diffusePower + specPower), 1);
}