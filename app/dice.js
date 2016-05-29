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
                    successCallback(request.responseText, data)
                } else {
                    errorCallback(url);
                }
            }
        };
        request.send(null);
    }
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
    SimpleGL.prototype.createIBO = function create_ibo(data){
        var ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    };
    SimpleGL.prototype.createShaders = function(shaderFileUrls, successCallback, errorCallback) {
        var compiled = 0;
        var completed = shaderFileUrls.length;
        var shaders = [];
        var that = this;
        
        function innerCallback(response, index) {
            shaders[index] = that.compileShader(index, response);
            if (shaders[index] === null) {
                errorCallback();
            } else if (++compiled === completed) {
                var program = that.linkProgram(shaders[0], shaders[1]);
                that.gl.useProgram(program);
                successCallback(shaders[0], shaders[1], program);
            }
        }
        for (var i = 0; i < shaderFileUrls.length; ++i) {
            this.loadFile(shaderFileUrls[i], i, innerCallback);
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
    
    sgl.createShaders(['/shaders/vertex.vs', '/shaders/fragment.fs'], function(vs, fs, program) {
        sgl.clear(0.0, 0.0, 255.0);
        var gl = sgl.getGL();
        var attLocation = new Array(2);
        attLocation[0] = gl.getAttribLocation(program, 'position');
        attLocation[1] = gl.getAttribLocation(program, 'color');
        var attStride = new Array(2);
        attStride[0] = 3;
        attStride[1] = 4;

        var vertexPosition = [
             0.0,  1.0,  0.0,
             1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
             0.0, -1.0,  0.0
        ];
        var vertexColor = [
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0
        ];
        var index = [
            0, 1, 2,
            1, 2, 3
        ];
        var pvbo = sgl.createVBO(vertexPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, pvbo);
        gl.enableVertexAttribArray(attLocation[0]);
        gl.vertexAttribPointer(attLocation[0], attStride[0], gl.FLOAT, false, 0, 0);
        var cvbo = sgl.createVBO(vertexColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, cvbo);
        gl.enableVertexAttribArray(attLocation[1]);
        gl.vertexAttribPointer(attLocation[1], attStride[1], gl.FLOAT, false, 0, 0);
        var ibo = sgl.createIBO(index);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    
        var minMatrix = new matIV();
        var mtxModel = minMatrix.identity(minMatrix.create());
        var mtxView = minMatrix.identity(minMatrix.create());
        var mtxProj = minMatrix.identity(minMatrix.create());
        var mtxMVP = minMatrix.identity(minMatrix.create());
        minMatrix.lookAt([0.0, 0.0, 2.0], [0, 0, 0], [0, 1, 0], mtxView);
        minMatrix.perspective(90, sgl.getWidth() / sgl.getHeight(), 0.1, 100, mtxProj);
        minMatrix.multiply(mtxProj, mtxView, mtxMVP);
        minMatrix.multiply(mtxMVP, mtxModel, mtxMVP);
        
        var uniLocation = gl.getUniformLocation(program, 'mvpMatrix');
        gl.uniformMatrix4fv(uniLocation, false, mtxMVP);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
        gl.flush();
    });
}();
