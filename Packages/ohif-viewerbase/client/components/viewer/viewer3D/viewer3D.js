import { Template } from 'meteor/templating';
 import { Router } from 'meteor/iron:router';

//import 'meteor/fds:threejs';
//import 'meteor/polguixe:meteor-datgui';

import { $ } from 'meteor/jquery';
import { EffectController } from "./EffectController";
import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';
import {Session} from "meteor/session";
import { getElementIfNotEmpty } from "../../../lib/getElementIfNotEmpty";
//import  * as AMI from "../../../lib/ami/ami.js";
// import {stackHelperFactory} from '../../../lib/ami/ami.min.js';
// import "../../../lib/ami/ami.js";

//var THREE = require('three');
import "meteor/gtajesgenga:ami";
import {viewportOverlayUtils} from "../../../lib/viewportOverlayUtils";
import { PipelineSelector } from 'meteor/gtajesgenga:vtk';

let _div;

const colors = {
    red: 0xff0000,
    blue: 0x0000ff,
    darkGrey: 0x353535,
};

const ami_gui = stackHelper => {
    const stack = stackHelper.stack;
    gui = new dat.GUI({
        autoPlace: false,
    });
    const customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);

    // material
    const materialfolder = gui.addFolder('Material');

    const transparency = materialfolder
        .add(material, 'transparent')
        .listen();

    const opacity = materialfolder
        .add(material, 'opacity', 0.0, 1.0, 0.1)
        .listen();

    materialfolder.open();

    // stack
    const stackFolder = gui.addFolder('Stack');
    // index range depends on stackHelper orientation.
    const index = stackFolder
        .add(stackHelper, 'index', 0, stack.dimensionsIJK.z - 1)
        .step(1)
        .listen();
    const orientation = stackFolder
        .add(stackHelper, 'orientation', 0, 2)
        .step(1)
        .listen();
    orientation.onChange(value => {
        index.__max = stackHelper.orientationMaxIndex;
        stackHelper.index = Math.floor(index.__max / 2);
    });
    stackFolder.open();

    // slice
    const sliceFolder = gui.addFolder('Slice');
    sliceFolder
        .add(stackHelper.slice, 'windowWidth', 1, stack.minMax[1] - stack.minMax[0])
        .step(1)
        .listen();
    sliceFolder
        .add(stackHelper.slice, 'windowCenter', stack.minMax[0], stack.minMax[1])
        .step(1)
        .listen();
    sliceFolder.add(stackHelper.slice, 'intensityAuto').listen();
    sliceFolder.add(stackHelper.slice, 'invert');
    sliceFolder.open();

    // bbox
    const bboxFolder = gui.addFolder('Bounding Box');
    bboxFolder.add(stackHelper.bbox, 'visible');
    bboxFolder.addColor(stackHelper.bbox, 'color');
    bboxFolder.open();

    // border
    const borderFolder = gui.addFolder('Border');
    borderFolder.add(stackHelper.border, 'visible');
    borderFolder.addColor(stackHelper.border, 'color');
    borderFolder.open();
};

var scene, camera, renderer, controls;
var texture, geometry, material, plane = undefined, geometry2, material2, sphere2, edges;
var aspectRelation; // Width / Height
var objects = new Map();
var mouse , INTERSECTED, SELECTED_OBJECT, selectionMode;
var canvas, container, raycaster, effectController, textureMagFilter, textureMinFilter, ftexture, ftextureMagFilter, ftextureMinFilter, hasGeometry;
var gui = {
    domElement: undefined
};
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
    var dir_y = new THREE.Vector3( 0, -1, 0 ); dir_y.normalize();
    var dir_z = new THREE.Vector3( 0, 0, -1 ); dir_z.normalize();

    var origin = new THREE.Vector3( originX, originY, originZ );
    origin.subScalar(2);

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
    camera.position.x = (originX + (lengthX)) * 1;
    camera.position.y = (originY + (lengthY)) * 1;
    camera.updateProjectionMatrix();
    setArrowHelper();
}

function initializeGUI() {

    gui = new dat.GUI({autoPlace: false});
    gui.close();
    gui.domElement.style.display = 'none';
    document.getElementsByClassName('dg').item(0).appendChild(gui.domElement);

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

    var fcam = gui.addFolder("Camera");
    fcam.add(camera.position, 'x').min(-1200).max(1200).step(1.0).listen();
    fcam.add(camera.position, 'y').min(-1200).max(1200).step(1.0).listen();
    fcam.add(camera.position, 'z').min(-1200).max(1200).step(1.0).listen();
    ftexture = gui.addFolder("Texture");
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
    var intersects = raycaster.intersectObjects( Array.from(objects.values()) );

    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            if (selectionMode) INTERSECTED.material.emissive.setHex( 0xff0000 );
        }
    } else {
        if (INTERSECTED && INTERSECTED.material.emissive !== undefined) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
        INTERSECTED = null;
    }
}

function onImage2DRendered(e) {
    if (hasGeometry) {
        if (texture === undefined) {
            ftextureMagFilter !== undefined ? ftexture.remove(ftextureMagFilter) : null;
            ftextureMinFilter !== undefined ? ftexture.remove(ftextureMinFilter) : null;
        }

        const eventData = e.originalEvent.detail;

        // set the canvas context to the image coordinate system
        //cornerstone.setToPixelCoordinateSystem(eventData.enabledElement, eventData.canvasContext);

        const image = eventData.image;

        texture = new THREE.DataTexture(image.getPixelData(), image.width, image.height, THREE.LuminanceFormat, THREE.UnsignedByteType);
        texture.needsUpdate = true;

        if (ftextureMagFilter === undefined) {
            ftextureMagFilter = ftexture.add(texture, 'magFilter', {
                'Nearest': THREE.NearestFilter,
                'Linear': THREE.LinearFilter
            }).listen();
            ftextureMagFilter.onFinishChange(function (value) {
                texture.needsUpdate = true;
            });
        }
        if (ftextureMinFilter === undefined) {
            ftextureMinFilter = ftexture.add(texture, 'minFilter', {
                'Nearest': THREE.NearestFilter,
                'NearestMipMapNearestFilter': THREE.NearestMipMapNearestFilter,
                'NearestMipMapLinearFilter': THREE.NearestMipMapLinearFilter,
                'Linear': THREE.LinearFilter,
                'LinearMipMapNearestFilter': THREE.LinearMipMapNearestFilter,
                'LinearMipMapLinearFilter': THREE.LinearMipMapLinearFilter
            }).listen();
            ftextureMinFilter.onFinishChange(function (value) {
                texture.needsUpdate = true;
            });
        }

        geometry = new THREE.PlaneGeometry(image.width, image.height, image.width, image.height);
        // geometry.center();
        geometry.scale(0.961000025272369, 0.961000025272369, 1)
        //geometry.applyMatrix(mS);
        //mesh.applyMatrix(mS);
        //object.applyMatrix(mS);

        material = new THREE.MeshBasicMaterial({color: 0xff0000, map: texture, side: THREE.DoubleSide});
         material.transparent = false;
         material.opacity = 0.5;
        if (plane !== undefined) {
            scene.remove(plane);
            objects.delete(plane.uuid);
        }


        plane = new THREE.Mesh( geometry, material );
        plane.effectController = new EffectController(plane.material.color.getHex(), plane.material.transparent, plane.material.opacity, 1);
        console.log('Original:' + plane.position);
        var obj = scene.getObjectByName("volume3D");
        obj.geometry.computeBoundingBox();
        obj.geometry.boundingBox.center(plane.position);
        plane.position.setZ(0);
        console.log('Nueva:' + plane.position);
        scene.add(plane);
        objects.set(plane.uuid, plane);
        //camera.updateProjectionMatrix();
    }
}

