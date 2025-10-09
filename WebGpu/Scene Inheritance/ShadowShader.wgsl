struct VertexInput {
    @location(0) position: vec3f,
    @location(1) color: vec4f,
    @location(2) normal: vec3f,
    @location(3) specExp: f32,
    @location(4) spec: vec4f,
};

struct VertexOutput {
    @builtin(position) position: vec4f,
};

struct UniformMatrix {
    lightSpaceMatrix: mat4x4<f32>, // Light's view-projection matrix
};

@group(0) @binding(0) var<uniform> uniforms: UniformMatrix;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    // Transform vertex to light's clip space
    output.position = uniforms.lightSpaceMatrix * vec4f(input.position, 1.0);
    return output;
}