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
    SimpleGL.prototype.createShader = function(id) {
        var scriptElement = document.getElementById(id);
        if(!scriptElement) {
            console.log('createShader: "' + id + '" not found.');
            return null;
        }
        
        var shader = null;
        switch(scriptElement.type) {
            case 'x-shader/x-vertex':
                shader = this.gl.createShader(this.gl.VERTEX_SHADER);
                break;
            case 'x-shader/x-fragment':
                shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
                break;
            default:
                return null;
        }
        this.gl.shaderSource(shader, scriptElement.text);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.log('compile error.');
            return null;
        }
        return shader;
    };
    SimpleGL.prototype.loadShader = function(url, data, successCallback, errorCallback) {
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
    webgldice.SimpleGL = SimpleGL;
}());

var main = function() {
    var sgl = new webgldice.SimpleGL();
    sgl.initalize('canvas', 640, 480);
    sgl.clear(0.0, 0.0, 255.0);
    sgl.loadShader('/shaders/vertex.vs', null, function(response, data) {
        
    });
    //sgl.loadShader('/shaders/fragment.fs');
}();