type float4 = vec4<f32>;

@group(0) @binding(0) var<uniform> cameraMatrix: mat4x4<f32>;

struct VertexOutput {
    @builtin(position) clip_position: vec4f,
    @location(0) depth: f32
}

struct FragOutputs {
    @builtin(frag_depth) depth: f32,
    @location(0) color: float4
}

@vertex
fn vertexMain(
    @location(0) inPos: vec3f,
) -> VertexOutput {
    var out: VertexOutput;
    out.clip_position = lightMatrix * float4(inPos, 1.0);
    out.depth = out.clip_position.z / out.clip_position.w;
    return out;
}

@fragment
fn fragmentMain(
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