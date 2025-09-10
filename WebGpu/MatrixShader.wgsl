struct VertexData{
    @builtin(position) position: vec4f,
    @location(0) color: vec3f
};

struct UniformMatrix{
    transform: mat4x4<f32>
}
@group(0) @binding(0) var<uniform> myMatrix: UniformMatrix;

@vertex
fn vertexMain(@location(0) position:vec3f, @location(1) color:vec3f) -> VertexData {
    var vertex: VertexData;
    vertex.position = myMatrix.transform*vec4f(position, 1.0f);
    vertex.color = color;
    return vertex;
}

@fragment
fn fragmentMain(fsInput: VertexData) -> @location(0) vec4f {
    return vec4f(fsInput.color, 1.0f);
}