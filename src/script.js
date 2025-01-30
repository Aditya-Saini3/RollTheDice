import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { TextGeometry } from 'three/examples/jsm/Addons.js'
import { FontLoader } from 'three/examples/jsm/Addons.js'

/**
 * Base
 */
// Debug
const gui = new GUI()
// gui.hide()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//Loaders
//Gltf Loader
const gltfLoader = new GLTFLoader()
//Font Loader
const fontLoader = new FontLoader()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster()



/**
 * Mouse
 */
const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX / sizes.width * 2 - 1
  mouse.y = -(event.clientY / sizes.height) * 2 + 1
})

// Add click state
let isRolling = false
let rollStartTime = 0
const ROLL_DURATION = 2000 // 2 seconds in milliseconds

// Replace mousemove with click event
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1
    mouse.y = -(event.clientY / sizes.height) * 2 + 1
    
    raycaster.setFromCamera(mouse, camera)
    if (dice) {
        const modelIntersects = raycaster.intersectObject(dice)
        if (modelIntersects.length > 0) {
            isRolling = true
            rollStartTime = Date.now()
            // Set random rotation speeds
            dice.userData.rotationSpeed = {
                x: Math.random() * 0.5 - 0.25,
                y: Math.random() * 0.5 - 0.25,
                z: Math.random() * 0.5 - 0.25
            }

            // Play sound
            if (diceSound.isPlaying) {
              diceSound.stop()
            }
            diceSound.play()
        }
    }
})

const params = {
  z: 3,
  y: 0, 
  x: 0
}

window.addEventListener('resize', () =>
{
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-9, 3, 0)
camera.rotation.x = Math.PI / 2 / 2
scene.add(camera)

gui.add(params, 'x', -10, 100).step(1).onChange((value) => {
  camera.position.x = value;
})
gui.add(params, 'y', -10, 100).step(1).onChange((value) => {
  camera.position.y = value;
})
gui.add(params, 'z', -10, 100).step(1).onChange((value) => {
  camera.position.z = value;
})

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Dice
 */
let dice = null
gltfLoader.load('/textures/dice_4k.glb', (gltf) => {
  dice = gltf.scene
  scene.add(dice)
  dice.scale.set(100, 100, 100)
})

/**
 * Audio
 */
const audioLoader = new THREE.AudioLoader()
const listener = new THREE.AudioListener()
const diceSound = new THREE.Audio(listener)

// Add listener to camera
camera.add(listener)

// Load sound file
audioLoader.load(
    '/sounds/dice-roll.mp3', // Update this path to match your sound file
    (buffer) => {
        diceSound.setBuffer(buffer)
        diceSound.setVolume(0.7) // Adjust volume (0.0 to 1.0)
        diceSound.setPlaybackRate(1.0) // Adjust speed
    }
)

/**
 * Text
 */
fontLoader.load(
    '/fonts/raleway.json',
    (font) => {
        const textGeometry = new TextGeometry(
            'Click on dice to roll',
            {
                font: font,
                size: 0.5,
                depth: 0.2,
                curveSegments: 5,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 4
            }
        )
        const textMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            metalness: 0.3,
            roughness: 0.2
        })
        const text = new THREE.Mesh(textGeometry, textMaterial)
        
        // Center the text
        textGeometry.center()
        
        // Position the text below the dice
        text.position.y = -2
        text.rotation.y = -Math.PI / 2
        scene.add(text)
    }
)


/**
* Renderer
*/
const renderer = new THREE.WebGLRenderer({
   canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
* Light
*/
const ambientLight = new THREE.AmbientLight('#ffffff', 3)
ambientLight.position.set(0, 0, 0)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight('#ffffff', 4)
directionalLight.position.set(-10, 5, 3)
scene.add(directionalLight)


/**
* Animate
*/
const clock = new THREE.Clock()

const tick = () =>
  {
    const elapsedTime = clock.getElapsedTime()

    if (dice && isRolling) {
      const rollTime = Date.now() - rollStartTime
      const progress = rollTime / ROLL_DURATION
      
      if (progress < 1) {
          // Apply rotation with easing
          const easing = 1 - Math.pow(progress, 2)
          dice.rotation.x += dice.userData.rotationSpeed.x * easing
          dice.rotation.y += dice.userData.rotationSpeed.y * easing
          dice.rotation.z += dice.userData.rotationSpeed.z * easing
      } else {
          // Stop rolling
          isRolling = false
      }
  }




    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()