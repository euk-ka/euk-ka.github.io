var readInput = true;
function changeEventHandler(event){
    readInput = true;
}
  
(function loadscene() {
  
  var resize, gl, progDraw, progBlurX, progPost, vp_size, blurFB;
  var bufCube = {};
  var bufQuad = {};
  var shininess = 10.0;
  var glow = 10.0;
  var sigma = 0.8;
  
  function render(delteMS){

      //if ( readInput ) {
          readInput = false;
          var sliderScale = 100;
          shininess = document.getElementById( "shine" ).value;
          glow      = document.getElementById( "glow" ).value / sliderScale;
          sigma     = document.getElementById( "sigma" ).value / sliderScale;
      //}

      Camera.create();
      Camera.vp = vp_size;
          
      gl.enable( gl.DEPTH_TEST );
      gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

      // set up framebuffer
      gl.bindFramebuffer( gl.FRAMEBUFFER, blurFB[0] );
      gl.viewport( 0, 0, blurFB[0].width, blurFB[0].height );
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
  
      // set up draw shader
      ShaderProgram.Use( progDraw.prog );
      ShaderProgram.SetUniformM44( progDraw.prog, "u_projectionMat44", Camera.Perspective() );
      ShaderProgram.SetUniformM44( progDraw.prog, "u_viewMat44", Camera.LookAt() );
      var modelMat = IdentityMat44()
      modelMat = RotateAxis( modelMat, CalcAng( delteMS, 13.0 ), 0 );
      modelMat = RotateAxis( modelMat, CalcAng( delteMS, 17.0 ), 1 );
      ShaderProgram.SetUniformM44( progDraw.prog, "u_modelMat44", modelMat );
      ShaderProgram.SetUniformF1( progDraw.prog, "u_shininess", shininess );
      ShaderProgram.SetUniformF1( progDraw.prog, "u_glow", glow );
      
      // draw scene
      VertexBuffer.Draw( bufCube );

      // set blur-X framebuffer and bind frambuffer texture
      gl.bindFramebuffer( gl.FRAMEBUFFER, blurFB[1] );
      gl.viewport( 0, 0, blurFB[1].width, blurFB[1].height );
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
      var texUnit = 1;
      gl.activeTexture( gl.TEXTURE0 + texUnit );
      gl.bindTexture( gl.TEXTURE_2D, blurFB[0].color0_texture );

      // set up blur-X shader
      ShaderProgram.Use( progBlurX.prog );
      ShaderProgram.SetUniformI1( progBlurX.prog , "u_texture", texUnit )
      ShaderProgram.SetUniformF2( progBlurX.prog , "u_textureSize", vp_size );
      ShaderProgram.SetUniformF1( progBlurX.prog , "u_sigma", sigma )

      // draw full screen space
      gl.enableVertexAttribArray( progBlurX.inPos );
      gl.bindBuffer( gl.ARRAY_BUFFER, bufQuad.pos );
      gl.vertexAttribPointer( progBlurX.inPos, 2, gl.FLOAT, false, 0, 0 ); 
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufQuad.inx );
      gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0 );
      gl.disableVertexAttribArray( progBlurX.inPos );

      // reset framebuffer and bind frambuffer texture
      gl.bindFramebuffer( gl.FRAMEBUFFER, null );
      gl.viewport( 0, 0, vp_size[0], vp_size[1] );
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
      texUnit = 2;
      gl.activeTexture( gl.TEXTURE0 + texUnit );
      gl.bindTexture( gl.TEXTURE_2D, blurFB[1].color0_texture );

      // set up pst process shader
      ShaderProgram.Use( progPost.prog );
      ShaderProgram.SetUniformI1( progPost.prog, "u_texture", texUnit )
      ShaderProgram.SetUniformF2( progPost.prog, "u_textureSize", vp_size );
      ShaderProgram.SetUniformF1( progPost.prog, "u_sigma", sigma );

      // draw full screen space
      gl.enableVertexAttribArray( progPost.inPos );
      gl.bindBuffer( gl.ARRAY_BUFFER, bufQuad.pos );
      gl.vertexAttribPointer( progPost.inPos, 2, gl.FLOAT, false, 0, 0 ); 
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufQuad.inx );
      gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0 );
      gl.disableVertexAttribArray( progPost.inPos );

      requestAnimationFrame(render);
  }
  
  function resize() {
      //vp_size = [gl.drawingBufferWidth, gl.drawingBufferHeight];
      vp_size = [window.innerWidth, window.innerHeight]
      canvas.width = vp_size[0];
      canvas.height = vp_size[1];

      var fbsize = Math.max(vp_size[0], vp_size[1])-1;
      fbsize = 1 << 31 - Math.clz32(fbsize); // nearest power of 2
      fbsize = fbsize * 2

      blurFB = [];
      for ( var i = 0; i < 2; ++ i ) {
          fb = gl.createFramebuffer();
          fb.width = fbsize;
          fb.height = fbsize;
          gl.bindFramebuffer( gl.FRAMEBUFFER, fb );
          fb.color0_texture = gl.createTexture();
          gl.bindTexture( gl.TEXTURE_2D, fb.color0_texture );
          gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
          gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
          gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, fb.width, fb.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );
          fb.renderbuffer = gl.createRenderbuffer();
          gl.bindRenderbuffer( gl.RENDERBUFFER, fb.renderbuffer );
          gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fb.width, fb.height );
          gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb.color0_texture, 0 );
          gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fb.renderbuffer );
          gl.bindTexture( gl.TEXTURE_2D, null );
          gl.bindRenderbuffer( gl.RENDERBUFFER, null );
          gl.bindFramebuffer( gl.FRAMEBUFFER, null );
          blurFB.push( fb );
      }
  }
  
  function initScene() {
  
      canvas = document.getElementById( "canvas");
      gl = canvas.getContext( "experimental-webgl" );
      if ( !gl )
        return null;
  
      progDraw = {}
      progDraw.prog = ShaderProgram.Create( 
        [ { source : "draw-shader-vs", stage : gl.VERTEX_SHADER },
          { source : "draw-shader-fs", stage : gl.FRAGMENT_SHADER }
        ] );
      if ( !progDraw.prog )
          return null;
      progDraw.inPos = gl.getAttribLocation( progDraw.prog, "inPos" );
      progDraw.inNV  = gl.getAttribLocation( progDraw.prog, "inNV" );
      progDraw.inCol = gl.getAttribLocation( progDraw.prog, "inCol" );

      progBlurX = {}
      progBlurX.prog = ShaderProgram.Create( 
        [ { source : "post-shader-vs", stage : gl.VERTEX_SHADER },
          { source : "blurX-shader-fs", stage : gl.FRAGMENT_SHADER }
        ] );
      progBlurX.inPos = gl.getAttribLocation( progBlurX.prog, "inPos" );
      if ( !progBlurX.prog )
          return;    

      progPost = {}
      progPost.prog = ShaderProgram.Create( 
        [ { source : "post-shader-vs", stage : gl.VERTEX_SHADER },
          { source : "blurY-shader-fs", stage : gl.FRAGMENT_SHADER }
        ] );
      progPost.inPos = gl.getAttribLocation( progPost.prog, "inPos" );
      if ( !progPost.prog )
          return;
      
      // create cube
      var cubePos = [
        -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,  1.0,
        -1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0, -1.0 ];
      var cubeCol = [ 1.0, 0.0, 0.0, 1.0, 0.5, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0 ];
      var cubeHlpInx = [ 0, 1, 2, 3, 1, 5, 6, 2, 5, 4, 7, 6, 4, 0, 3, 7, 3, 2, 6, 7, 1, 0, 4, 5 ];  
      var cubePosData = [];
      for ( var i = 0; i < cubeHlpInx.length; ++ i ) {
        cubePosData.push( cubePos[cubeHlpInx[i]*3], cubePos[cubeHlpInx[i]*3+1], cubePos[cubeHlpInx[i]*3+2] );
      }
      var cubeNVData = [];
      for ( var i1 = 0; i1 < cubeHlpInx.length; i1 += 4 ) {
      var nv = [0, 0, 0];
      for ( i2 = 0; i2 < 4; ++ i2 ) {
          var i = i1 + i2;
          nv[0] += cubePosData[i*3]; nv[1] += cubePosData[i*3+1]; nv[2] += cubePosData[i*3+2];
      }
      for ( i2 = 0; i2 < 4; ++ i2 )
        cubeNVData.push( nv[0], nv[1], nv[2] );
      }
      var cubeColData = [];
      for ( var is = 0; is < 6; ++ is ) {
        for ( var ip = 0; ip < 4; ++ ip ) {
         cubeColData.push( cubeCol[is*3], cubeCol[is*3+1], cubeCol[is*3+2] ); 
        }
      }
      var cubeInxData = [];
      for ( var i = 0; i < cubeHlpInx.length; i += 4 ) {
        cubeInxData.push( i, i+1, i+2, i, i+2, i+3 );   
      }
      bufCube = VertexBuffer.Create(
      [ { data : cubePosData, attrSize : 3, attrLoc : progDraw.inPos },
        { data : cubeNVData,  attrSize : 3, attrLoc : progDraw.inNV },
        { data : cubeColData, attrSize : 3, attrLoc : progDraw.inCol } ],
        cubeInxData );

      bufQuad.pos = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, bufQuad.pos );
      gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [ -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0 ] ), gl.STATIC_DRAW );
      bufQuad.inx = gl.createBuffer();
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufQuad.inx );
      gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( [ 0, 1, 2, 0, 2, 3 ] ), gl.STATIC_DRAW );  
        
      window.onresize = resize;
      resize();
      requestAnimationFrame(render);
  }
  
  function Fract( val ) { 
      return val - Math.trunc( val );
  }
  function CalcAng( deltaTime, intervall ) {
      return Fract( deltaTime / (1000*intervall) ) * 2.0 * Math.PI;
  }
  function CalcMove( deltaTime, intervall, range ) {
      var pos = self.Fract( deltaTime / (1000*intervall) ) * 2.0
      var pos = pos < 1.0 ? pos : (2.0-pos)
      return range[0] + (range[1] - range[0]) * pos;
  }    
  function EllipticalPosition( a, b, angRag ) {
      var a_b = a * a - b * b
      var ea = (a_b <= 0) ? 0 : Math.sqrt( a_b );
      var eb = (a_b >= 0) ? 0 : Math.sqrt( -a_b );
      return [ a * Math.sin( angRag ) - ea, b * Math.cos( angRag ) - eb, 0 ];
  }
  
  glArrayType = typeof Float32Array !="undefined" ? Float32Array : ( typeof WebGLFloatArray != "undefined" ? WebGLFloatArray : Array );
  
  function IdentityMat44() {
    var m = new glArrayType(16);
    m[0]  = 1; m[1]  = 0; m[2]  = 0; m[3]  = 0;
    m[4]  = 0; m[5]  = 1; m[6]  = 0; m[7]  = 0;
    m[8]  = 0; m[9]  = 0; m[10] = 1; m[11] = 0;
    m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
    return m;
  };
  
  function RotateAxis(matA, angRad, axis) {
      var aMap = [ [1, 2], [2, 0], [0, 1] ];
      var a0 = aMap[axis][0], a1 = aMap[axis][1]; 
      var sinAng = Math.sin(angRad), cosAng = Math.cos(angRad);
      var matB = new glArrayType(16);
      for ( var i = 0; i < 16; ++ i ) matB[i] = matA[i];
      for ( var i = 0; i < 3; ++ i ) {
          matB[a0*4+i] = matA[a0*4+i] * cosAng + matA[a1*4+i] * sinAng;
          matB[a1*4+i] = matA[a0*4+i] * -sinAng + matA[a1*4+i] * cosAng;
      }
      return matB;
  }
  
  function Cross( a, b ) { return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0], 0.0 ]; }
  function Dot( a, b ) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
  function Normalize( v ) {
      var len = Math.sqrt( v[0] * v[0] + v[1] * v[1] + v[2] * v[2] );
      return [ v[0] / len, v[1] / len, v[2] / len ];
  }
  
  var Camera = {};
  Camera.create = function() {
      this.pos    = [0, 3, 0.0];
      this.target = [0, 0, 0];
      this.up     = [0, 0, 1];
      this.fov_y  = 90;
      this.vp     = [800, 600];
      this.near   = 0.5;
      this.far    = 100.0;
  }
  Camera.Perspective = function() {
      var fn = this.far + this.near;
      var f_n = this.far - this.near;
      var r = this.vp[0] / this.vp[1];
      var t = 1 / Math.tan( Math.PI * this.fov_y / 360 );
      var m = IdentityMat44();
      m[0]  = t/r; m[1]  = 0; m[2]  =  0;                              m[3]  = 0;
      m[4]  = 0;   m[5]  = t; m[6]  =  0;                              m[7]  = 0;
      m[8]  = 0;   m[9]  = 0; m[10] = -fn / f_n;                       m[11] = -1;
      m[12] = 0;   m[13] = 0; m[14] = -2 * this.far * this.near / f_n; m[15] =  0;
      return m;
  }
  Camera.LookAt = function() {
      var mz = Normalize( [ this.pos[0]-this.target[0], this.pos[1]-this.target[1], this.pos[2]-this.target[2] ] );
      var mx = Normalize( Cross( this.up, mz ) );
      var my = Normalize( Cross( mz, mx ) );
      var tx = Dot( mx, this.pos );
      var ty = Dot( my, this.pos );
      var tz = Dot( [-mz[0], -mz[1], -mz[2]], this.pos ); 
      var m = IdentityMat44();
      m[0]  = mx[0]; m[1]  = my[0]; m[2]  = mz[0]; m[3]  = 0;
      m[4]  = mx[1]; m[5]  = my[1]; m[6]  = mz[1]; m[7]  = 0;
      m[8]  = mx[2]; m[9]  = my[2]; m[10] = mz[2]; m[11] = 0;
      m[12] = tx;    m[13] = ty;    m[14] = tz;    m[15] = 1; 
      return m;
  } 
  
  var ShaderProgram = {};
  ShaderProgram.Create = function( shaderList ) {
      var shaderObjs = [];
      for ( var i_sh = 0; i_sh < shaderList.length; ++ i_sh ) {
          var shderObj = this.CompileShader( shaderList[i_sh].source, shaderList[i_sh].stage );
          if ( shderObj == 0 )
              return 0;
          shaderObjs.push( shderObj );
      }
      var progObj = this.LinkProgram( shaderObjs )
      if ( progObj != 0 ) {
          progObj.attribIndex = {};
          var noOfAttributes = gl.getProgramParameter( progObj, gl.ACTIVE_ATTRIBUTES );
          for ( var i_n = 0; i_n < noOfAttributes; ++ i_n ) {
              var name = gl.getActiveAttrib( progObj, i_n ).name;
              progObj.attribIndex[name] = gl.getAttribLocation( progObj, name );
          }
          progObj.unifomLocation = {};
          var noOfUniforms = gl.getProgramParameter( progObj, gl.ACTIVE_UNIFORMS );
          for ( var i_n = 0; i_n < noOfUniforms; ++ i_n ) {
              var name = gl.getActiveUniform( progObj, i_n ).name;
              progObj.unifomLocation[name] = gl.getUniformLocation( progObj, name );
          }
      }
      return progObj;
  }
  ShaderProgram.AttributeIndex = function( progObj, name ) { return progObj.attribIndex[name]; } 
  ShaderProgram.UniformLocation = function( progObj, name ) { return progObj.unifomLocation[name]; } 
  ShaderProgram.Use = function( progObj ) { gl.useProgram( progObj ); } 
  ShaderProgram.SetUniformI1  = function( progObj, name, val ) { if(progObj.unifomLocation[name]) gl.uniform1i( progObj.unifomLocation[name], val ); }
  ShaderProgram.SetUniformF1  = function( progObj, name, val ) { if(progObj.unifomLocation[name]) gl.uniform1f( progObj.unifomLocation[name], val ); }
  ShaderProgram.SetUniformF2  = function( progObj, name, arr ) { if(progObj.unifomLocation[name]) gl.uniform2fv( progObj.unifomLocation[name], arr ); }
  ShaderProgram.SetUniformF3  = function( progObj, name, arr ) { if(progObj.unifomLocation[name]) gl.uniform3fv( progObj.unifomLocation[name], arr ); }
  ShaderProgram.SetUniformF4  = function( progObj, name, arr ) { if(progObj.unifomLocation[name]) gl.uniform4fv( progObj.unifomLocation[name], arr ); }
  ShaderProgram.SetUniformM33 = function( progObj, name, mat ) { if(progObj.unifomLocation[name]) gl.uniformMatrix3fv( progObj.unifomLocation[name], false, mat ); }
  ShaderProgram.SetUniformM44 = function( progObj, name, mat ) { if(progObj.unifomLocation[name]) gl.uniformMatrix4fv( progObj.unifomLocation[name], false, mat ); }
  ShaderProgram.CompileShader = function( source, shaderStage ) {
      var shaderScript = document.getElementById(source);
      if (shaderScript)
        source = shaderScript.text;
      var shaderObj = gl.createShader( shaderStage );
      gl.shaderSource( shaderObj, source );
      gl.compileShader( shaderObj );
      var status = gl.getShaderParameter( shaderObj, gl.COMPILE_STATUS );
      if ( !status ) alert(gl.getShaderInfoLog(shaderObj));
      return status ? shaderObj : null;
  } 
  ShaderProgram.LinkProgram = function( shaderObjs ) {
      var prog = gl.createProgram();
      for ( var i_sh = 0; i_sh < shaderObjs.length; ++ i_sh )
          gl.attachShader( prog, shaderObjs[i_sh] );
      gl.linkProgram( prog );
      status = gl.getProgramParameter( prog, gl.LINK_STATUS );
      if ( !status ) alert("Could not initialise shaders");
      gl.useProgram( null );
      return status ? prog : null;
  }
  
  var VertexBuffer = {};
  VertexBuffer.Create = function( attributes, indices ) {
      var buffer = {};
      buffer.buf = [];
      buffer.attr = []
      for ( var i = 0; i < attributes.length; ++ i ) {
          buffer.buf.push( gl.createBuffer() );
          buffer.attr.push( { size : attributes[i].attrSize, loc : attributes[i].attrLoc } );
          gl.bindBuffer( gl.ARRAY_BUFFER, buffer.buf[i] );
          gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( attributes[i].data ), gl.STATIC_DRAW );
      }
      buffer.inx = gl.createBuffer();
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, buffer.inx );
      gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );
      buffer.inxLen = indices.length;
      gl.bindBuffer( gl.ARRAY_BUFFER, null );
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
      return buffer;
  }
  VertexBuffer.Draw = function( bufObj ) {
    for ( var i = 0; i < bufObj.buf.length; ++ i ) {
          gl.bindBuffer( gl.ARRAY_BUFFER, bufObj.buf[i] );
          gl.vertexAttribPointer( bufObj.attr[i].loc, bufObj.attr[i].size, gl.FLOAT, false, 0, 0 );
          gl.enableVertexAttribArray( bufObj.attr[i].loc );
      }
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufObj.inx );
      gl.drawElements( gl.TRIANGLES, bufObj.inxLen, gl.UNSIGNED_SHORT, 0 );
      for ( var i = 0; i < bufObj.buf.length; ++ i )
         gl.disableVertexAttribArray( bufObj.attr[i].loc );
      gl.bindBuffer( gl.ARRAY_BUFFER, null );
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
  }
  
  initScene();
  
})();