function init() {
    //Initialize vars
    mouse = new THREE.Vector2();
    raycaster =  new THREE.Raycaster();
    effectController = new EffectController(0, false, 1.0, 1);
    selectionMode = false;
    hasGeometry = false;
    lengthX = lengthY = lengthZ = 0.0;
    originX = originY = originZ = Number.POSITIVE_INFINITY;
    textureMagFilter = THREE.LinearFilter;
    textureMinFilter = THREE.LinearMipMapLinearFilter;



    //Scene
    scene = new THREE.Scene();

    //Renderer
    canvas = document.getElementById('wglcanvas');
    container = document.getElementById('imageViewerViewport3D');
    renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( renderer.domElement.offsetWidth, renderer.domElement.offsetHeight );

    //Camera
    aspectRelation = renderer.getSize().width / renderer.getSize().height;
    camera = new THREE.PerspectiveCamera( 70, aspectRelation, 0.1, 10000 );
    camera.updateProjectionMatrix();
    camera.position.z = 1000;
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
    //initializeGUI();

    $("#enableSelectionButton").click(function (event) {
        event.preventDefault();
        $( this ).toggleClass( "active" );
        selectionMode = !selectionMode;
    });

     // geometry = new THREE.PlaneGeometry();
    // geometry.center();
    //  material = new THREE.MeshBasicMaterial({color: 0xff0000});
    // material.transparent = false;
    // material.opacity = 0.5;
    //  plane = new THREE.Mesh( geometry, material );
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

     //scene.add(plane);
    // objects.push(sphere);
    // scene.add(sphere2);
    // objects.push(sphere2);

    // loader.load("/colon.vtk", function (geometry) {
    //     geometry.computeVertexNormals();
    //     console.log("colon");
    //
    //     //geometry.center();
    //     computeScale(geometry);
    //     var material = new THREE.MeshLambertMaterial( { color: Math.pow(Math.random(), 2.0) * 0xFFFFFF, side: THREE.DoubleSide } );
    //     var mesh = new THREE.Mesh(geometry, material);
    //     mesh.updateMatrixWorld();
    //     mesh.effectController = new EffectController(mesh.material.color.getHex(), mesh.material.transparent, mesh.material.opacity, 1);
    //     // document.getElementById("sp_x_sr").innerHTML = geometry.boundingBox.min.x + ' / ' + geometry.boundingBox.max.x;
    //     // document.getElementById("sp_y_sr").innerHTML = geometry.boundingBox.min.y + ' / ' + geometry.boundingBox.max.y;
    //     // document.getElementById("sp_z_sr").innerHTML = geometry.boundingBox.min.z + ' / ' + geometry.boundingBox.max.z;
    //     scene.add(mesh);
    //     objects.push(mesh);
    //     hasGeometry = hasGeometry || true;
    // });
    //
    // loader.load("/heart.vtk", function (geometry) {
    //     geometry.computeVertexNormals();
    //     console.log("heart");
    //
    //     //geometry.center();
    //     computeScale(geometry);
    //     var material = new THREE.MeshLambertMaterial( { color: Math.pow(Math.random(), 2.0) * 0xFFFFFF, side: THREE.DoubleSide } );
    //     var mesh = new THREE.Mesh(geometry, material);
    //     mesh.updateMatrixWorld();
    //     mesh.effectController = new EffectController(mesh.material.color.getHex(), mesh.material.transparent, mesh.material.opacity, 1);
    //     // document.getElementById("sp_x_sr").innerHTML = geometry.boundingBox.min.x + ' / ' + geometry.boundingBox.max.x;
    //     // document.getElementById("sp_y_sr").innerHTML = geometry.boundingBox.min.y + ' / ' + geometry.boundingBox.max.y;
    //     // document.getElementById("sp_z_sr").innerHTML = geometry.boundingBox.min.z + ' / ' + geometry.boundingBox.max.z;
    //     scene.add(mesh);
    //     objects.push(mesh);
    // });

    setArrowHelper();
    //document.getElementsByClassName("imageViewerViewport").item(0).addEventListener('cornerstoneimagerendered', onImage2DRendered);
}

function animate() {
    requestAnimationFrame( animate );
    render();
    controls.update();
}

function render() {
    renderer.render( scene, camera );
}

function parentTemplate(v, levels) {
    var view = v;
    if (typeof levels === "undefined") {
        levels = 1;
    }
    while (view) {
        if (view.name.substring(0, 9) === "Template." && !(levels--)) {
            return view.templateInstance();
        }
        view = view.parentView;
    }
}

