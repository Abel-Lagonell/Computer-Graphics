
class Triangle
{
			constructor()
			{
				this.VertCount = 0;
				this.IsFinished = false;
				this.Positions = [];
				//Create a position buffer;
				this.positionBuffer = gl.createBuffer();
				//Bind "ARRAY_BUFFER type to the positionBuffer";
				gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
							//load the points.
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.Positions), gl.STATIC_DRAW);
			}

			addPoint(x,y)
			{
				this.Positions.push(x);
				this.Positions.push(y);
				this.Positions.push(0);
				this.Positions.push(0);
				this.Positions.push(1);
				this.Positions.push(0);
				this.VertCount+=1;
				//Rebuffer the buffer;
				gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
				//load the points.
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.Positions), gl.STATIC_DRAW);
				if(this.VertCount == 3)
				{
					this.IsFinished = true;
				}
				
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
				if(this.IsFinished == false)
				{
					primitiveType = gl.LINE_LOOP;
				}
				var offset = 0;
				//var count = 3;
				gl.drawArrays(primitiveType, offset, this.VertCount);
				//gl.drawArrays(gl.TRIANGLE_STRIP,3,4);
				
			}

}