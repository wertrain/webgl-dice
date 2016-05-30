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
    SimpleGL.prototype.loadFiles = function(urls, data, successCallback, errorCallback) {
        var allItemCount = urls.length;
        var files = new Array(allItemCount);
        var count = 0;
        for (var i = 0; i < urls.length; ++i) {
            var request = new XMLHttpRequest();
            request.open('GET', urls[i], true);
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        files[i] = request.responseText;
                        if (++count === allItemCount) {
                            successCallback(files, data);
                        }
                    } else {
                        errorCallback(urls[i]);
                    }
                }
            };
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
    SimpleGL.prototype.createShaders = function(shaderFileUrls, successCallback, errorCallback) {
        var current = 0;
        var completed = shaderFileUrls.length;
        var shaders = [];
        var that = this;
        
        function innerCallback(response, index) {
            shaders[index] = that.compileShader(index, response);
            if (shaders[index] === null) {
                errorCallback();
            } else if (++current === completed) {
                var program = that.linkProgram(shaders[0], shaders[1]);
                that.gl.useProgram(program);
                successCallback(shaders[0], shaders[1], program);
            }
        }
        for (var i = 0; i < shaderFileUrls.length; ++i) {
            this.loadFile(shaderFileUrls[i], i, innerCallback, function(url){
                console.log('Failed to load: ' + url);
            });
        }
    };
    SimpleGL.prototype.loadImages = function(imageFileUrls, successCallback, errorCallback) {
        function collector(allItemCount, callback, param) {
            var loadedCount = 0;
            return function() {
                if(++loadedCount == allItemCount) {
                    callback(param);
                }
            }
        }
        function error() {
            errorCallback(this.src);
        }
        var images = new Array(imageFileUrls.length);
        var success = new collector(imageFileUrls.length, successCallback, images);
        for (var i = 0; i < imageFileUrls.length; ++i) {
            var image = new Image();
            image.src = imageFileUrls[i];
            image.onload = success;
            image.onerror = error;
            images[i] = image;
        }
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
    sgl.loadImages(['/textures/dice.png'], function(images) {
        sgl.createShaders(['/shaders/vertex.vs', '/shaders/fragment.fs'], function(vs, fs, program) {
            var gl = sgl.getGL();
            var attLocation = new Array(3);
            attLocation[0] = gl.getAttribLocation(program, 'position');
            attLocation[1] = gl.getAttribLocation(program, 'color');
            attLocation[2] = gl.getAttribLocation(program, 'textureCoord');
            var attStride = new Array(3);
            attStride[0] = 3;
            attStride[1] = 4;
            attStride[2] = 2;
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
            var index = [
                0,  1,  2,      0,  2,  3,    // front
                4,  5,  6,      4,  6,  7,    // back
                8,  9,  10,     8,  10, 11,   // top
                12, 13, 14,     12, 14, 15,   // bottom
                16, 17, 18,     16, 18, 19,   // right
                20, 21, 22,     20, 22, 23    // left
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
            var ibo = sgl.createIBO(index);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

            var uniLocation = new Array();
            uniLocation[0]  = gl.getUniformLocation(program, 'mvpMatrix');
            uniLocation[1]  = gl.getUniformLocation(program, 'texture');
            
            var texture = sgl.createTexture(images[0]);
            var count = 0;
            var minMatrix = new matIV();
            var mtxView = minMatrix.identity(minMatrix.create());
            var mtxProj = minMatrix.identity(minMatrix.create());
            minMatrix.lookAt([0.0, 0.0, 4.0], [0, 0, 0], [0, 1, 0], mtxView);
            minMatrix.perspective(60, sgl.getWidth() / sgl.getHeight(), 0.1, 100, mtxProj);
            
            (function() {
                var mtxModel = minMatrix.identity(minMatrix.create());
                var mtxMVP = minMatrix.identity(minMatrix.create());
                
                var rad = (count++ % 360) * Math.PI / 180;
                minMatrix.rotate(mtxModel, rad, [0, 1, 1], mtxModel);
                minMatrix.multiply(mtxProj, mtxView, mtxMVP);
                minMatrix.multiply(mtxMVP, mtxModel, mtxMVP);

                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clearDepth(1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LEQUAL);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniformMatrix4fv(uniLocation[0], false, mtxMVP);
                gl.uniform1i(uniLocation[1], 0);
                gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
                gl.flush();
                setTimeout(arguments.callee, 1000 / 30);
            })();
        });
    });
}();