function parseResponse( data ) {

    function parseASCII( data ) {

        // connectivity of the triangles
        var indices = [];

        // triangles vertices
        var positions = [];

        // red, green, blue colors in the range 0 to 1
        var colors = [];

        // normal vector, one per vertex
        var normals = [];

        var result;

        // pattern for reading vertices, 3 floats or integers
        var pat3Floats = /(\-?\d+\.?[\d\-\+e]*)\s+(\-?\d+\.?[\d\-\+e]*)\s+(\-?\d+\.?[\d\-\+e]*)/g;

        // pattern for connectivity, an integer followed by any number of ints
        // the first integer is the number of polygon nodes
        var patConnectivity = /^(\d+)\s+([\s\d]*)/;

        // indicates start of vertex data section
        var patPOINTS = /^POINTS /;

        // indicates start of polygon connectivity section
        var patPOLYGONS = /^POLYGONS /;

        // indicates start of triangle strips section
        var patTRIANGLE_STRIPS = /^TRIANGLE_STRIPS /;

        // POINT_DATA number_of_values
        var patPOINT_DATA = /^POINT_DATA[ ]+(\d+)/;

        // CELL_DATA number_of_polys
        var patCELL_DATA = /^CELL_DATA[ ]+(\d+)/;

        // Start of color section
        var patCOLOR_SCALARS = /^COLOR_SCALARS[ ]+(\w+)[ ]+3/;

        // NORMALS Normals float
        var patNORMALS = /^NORMALS[ ]+(\w+)[ ]+(\w+)/;

        var inPointsSection = false;
        var inPolygonsSection = false;
        var inTriangleStripSection = false;
        var inPointDataSection = false;
        var inCellDataSection = false;
        var inColorSection = false;
        var inNormalsSection = false;

        var lines = data.split( '\n' );

        for ( var i in lines ) {

            var line = lines[ i ];

            if ( inPointsSection ) {

                // get the vertices
                while ( ( result = pat3Floats.exec( line ) ) !== null ) {

                    var x = parseFloat( result[ 1 ] );
                    var y = parseFloat( result[ 2 ] );
                    var z = parseFloat( result[ 3 ] );
                    positions.push( x, y, z );

                }

            } else if ( inPolygonsSection ) {

                if ( ( result = patConnectivity.exec( line ) ) !== null ) {

                    // numVertices i0 i1 i2 ...
                    var numVertices = parseInt( result[ 1 ] );
                    var inds = result[ 2 ].split( /\s+/ );

                    if ( numVertices >= 3 ) {

                        var i0 = parseInt( inds[ 0 ] );
                        var i1, i2;
                        var k = 1;
                        // split the polygon in numVertices - 2 triangles
                        for ( var j = 0; j < numVertices - 2; ++ j ) {

                            i1 = parseInt( inds[ k ] );
                            i2 = parseInt( inds[ k + 1 ] );
                            indices.push( i0, i1, i2 );
                            k ++;

                        }

                    }

                }

            } else if ( inTriangleStripSection ) {

                if ( ( result = patConnectivity.exec( line ) ) !== null ) {

                    // numVertices i0 i1 i2 ...
                    var numVertices = parseInt( result[ 1 ] );
                    var inds = result[ 2 ].split( /\s+/ );

                    if ( numVertices >= 3 ) {

                        var i0, i1, i2;
                        // split the polygon in numVertices - 2 triangles
                        for ( var j = 0; j < numVertices - 2; j ++ ) {

                            if ( j % 2 === 1 ) {

                                i0 = parseInt( inds[ j ] );
                                i1 = parseInt( inds[ j + 2 ] );
                                i2 = parseInt( inds[ j + 1 ] );
                                indices.push( i0, i1, i2 );

                            } else {

                                i0 = parseInt( inds[ j ] );
                                i1 = parseInt( inds[ j + 1 ] );
                                i2 = parseInt( inds[ j + 2 ] );
                                indices.push( i0, i1, i2 );

                            }

                        }

                    }

                }

            } else if ( inPointDataSection || inCellDataSection ) {

                if ( inColorSection ) {

                    // Get the colors

                    while ( ( result = pat3Floats.exec( line ) ) !== null ) {

                        var r = parseFloat( result[ 1 ] );
                        var g = parseFloat( result[ 2 ] );
                        var b = parseFloat( result[ 3 ] );
                        colors.push( r, g, b );

                    }

                } else if ( inNormalsSection ) {

                    // Get the normal vectors

                    while ( ( result = pat3Floats.exec( line ) ) !== null ) {

                        var nx = parseFloat( result[ 1 ] );
                        var ny = parseFloat( result[ 2 ] );
                        var nz = parseFloat( result[ 3 ] );
                        normals.push( nx, ny, nz );

                    }

                }

            }

            if ( patPOLYGONS.exec( line ) !== null ) {

                inPolygonsSection = true;
                inPointsSection = false;
                inTriangleStripSection = false;

            } else if ( patPOINTS.exec( line ) !== null ) {

                inPolygonsSection = false;
                inPointsSection = true;
                inTriangleStripSection = false;

            } else if ( patTRIANGLE_STRIPS.exec( line ) !== null ) {

                inPolygonsSection = false;
                inPointsSection = false;
                inTriangleStripSection = true;

            } else if ( patPOINT_DATA.exec( line ) !== null ) {

                inPointDataSection = true;
                inPointsSection = false;
                inPolygonsSection = false;
                inTriangleStripSection = false;

            } else if ( patCELL_DATA.exec( line ) !== null ) {

                inCellDataSection = true;
                inPointsSection = false;
                inPolygonsSection = false;
                inTriangleStripSection = false;

            } else if ( patCOLOR_SCALARS.exec( line ) !== null ) {

                inColorSection = true;
                inNormalsSection = false;
                inPointsSection = false;
                inPolygonsSection = false;
                inTriangleStripSection = false;

            } else if ( patNORMALS.exec( line ) !== null ) {

                inNormalsSection = true;
                inColorSection = false;
                inPointsSection = false;
                inPolygonsSection = false;
                inTriangleStripSection = false;

            }

        }

        var geometry;
        var stagger = 'point';

        if ( colors.length === indices.length ) {

            stagger = 'cell';

        }

        if ( stagger === 'point' ) {

            // Nodal. Use BufferGeometry
            geometry = new THREE.BufferGeometry();
            geometry.setIndex( new THREE.BufferAttribute( new Uint32Array( indices ), 1 ) );
            geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( positions ), 3 ) );

            if ( colors.length === positions.length ) {

                geometry.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( colors ), 3 ) );

            }

            if ( normals.length === positions.length ) {

                geometry.addAttribute( 'normal', new THREE.BufferAttribute( new Float32Array( normals ), 3 ) );

            }

        } else {

            // Cell centered colors. The only way to attach a solid color to each triangle
            // is to use Geometry, which is less efficient than BufferGeometry
            geometry = new THREE.Geometry();

            var numTriangles = indices.length / 3;
            var numPoints = positions.length / 3;
            var face;
            var ia, ib, ic;
            var x, y, z;
            var r, g, b;

            for ( var j = 0; j < numPoints; ++ j ) {

                x = positions[ 3 * j + 0 ];
                y = positions[ 3 * j + 1 ];
                z = positions[ 3 * j + 2 ];
                geometry.vertices.push( new THREE.Vector3( x, y, z ) );

            }

            for ( var i = 0; i < numTriangles; ++ i ) {

                ia = indices[ 3 * i + 0 ];
                ib = indices[ 3 * i + 1 ];
                ic = indices[ 3 * i + 2 ];
                geometry.faces.push( new THREE.Face3( ia, ib, ic ) );

            }

            if ( colors.length === numTriangles * 3 ) {

                for ( var i = 0; i < numTriangles; ++ i ) {

                    face = geometry.faces[ i ];
                    r = colors[ 3 * i + 0 ];
                    g = colors[ 3 * i + 1 ];
                    b = colors[ 3 * i + 2 ];
                    face.color = new THREE.Color().setRGB( r, g, b );

                }

            }

        }

        return geometry;

    }

    function arrayBufferToString(arrayBuffer) {
        const byteArray = new Uint8Array(arrayBuffer);
        const strArr = [];
        for (let i = 0; i < byteArray.length; ++i) {
            strArr[i] = String.fromCharCode(byteArray[i]);
        }
        return strArr.join('');
    }

    function parseBinary( data ) {

        var count, pointIndex, i, numberOfPoints, s;
        //var buffer = new Uint8Array( data );
        var buffer = new Uint8Array( data );
        var dataView = new DataView( buffer.buffer );

        // Points and normals, by default, are empty
        var points = [];
        var normals = [];
        var indices = [];

        // Going to make a big array of strings
        var vtk = [];
        var index = 0;

        function findString( buffer, start ) {

            var index = start;
            var c = buffer[ index ];
            var s = [];
            while ( c !== 10 ) {

                s.push( String.fromCharCode( c ) );
                index ++;
                c = buffer[ index ];

            }

            return { start: start,
                end: index,
                next: index + 1,
                parsedString: s.join( '' ) };

        }

        var state, line;

        while ( true ) {

            // Get a string
            state = findString( buffer, index );
            line = state.parsedString;

            if ( line.indexOf( 'POINTS' ) === 0 ) {

                vtk.push( line );
                // Add the points
                numberOfPoints = parseInt( line.split( ' ' )[ 1 ], 10 );

                // Each point is 3 4-byte floats
                count = numberOfPoints * 4 * 3;

                points = new Float32Array( numberOfPoints * 3 );

                pointIndex = state.next;
                for ( i = 0; i < numberOfPoints; i ++ ) {

                    points[ 3 * i ] = dataView.getFloat32( pointIndex, false );
                    points[ 3 * i + 1 ] = dataView.getFloat32( pointIndex + 4, false );
                    points[ 3 * i + 2 ] = dataView.getFloat32( pointIndex + 8, false );
                    pointIndex = pointIndex + 12;

                }
                // increment our next pointer
                state.next = state.next + count + 1;

            } else if ( line.indexOf( 'TRIANGLE_STRIPS' ) === 0 ) {

                var numberOfStrips = parseInt( line.split( ' ' )[ 1 ], 10 );
                var size = parseInt( line.split( ' ' )[ 2 ], 10 );
                // 4 byte integers
                count = size * 4;

                indices = new Uint32Array( 3 * size - 9 * numberOfStrips );
                var indicesIndex = 0;

                pointIndex = state.next;
                for ( i = 0; i < numberOfStrips; i ++ ) {

                    // For each strip, read the first value, then record that many more points
                    var indexCount = dataView.getInt32( pointIndex, false );
                    var strip = [];
                    pointIndex += 4;
                    for ( s = 0; s < indexCount; s ++ ) {

                        strip.push( dataView.getInt32( pointIndex, false ) );
                        pointIndex += 4;

                    }

                    // retrieves the n-2 triangles from the triangle strip
                    for ( var j = 0; j < indexCount - 2; j ++ ) {

                        if ( j % 2 ) {

                            indices[ indicesIndex ++ ] = strip[ j ];
                            indices[ indicesIndex ++ ] = strip[ j + 2 ];
                            indices[ indicesIndex ++ ] = strip[ j + 1 ];

                        } else {


                            indices[ indicesIndex ++ ] = strip[ j ];
                            indices[ indicesIndex ++ ] = strip[ j + 1 ];
                            indices[ indicesIndex ++ ] = strip[ j + 2 ];

                        }

                    }

                }
                // increment our next pointer
                state.next = state.next + count + 1;

            } else if ( line.indexOf( 'POLYGONS' ) === 0 ) {

                var numberOfStrips = parseInt( line.split( ' ' )[ 1 ], 10 );
                var size = parseInt( line.split( ' ' )[ 2 ], 10 );
                // 4 byte integers
                count = size * 4;

                indices = new Uint32Array( 3 * size - 9 * numberOfStrips );
                var indicesIndex = 0;

                pointIndex = state.next;
                for ( i = 0; i < numberOfStrips; i ++ ) {

                    // For each strip, read the first value, then record that many more points
                    var indexCount = dataView.getInt32( pointIndex, false );
                    var strip = [];
                    pointIndex += 4;
                    for ( s = 0; s < indexCount; s ++ ) {

                        strip.push( dataView.getInt32( pointIndex, false ) );
                        pointIndex += 4;

                    }

                    // divide the polygon in n-2 triangle
                    for ( var j = 1; j < indexCount - 1; j ++ ) {

                        indices[ indicesIndex ++ ] = strip[ 0 ];
                        indices[ indicesIndex ++ ] = strip[ j ];
                        indices[ indicesIndex ++ ] = strip[ j + 1 ];

                    }

                }
                // increment our next pointer
                state.next = state.next + count + 1;

            } else if ( line.indexOf( 'POINT_DATA' ) === 0 ) {

                numberOfPoints = parseInt( line.split( ' ' )[ 1 ], 10 );

                // Grab the next line
                state = findString( buffer, state.next );

                // Now grab the binary data
                count = numberOfPoints * 4 * 3;

                normals = new Float32Array( numberOfPoints * 3 );
                pointIndex = state.next;
                for ( i = 0; i < numberOfPoints; i ++ ) {

                    normals[ 3 * i ] = dataView.getFloat32( pointIndex, false );
                    normals[ 3 * i + 1 ] = dataView.getFloat32( pointIndex + 4, false );
                    normals[ 3 * i + 2 ] = dataView.getFloat32( pointIndex + 8, false );
                    pointIndex += 12;

                }

                // Increment past our data
                state.next = state.next + count;

            }

            // Increment index
            index = state.next;

            if ( index >= buffer.byteLength ) {

                break;

            }

        }

        var geometry = new THREE.BufferGeometry();
        geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
        geometry.addAttribute( 'position', new THREE.BufferAttribute( points, 3 ) );

        if ( normals.length === points.length ) {

            geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );

        }

        return geometry;

    }

    function Float32Concat( first, second ) {

        var firstLength = first.length, result = new Float32Array( firstLength + second.length );

        result.set( first );
        result.set( second, firstLength );

        return result;

    }

    function Int32Concat( first, second ) {

        var firstLength = first.length, result = new Int32Array( firstLength + second.length );

        result.set( first );
        result.set( second, firstLength );

        return result;

    }

    function parseXML( stringFile ) {

        // Changes XML to JSON, based on https://davidwalsh.name/convert-xml-json

        function xmlToJson( xml ) {

            // Create the return object
            var obj = {};

            if ( xml.nodeType === 1 ) { // element

                // do attributes

                if ( xml.attributes ) {

                    if ( xml.attributes.length > 0 ) {

                        obj[ 'attributes' ] = {};

                        for ( var j = 0; j < xml.attributes.length; j ++ ) {

                            var attribute = xml.attributes.item( j );
                            obj[ 'attributes' ][ attribute.nodeName ] = attribute.nodeValue.trim();

                        }

                    }

                }

            } else if ( xml.nodeType === 3 ) { // text

                obj = xml.nodeValue.trim();

            }

            // do children
            if ( xml.hasChildNodes() ) {

                for ( var i = 0; i < xml.childNodes.length; i ++ ) {

                    var item = xml.childNodes.item( i );
                    var nodeName = item.nodeName;

                    if ( typeof obj[ nodeName ] === 'undefined' ) {

                        var tmp = xmlToJson( item );

                        if ( tmp !== '' ) obj[ nodeName ] = tmp;

                    } else {

                        if ( typeof obj[ nodeName ].push === 'undefined' ) {

                            var old = obj[ nodeName ];
                            obj[ nodeName ] = [ old ];

                        }

                        var tmp = xmlToJson( item );

                        if ( tmp !== '' ) obj[ nodeName ].push( tmp );

                    }

                }

            }

            return obj;

        }

        // Taken from Base64-js
        function Base64toByteArray( b64 ) {

            var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
            var i;
            var lookup = [];
            var revLookup = [];
            var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var len = code.length;

            for ( i = 0; i < len; i ++ ) {

                lookup[ i ] = code[ i ];

            }

            for ( i = 0; i < len; ++ i ) {

                revLookup[ code.charCodeAt( i ) ] = i;

            }

            revLookup[ '-'.charCodeAt( 0 ) ] = 62;
            revLookup[ '_'.charCodeAt( 0 ) ] = 63;

            var j, l, tmp, placeHolders, arr;
            var len = b64.length;

            if ( len % 4 > 0 ) {

                throw new Error( 'Invalid string. Length must be a multiple of 4' );

            }

            placeHolders = b64[ len - 2 ] === '=' ? 2 : b64[ len - 1 ] === '=' ? 1 : 0;
            arr = new Arr( len * 3 / 4 - placeHolders );
            l = placeHolders > 0 ? len - 4 : len;

            var L = 0;

            for ( i = 0, j = 0; i < l; i += 4, j += 3 ) {

                tmp = ( revLookup[ b64.charCodeAt( i ) ] << 18 ) | ( revLookup[ b64.charCodeAt( i + 1 ) ] << 12 ) | ( revLookup[ b64.charCodeAt( i + 2 ) ] << 6 ) | revLookup[ b64.charCodeAt( i + 3 ) ];
                arr[ L ++ ] = ( tmp & 0xFF0000 ) >> 16;
                arr[ L ++ ] = ( tmp & 0xFF00 ) >> 8;
                arr[ L ++ ] = tmp & 0xFF;

            }

            if ( placeHolders === 2 ) {

                tmp = ( revLookup[ b64.charCodeAt( i ) ] << 2 ) | ( revLookup[ b64.charCodeAt( i + 1 ) ] >> 4 );
                arr[ L ++ ] = tmp & 0xFF;

            } else if ( placeHolders === 1 ) {

                tmp = ( revLookup[ b64.charCodeAt( i ) ] << 10 ) | ( revLookup[ b64.charCodeAt( i + 1 ) ] << 4 ) | ( revLookup[ b64.charCodeAt( i + 2 ) ] >> 2 );
                arr[ L ++ ] = ( tmp >> 8 ) & 0xFF;
                arr[ L ++ ] = tmp & 0xFF;

            }

            return arr;

        }

        function parseDataArray( ele, compressed ) {

            var numBytes = 0;

            if ( json.attributes.header_type === 'UInt64' ) {

                numBytes = 8;

            }	else if ( json.attributes.header_type === 'UInt32' ) {

                numBytes = 4;

            }


            // Check the format
            if ( ele.attributes.format === 'binary' && compressed ) {

                var rawData, content, byteData, blocks, cSizeStart, headerSize, padding, dataOffsets, currentOffset;

                if ( ele.attributes.type === 'Float32' ) {

                    var txt = new Float32Array( );

                } else if ( ele.attributes.type === 'Int64' ) {

                    var txt = new Int32Array( );

                }

                // VTP data with the header has the following structure:
                // [#blocks][#u-size][#p-size][#c-size-1][#c-size-2]...[#c-size-#blocks][DATA]
                //
                // Each token is an integer value whose type is specified by "header_type" at the top of the file (UInt32 if no type specified). The token meanings are:
                // [#blocks] = Number of blocks
                // [#u-size] = Block size before compression
                // [#p-size] = Size of last partial block (zero if it not needed)
                // [#c-size-i] = Size in bytes of block i after compression
                //
                // The [DATA] portion stores contiguously every block appended together. The offset from the beginning of the data section to the beginning of a block is
                // computed by summing the compressed block sizes from preceding blocks according to the header.

                rawData = ele[ '#text' ];

                byteData = Base64toByteArray( rawData );

                blocks = byteData[ 0 ];
                for ( var i = 1; i < numBytes - 1; i ++ ) {

                    blocks = blocks | ( byteData[ i ] << ( i * numBytes ) );

                }

                headerSize = ( blocks + 3 ) * numBytes;
                padding = ( ( headerSize % 3 ) > 0 ) ? 3 - ( headerSize % 3 ) : 0;
                headerSize = headerSize + padding;

                dataOffsets = [];
                currentOffset = headerSize;
                dataOffsets.push( currentOffset );

                // Get the blocks sizes after the compression.
                // There are three blocks before c-size-i, so we skip 3*numBytes
                cSizeStart = 3 * numBytes;

                for ( var i = 0; i < blocks; i ++ ) {

                    var currentBlockSize = byteData[ i * numBytes + cSizeStart ];

                    for ( var j = 1; j < numBytes - 1; j ++ ) {

                        // Each data point consists of 8 bytes regardless of the header type
                        currentBlockSize = currentBlockSize | ( byteData[ i * numBytes + cSizeStart + j ] << ( j * 8 ) );

                    }

                    currentOffset = currentOffset + currentBlockSize;
                    dataOffsets.push( currentOffset );

                }

                for ( var i = 0; i < dataOffsets.length - 1; i ++ ) {

                    var inflate = new Zlib.Inflate( byteData.slice( dataOffsets[ i ], dataOffsets[ i + 1 ] ), { resize: true, verify: true } ); // eslint-disable-line no-undef
                    content = inflate.decompress();
                    content = content.buffer;

                    if ( ele.attributes.type === 'Float32' ) {

                        content = new Float32Array( content );
                        txt = Float32Concat( txt, content );

                    } else if ( ele.attributes.type === 'Int64' ) {

                        content = new Int32Array( content );
                        txt = Int32Concat( txt, content );

                    }

                }

                delete ele[ '#text' ];

                // Get the content and optimize it
                if ( ele.attributes.type === 'Float32' ) {

                    if ( ele.attributes.format === 'binary' ) {

                        if ( ! compressed ) {

                            txt = txt.filter( function ( el, idx ) {

                                if ( idx !== 0 ) return true;

                            } );

                        }

                    }

                } else if ( ele.attributes.type === 'Int64' ) {

                    if ( ele.attributes.format === 'binary' ) {

                        if ( ! compressed ) {

                            txt = txt.filter( function ( el, idx ) {

                                if ( idx !== 0 ) return true;

                            } );

                        }

                        txt = txt.filter( function ( el, idx ) {

                            if ( idx % 2 !== 1 ) return true;

                        } );

                    }

                }

            } else {

                if ( ele.attributes.format === 'binary' && ! compressed ) {

                    var content = Base64toByteArray( ele[ '#text' ] );

                    //  VTP data for the uncompressed case has the following structure:
                    // [#bytes][DATA]
                    // where "[#bytes]" is an integer value specifying the number of bytes in the block of data following it.
                    content = content.slice( numBytes ).buffer;

                } else {

                    if ( ele[ '#text' ] ) {

                        var content = ele[ '#text' ].split( /\s+/ ).filter( function ( el ) {

                            if ( el !== '' ) return el;

                        } );

                    } else {

                        var content = new Int32Array( 0 ).buffer;

                    }

                }

                delete ele[ '#text' ];

                // Get the content and optimize it
                if ( ele.attributes.type === 'Float32' ) {

                    var txt = new Float32Array( content );

                } else if ( ele.attributes.type === 'Int32' ) {

                    var txt = new Int32Array( content );

                } else if ( ele.attributes.type === 'Int64' ) {

                    var txt = new Int32Array( content );

                    if ( ele.attributes.format === 'binary' ) {

                        txt = txt.filter( function ( el, idx ) {

                            if ( idx % 2 !== 1 ) return true;

                        } );

                    }

                }

            } // endif ( ele.attributes.format === 'binary' && compressed )

            return txt;

        }

        // Main part
        // Get Dom
        var dom = null;

        if ( window.DOMParser ) {

            try {

                dom = ( new DOMParser() ).parseFromString( stringFile, 'text/xml' );

            } catch ( e ) {

                dom = null;

            }

        } else if ( window.ActiveXObject ) {

            try {

                dom = new ActiveXObject( 'Microsoft.XMLDOM' ); // eslint-disable-line no-undef
                dom.async = false;

                if ( ! dom.loadXML( /* xml */ ) ) {

                    throw new Error( dom.parseError.reason + dom.parseError.srcText );

                }

            } catch ( e ) {

                dom = null;

            }

        } else {

            throw new Error( 'Cannot parse xml string!' );

        }

        // Get the doc
        var doc = dom.documentElement;
        // Convert to json
        var json = xmlToJson( doc );
        var points = [];
        var normals = [];
        var indices = [];

        if ( json.PolyData ) {

            var piece = json.PolyData.Piece;
            var compressed = json.attributes.hasOwnProperty( 'compressor' );

            // Can be optimized
            // Loop through the sections
            var sections = [ 'PointData', 'Points', 'Strips', 'Polys' ];// +['CellData', 'Verts', 'Lines'];
            var sectionIndex = 0, numberOfSections = sections.length;

            while ( sectionIndex < numberOfSections ) {

                var section = piece[ sections[ sectionIndex ] ];

                // If it has a DataArray in it

                if ( section && section.DataArray ) {

                    // Depending on the number of DataArrays

                    if ( Object.prototype.toString.call( section.DataArray ) === '[object Array]' ) {

                        var arr = section.DataArray;

                    } else {

                        var arr = [ section.DataArray ];

                    }

                    var dataArrayIndex = 0, numberOfDataArrays = arr.length;

                    while ( dataArrayIndex < numberOfDataArrays ) {

                        // Parse the DataArray
                        if ( ( '#text' in arr[ dataArrayIndex ] ) && ( arr[ dataArrayIndex ][ '#text' ].length > 0 ) ) {

                            arr[ dataArrayIndex ].text = parseDataArray( arr[ dataArrayIndex ], compressed );

                        }

                        dataArrayIndex ++;

                    }

                    switch ( sections[ sectionIndex ] ) {

                        // if iti is point data
                        case 'PointData':

                            var numberOfPoints = parseInt( piece.attributes.NumberOfPoints );
                            var normalsName = section.attributes.Normals;

                            if ( numberOfPoints > 0 ) {

                                for ( var i = 0, len = arr.length; i < len; i ++ ) {

                                    if ( normalsName === arr[ i ].attributes.Name ) {

                                        var components = arr[ i ].attributes.NumberOfComponents;
                                        normals = new Float32Array( numberOfPoints * components );
                                        normals.set( arr[ i ].text, 0 );

                                    }

                                }

                            }

                            break;

                        // if it is points
                        case 'Points':

                            var numberOfPoints = parseInt( piece.attributes.NumberOfPoints );

                            if ( numberOfPoints > 0 ) {

                                var components = section.DataArray.attributes.NumberOfComponents;
                                points = new Float32Array( numberOfPoints * components );
                                points.set( section.DataArray.text, 0 );

                            }

                            break;

                        // if it is strips
                        case 'Strips':

                            var numberOfStrips = parseInt( piece.attributes.NumberOfStrips );

                            if ( numberOfStrips > 0 ) {

                                var connectivity = new Int32Array( section.DataArray[ 0 ].text.length );
                                var offset = new Int32Array( section.DataArray[ 1 ].text.length );
                                connectivity.set( section.DataArray[ 0 ].text, 0 );
                                offset.set( section.DataArray[ 1 ].text, 0 );

                                var size = numberOfStrips + connectivity.length;
                                indices = new Uint32Array( 3 * size - 9 * numberOfStrips );

                                var indicesIndex = 0;

                                for ( var i = 0, len = numberOfStrips; i < len; i ++ ) {

                                    var strip = [];

                                    for ( var s = 0, len1 = offset[ i ], len0 = 0; s < len1 - len0; s ++ ) {

                                        strip.push( connectivity[ s ] );

                                        if ( i > 0 ) len0 = offset[ i - 1 ];

                                    }

                                    for ( var j = 0, len1 = offset[ i ], len0 = 0; j < len1 - len0 - 2; j ++ ) {

                                        if ( j % 2 ) {

                                            indices[ indicesIndex ++ ] = strip[ j ];
                                            indices[ indicesIndex ++ ] = strip[ j + 2 ];
                                            indices[ indicesIndex ++ ] = strip[ j + 1 ];

                                        } else {

                                            indices[ indicesIndex ++ ] = strip[ j ];
                                            indices[ indicesIndex ++ ] = strip[ j + 1 ];
                                            indices[ indicesIndex ++ ] = strip[ j + 2 ];

                                        }

                                        if ( i > 0 ) len0 = offset[ i - 1 ];

                                    }

                                }

                            }

                            break;

                        // if it is polys
                        case 'Polys':

                            var numberOfPolys = parseInt( piece.attributes.NumberOfPolys );

                            if ( numberOfPolys > 0 ) {

                                var connectivity = new Int32Array( section.DataArray[ 0 ].text.length );
                                var offset = new Int32Array( section.DataArray[ 1 ].text.length );
                                connectivity.set( section.DataArray[ 0 ].text, 0 );
                                offset.set( section.DataArray[ 1 ].text, 0 );

                                var size = numberOfPolys + connectivity.length;
                                indices = new Uint32Array( 3 * size - 9 * numberOfPolys );
                                var indicesIndex = 0, connectivityIndex = 0;
                                var i = 0, len = numberOfPolys, len0 = 0;

                                while ( i < len ) {

                                    var poly = [];
                                    var s = 0, len1 = offset[ i ];

                                    while ( s < len1 - len0 ) {

                                        poly.push( connectivity[ connectivityIndex ++ ] );
                                        s ++;

                                    }

                                    var j = 1;

                                    while ( j < len1 - len0 - 1 ) {

                                        indices[ indicesIndex ++ ] = poly[ 0 ];
                                        indices[ indicesIndex ++ ] = poly[ j ];
                                        indices[ indicesIndex ++ ] = poly[ j + 1 ];
                                        j ++;

                                    }

                                    i ++;
                                    len0 = offset[ i - 1 ];

                                }

                            }

                            break;

                        default:
                            break;

                    }

                }

                sectionIndex ++;

            }

            var geometry = new THREE.BufferGeometry();
            geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
            geometry.addAttribute( 'position', new THREE.BufferAttribute( points, 3 ) );

            if ( normals.length === points.length ) {

                geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );

            }

            return geometry;

        } else {

            // TODO for vtu,vti,and other xml formats

        }

    }

    function getStringFile( data ) {

        var stringFile = '';
        var charArray = new Uint8Array( data );
        var i = 0;
        var len = charArray.length;

        while ( len -- ) {

            stringFile += String.fromCharCode( charArray[ i ++ ] );

        }

        return stringFile;

    }

    // get the 5 first lines of the files to check if there is the key word binary
    var meta = THREE.LoaderUtils.decodeText( new Uint8Array( data, 0, 250 ) ).split( '\n' );

    if ( meta[ 0 ].indexOf( 'xml' ) !== - 1 ) {

        return parseXML( getStringFile( data ) );

    } else if ( meta[ 2 ].includes( 'ASCII' ) ) {

        return parseASCII( getStringFile( data ) );

    } else {

        return parseBinary( data );

    }

}

