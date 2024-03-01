class InitWebGLProgram
		{
			constructor()
			{
				//setup our viewport
				gl.viewport(0,0, gl.canvas.width, gl.canvas.height);
				//set clear colors
				gl.clearColor(1,1,1,1);
				gl.clear(gl.COLOR_BUFFER_BIT);
			}
			createShader(type,source)
			{
				var shader = gl.createShader(type);
				gl.shaderSource(shader,source);
				gl.compileShader(shader);
				var success = gl.getShaderParameter(shader,gl.COMPILE_STATUS);
				if(success)
				{
					return shader;
				}
				//Else it didn't work
				console.error(gl.getShaderInfoLog(shader));
				gl.deleteShader(shader);
			}
			createProgram(vs,fs)
			{
				var program = gl.createProgram();
				gl.attachShader(program,vs);
				gl.attachShader(program,fs);
				gl.linkProgram(program);
				var succsess = gl.getProgramParameter(program,gl.LINK_STATUS);
				if(succsess)
				{
					return program;
				}
				console.error(gl.getProgramInfoLog(program));
				gl.deleteProgram(program);
			}
		}
		