struct VertexData{
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) normal: vec4f,
};

struct UniformMatrix{
    transform: mat4x4<f32>
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
    vertex.position = myMatrix.transform*vec4f(position, 1.0f);
    vertex.color = color;
    vertex.normal = vec4f(normal,1.0f);
    return vertex;
}

@fragment
fn fragmentMain(fsInput: VertexData) -> @location(0) vec4f {
    return vec4f(fsInput.color);
}