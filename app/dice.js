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
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
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
                successCallback();
            }
        }
        for (var i = 0; i < shaderFileUrls.length; ++i) {
            this.loadFile(shaderFileUrls[i], i, innerCallback);
        }
    }
    webgldice.SimpleGL = SimpleGL;
}());

var main = function() {
    var sgl = new webgldice.SimpleGL();
    sgl.initalize('canvas', 640, 480);
    sgl.createShaders(['/shaders/vertex.vs', '/shaders/fragment.fs'], function() {
        sgl.clear(0.0, 0.0, 255.0);
    });
}();