// function parseResponse( data ) {
//
//     var indices = [];
//     var positions = [];
//
//     var result;
//
//     // float float float
//
//     var pat3Floats = /([\-]?[\d]+[\.]?[\d|\-|e]*)[ ]+([\-]?[\d]+[\.]?[\d|\-|e]*)[ ]+([\-]?[\d]+[\.]?[\d|\-|e]*)/g;
//     var patTriangle = /^3[ ]+([\d]+)[ ]+([\d]+)[ ]+([\d]+)/;
//     var patQuad = /^4[ ]+([\d]+)[ ]+([\d]+)[ ]+([\d]+)[ ]+([\d]+)/;
//     var patPOINTS = /^POINTS /;
//     var patPOLYGONS = /^POLYGONS /;
//     var inPointsSection = false;
//     var inPolygonsSection = false;
//
//     var lines = data.split('\n');
//     for ( var i = 0; i < lines.length; ++i ) {
//
//         line = lines[i];
//
//         if ( inPointsSection ) {
//
//             // get the vertices
//
//             while ( ( result = pat3Floats.exec( line ) ) !== null ) {
//                 positions.push( parseFloat( result[ 1 ] ), parseFloat( result[ 2 ] ), parseFloat( result[ 3 ] ) );
//             }
//         }
//         else if ( inPolygonsSection ) {
//
//             result = patTriangle.exec(line);
//
//             if ( result !== null ) {
//
//                 // 3 int int int
//                 // triangle
//
//                 indices.push( parseInt( result[ 1 ] ), parseInt( result[ 2 ] ), parseInt( result[ 3 ] ) );
//             }
//             else {
//
//                 result = patQuad.exec(line);
//
//                 if ( result !== null ) {
//
//                     // 4 int int int int
//                     // break quad into two triangles
//
//                     indices.push( parseInt( result[ 1 ] ), parseInt( result[ 2 ] ), parseInt( result[ 4 ] ) );
//                     indices.push( parseInt( result[ 2 ] ), parseInt( result[ 3 ] ), parseInt( result[ 4 ] ) );
//                 }
//
//             }
//
//         }
//
//         if ( patPOLYGONS.exec(line) !== null ) {
//             inPointsSection = false;
//             inPolygonsSection = true;
//         }
//         if ( patPOINTS.exec(line) !== null ) {
//             inPolygonsSection = false;
//             inPointsSection = true;
//         }
//     }
//
//     var geometry = new THREE.BufferGeometry();
//     geometry.setIndex( new THREE.BufferAttribute( new ( indices.length > 65535 ? Uint32Array : Uint16Array )( indices ), 1 ) );
//     geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( positions ), 3 ) );
//
//     return geometry;
//
// }

