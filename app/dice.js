var webgldice = {};

(function () {
    var SimpleGL = function() {
        this.canvas = null;
        this.gl = null;
    };
    SimpleGL.prototype.initalize = function(canvasId, width, height) {
        this.canvas = document.getElementById(canvasId);
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (this.gl === null || typeof this.gl === 'undefined') {
            console.log('WebGL not supported.');
            return false;
        }
        return true;
    };
    SimpleGL.prototype.clear = function(r, g, b) {
        this.gl.clearColor(r, g, b, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    };
    SimpleGL.prototype.loadFile = function(url, data, successCallback, errorCallback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    successCallback(request.responseText, data);
                } else {
                    errorCallback(url);
                }
            }
        };
        request.send(null);
    };
    SimpleGL.prototype.loadFiles = function(urls, successCallback, errorCallback) {
        function XHRCollector(allItemCount, cb, ecb, param) {
            var count = 0;
            return function(e) {
                if (this.status == 200) {
                    if (this.responseType === 'blob') {
                        var image = new Image();
                        image.onload = function(e) {
                            window.URL.revokeObjectURL(image.src);
                            if (++count === allItemCount) {
                                cb(param);
                            }
                        };
                        image.src = window.URL.createObjectURL(this.response);
                        param[this.index] = image;
                    } else {
                        param[this.index] = this.response;
                        if (++count === allItemCount) {
                            cb(param);
                        }
                    }
                } else {
                    ecb(e.currentTarget.responseURL);
                }
            }
        }
        var responses = new Array(urls.length);
        var collector = new XHRCollector(urls.length, successCallback, errorCallback, responses);
        for (var i = 0; i < urls.length; ++i) {
            var request = new XMLHttpRequest();
            request.index = i;
            request.url = urls[i];
            request.open('GET', urls[i], true);
            switch (urls[i].split('.').pop().toLowerCase()) {
                case 'jpg':
                case 'png':
                case 'gif':
                    request.responseType = 'blob';
                    break;
                default:
                    request.responseType = 'text';
                    break;
            }
            request.onload = collector;
            request.send(null);
        }
    };
    SimpleGL.prototype.compileShader = function(type, text) {
        var shader = null;
        switch(type) {
            case 0: // 'x-shader/x-vertex'
                shader = this.gl.createShader(this.gl.VERTEX_SHADER);
                break;
            case 1: // 'x-shader/x-fragment'
                shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
                break;
            default:
                return null;
        }
        this.gl.shaderSource(shader, text);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.log('compile error.');
            return null;
        }
        return shader;
    };
    SimpleGL.prototype.linkProgram = function(vs, fs) {
        var program = this.gl.createProgram();

        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);

        if(!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.log('link error:' + this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    };
    SimpleGL.prototype.createVBO = function(data) {
        var vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        return vbo;
    };
    SimpleGL.prototype.createIBO = function(data) {
        var ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    };
    SimpleGL.prototype.createTexture = function(data) {
        var texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        return texture;
    };
    SimpleGL.prototype.getGL = function() {
        return this.gl;
    };
    SimpleGL.prototype.getWidth = function() {
        return this.canvas.width;
    };
    SimpleGL.prototype.getHeight = function() {
        return this.canvas.height;
    };
    webgldice.SimpleGL = SimpleGL;
}());

