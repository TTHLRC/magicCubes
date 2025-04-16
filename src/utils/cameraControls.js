import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { cameraConfig } from '../config/cameraConfig'
import { CubeManager } from './cubeManager'
import { cubeConfig } from '../config/cubeConfig'
import { SceneStateManager } from './sceneStateManager'
import { SceneMode } from '../config/modeConfig'
import { selectedMaterial_Hinge, preMaterial_Hinge } from '../config/materials'
import * as CANNON from 'cannon-es'

export class CameraControls extends OrbitControls {
  constructor(camera, domElement, scene) {
    super(camera, domElement)
    this.scene = scene
    this.camera = camera
    this.cubeManager = new CubeManager(scene)
    this.sceneStateManager = new SceneStateManager(this.cubeManager)
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.currentMode = SceneMode.CREATE
    this.keys = {}
    this.moveSpeed = cameraConfig.controls.moveSpeed
    this.rotateSpeed = cameraConfig.controls.rotateSpeed
    this.currentLayer = 0  // 当前层级
    this.layerHeight = 4   // 每层高度
    this.isFixMode = false  // 添加固定模式标志
    this.isDraggingCone = false  // 添加拖动圆锥体标志
    this.lastUpdateTime = 0  // 添加上次更新时间

    // 创建光源
    const light = new THREE.DirectionalLight(0xffffff, 3)
    light.position.set(5, 5, 5)
    light.castShadow = true
    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 1024
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 20
    this.scene.add(light)

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040)
    this.scene.add(ambientLight)

    // 预览立方体相关
    this.previewCube = null
    this.initPreviewCube()

