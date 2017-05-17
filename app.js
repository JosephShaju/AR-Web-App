
	//////////////////////////////////////////////////////////////////////////////////
	//		Init
	//////////////////////////////////////////////////////////////////////////////////

	// init renderer//
	var renderer	= new THREE.WebGLRenderer({
		// antialias	: true,
		alpha: true
	});
	renderer.setClearColor(new THREE.Color('white'), 0);
	// renderer.setPixelRatio( 1/2 );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.top = '0px';
	renderer.domElement.style.left = '0px';
	document.body.appendChild( renderer.domElement );

	// array of functions for the rendering loop
	var onRenderFcts= [];

	// init scene and camera
	var scene	= new THREE.Scene();

	//////////////////////////////////////////////////////////////////////////////////
	//		Initialize a basic camera in 3d scene
	//////////////////////////////////////////////////////////////////////////////////

	// Create a camera
	var camera = new THREE.PerspectiveCamera(); //change from just Camera() to PerspectiveCamera() or OrthographicCamera()?
	scene.add(camera);

	////////////////////////////////////////////////////////////////////////////////
	//          handle arToolkitSource, define media input
	////////////////////////////////////////////////////////////////////////////////

	var arToolkitSource = new THREEx.ArToolkitSource({
		// to read from the webcam
		sourceType : 'webcam',

		// to read from an image
		// sourceType : 'image',
		// sourceUrl : THREEx.ArToolkitContext.baseURL + 'data/images/img.jpg',

		// to read from a video
		// sourceType : 'video',
		// sourceUrl : THREEx.ArToolkitContext.baseURL + 'data/videos/headtracking.mp4',
	});

	arToolkitSource.init(function onReady(){
		// handle resize of renderer
		arToolkitSource.onResize(renderer.domElement);
	});

	// handle resize
	window.addEventListener('resize', function(){
		// handle arToolkitSource resize
		arToolkitSource.onResize(renderer.domElement);
	});


	////////////////////////////////////////////////////////////////////////////////
	//          initialize arToolkitContext
	////////////////////////////////////////////////////////////////////////////////

	// create atToolkitContext
	var arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: THREEx.ArToolkitContext.baseURL + 'data/data/camera_para.dat',
		detectionMode: 'mono',
		maxDetectionRate: 30,
		canvasWidth: 80*3,
		canvasHeight: 60*3,
	});
	// initialize it
	arToolkitContext.init(function onCompleted(){
		// copy projection matrix to camera
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	});

	// update artoolkit on every frame
	onRenderFcts.push(function(){
		if( arToolkitSource.ready === false )	return

		arToolkitContext.update( arToolkitSource.domElement )
	});


	////////////////////////////////////////////////////////////////////////////////
	//          Create a ArMarkerControls
	////////////////////////////////////////////////////////////////////////////////

	//For each marker, run ARToolkit5/bin/mk_patt.exe and create a patt file for your marker. Then link it below.
	//Add new markers for each image you want to appear.

	//MARKER 1
	var markerRoot = new THREE.Group;
	scene.add(markerRoot);
	var artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
		type : 'pattern',
		patternUrl : THREEx.ArToolkitContext.baseURL + 'data/data/patt.wv'
	});

	//MARKER 2
	var markerRoot2 = new THREE.Group;
	scene.add(markerRoot2);
	var artoolkitMarker2 = new THREEx.ArMarkerControls(arToolkitContext, markerRoot2, {
		type : 'pattern',
		patternUrl: THREEx.ArToolkitContext.baseURL + 'data/data/patt.hiro'
	});

	//////////////////////////////////////////////////////////////////////////////////
	//		add an object in the scene
	//////////////////////////////////////////////////////////////////////////////////

	//Object generator, uses async texture loading
	function createCube(texturePath, name, markerName){
		var loader = new THREE.TextureLoader();
		loader.load(
			texturePath,
			function(texture){
				var cubeMaterials = [
					new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.1}),
			    new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.1}),
			    new THREE.MeshBasicMaterial({map: texture, transparent:false}), //this is the front facing side of the cube
			    new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.1}),
			    new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.1}),
			    new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.1}),
				];
				var geometry = new THREE.BoxGeometry(1.5,0.12,1.5); //make it a short plane, not a cube
				var cubeMaterial = new THREE.MeshFaceMaterial(cubeMaterials);
				nameToBe = name;
				name =  new THREE.Mesh(geometry, cubeMaterial);
				name.name = nameToBe;
				name.position.y	= 0.05; //distance from AR marker
				markerName.add( name ); //add finished cube to render queue on marker root
			}
		);
	}

	//actually create objects. Add one of these for every new marker, with a different name
	createCube('img/texture.PNG', 'cube', markerRoot);
	createCube('img/texture2.PNG', 'cube2', markerRoot2);


	///////////////////////////////////////////////////
	//	CLICK HANDLING
	//////////////////////////////////////////////////

	//Manual THREE.js raycasting implementation using event handlers
	function onMouseDown(event){

		//window.open('https://donate.worldvision.ca/collections/sponsorships', 'Donate'); //can be re-enabled to make every click head to the same location, bypassing raycasting
		raycaster = new THREE.Raycaster();
		mouse = new THREE.Vector2();

		//update mouse vector from its position when the click/tap event takes place
		mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
		raycaster.setFromCamera(mouse, camera); //cast ray in direction of mouse click

		var intersects = raycaster.intersectObjects( scene.children, true ); //see if ray intersects any rendered objects

		if(intersects.length > 0){
			//console.log(intersects[0].object); //re-enable to debug, prints out object that is hit by ray

			//handle different click cases based on which object is clicked (using object.name property)
			switch(intersects[ 0 ].object.name){
				case 'cube':
					window.open('https://donate.worldvision.ca/collections/sponsorships', 'Donate'); //TODO re-enable this once raycasting works, but for specific objects
					break;
				case 'cube2':
					window.open('https://en.wikipedia.org/wiki/World_Vision_International', 'Wikipedia');
					break;
				default:
					break;
			}
		}
		console.log('Click detected.');
	}

	//add event listener waiting for mobile touch and translate coordinates to click
	document.addEventListener('touchstart', function(e){
		clientX = e.touches[0].clientX;
		clientY = e.touches[0].clientY;
	}, false);
	document.addEventListener('click', onMouseDown, false);


	//////////////////////////////////////////////////////////////////////////////////
	//		render the whole thing on the page
	//////////////////////////////////////////////////////////////////////////////////

	var stats = new Stats();
	document.body.appendChild( stats.dom );
	// render the scene
	onRenderFcts.push(function(){
		renderer.render( scene, camera );
		stats.update();
	})

	// run the rendering loop
	var lastTimeMsec= null;
	requestAnimationFrame(function animate(nowMsec){
		// keep looping
		requestAnimationFrame( animate );
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60;
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec);
		lastTimeMsec	= nowMsec;
		// call each update function
		onRenderFcts.forEach(function(onRenderFct){
			onRenderFct(deltaMsec/1000, nowMsec/1000);
		})
	})