var main = function() {
    var sgl = new webgldice.SimpleGL();
    sgl.initalize('canvas', 640, 480);
    sgl.loadFiles(['/shaders/vertex.vs', '/shaders/fragment.fs', '/textures/dice.png'], function(responses) {
        var gl = sgl.getGL();
        var vs = sgl.compileShader(0, responses[0]);
        var fs = sgl.compileShader(1, responses[1]);
        var program = sgl.linkProgram(vs, fs);
        gl.useProgram(program);

        var attLocation = new Array(4);
        attLocation[0] = gl.getAttribLocation(program, 'position');
        attLocation[1] = gl.getAttribLocation(program, 'color');
        attLocation[2] = gl.getAttribLocation(program, 'textureCoord');
        attLocation[3] = gl.getAttribLocation(program, 'normal');
        var attStride = new Array(4);
        attStride[0] = 3;
        attStride[1] = 4;
        attStride[2] = 2;
        attStride[3] = 3;
        var vertexPosition = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,
            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,
            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,
            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0
        ];
        var colors = [
            [1.0,  1.0,  1.0,  1.0],    // Front face: white
            [1.0,  1.0,  1.0,  1.0],    // Back face: white
            [1.0,  1.0,  1.0,  1.0],    // Top face: white
            [1.0,  1.0,  1.0,  1.0],    // Bottom face: white
            [1.0,  1.0,  1.0,  1.0],    // Right face: white
            [1.0,  1.0,  1.0,  1.0]     // Left face: white
        ];
        var vertexColor = [];
        for (var j = 0; j < colors.length; ++j) {
            var c = colors[j];
            for (var i = 0; i < colors[j].length; ++i) {
                vertexColor = vertexColor.concat(c);
            }
        }
        var textureCoord = [
            0.0, 1.0,
            0.0, 0.0,
            0.125, 0.0,
            0.125, 1.0,
            
            0.625, 1.0,
            0.625, 0.0,
            0.75, 0.0,
            0.75, 1.0,
            
            0.5, 1.0,
            0.5, 0.0,
            0.625, 0.0,
            0.625, 1.0,
            
            0.125, 1.0,
            0.125, 0.0,
            0.25, 0.0,
            0.25, 1.0,
            
            0.25, 1.0,
            0.25, 0.0,
            0.375, 0.0,
            0.375, 1.0,
            
            0.375, 1.0,
            0.375, 0.0,
            0.5, 0.0,
            0.5, 1.0,
        ];
        var vertexNormal = [
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
            
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
            
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
            
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
            
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
            
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0
        ];
        var index = [
            0,  1,  2,    0,  2,  3,    // front
            4,  5,  6,    4,  6,  7,    // back
            8,  9,  10,   8,  10, 11,   // top
            12, 13, 14,   12, 14, 15,   // bottom
            16, 17, 18,   16, 18, 19,   // right
            20, 21, 22,   20, 22, 23    // left
        ];

        var pvbo = sgl.createVBO(vertexPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, pvbo);
        gl.enableVertexAttribArray(attLocation[0]);
        gl.vertexAttribPointer(attLocation[0], attStride[0], gl.FLOAT, false, 0, 0);
        var cvbo = sgl.createVBO(vertexColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, cvbo);
        gl.enableVertexAttribArray(attLocation[1]);
        gl.vertexAttribPointer(attLocation[1], attStride[1], gl.FLOAT, false, 0, 0);
        var tvbo = sgl.createVBO(textureCoord);
        gl.bindBuffer(gl.ARRAY_BUFFER, tvbo);
        gl.enableVertexAttribArray(attLocation[2]);
        gl.vertexAttribPointer(attLocation[2], attStride[2], gl.FLOAT, false, 0, 0);
        var nvbo = sgl.createVBO(vertexNormal);
        gl.bindBuffer(gl.ARRAY_BUFFER, nvbo);
        gl.enableVertexAttribArray(attLocation[3]);
        gl.vertexAttribPointer(attLocation[3], attStride[3], gl.FLOAT, false, 0, 0);
        var ibo = sgl.createIBO(index);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

        var uniLocation = new Array();
        uniLocation[0] = gl.getUniformLocation(program, 'mvpMatrix');
        uniLocation[1] = gl.getUniformLocation(program, 'texture');
        uniLocation[2] = gl.getUniformLocation(program, 'invMatrix');
        uniLocation[3] = gl.getUniformLocation(program, 'lightDirection');
        uniLocation[4] = gl.getUniformLocation(program, 'ambientColor');

        var texture = sgl.createTexture(responses[2]);
        var frameCount = 0;
        var minMatrix = new matIV();
        var mtxView = minMatrix.identity(minMatrix.create());
        var mtxProj = minMatrix.identity(minMatrix.create());
        
        minMatrix.lookAt([0.0, 0.0, 4.0], [0, 0, 0], [0, 1, 0], mtxView);
        minMatrix.perspective(60, sgl.getWidth() / sgl.getHeight(), 0.1, 100, mtxProj);
        var lightDirection = [-0.5, 0.5, 0.5];
        var ambientColor = [0.1, 0.1, 0.1, 1.0];
        
        (function() {
            var mtxModel = minMatrix.identity(minMatrix.create());
            var mtxMVP = minMatrix.identity(minMatrix.create());
            var mtxInv = minMatrix.identity(minMatrix.create());
            
            minMatrix.inverse(mtxModel, mtxInv);
            
            var rad = (frameCount++ % 360) * Math.PI / 180;
            minMatrix.rotate(mtxModel, rad, [0, 1, 1], mtxModel);
            minMatrix.multiply(mtxProj, mtxView, mtxMVP);
            minMatrix.multiply(mtxMVP, mtxModel, mtxMVP);

            gl.clearColor(0.0, 0.0, 255.0, 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniformMatrix4fv(uniLocation[0], false, mtxMVP);
            gl.uniform1i(uniLocation[1], 0);
            gl.uniformMatrix4fv(uniLocation[2], false, mtxInv);
            gl.uniform3fv(uniLocation[3], lightDirection);
            gl.uniform4fv(uniLocation[4], ambientColor);
            
            gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
            gl.flush();
            setTimeout(arguments.callee, 1000 / 30);
        })();
    }, function(e) {
        console.log('failed to load:' + e);
    });
}();