function setRequestHeaders(request) {
    const userId = Meteor.userId();
    const accessToken = OHIF.user.getAccessToken();
    if (accessToken) {
        request.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    } else {
        const loginToken = Accounts._storedLoginToken();
        if (userId && loginToken) {
            request.setRequestHeader("x-user-id", userId);
            request.setRequestHeader("x-auth-token", loginToken);
        }
    }
}

function fetch(url, requests) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', url);
        setRequestHeaders(request);
        request.crossOrigin = true;
        request.responseType = 'arraybuffer';

        request.onloadstart = event => {
            // emit 'fetch-start' event
            this.emit('fetch-start', {
                file: url,
                time: new Date(),
            });
        };

        request.onload = event => {
            if (request.status === 200 || request.status === 0) {
                this._loaded = event.loaded;
                this._totalLoaded = event.total;

                // will be removed after eventer set up
                if (this._progressBar) {
                    this._progressBar.update(this._loaded, this._totalLoaded, 'load', url);
                }

                let buffer = request.response;
                let response = {
                    url,
                    buffer,
                };

                // emit 'fetch-success' event
                this.emit('fetch-success', {
                    file: url,
                    time: new Date(),
                    totalLoaded: event.total,
                });

                resolve(response);
            } else {
                reject(request.statusText);
            }
        };

        request.onerror = () => {
            // emit 'fetch-error' event
            this.emit('fetch-error', {
                file: url,
                time: new Date(),
            });

            reject(request.statusText);
        };

        request.onabort = event => {
            // emit 'fetch-abort' event
            this.emit('fetch-abort', {
                file: url,
                time: new Date(),
            });

            reject(request.statusText || 'Aborted');
        };

        request.ontimeout = () => {
            // emit 'fetch-timeout' event
            this.emit('fetch-timeout', {
                file: url,
                time: new Date(),
            });

            reject(request.statusText);
        };

        request.onprogress = event => {
            this._loaded = event.loaded;
            this._totalLoaded = event.total;
            // emit 'fetch-progress' event
            this.emit('fetch-progress', {
                file: url,
                total: event.total,
                loaded: event.loaded,
                time: new Date(),
            });
            // will be removed after eventer set up
            if (this._progressBar) {
                this._progressBar.update(this._loaded, this._totalLoaded, 'load', url);
            }
        };

        request.onloadend = event => {
            // emit 'fetch-end' event
            this.emit('fetch-end', {
                file: url,
                time: new Date(),
            });
            // just use onload when success and onerror when failure, etc onabort
            // reject(request.statusText);
        };

        if (requests instanceof Map) {
            requests.set(url, request);
        }

        request.send();
    });
}

