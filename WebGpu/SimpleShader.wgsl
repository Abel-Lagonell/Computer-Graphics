struct VertexData 
{
    @builtin(position) position: vec4f,
    @location(0) color: vec3f,
};

struct UniformCoordinates{
    translation: vec3f,
    rotation: vec3f,
    scale: vec3f,
}
@group(0) @binding(0) var<uniform> myCords: UniformCoordinates;

struct CameraInfo{
    translation: vec3f,
    rotation: vec3f
}
@group(1) @binding(0) var<uniform> myCam: CameraInfo;

fn MoveCamera(vert: vec4f) -> vec4f{
    var translationM : mat4x4<f32> = mat4x4<f32>(
        vec4<f32>(1.0,  0.0,    0.0,    0.0),
        vec4<f32>(0.0,  1.0,    0.0,    0.0),
        vec4<f32>(0.0,  0.0,    1.0,    0.0),
        vec4<f32>(-1.0*myCam.translation.x,     -1* myCam.translation.y,    -1*myCam.translation.z,    1.0),
    );

    var c : vec3f = cos(myCam.rotation);
    var s : vec3f = sin(myCam.rotation);
    
    var rotM : mat4x4<f32> = mat4x4<f32>(
        vec4<f32>(c.y,  0.0,    -s.y,   0.0),
        vec4<f32>(0.0,  1.0,    0.0,    0.0),
        vec4<f32>(s.y,  0.0,    c.y,    0.0),
        vec4<f32>(0.0,  0.0,    0.0,    1.0),
    );
    
    return rotM*tranlastionM*vert;

}

fn PerspectiveProjection(vert: vec4f) -> vec4f{
    var n: f32 = .001;
    var r: f32 = .001;
    var t: f32 = .001;
    var f: f32 = 5000.0;
    
    var perspectiveM : mat4x4<f32> = mat4x4<f32> (
        vec4<f32>(n/r,  0.0,    0.0,   0.0),
        vec4<f32>(0.0,  n/t,    0.0,    0.0),
        vec4<f32>(0.0,  0.0,    (f+n)/(f-n),    1.0),
        vec4<f32>(0.0,  0.0,    2*f*n/(f-n),    1.0),
    );
    
    return perspectiveM*vert;
}


fn scale(vert: vec3f) -> vec4f
{
    var scaleM : mat4x4<f32> = mat4x4<f32>(
        vec4<f32>(myCords.scale.x,     0.0,    0.0,    0.0),
        vec4<f32>(0.0,     myCords.scale.y,    0.0,    0.0),
        vec4<f32>(0.0,     0.0,    myCords.scale.z,    0.0),
        vec4<f32>(0.0,     0.0,    0.0,                1.0),
    );
    return scaleM*vec4f(vert,1.0f);
}

fn rotateY(vert: vec4f) -> vec4f 
{
    var c : vec3f = cos(myCords.rotation);
    var s : vec3f = sin(myCords.rotation);

    var rotM : mat4x4<f32> = mat4x4<f32>(
        vec4<f32>(c.y,  0.0,    -s.y,   0.0),
        vec4<f32>(0.0,  1.0,    0.0,    0.0),
        vec4<f32>(s.y,  0.0,    c.y,    0.0),
        vec4<f32>(0.0,  0.0,    0.0,    1.0),
    );
    return rotM*vert;
}

fn rotateX(vert: vec4f) -> vec4f 
{
    var c : vec3f = cos(myCords.rotation);
    var s : vec3f = sin(myCords.rotation);

    var rotM : mat4x4<f32> = mat4x4<f32>(
        vec4<f32>(1.0,  0.0,    0.0,    0.0),
        vec4<f32>(0.0,  c.x,    s.x,    0.0),
        vec4<f32>(0.0,  -s.x,   c.x,    0.0),
        vec4<f32>(0.0,  0.0,    0.0,    1.0),
    );
    return rotM*vert;
}

fn rotateZ(vert: vec4f) -> vec4f 
{
    var c : vec3f = cos(myCords.rotation);
    var s : vec3f = sin(myCords.rotation);

    var rotM : mat4x4<f32> = mat4x4<f32>(
        vec4<f32>(c.z,  s.z,    0.0,    0.0),
        vec4<f32>(-s.z, c.z,    0.0,    0.0),
        vec4<f32>(0.0,  0.0,    1.0,    0.0),
        vec4<f32>(0.0,  0.0,    0.0,    1.0),
    );
    return rotM*vert;
}

fn rotate(vert: vec4f) -> vec4f
{
    return rotateZ(rotateX(rotateY(vert)));
}

fn translate(vert: vec4f) -> vec4f
{
    var translationM : mat4x4<f32> = mat4x4<f32>(
        vec4<f32>(1.0,  0.0,    0.0,    0.0),
        vec4<f32>(0.0,  1.0,    0.0,    0.0),
        vec4<f32>(0.0,  0.0,    1.0,    0.0),
        vec4<f32>(myCords.translation.x,     myCords.translation.y,    myCords.translation.z,    1.0),
    );
    return translationM*vert;
}

@vertex
fn vertexMain(@location(0) pos:vec3f, @location(1) col: vec3f) -> VertexData
{
    var returnMe: VertexData;
    returnMe.position = PerspectiveProjection(MoveCamera(translate(rotate(scale(pos)))));
    returnMe.color = col;
    return returnMe;
}

@fragment
fn fragmentMain(fsInput:VertexData) -> @location(0) vec4f
{
    return vec4f(fsInput.color, 1.0f);
}


		
			
			