//@ts-check
class Transform	{
	constructor()
	{
		this.forward = [0,0,1];
		this.right = [1,0,0];
		this.up = [0,1,0];
	}

  /**
  * @param {number[]} RotAngles 
  */
	doRotations(RotAngles) {
	  this.xRot = [
				[1,0,0,0],
				[0,Math.cos(RotAngles[0]),-1*Math.sin(RotAngles[0]),0],
					[0,Math.sin(RotAngles[0]),Math.cos(RotAngles[0]),0],
					[0,0,0,1]
				];		
		this.yRot = [
				[Math.cos(RotAngles[1]),0,Math.sin(RotAngles[1]),0],
				[0,1,0,0],
				[-1*Math.sin(RotAngles[1]),0,Math.cos(RotAngles[1]),0],
				[0,0,0,1]	
				];
		this.zRot = [
					[Math.cos(RotAngles[2]),-1*Math.sin(RotAngles[2]),0,0],
					[Math.sin(RotAngles[2]),Math.cos(RotAngles[2]),0,0],
					[0,0,1,0],
					[0,0,0,1]
				]
		//this.forward = this.crossMultiply(xRot,[0,0,1,0]);		
		this.forward = this.crossMultiply(this.zRot,this.crossMultiply(this.yRot,this.crossMultiply(this.xRot,[0,0,1,0])))
		this.right = this.crossMultiply(this.zRot,this.crossMultiply(this.yRot,this.crossMultiply(this.xRot,[1,0,0,0])))
		this.up = this.crossMultiply(this.zRot,this.crossMultiply(this.yRot,this.crossMultiply(this.xRot,[0,1,0,0])))
	}

  /** 
   * @param {number[][]} M
   * @param {number[]} V 
   */
	crossMultiply(M,V) {
	  console.log(M[0][3]);
	  console.log(V[3]);
	  var temp = [
				M[0][0]*V[0]+M[0][1]*V[1]+M[0][2] * V[2]+ M[0][3]*V[3],
				M[1][0]*V[0]+M[1][1]*V[1]+M[1][2] * V[2]+ M[1][3]*V[3],
				M[2][0]*V[0]+M[2][1]*V[1]+M[2][2] * V[2]+ M[2][3]*V[3],
				M[3][0]*V[0]+M[3][1]*V[1]+M[3][2] * V[2]+ M[3][3]*V[3]
				]
	  console.log(temp);
		return temp;
	}
	
}
	
class GameObject
{
	constructor() 
	{
		this.loc = [0,0,0];
		this.rot = [0,0,0];
		this.isTrigger = false;
		this.collissionRadius = 0.1;
		this.velocity = [0,0,0];
		this.angVelocity = [0,0,0];
		this.name = "Default";
		this.id = 0;
		this.tranform = new Transform();
	}

  Move(m){
    let tempP = [0,0,0];
    for(let i in [0,1,2]) {
      tempP[i] = this.loc[i];
      tempP[i] += this.velocity[i];
      this.rot[i] = this.angVelocity[i];
    }

    let clear = true;
    for(let so in m.Solid){
      if(m.Solid[so] != this){
        if (m.checkCollision(tempP, this.collissionRadius, m.Solid[so].loc, m.Solid.collissionRadius)){
          if(!this.isTrigger){
            this.OnCollisionEnter(m.Solid[so]);
            m.Solid[so].OnCollisionEnter(this);
            clear = false;
          } else {
            this.OnTriggerEnter(m.Solid[so]);
            m.Solid[so].OnTriggerEnter(this)
          }
        }
      }
    }
    if (clear){
      this.loc = tempP;
    }
    for(let to in m.Trigger){
      if (m.Trigger[to] != this){
        if (m.checkCollision(this.loc, this.collissionRadius, m.Trigger[to].loc, m.Trigger.collissionRadius)){
          this.OnCollisionEnter(m.Trigger[to]);
          m.Trigger[to].OnCollisionEnter(this);
        }
      }
    }

  }
	
	Update()
	{
		console.error(this.name +" update() is NOT IMPLEMENTED!");
	}
	Render(program)
	{
		console.error(this.name + " render() is NOT IMPLEMENTED!");
	}
  OnTriggerEnter(other){
    
  }
  OnCollisionEnter(object){

  }
}

class Demo extends GameObject
{
	constructor()
	{
    /**@type {WebGL2RenderingContext} gl */
    let gl;
		super();
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    this.verticies = []
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verticies), gl.STATIC_DRAW)
	}

  Update(){
    
  }

  Render(program){
    
  }
	
}