function renderSerieHandler(event) {
    const viewportIndex = Session.get('activeViewport') || 0;
    let activeElement = getElementIfNotEmpty(viewportIndex)
    let element = OHIF.viewerbase.viewportUtils.getEnabledElement(activeElement);
    let e = {imageId: element.image.imageId};
    let serieInstanceUid = viewportOverlayUtils.getSeries.call(e, 'seriesInstanceUid');
    let studyInstanceUid = viewportOverlayUtils.getStudy.call(e, 'studyInstanceUid');
    let pipelineId = PipelineSelector.selectedId;

    Meteor.call('RenderSerie', studyInstanceUid, serieInstanceUid, pipelineId, function (error, response) {

        if (error) {
            const errorType = error.error;
            let errorMessage = '';

            if (errorType === 'server-connection-error') {
                errorMessage = 'There was an error connecting to the DICOM server, please verify if it is up and running.';
            } else if (errorType === 'server-internal-error') {
                errorMessage = `There was an internal error with the DICOM server getting metadeta for ${studyInstanceUid}`;
            } else {
                errorMessage = `For some reason we could not retrieve the study\'s metadata for ${event.studyId}.`;
            }

            OHIF.log.error(errorMessage);
            OHIF.log.error(error.stack);
            return;
        }

        let geometry = parseResponse( response.vtk.content );


        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        computeScale(geometry);
        material = new THREE.MeshLambertMaterial( { color: Math.pow(Math.random(), 2.0) * 0xFFFFFF, side: THREE.DoubleSide } );
        scene.remove(scene.getObjectByName("volume3D"));
        var mesh = new THREE.Mesh(geometry, material);
        mesh.updateMatrixWorld();
        mesh.effectController = new EffectController(mesh.material.color.getHex(), mesh.material.transparent, mesh.material.opacity, 1);
        // document.getElementById("sp_x_sr").innerHTML = geometry.boundingBox.min.x + ' / ' + geometry.boundingBox.max.x;
        // document.getElementById("sp_y_sr").innerHTML = geometry.boundingBox.min.y + ' / ' + geometry.boundingBox.max.y;
        // document.getElementById("sp_z_sr").innerHTML = geometry.boundingBox.min.z + ' / ' + geometry.boundingBox.max.z;
        mesh.name = "volume3D";

        scene.add(mesh);
        objects.set(mesh.name, mesh);
        hasGeometry = hasGeometry || true;
        var helper = new THREE.BoxHelper( mesh, 0xffff00 );
        scene.add( helper );
        if (gui.domElement !== undefined) {
            gui.domElement.style.display = '';
        }

        var loader = new AMI.VolumeLoader(container);
        loader
            .load(response.instances)
            .then(function () {
                const series = loader.data[0].mergeSeries(loader.data);
                const stack = series[0].stack[0];
                loader.free();

                const StackHelper = AMI.stackHelperFactory(THREE);
                //const stackHelper = new StackHelper();

                const stackHelper = new StackHelper(stack);
                stackHelper.border.color = colors.red;
                scene.add(stackHelper);

                // build the gui
                ami_gui(stackHelper);


                const centerLPS = stackHelper.stack.worldCenter();
                camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
                camera.updateProjectionMatrix();
                controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
            })
            .catch(function (error) {
                window.console.log('oops... something went wrong...');
                window.console.log(error);
            });
    });
}

