import { createRouter, createWebHashHistory } from 'vue-router'
import Create from '../views/Create.vue'
import Hinge from '../views/Hinge.vue'
import Demo from '../views/Demo.vue'
import Introduction from '@/views/Introduction.vue'
import Help from '@/views/Help.vue'

const routes = [
  {
    path: '/introduction',
    name: 'Introduction',
    component: Introduction
  },
  {
    path: '/help',
    name: 'Help',
    component: Help
  },
  {
    path: '/',
    redirect: '/create'
  },
  {
    path: '/create',
    name: 'Create',
    component: Create
  },
  {
    path: '/hinge',
    name: 'Hinge',
    component: Hinge
  },
  {
    path: '/demo',
    name: 'Demo',
    component: Demo
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
