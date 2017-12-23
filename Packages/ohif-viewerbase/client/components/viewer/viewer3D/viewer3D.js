import { Template } from 'meteor/templating';
import 'meteor/fds:threejs';


var scene, camera, renderer, controls;
var geometry, material, sphere, geometry2, material2, sphere2, edges;
var aspectRelation; // Width / Height

var Detector = {

    canvas: !! window.CanvasRenderingContext2D,
    webgl: ( function () {

        try {

            var canvas = document.createElement( 'canvas' ); return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );

        } catch ( e ) {

            return false;

        }

    } )(),
    workers: !! window.Worker,
    fileapi: window.File && window.FileReader && window.FileList && window.Blob,

    getWebGLErrorMessage: function () {

        var element = document.createElement( 'div' );
        element.id = 'webgl-error-message';
        element.style.fontFamily = 'monospace';
        element.style.fontSize = '13px';
        element.style.fontWeight = 'normal';
        element.style.textAlign = 'center';
        element.style.background = '#fff';
        element.style.color = '#000';
        element.style.padding = '1.5em';
        element.style.width = '400px';
        element.style.margin = '5em auto 0';

        if ( ! this.webgl ) {

            element.innerHTML = window.WebGLRenderingContext ? [
                'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
                'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
            ].join( '\n' ) : [
                'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
                'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
            ].join( '\n' );

        }

        return element;

    },

    addGetWebGLMessage: function ( parameters ) {

        var parent, id, element;

        parameters = parameters || {};

        parent = parameters.parent !== undefined ? parameters.parent : document.body;
        id = parameters.id !== undefined ? parameters.id : 'oldie';

        element = Detector.getWebGLErrorMessage();
        element.id = id;

        parent.appendChild( element );

    }

};

// browserify support
if ( typeof module === 'object' ) {

    module.exports = Detector;

}

function init() {
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('wglcanvas')});
    renderer.setSize( renderer.domElement.offsetWidth, renderer.domElement.offsetHeight );
    aspectRelation = renderer.getSize().width / renderer.getSize().height;
    geometry = new THREE.SphereGeometry(1, 64, 64, 3 * Math.PI / 2, Math.PI / 2);
    material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    material.transparent = false;
    material.opacity = 0.5;
    sphere = new THREE.Mesh( geometry, material );
    sphere.scale.set(1, 1, 1);
    edges = new THREE.EdgesHelper(sphere);
    geometry2 = new THREE.SphereGeometry(2, 64, 64, 0, 3 * Math.PI / 2);
    material2 = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    material2.transparent = true;
    material2.opacity = 0.1;
    sphere2 = new THREE.Mesh( geometry2, material2 );
    sphere2.scale.set(1, 1, 1);

    var loader = new THREE.VTKLoader();
    loader.load("/artery.vtk", function (geometry) {
        geometry.center();
        geometry.computeVertexNormals();
        var material = new THREE.MeshLambertMaterial( { color: 0x2A54DD, side: THREE.DoubleSide } );
        var mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(0.1, 0.1, 0.1);
       mesh.scale.multiplyScalar(0.1);
        scene.add(mesh);
        render();
    });

    camera = new THREE.PerspectiveCamera( 75, aspectRelation, 0.1, 1000 );
    controls = new THREE.TrackballControls(camera, renderer.domElement);

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [ 65, 83, 68 ];
    controls.addEventListener( 'change', render );

    var dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( 200, 200, 1000 ).normalize();
    camera.add( dirLight );
    camera.add( dirLight.target );

    camera.position.z = 5;

    scene.add(camera);

    render();
}

function animate() {
    requestAnimationFrame( animate );
    // sphere.rotation.x += 0.1;
    // sphere.rotation.y += 0.1;
    controls.update();
}

function render() {
    renderer.render( scene, camera );
}


Template.viewer3D.onRendered(() => {

    if ( ! Detector.webgl ) {
        Detector.addGetWebGLMessage();
    } else {
        init();
        animate();
    }
});