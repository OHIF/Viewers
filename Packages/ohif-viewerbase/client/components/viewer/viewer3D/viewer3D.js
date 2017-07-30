import { Template } from 'meteor/templating';
import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    } from 'three';

Template.viewer3D.onRendered(() => {
    var scene = new Scene();
    var camera = new PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

    var renderer = new WebGLRenderer({canvas: document.getElementById('wglcanvas')});
    renderer.setSize( renderer.domElement.width, renderer.domElement.height );
//document.body.appendChild( renderer.domElement );

    var geometry = new BoxGeometry( 3, 3, 3 );
    var material = new MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new Mesh( geometry, material );
    scene.add( cube );

    camera.position.z = 5;

    var animate = function () {
        requestAnimationFrame( animate );

        cube.rotation.x += 0.1;
        cube.rotation.y += 0.1;

        renderer.render(scene, camera);
    };

    animate();
});