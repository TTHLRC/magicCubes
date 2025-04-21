export const physicsConfig = {
  gravity: {
    x: 0,
    y: 9.8,  // 使用标准重力加速度
    z: 0
  },
  world: {
    iterations: 30,  // 增加物理迭代次数以提高精度
    tolerance: 0.0001  // 减小物理计算容差
  },
  materials: {
    default: {
      friction: 0.8,  // 增加摩擦力
      restitution: 0.2  // 减小弹性
    },
    cube: {
      friction: 0.8,  // 增加摩擦力
      restitution: 0.2  // 减小弹性
    }
  }
} 