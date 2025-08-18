class Shape
		{
			constructor()
			{
				/*Now we have to explain to GLSL how to ineterprate our data*/
				//Find the position attribute location in the program
				//2nd create a position buffer
				//3rd create a 
				var positions = [
				  //X,	Y    	Z, 	R,	G,	B,  
				  0, 	0,	 	0,	0,	0,	1,	
				  0, 	0.5,  -.8,  0,	1,	0,
				  0.7, 	0,	   .8,	1, 	0,	0,
				  -1,	-1,	  	0,	1,	0,	0,
				  0,    -1,   	0,	1,	0,	0,
				  -1,	 0,	   	0,	1,	0,	0,
				  0,	 0,		0,	1,	0,	0
				];
				//Create a position buffer;
				this.positionBuffer = gl.createBuffer();
				//Bind "ARRAY_BUFFER type to the positionBuffer";
				gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
							//load the points.
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
			}
			
			render(program)
			{
			    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
				//Now we have to find the attribute position in the program --- think of this as a pointer.
				
				var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
				//Now we specify HOW TO read our vertices
				gl.enableVertexAttribArray(positionAttributeLocation);
				// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
				var size = 3;          // 2 components per iteration
				var type = gl.FLOAT;   // the data is 32bit floats
				var normalize = false; // don't normalize the data
				var stride = 6*Float32Array.BYTES_PER_ELEMENT;        // 0 = move forward size * sizeof(type) each iteration to get the next position
				var offset = 0;        // start at the beginning of the buffer
				gl.vertexAttribPointer(positionAttributeLocation, size, 
				type, normalize, stride, offset)
				///
				
				var colorAttributeLocation = gl.getAttribLocation(program, "a_color");
				//Now we specify HOW TO read our vertices
				gl.enableVertexAttribArray(colorAttributeLocation);
				// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
				var size = 3;          // 2 components per iteration
				var type = gl.FLOAT;   // the data is 32bit floats
				var normalize = false; // don't normalize the data
				var stride = 6*Float32Array.BYTES_PER_ELEMENT;        // 0 = move forward size * sizeof(type) each iteration to get the next position
				var offset = 3*Float32Array.BYTES_PER_ELEMENT;        // start at the beginning of the buffer
				gl.vertexAttribPointer(colorAttributeLocation, size, 
				type, normalize, stride, offset)
				
				
				var primitiveType = gl.TRIANGLES;
				var offset = 0;
				var count = 3;
				gl.drawArrays(primitiveType, offset, count);
				gl.drawArrays(gl.TRIANGLE_STRIP,3,4);
				
			}
		}