    // 选中的立方体
    this.selectedCubes = []
    this.selectedMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
    })
    this.originalMaterials = new Map()

    // 铰接点相关
    this.hingePoints = []  // 存储所有铰接点
    this.hingeGeometry = new THREE.SphereGeometry(0.5, 32, 32)
    this.hingeMaterial = preMaterial_Hinge
    this.selectedHingePoints = []  // 存储选中的铰接点
    this.hingeMap = new Map()  // 存储铰接点信息

    this.initEventListeners()
    this.loadSavedScene()
  }

  loadSavedScene() {
    if (this.sceneStateManager.hasSavedState()) {
      this.sceneStateManager.loadSceneState()
    }
  }

  initPreviewCube() {
    const geometry = new THREE.BoxGeometry(cubeConfig.size, cubeConfig.size, cubeConfig.size)
    const material = new THREE.MeshStandardMaterial({
      color: 0x20B2AA, // 浅海绿色，更接近图片中的颜色
      transparent: true,
      opacity: 0.5
    })
    this.previewCube = new THREE.Mesh(geometry, material)
    this.previewCube.visible = false
    this.scene.add(this.previewCube)
  }

  initEventListeners() {
    // 鼠标事件
    this.domElement.addEventListener('mousedown', (event) => {
      const isCtrlPressed = event.ctrlKey || event.metaKey

      // 如果不是Ctrl/Command键按下，不处理
      if (!isCtrlPressed) return

      // 计算鼠标在归一化设备坐标中的位置
      const rect = this.domElement.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // 更新射线
      this.raycaster.setFromCamera(this.mouse, this.camera)

      // 根据按钮类型处理点击事件
      if (event.button === 0) { // 左键
        this.handleLeftClick(event)
      } else if (event.button === 2) { // 右键
        this.handleRightClick(event)
      }
    })

    // 键盘事件
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false,
      shift: false,
      up: false,
      down: false
    }

    window.addEventListener('keydown', (event) => {
      switch (event.key.toLowerCase()) {
        case 'w': this.keys.w = true; break
        case 'a': this.keys.a = true; break
        case 's': this.keys.s = true; break
        case 'd': this.keys.d = true; break
        case ' ': this.keys.space = true; break
        case 'shift': this.keys.shift = true; break
        case 'arrowup':
          this.keys.up = true
          if (this.currentMode === SceneMode.CREATE) {
            this.currentLayer++
            console.log('Current layer:', this.currentLayer)
          }
          break
        case 'arrowdown':
          this.keys.down = true
          if (this.currentMode === SceneMode.CREATE) {
            this.currentLayer = Math.max(0, this.currentLayer - 1)
            console.log('Current layer:', this.currentLayer)
          }
          break
      }
    })

    window.addEventListener('keyup', (event) => {
      switch (event.key.toLowerCase()) {
        case 'w': this.keys.w = false; break
        case 'a': this.keys.a = false; break
        case 's': this.keys.s = false; break
        case 'd': this.keys.d = false; break
        case ' ': this.keys.space = false; break
        case 'shift': this.keys.shift = false; break
        case 'arrowup': this.keys.up = false; break
        case 'arrowdown': this.keys.down = false; break
      }
    })

    // 鼠标移动事件
    this.domElement.addEventListener('mousemove', (event) => {
      // 计算鼠标在归一化设备坐标中的位置
      const rect = this.domElement.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // 更新射线
      this.raycaster.setFromCamera(this.mouse, this.camera)

      // 处理铰接点的悬停效果
      this.handleHingePointHover()
    })

    // 鼠标离开画布时隐藏预览立方体
    this.domElement.addEventListener('mouseleave', () => {
      if (this.previewCube) {
        this.previewCube.visible = false
      }
    })

    // 鼠标抬起事件
    this.domElement.addEventListener('mouseup', () => {
      this.enabled = true
    })

    // 添加鼠标按下事件
    this.domElement.addEventListener('mousedown', (event) => {
      const isCtrlPressed = event.ctrlKey || event.metaKey
      if (!isCtrlPressed) return

      // 检查是否点击到控制圆锥体
      const cones = this.cubeManager.coneControlArray
      const coneIntersects = this.raycaster.intersectObjects(cones)
      if (coneIntersects.length > 0) {
        this.isDraggingCone = true
        this.lastUpdateTime = performance.now()
      }
    })

    // 添加鼠标抬起事件
    this.domElement.addEventListener('mouseup', () => {
      this.isDraggingCone = false
    })

    // 添加鼠标移动事件
    this.domElement.addEventListener('mousemove', (event) => {
      if (this.isDraggingCone && this.selectedCubes.length > 0) {
        const currentTime = performance.now()
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000
        this.lastUpdateTime = currentTime

        const selectedCube = this.selectedCubes[0]
        const cones = this.cubeManager.coneControlArray
        const coneIntersects = this.raycaster.intersectObjects(cones)

        if (coneIntersects.length > 0) {
          const clickedCone = coneIntersects[0].object

          // 计算从被选中的网格到控制圆锥体的方向向量
          const direction = clickedCone.position.clone().sub(selectedCube.position).normalize()
          const forceMagnitude = 1000  // 增加力的大小
          const f = direction.multiplyScalar(forceMagnitude)

          // 获取立方体的物理体
          const cubeBody = selectedCube.userData.physicsBody

          if (cubeBody) {
            // 重置速度和角速度
            cubeBody.velocity.set(0, 0, 0)
            cubeBody.angularVelocity.set(0, 0, 0)

            // 应用力到物理体
            const cannonForce = new CANNON.Vec3(f.x, f.y, f.z)
            cubeBody.applyForce(
              cannonForce,
              new CANNON.Vec3(0, 0, 0)
            )

            // 更新物理世界
            this.cubeManager.physicsManager.update(deltaTime)

            // 同步物理体到图形对象
            this.cubeManager.physicsManager.syncPhysicsToGraphics(selectedCube, cubeBody)
          }
        }
      }
    })

    // 添加动画循环
    this.animate()
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))

    // 处理键盘控制
    const moveSpeed = 0.1
    if (this.keys.w) this.camera.position.z -= moveSpeed
    if (this.keys.s) this.camera.position.z += moveSpeed
    if (this.keys.a) this.camera.position.x -= moveSpeed
    if (this.keys.d) this.camera.position.x += moveSpeed
    if (this.keys.space) this.camera.position.y += moveSpeed
    if (this.keys.shift) this.camera.position.y -= moveSpeed


    // 同步物理体到图形对象
    this.cubeManager.cubes.forEach(cube => {
      if (cube.userData.physicsBody) {
        this.cubeManager.physicsManager.syncPhysicsToGraphics(cube, cube.userData.physicsBody)
      }
    })

    // 更新控制器
    this.update()
  }

  // 检查两个立方体是否相邻
  areCubesAdjacent(cube1, cube2) {
    const gridSize = 4  // 网格大小
    const pos1 = cube1.position
    const pos2 = cube2.position

    // 计算两个立方体中心点之间的距离
    const dx = Math.abs(pos1.x - pos2.x)
    const dy = Math.abs(pos1.y - pos2.y)
    const dz = Math.abs(pos1.z - pos2.z)

    // 如果两个立方体在同一水平面上（y坐标相同）
    // 且满足以下任一条件：
    // 1. x或z方向上相邻（相差一个网格大小）
    // 2. x和z方向上都相差一个网格大小（斜角相邻）
    return dy === 0 && (
      (dx === gridSize && dz === 0) ||  // x方向相邻
      (dx === 0 && dz === gridSize) ||  // z方向相邻
      (dx === gridSize && dz === gridSize)  // 斜角相邻
    )
  }

  // 创建铰接点
  createHingePoints() {
    if (this.selectedCubes.length !== 2) return

    const cube1 = this.selectedCubes[0]
    const cube2 = this.selectedCubes[1]

    // 检查是否已经存在这些立方体之间的铰接点
    const existingHinges = this.hingePoints.filter(point =>
      point.userData.connectedCubes.includes(cube1) &&
      point.userData.connectedCubes.includes(cube2)
    )

    if (existingHinges.length > 0) {
      // 如果已存在铰接点，只更新它们的可见性
      existingHinges.forEach(hinge => {
        hinge.visible = this.currentMode === SceneMode.HINGE
      })
      return
    }

    // 确定两个立方体的相对位置
    const dx = cube2.position.x - cube1.position.x
    const dy = cube2.position.y - cube1.position.y
    const dz = cube2.position.z - cube1.position.z
    const cubeSize = 4 // 立方体大小

    // 检查是否有共享边或顶点
    let hingePositions = []

    if ((Math.abs(dx) === cubeSize && dz === 0) || (dx === 0 && Math.abs(dz) === cubeSize)) {
      // 直接相邻的情况（x方向或z方向），创建四个铰接点
      const midX = cube1.position.x + dx / 2
      const midZ = cube1.position.z + dz / 2
      const y = cube1.position.y

      // 创建四个铰接点，每个在边的中点
      const edgePoints = [
        // 前边中点
        {
          position: new THREE.Vector3(midX, y - cubeSize / 2, midZ),
          edge: 'front'
        },
        // 后边中点
        {
          position: new THREE.Vector3(midX, y + cubeSize / 2, midZ),
          edge: 'back'
        },
        // 左边中点
        {
          position: new THREE.Vector3(midX - (dz === 0 ? 0 : cubeSize / 2), y, midZ - (dx === 0 ? 0 : cubeSize / 2)),
          edge: 'left'
        },
        // 右边中点
        {
          position: new THREE.Vector3(midX + (dz === 0 ? 0 : cubeSize / 2), y, midZ + (dx === 0 ? 0 : cubeSize / 2)),
          edge: 'right'
        }
      ]
      hingePositions.push(...edgePoints)
    } else if (Math.abs(dx) === cubeSize && Math.abs(dz) === cubeSize) {
      // 斜角相邻，在共享顶点处创建铰接点
      const x = cube1.position.x + dx / 2
      const y = cube1.position.y
      const z = cube1.position.z + dz / 2
      hingePositions.push({
        position: new THREE.Vector3(x, y, z),
        edge: 'corner'
      })
    }

    // 创建所有铰接点
    if (hingePositions.length > 0) {
      hingePositions.forEach(({ position, edge }) => {
        const hingePoint = new THREE.Mesh(this.hingeGeometry, this.hingeMaterial)
        hingePoint.position.copy(position)
        hingePoint.userData = {
          isHingePoint: true,
          status: false,
          connectedCubes: [cube1, cube2],
          edge: edge
        }
        hingePoint.visible = this.currentMode === SceneMode.HINGE
        this.scene.add(hingePoint)
        this.hingePoints.push(hingePoint)
      })
    } else {
      // 如果没有共享边或顶点，清除选择
      console.log('立方体没有共享边或顶点，无法创建铰接点')
      this.clearSelection()
    }
  }

  // 清除所有选中状态
  clearSelection() {
    // 清除立方体选中状态
    this.selectedCubes.forEach(cube => {
      // 检查立方体是否处于固定状态
      if (!this.cubeManager.isFixed(cube)) {
        if (this.originalMaterials.has(cube.uuid)) {
          cube.material = this.originalMaterials.get(cube.uuid)
          this.originalMaterials.delete(cube.uuid)
        }
      }
    })
    this.selectedCubes = []

    // 清除铰接点选中状态
    this.selectedHingePoints.forEach(point => {
      point.material = preMaterial_Hinge
      point.userData.status = false
    })
    this.selectedHingePoints = []

    // 清除控制圆锥体
    this.cubeManager.clearControlCones()
  }

  handleLeftClick(event) {
    const isCtrlPressed = event.ctrlKey || event.metaKey
    if (!isCtrlPressed) return

    // 获取所有立方体，用于检查交点
    const cubes = this.cubeManager.getAllCubes()
    const intersects = this.raycaster.intersectObjects(cubes)

    // 检查是否点击到铰接点
    const intersectedPoint = this.checkHingePointIntersection()
    if (intersectedPoint) {
      // 如果点击已选中的铰接点，取消选中
      const index = this.selectedHingePoints.indexOf(intersectedPoint)
      if (index !== -1) {
        intersectedPoint.material = preMaterial_Hinge
        intersectedPoint.userData.status = false
        this.selectedHingePoints.splice(index, 1)
        // 从 hingeMap 中移除
        this.hingeMap.delete(intersectedPoint.uuid)
        this.saveHingeState()  // 保存状态
      } else {
        // 如果未达到最大选中数量，添加新的选中点
        this.selectedHingePoints.push(intersectedPoint)
        intersectedPoint.material = selectedMaterial_Hinge
        intersectedPoint.userData.status = true

        // 将铰接点信息存储到 hingeMap 中
        const cube1 = intersectedPoint.userData.connectedCubes[0]
        const cube2 = intersectedPoint.userData.connectedCubes[1]
        console.log(this.hingeMap);

        this.hingeMap.set(intersectedPoint.uuid, {
          cube1UUID: cube1.uuid,
          cube2UUID: cube2.uuid,
          edge: intersectedPoint.userData.edge,
          positon: intersectedPoint.positon
        })

        this.saveHingeState()  // 保存状态
      }
      event.stopPropagation()
      return
    }

    // 检查是否点击到控制圆锥体
    const cones = this.cubeManager.coneControlArray
    const coneIntersects = this.raycaster.intersectObjects(cones)
    if (coneIntersects.length > 0) {
      event.stopPropagation()
      return
    }

    if (this.currentMode === SceneMode.CREATE) {
      // 创建模式下的逻辑
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -2)
      const intersection = new THREE.Vector3()

      if (this.raycaster.ray.intersectPlane(groundPlane, intersection)) {
        const gridSize = 4
        intersection.x = Math.floor(intersection.x / gridSize) * gridSize + gridSize / 2
        intersection.y = -3 + (this.currentLayer * this.layerHeight)  // 根据当前层级计算Y轴位置
        intersection.z = Math.floor(intersection.z / gridSize) * gridSize + gridSize / 2

        // 检查该位置是否已有立方体
        const existingCube = this.cubeManager.getCubeAtPosition(intersection)
        if (!existingCube) {
          const newCube = this.cubeManager.createCube(intersection)
          this.saveHingeState()
        }
      }
    } else if (this.currentMode === SceneMode.HINGE) {
      console.log(this.selectedHingePoints);

      // 铰接模式下的选择逻辑
      if (intersects.length > 0) {
        const clickedCube = intersects[0].object

        // 如果点击已选中的立方体，取消选中
        if (this.selectedCubes.includes(clickedCube)) {
          // 恢复原始材质
          clickedCube.material = this.originalMaterials.get(clickedCube.uuid)
          this.originalMaterials.delete(clickedCube.uuid)
          // 从选中列表中移除
          this.selectedCubes = this.selectedCubes.filter(cube => cube !== clickedCube)
          // 保存状态
          this.saveHingeState()
          return
        }

        // 如果已经选中了两个立方体，清除所有选中
        if (this.selectedCubes.length >= 2) {
          this.clearSelection()
          return
        }

        // 保存原始材质并应用选中材质
        this.originalMaterials.set(clickedCube.uuid, clickedCube.material)
        clickedCube.material = this.selectedMaterial
        this.selectedCubes.push(clickedCube)

        // 如果选中了两个立方体，创建铰接点
        if (this.selectedCubes.length === 2) {
          this.createHingePoints()
          // 恢复之前选中的铰接点状态
          this.hingePoints.forEach(point => {
            if (point.userData.status) {
              point.material = selectedMaterial_Hinge
              this.selectedHingePoints.push(point)
            }
          })
        }
        // 保存状态
        this.saveHingeState()
      }
    } else if (this.currentMode === SceneMode.DEMO) {
      // 演示模式下的选择逻辑
      if (intersects.length > 0) {
        const clickedCube = intersects[0].object

        // 如果点击已选中的立方体，取消选中
        if (this.selectedCubes.includes(clickedCube)) {
          // 恢复原始材质
          clickedCube.material = this.originalMaterials.get(clickedCube.uuid)
          this.originalMaterials.delete(clickedCube.uuid)
          // 从选中列表中移除
          this.selectedCubes = this.selectedCubes.filter(cube => cube !== clickedCube)
          // 清除控制圆锥体
          this.cubeManager.clearControlCones()
          return
        }

        // 如果已经选中了两个立方体，清除所有选中
        if (this.selectedCubes.length >= 2) {
          this.clearSelection()
          return
        }

        // 保存原始材质并应用选中材质
        this.originalMaterials.set(clickedCube.uuid, clickedCube.material)
        clickedCube.material = this.selectedMaterial
        this.selectedCubes.push(clickedCube)

        // 显示控制圆锥体
        this.cubeManager.createControlCones(clickedCube.position)
      }
    }
  }

  handleRightClick(event) {
    const isCtrlPressed = event.ctrlKey || event.metaKey
    if (!isCtrlPressed) return

    if (this.currentMode === SceneMode.CREATE) {
      // 创建模式下的删除逻辑
      const cubes = this.cubeManager.getAllCubes()
      const intersects = this.raycaster.intersectObjects(cubes)

      if (intersects.length > 0) {
        this.cubeManager.removeCube(intersects[0].object)
        this.sceneStateManager.autoSave()
      }
    }
  }

  update() {
    // 更新控制器
    super.update()

    // 处理键盘移动
    const direction = new THREE.Vector3()

    // 前后移动 (Z轴)
    if (this.keys.w) {
      direction.z -= this.moveSpeed
    }
    if (this.keys.s) {
      direction.z += this.moveSpeed
    }

    // 左右移动 (X轴)
    if (this.keys.a) {
      direction.x -= this.moveSpeed
    }
    if (this.keys.d) {
      direction.x += this.moveSpeed
    }

    // 上下移动 (Y轴)
    if (this.keys.space) {
      direction.y += this.moveSpeed
    }
    if (this.keys.shift) {
      direction.y -= this.moveSpeed
    }

    // 根据相机旋转角度调整移动方向
    const cameraRotation = new THREE.Euler(0, this.object.rotation.y, 0)
    direction.applyEuler(cameraRotation)

    // 应用移动
    this.object.position.add(direction)
  }

  dispose() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    if (this.previewCube) {
      this.scene.remove(this.previewCube)
      this.previewCube.geometry.dispose()
      this.previewCube.material.dispose()
    }
    if (this.selectedMaterial) {
      this.selectedMaterial.dispose()
    }
    if (this.hingeMaterial) {
      this.hingeMaterial.dispose()
    }
    this.clearSelection()
    super.dispose()
    this.cubeManager.clearAllCubes()
  }

  setMode(mode) {
    this.currentMode = mode

    // 在非创建模式下隐藏预览立方体
    if (mode !== SceneMode.CREATE && this.previewCube) {
      this.previewCube.visible = false
    }

    // 清除控制圆锥体
    this.cubeManager.clearControlCones()

    // 设置铰接点的可见性
    this.hingePoints.forEach(point => {
      point.visible = mode === SceneMode.HINGE
    })
  }

  getMode() {
    return this.currentMode
  }

  checkHingePointIntersection() {
    const intersects = this.raycaster.intersectObjects(this.hingePoints)
    return intersects.length > 0 ? intersects[0].object : null
  }

  // 保存铰接状态
  saveHingeState() {
    // 将 hingeMap 转换为普通对象以便存储
    const hingeMapData = {}
    this.hingeMap.forEach((value, key) => {
      // 找到对应的铰接点对象
      const hingePoint = this.hingePoints.find(point => point.uuid === key)
      if (hingePoint) {
        hingeMapData[key] = {
          ...value,
          position: {
            x: hingePoint.position.x,
            y: hingePoint.position.y,
            z: hingePoint.position.z
          }
        }
      }
    })

    const state = {
      selectedCubes: this.selectedCubes.map(cube => cube.uuid),
      selectedHinges: this.selectedHingePoints.map(point => point.uuid),
      hingeMap: hingeMapData
    }
    this.sceneStateManager.saveSceneState(state)
  }

  // 加载铰接状态
  loadHingeState(state) {
    if (!state) return

    // 恢复铰接点映射
    this.hingeMap.clear()
    if (state.hingeMap) {
      Object.entries(state.hingeMap).forEach(([key, value]) => {
        this.hingeMap.set(key, value)
      })
    }

    // 恢复选中的立方体
    this.selectedCubes = []
    if (state.selectedCubes) {
      state.selectedCubes.forEach(uuid => {
        const cube = this.cubeManager.getCubeByUUID(uuid)
        if (cube) {
          this.selectedCubes.push(cube)
        }
      })
    }

    // 恢复选中的铰接点
    this.selectedHingePoints = []
    if (state.selectedHinges) {
      state.selectedHinges.forEach(uuid => {
        const hinge = this.hingePoints.find(point => point.uuid === uuid)
        if (hinge) {
          this.selectedHingePoints.push(hinge)
          hinge.material = selectedMaterial_Hinge
          hinge.userData.status = true
        }
      })
    }
  }

  // 处理铰接点的鼠标移入事件
  handleHingePointHover() {
    if (this.currentMode !== SceneMode.HINGE) return

    const intersectedPoint = this.checkHingePointIntersection()

    // 重置所有未选中铰接点为预览材质
    this.hingePoints.forEach(point => {
      if (!this.selectedHingePoints.includes(point)) {
        point.material = preMaterial_Hinge
      }
    })

    // 如果鼠标悬停在铰接点上，且该点未被选中，显示预览效果
    if (intersectedPoint && !this.selectedHingePoints.includes(intersectedPoint)) {
      intersectedPoint.material = preMaterial_Hinge
    }
  }

  // 处理模式切换
  handleModeChange(newMode) {
    this.currentMode = newMode
    this.selectedCubes = []
    this.selectedHingePoints = []
    this.hingePoints = []
    this.hingeMap = {}

    // 从本地存储恢复铰接点信息
    const savedState = localStorage.getItem('scene_state')
    if (savedState) {
      const sceneState = JSON.parse(savedState)
      if (sceneState.hingePoints) {
        this.hingeMap = sceneState.hingePoints
      }
    }

    // 更新所有立方体的交互状态
    this.cubeManager.getAllCubes().forEach(cube => {
      cube.userData.isSelectable = newMode === SceneMode.CREATE
      cube.userData.isHingeable = newMode === SceneMode.HINGE
    })
  }

  // 添加切换固定模式的方法
  toggleFixMode() {
    this.isFixMode = !this.isFixMode
    console.log('Fix mode:', this.isFixMode)
  }

  // 创建网格地板
  createGridFloor() {
    // 清除现有网格
    while (this.gridGroup.children.length > 0) {
      const child = this.gridGroup.children[0]
      child.geometry.dispose()
      child.material.dispose()
      this.gridGroup.remove(child)
    }

    // 创建几何体
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    // 创建边框几何体
    const edges = new THREE.EdgesGeometry(geometry)

    for (let x = -this.GRID_SIZE / 2 + 0.5; x < this.GRID_SIZE / 2 - 0.5; x++) {
      for (let z = -this.GRID_SIZE / 2 + 0.5; z < this.GRID_SIZE / 2 - 0.5; z++) {
        // 创建半透明材质
        const material = new THREE.MeshBasicMaterial({
          color: 0xffffff, // 立方体颜色
          transparent: true, // 启用透明度
          opacity: 0.2, // 设置透明度
        })
        // 创建边框材质
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0x000000, // 边框颜色
          linewidth: 10, // 边框宽度
        })

        // 创建立方体网格
        let cube = new THREE.Mesh(geometry, material)
        // 创建边框网格
        let cubeEdges = new THREE.LineSegments(edges, edgeMaterial)

        cube.position.set(x, -2, z)
        cubeEdges.position.copy(cube.position)

        this.gridGroup.add(cube)
        this.gridGroup.add(cubeEdges)
      }
    }
  }

  // 更新网格地板
  updateGridFloor() {
    this.createGridFloor()
  }


} 