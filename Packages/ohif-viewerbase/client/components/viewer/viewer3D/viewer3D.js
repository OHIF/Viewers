import { Template } from 'meteor/templating';
import 'meteor/fds:threejs';
import 'meteor/polguixe:meteor-datgui';
import { $ } from 'meteor/jquery';
import { EffectController } from "./EffectController";

var scene, camera, renderer, controls;
var geometry, material, sphere, geometry2, material2, sphere2, edges;
var aspectRelation; // Width / Height
var objects = [];
var mouse , INTERSECTED, SELECTED_OBJECT, selectionMode;
var canvas, raycaster, effectController, gui_initialized, gui;
var lengthX, lengthY, lengthZ, originX, originY, originZ;
var arrowHelper_x, arrowHelper_y, arrowHelper_z;

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

function setArrowHelper() {
    var dir_x = new THREE.Vector3( 1, 0, 0 ); dir_x.normalize();
    var dir_y = new THREE.Vector3( 0, 1, 0 ); dir_y.normalize();
    var dir_z = new THREE.Vector3( 0, 0, 1 ); dir_z.normalize();

    var origin = new THREE.Vector3( originX, originY, originZ );
    origin.subScalar(1);

    var length = Math.min(lengthX, lengthY, lengthZ) * 0.25;

    arrowHelper_x = new THREE.ArrowHelper( dir_x, origin, length, 0xff0000 );
    arrowHelper_y = new THREE.ArrowHelper( dir_y, origin, length, 0x00ff00 );
    arrowHelper_z = new THREE.ArrowHelper( dir_z, origin, length, 0xffff00 );
    arrowHelper_x.name = 'arrowHelper_x';
    arrowHelper_y.name = 'arrowHelper_y';
    arrowHelper_z.name = 'arrowHelper_z';
    scene.remove(scene.getObjectByName(arrowHelper_x.name));
    scene.remove(scene.getObjectByName(arrowHelper_y.name));
    scene.remove(scene.getObjectByName(arrowHelper_z.name));
    scene.add( arrowHelper_x );
    scene.add( arrowHelper_y );
    scene.add( arrowHelper_z );
}

function computeScale(geometry) {
    var geometrySize;
    geometry.computeBoundingBox();
    geometrySize = geometry.boundingBox.size();
    lengthX = Math.max(lengthX, geometrySize.x);
    lengthY = Math.max(lengthY, geometrySize.y);
    lengthZ = Math.max(lengthZ, geometrySize.z);
    originX = Math.min(originX, geometry.boundingBox.min.x);
    originY = Math.min(originY, geometry.boundingBox.min.y);
    originZ = Math.min(originZ, geometry.boundingBox.min.z);
    setArrowHelper();
}

function initializeGUI() {

        gui = new dat.GUI({autoPlace: false, domElement: document.getElementsByClassName('dg').item(0)});
        gui.close();

        var colorController, opacityController, transparentController, positionController;

        colorController = gui.addColor(effectController, 'color');
        colorController.onChange(function (value) {
            if (SELECTED_OBJECT) {
                SELECTED_OBJECT.material.color.setStyle('#' + value.toString(16));
                SELECTED_OBJECT.effectController.color = SELECTED_OBJECT.material.color.getHex();
            }
        }).listen();

        transparentController = gui.add(effectController, 'transparent');
        transparentController.onChange(function (value) {
            if (SELECTED_OBJECT) {
                SELECTED_OBJECT.material.transparent = value;
                SELECTED_OBJECT.effectController.transparent = SELECTED_OBJECT.material.transparent;
            }
        }).listen();

        opacityController = gui.add(effectController, 'opacity', 0.0, 1.0, 0.1);
        opacityController.listen().onChange(function (value) {
            if (SELECTED_OBJECT) {
                SELECTED_OBJECT.material.opacity = value;
                SELECTED_OBJECT.effectController.opacity = SELECTED_OBJECT.material.opacity;
            }
        });
        positionController = gui.add(effectController, 'position').min(0).max(10).step(1.0);
        positionController.onChange(function (value) {
            if (SELECTED_OBJECT) {
                SELECTED_OBJECT.effectController.setPosition(value);
                SELECTED_OBJECT.renderOrder = value;
            }
        });
        positionController.listen();
}

function onMouseClick(event) {
    event.preventDefault();
    if (!selectionMode) return;
    SELECTED_OBJECT = INTERSECTED;
    effectController.copy(SELECTED_OBJECT.effectController);
    $("#enableSelectionButton").click();
}

function onMouseMove(event) {
    event.preventDefault();

    // var x = event.offsetX == undefined ? event.layerX : event.offsetX;
    // var y = event.offsetY == undefined ? event.layerY : event.offsetY;
    mouse.x = ( event.offsetX / renderer.domElement.width ) * 2 - 1;
    mouse.y = - ( event.offsetY / renderer.domElement.height ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( objects );

    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            if (selectionMode) INTERSECTED.material.emissive.setHex( 0xff0000 );
        }
    } else {
        if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
        INTERSECTED = null;
    }
}

