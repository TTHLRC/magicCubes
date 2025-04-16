<template>
  <nav class="navbar">
    <div class="logo">Magic Cubes</div>
    <div class="nav-links">
      <router-link to="/" class="nav-link" :class="{ active: currentRoute === '/' }">Home</router-link>
      <router-link to="/introduction" class="nav-link"
        :class="{ active: currentRoute === '/introduction' }">Introduction</router-link>
      <router-link to="/help" class="nav-link" :class="{ active: currentRoute === '/help' }">Help</router-link>
    </div>
    <div class="user-menu">
      <div class="logo font16">Welcome</div>
      <button v-if="isLoggedIn" class="login-btn" @click="loginOut">退出</button>
      <button v-if="!isLoggedIn" class="login-btn" @click="showLoginDialog">Login</button>
    </div>
  </nav>
  <LoginDialog ref="loginDialog" @login-success="handleLoginSuccess" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LoginDialog from './LoginDialog.vue'
const route = useRoute()
const isLoggedIn = ref(localStorage.getItem('token') ? true : false)
const currentRoute = computed(() => route.path)
const loginDialog = ref(null)

onMounted(() => {

  if (!localStorage.getItem('token')) {

    loginDialog.value.show()
  }
})
const loginOut = () => {
  localStorage.removeItem('token')
  //刷新页面
  window.location.reload()
}
const showLoginDialog = () => {
  loginDialog.value.show()
}
const handleLoginSuccess = () => {
  // 登录成功后，更新登录状态
  isLoggedIn.value = true
}
</script>

<style scoped>
.navbar {

  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.95);
  border-bottom: 1px solid;
  border-image: linear-gradient(45deg, var(--gradient-start), var(--gradient-end)) 1;
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
}

.logo {
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.font16 {
  font-size: 16px !important;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: var(--primary-color);
  ;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  padding: 0.5rem 0;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
  transition: width 0.3s ease;
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}

.nav-link:hover,
.nav-link.active {
  color: var(--primary-color);
}

.login-btn {
  background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
  color: var(--secondary-color);
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  min-width: 120px;
  text-align: center;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  background: linear-gradient(to right, var(--gradient-end), var(--gradient-start));
}

.user-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-menu-content {
  display: none;
  position: absolute;
  right: 0;
  top: 100%;
  background: rgba(0, 0, 0, 0.95);
  min-width: 160px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 8px 0;
  z-index: 1000;
}

.user-menu.active .user-menu-content {
  display: block;
}

.user-menu-content a {
  color: #FFD700;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  transition: background-color 0.3s;
}

.user-menu-content a:hover {
  background-color: rgba(255, 215, 0, 0.1);
}
</style>