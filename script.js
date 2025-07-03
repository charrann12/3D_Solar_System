
// load textures for use  
const textureLoader = new THREE.TextureLoader();

// scene where everything is added(basically the space here)
const scene = new THREE.Scene();

// camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

//webGLRenderer and attaching it to DOM
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

//point light acts as a sun source
const light = new THREE.PointLight(0xffffff, 2, 1000);
light.position.set(0, 0, 0);
scene.add(light);

// sun creation (using emmisive material so that it glows)
const sunGeometry = new THREE.SphereGeometry(4, 64, 64);
const sunMaterial = new THREE.MeshPhongMaterial({ 
 emissive: 0xFDB813, 
 emissiveIntensity: 1,
 color: 0xFDB813,
 shininess: 100 
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun); 

// clock for time based animation
const clock = new THREE.Clock();

// earth texture loading and specular map loading from local files
const earthTextures = {
  map: new THREE.TextureLoader().load('textures/earth1.jpg'),
specularMap: new THREE.TextureLoader().load('textures/earth_specular_2048.jpg')
};


    // data array consists of all the 8 planets  

    const planetsData = [
      { name: "Mercury", color: 0xaaaaaa, size: 0.5, distance: 7, speed: 0.04 },
      { name: "Venus", color: 0xffcc99, size: 0.8, distance: 10, speed: 0.015 },
      { name: "Earth", color: 0x0000ff, size: 1, distance: 13, speed: 0.01 },
      { name: "Mars", color: 0xff3300, size: 0.7, distance: 16, speed: 0.008 },
      { name: "Jupiter", color: 0xff9966, size: 2, distance: 20, speed: 0.006 },
      { name: "Saturn", color: 0xffcc66, size: 1.7, distance: 25, speed: 0.004 },
      { name: "Uranus", color: 0x66ffff, size: 1.3, distance: 30, speed: 0.002 },
      { name: "Neptune", color: 0x3333ff, size: 1.3, distance: 35, speed: 0.0015 }
    ];

    const planetGroups = [];

    //speeds linked to sliders 
    const speeds = planetsData.map(p => p.speed);
    const controlsDiv = document.getElementById("controls");

// orbit and planet creation 

planetsData.forEach((planet, i) => {
  const orbitPath = new THREE.RingGeometry(planet.distance - 0.02, planet.distance + 0.02, 64);
  const orbitMaterial = new THREE.MeshBasicMaterial({
  color: 0x888888,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.5
});

const orbit = new THREE.Mesh(orbitPath, orbitMaterial);
orbit.rotation.x = Math.PI / 2;
scene.add(orbit);

// grp for rotating planet around the sun
const orbitGroup = new THREE.Object3D();
scene.add(orbitGroup);

//planet mesh creation 
const geometry = new THREE.SphereGeometry(planet.size, 32, 32);

let material;
if (planet.name === "Earth") {
  material = new THREE.MeshPhongMaterial({
    map: earthTextures.map,
    specularMap: earthTextures.specularMap,
    specular: new THREE.Color('grey')
  });
}

else {
  material = new THREE.MeshPhongMaterial({ color: planet.color });
}

const mesh = new THREE.Mesh(geometry, material);
mesh.position.x = planet.distance;
orbitGroup.add(mesh);
planetGroups.push({ orbit: orbitGroup, mesh }); //saves orbit and planet mesh

//creating label and slider for speed control 
const label = document.createElement("label");
label.innerHTML = `${planet.name} Speed: <span id="val-${i}">${planet.speed.toFixed(3)}</span>`;
const slider = document.createElement("input");
slider.type = "range";
slider.min = "0";
slider.max = "0.1";
slider.step = "0.001";
slider.value = planet.speed;
    // updates speed when the slider is moved
    slider.addEventListener("input", () => {
        speeds[i] = parseFloat(slider.value);
        document.getElementById(`val-${i}`).textContent = slider.value;
     });

      label.appendChild(slider);
      controlsDiv.appendChild(label);
    });

    camera.position.z = 50; // init cam position

    // planet names using tooltip elements
    const tooltip = document.getElementById("tooltip");
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    //mouse co-ordinates updation on move 
    window.addEventListener("mousemove", (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      tooltip.style.left = event.clientX + 10 + "px";
      tooltip.style.top = event.clientY + 10 + "px";
    });

    // focused planet on click  
    let targetPlanet = null;
    let originalCameraPos = camera.position.clone();

    //set target planet on click 
    window.addEventListener("click", () => {
      raycaster.setFromCamera(mouse, camera);
      const planetMeshes = planetGroups.map(p => p.mesh);
      const intersects = raycaster.intersectObjects(planetMeshes);
      targetPlanet = intersects.length > 0 ? intersects[0].object : null;
    });

    // random stars generation 
    function addStars(count) {
      const starGeometry = new THREE.BufferGeometry();
      const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
      const starVertices = [];

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
      }

      starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3));
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
    }

    addStars(2000);


    // rensponsive canvas 
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
      
      // animation loop 
    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      
        //animate orbit and spin of each planet
      planetGroups.forEach((p, i) => {
        p.orbit.rotation.y += speeds[i]*delta*60;
        p.mesh.rotation.y += 0.05;
      });

      // planet hover detection
      raycaster.setFromCamera(mouse, camera);
      const planetMeshes = planetGroups.map(p => p.mesh);
      const intersects = raycaster.intersectObjects(planetMeshes);
      if (intersects.length > 0) {
        const hovered = intersects[0].object;
        const planetIndex = planetGroups.findIndex(p => p.mesh === hovered);
        if (planetIndex !== -1) {
          tooltip.innerHTML = planetsData[planetIndex].name;
          tooltip.style.display = "block";
        }
      } else {
        tooltip.style.display = "none";
      }

      // smooth camera flow on click 
      if (targetPlanet) {
        const pos = new THREE.Vector3();
        targetPlanet.getWorldPosition(pos);
        const target = pos.clone().add(new THREE.Vector3(5, 5, 5));
        camera.position.lerp(target, 0.05);
        camera.lookAt(pos);
      } else {
        camera.position.lerp(originalCameraPos, 0.05);
        camera.lookAt(scene.position);
      }

      renderer.render(scene, camera);
    }

  animate();


 // toggle theme (dark/light)   
 const toggleBtn = document.getElementById("theme-toggle");
 const themeIcon = document.getElementById("theme-icon");
 let isDark = true;

 themeIcon.src = "sun.png";


  toggleBtn.addEventListener("click", () => {
  isDark = !isDark;

 // toggle styling
  document.body.style.background = isDark ? "#000" : "#fff";
  document.body.style.color = isDark ? "#fff" : "#000";
  controlsDiv.style.background = isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.8)";
  controlsDiv.style.color = isDark ? "white" : "black";
  renderer.setClearColor(isDark ? 0x000000 : 0xeeeeee);

  
  themeIcon.src = isDark
  ? "sun.png"   
  : "moon.png"; 
});