function init() {
    //Initialize vars
    mouse = new THREE.Vector2();
    raycaster =  new THREE.Raycaster();
    effectController = new EffectController(0, false, 1.0, 1);
    selectionMode = false;
    lengthX = lengthY = lengthZ = 0.0;
    originX = originY = originZ = 0;


    //Scene
    scene = new THREE.Scene();

    //Renderer
    canvas = document.getElementById('wglcanvas');
    renderer = new THREE.WebGLRenderer({canvas: canvas});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( renderer.domElement.offsetWidth, renderer.domElement.offsetHeight );

    //Camera
    aspectRelation = renderer.getSize().width / renderer.getSize().height;
    camera = new THREE.PerspectiveCamera( 70, aspectRelation, 0.1, 10000 );
    camera.updateProjectionMatrix();
    camera.position.z = 5;
    scene.add(camera);

    //Light
    var dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( 200, 200, 1000 ).normalize();
    camera.add( dirLight );
    camera.add( dirLight.target );


    //Controls
    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [ 74, 75, 76 ];
    controls.addEventListener( 'change', render );

    //GUI
    initializeGUI();

    $("#enableSelectionButton").click(function (event) {
        event.preventDefault();
        $( this ).toggleClass( "active" );
        selectionMode = !selectionMode;
    });

    // geometry = new THREE.SphereGeometry(1, 64, 64, 3 * Math.PI / 2, Math.PI / 2);
    // geometry.center();
    // material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
    // material.transparent = false;
    // material.opacity = 0.5;
    // sphere = new THREE.Mesh( geometry, material );
    // sphere.scale.set(1, 1, 1);
    // edges = new THREE.EdgesHelper(sphere);
    // geometry2 = new THREE.SphereGeometry(2, 64, 64, 0, 3 * Math.PI / 2);
    // geometry2.center();
    // geometry2.computeBoundingBox();
    // material2 = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    // material2.transparent = true;
    // material2.opacity = 0.1;
    // sphere2 = new THREE.Mesh( geometry2, material2 );
    // sphere2.scale.set(1, 1, 1);

    // scene.add(sphere);
    // objects.push(sphere);
    // scene.add(sphere2);
    // objects.push(sphere2);

    var loader = new THREE.VTKLoader();
    loader.load("/pancreas.vtk", function (geometry) {
        geometry.computeVertexNormals();
        console.log("pancreas");
        //geometry.center();
        computeScale(geometry);
        var material = new THREE.MeshLambertMaterial( { color: Math.pow(Math.random(), 2.0) * 0xFFFFFF, side: THREE.DoubleSide } );
        var mesh = new THREE.Mesh(geometry, material);
        mesh.updateMatrixWorld();
        mesh.effectController = new EffectController(mesh.material.color.getHex(), mesh.material.transparent, mesh.material.opacity, 1);
        // document.getElementById("sp_x_sr").innerHTML = geometry.boundingBox.min.x + ' / ' + geometry.boundingBox.max.x;
        // document.getElementById("sp_y_sr").innerHTML = geometry.boundingBox.min.y + ' / ' + geometry.boundingBox.max.y;
        // document.getElementById("sp_z_sr").innerHTML = geometry.boundingBox.min.z + ' / ' + geometry.boundingBox.max.z;
        scene.add(mesh);
        objects.push(mesh);
    });

    loader.load("/colon.vtk", function (geometry) {
        geometry.computeVertexNormals();
        console.log("colon");

        //geometry.center();
        computeScale(geometry);
        var material = new THREE.MeshLambertMaterial( { color: Math.pow(Math.random(), 2.0) * 0xFFFFFF, side: THREE.DoubleSide } );
        var mesh = new THREE.Mesh(geometry, material);
        mesh.updateMatrixWorld();
        mesh.effectController = new EffectController(mesh.material.color.getHex(), mesh.material.transparent, mesh.material.opacity, 1);
        // document.getElementById("sp_x_sr").innerHTML = geometry.boundingBox.min.x + ' / ' + geometry.boundingBox.max.x;
        // document.getElementById("sp_y_sr").innerHTML = geometry.boundingBox.min.y + ' / ' + geometry.boundingBox.max.y;
        // document.getElementById("sp_z_sr").innerHTML = geometry.boundingBox.min.z + ' / ' + geometry.boundingBox.max.z;
        scene.add(mesh);
        objects.push(mesh);
    });

    loader.load("/heart.vtk", function (geometry) {
        geometry.computeVertexNormals();
        console.log("heart");

        //geometry.center();
        computeScale(geometry);
        var material = new THREE.MeshLambertMaterial( { color: Math.pow(Math.random(), 2.0) * 0xFFFFFF, side: THREE.DoubleSide } );
        var mesh = new THREE.Mesh(geometry, material);
        mesh.updateMatrixWorld();
        mesh.effectController = new EffectController(mesh.material.color.getHex(), mesh.material.transparent, mesh.material.opacity, 1);
        // document.getElementById("sp_x_sr").innerHTML = geometry.boundingBox.min.x + ' / ' + geometry.boundingBox.max.x;
        // document.getElementById("sp_y_sr").innerHTML = geometry.boundingBox.min.y + ' / ' + geometry.boundingBox.max.y;
        // document.getElementById("sp_z_sr").innerHTML = geometry.boundingBox.min.z + ' / ' + geometry.boundingBox.max.z;
        scene.add(mesh);
        objects.push(mesh);
    });

    setArrowHelper();
}

function animate() {
    requestAnimationFrame( animate );
    render();
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

    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('click', onMouseClick, false);
});