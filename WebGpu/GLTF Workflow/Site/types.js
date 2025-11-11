/**
 * @typedef {Object} GLTF
 * @property {string} [asset.version] - The glTF version (e.g. "2.0").
 * @property {string} [asset.generator] - The software that generated this glTF.
 * @property {GLTFScene[]} [scenes] - A list of scenes.
 * @property {number} [scene] - The index of the default scene.
 * @property {GLTFNode[]} [nodes] - A list of node objects.
 * @property {GLTFMesh[]} [meshes] - A list of mesh objects.
 * @property {GLTFAccessor[]} [accessors] - A list of accessors.
 * @property {GLTFBufferView[]} [bufferViews] - A list of buffer views.
 * @property {GLTFBuffer[]} [buffers] - A list of buffers.
 * @property {GLTFMaterial[]} [materials] - A list of materials.
 * @property {GLTFTexture[]} [textures] - A list of textures.
 * @property {GLTFImage[]} [images] - A list of images.
 * @property {GLTFSampler[]} [samplers] - A list of samplers.
 * @property {GLTFAnimation[]} [animations] - A list of animations.
 * @property {GLTFCamera[]} [cameras] - A list of cameras.
 */

/**
 * @typedef {Object} GLTFScene
 * @property {string} [name]
 * @property {number[]} [nodes]
 */

/**
 * @typedef {Object} GLTFNode
 * @property {string} [name]
 * @property {number} [mesh]
 * @property {number[]} [children]
 * @property {number[]} [translation]
 * @property {number[]} [rotation]
 * @property {number[]} [scale]
 * @property {number[]} [matrix]
 */

/**
 * @typedef {Object} GLTFMesh
 * @property {string} [name]
 * @property {GLTFPrimitive[]} [primitives]
 */

/**
 * @typedef {Object} GLTFPrimitive
 * @property {Object.<string, number>} attributes - Mapping of attribute semantic (e.g. "POSITION") to accessor index.
 * @property {number} [indices] - The accessor index of indices.
 * @property {number} [material] - The material index.
 * @property {number} [mode] - The topology type (e.g. 4 for TRIANGLES).
 */

/**
 * @typedef {Object} GLTFAccessor
 * @property {number} bufferView
 * @property {number} byteOffset
 * @property {number} componentType
 * @property {boolean} [normalized]
 * @property {number} count
 * @property {string} type
 * @property {number[]} [max]
 * @property {number[]} [min]
 */

/**
 * @typedef {Object} GLTFBufferView
 * @property {number} buffer
 * @property {number} [byteOffset]
 * @property {number} byteLength
 * @property {number} [byteStride]
 * @property {number} [target]
 */

/**
 * @typedef {Object} GLTFBuffer
 * @property {string} uri
 * @property {number} byteLength
 */

/**
 * @typedef {Object} GLTFMaterial
 * @property {string} [name]
 * @property {Object} [pbrMetallicRoughness]
 * @property {Object} [normalTexture]
 * @property {Object} [occlusionTexture]
 * @property {Object} [emissiveTexture]
 * @property {number[]} [emissiveFactor]
 * @property {string} [alphaMode]
 * @property {number} [alphaCutoff]
 * @property {boolean} [doubleSided]
 */

/**
 * @typedef {Object} GLTFTexture
 * @property {number} [sampler]
 * @property {number} [source]
 */

/**
 * @typedef {Object} GLTFImage
 * @property {string} [uri]
 * @property {string} [mimeType]
 * @property {number} [bufferView]
 */

/**
 * @typedef {Object} GLTFSampler
 * @property {number} [magFilter]
 * @property {number} [minFilter]
 * @property {number} [wrapS]
 * @property {number} [wrapT]
 */

/**
 * @typedef {Object} GLTFAnimation
 * @property {string} [name]
 * @property {GLTFAnimationSampler[]} [samplers]
 * @property {GLTFAnimationChannel[]} [channels]
 */

/**
 * @typedef {Object} GLTFAnimationSampler
 * @property {number} input
 * @property {string} interpolation
 * @property {number} output
 */

/**
 * @typedef {Object} GLTFAnimationChannel
 * @property {number} sampler
 * @property {Object} target
 * @property {number} target.node
 * @property {string} target.path
 */

/**
 * @typedef {Object} GLTFCamera
 * @property {string} type
 * @property {Object} [perspective]
 * @property {Object} [orthographic]
 */
