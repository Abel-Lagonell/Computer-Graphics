struct UniformMatrixes{
    lightMatrix: mat4x4<f32>,
    worldSpaceMatrix: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> matrixes: UniformMatrixes;
        
struct VertexOutput {
    @builtin(position) clip_position: vec4f,
    @location(0) depth: f32
}

struct FragOutputs {
    @builtin(frag_depth) depth: f32,
    @location(0) color: vec4<f32>
}

@vertex
fn vs_main(
    @location(0) inPos: vec3f,
    @location(1) color:vec4f, 
    @location(2) normal:vec3f,
    @location(3) specExp:f32,
    @location(4) spec: vec4f,
) -> VertexOutput {
    var out: VertexOutput;
    var worldPos = matrixes.worldSpaceMatrix * vec4<f32>(inPos, 1.0);
    out.clip_position = matrixes.lightMatrix * worldPos;
    out.depth = out.clip_position.z / out.clip_position.w;
    return out;
}

@fragment
fn fs_main(
    in: VertexOutput,   
    @builtin(front_facing) isFront: bool
) -> FragOutputs {
     var out:FragOutputs;
     if (isFront) {
         out.depth = in.depth;
     }
     else {
         out.depth = in.depth - 0.001;
     }
     out.color = vec4<f32>(0.0,1.0,0.0,1.0);
     return out;
 }