Template.viewer3D.onRendered(function () {

    if ( ! Detector.webgl ) {
        Detector.addGetWebGLMessage();
    } else {
        init();
        animate();
    }

/**
    var element = parentTemplate(this.view);
    element = element.findAll('.imageViewerViewport');
    var $element = $(element);

    $element.off('cornerstoneimagerendered', onImage2DRendered);
    $element.on('cornerstoneimagerendered', onImage2DRendered);

    $element.on('OHIFActivateViewport', function (event) {
        const element = event.currentTarget;
        const $element = $(element);
        $element.off('cornerstoneimagerendered', onImage2DRendered);
        $element.on('cornerstoneimagerendered', onImage2DRendered);
    });
 **/

    // const viewportIndex = Session.get('activeViewport') || 0;
    // let activeElement = getElementIfNotEmpty(viewportIndex);
    //
    // var $element = $(activeElement);
    //
    // $element.on('Render3D', renderSerieHandler);

    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('click', onMouseClick, false);
});

Template.viewer3D.onCreated(function () {
    let toolbar = $('div.toolbarSection > div.clearfix > div.toolbarSectionTools').get(0);
    var _div = $('<div class="button3DContainer"><div class="svgContainer"><i class="fa fa-eye"></i></div><div class="buttonLabel"><span>View 3D</span></div></div>').addClass('toolbarSectionButton rp-x-1 imageViewerCommand').appendTo(toolbar);
    _div.on('click', renderSerieHandler);
});

Template.viewer3D.onDestroyed(function () {
    $('div.button3DContainer').remove();
});

