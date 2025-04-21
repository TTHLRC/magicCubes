import * as CANNON from 'cannon-es'
import { physicsConfig } from '../config/physicsConfig'

export class PhysicsManager {
  constructor() {
    this.world = new CANNON.World()

    this.world.gravity.set(
      physicsConfig.gravity.x,
      -physicsConfig.gravity.y,  // 取反使重力向下
      physicsConfig.gravity.z
    )
    this.world.solver.iterations = physicsConfig.world.iterations
    this.world.solver.tolerance = physicsConfig.world.tolerance

    this.world.defaultContactMaterial.friction = 0.5;
    this.world.defaultContactMaterial.restitution = 0.3;
    // 创建地面
    this.createGround()

  }

  createGround() {
    const groundShape = new CANNON.Box(new CANNON.Vec3(100, 0.1, 100));
    const groundBody = new CANNON.Body({
      mass: 0,
      material: this.defaultMaterial
    })
    groundBody.addShape(groundShape)
    // 旋转地面180度
    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      Math.PI / 2  // 旋转180度
    )
    groundBody.position.y = 0 // 设置地面位置
    this.world.addBody(groundBody)

  }

  createCubeBody(cube) {
    try {
      const params = cube.geometry.parameters
      const halfWidth = params.width / 2 - 0.01
      const halfHeight = params.height / 2 - 0.01
      const halfDepth = params.depth / 2 - 0.01
      const shape = new CANNON.Box(new CANNON.Vec3(halfWidth, halfHeight, halfDepth))

      // 根据是否是固定立方体设置不同的物理属性
      const isFixed = cube.userData.isFix
      const body = new CANNON.Body({
        mass: isFixed ? 0 : 1, // 固定立方体质量为0
        material: this.cubeMaterial,
        position: new CANNON.Vec3(
          cube.position.x,
          cube.position.y,
          cube.position.z
        ),
        linearDamping: 0, // 固定立方体不需要阻尼
        angularDamping: 0,
        fixedRotation: isFixed, // 固定立方体不允许旋转
        collisionResponse: true,
        userData: {
          uuid: cube.uuid,
          isFixed: isFixed
        },
        type: isFixed ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC
      })

      body.addShape(shape)

      // 重置所有物理状态
      body.velocity.set(0, 0, 0)
      body.angularVelocity.set(0, 0, 0)
      body.force.set(0, 0, 0)
      body.torque.set(0, 0, 0)

      // 设置碰撞过滤
      body.collisionFilterGroup = 1
      body.collisionFilterMask = -1

      // 如果是固定立方体，确保它完全静止
      if (isFixed) {
        body.sleep() // 让固定立方体进入睡眠状态
        body.updateMassProperties() // 更新质量属性
      } else {
        // 确保动态物体不会进入睡眠状态
        body.allowSleep = false
      }

      this.world.addBody(body)
      return body
    } catch (error) {
      console.error('Error creating physics body:', error)
      throw error
    }
  }

  update(deltaTime) {
    // 更新物理世界
    const maxSubSteps = 3;
    const fixedTimeStep = 1 / 60;

    // 确保物理世界更新
    this.world.step(fixedTimeStep, deltaTime, maxSubSteps);

    // 检查更新后的状态
    this.world.bodies.forEach(body => {
      if (body.mass > 0 && body.force.length() > 0) {
        console.log('After step:', {
          force: body.force,
          velocity: body.velocity,
          position: body.position,
          type: body.type,
          constraints: this.world.constraints.length
        });
      }
    });
  }

  syncPhysicsToGraphics(cube, body) {
    if (cube && body) {
      // 确保位置和旋转正确同步
      if (body.type === CANNON.Body.DYNAMIC) {
        cube.position.set(body.position.x, body.position.y, body.position.z);
        cube.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
      }
    }
  }

  removeBody(body) {
    this.world.removeBody(body)
  }
} 