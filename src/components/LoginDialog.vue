<template>
    <div class="modal-overlay" v-if="isVisible">
        <div class="login-dialog" @click.stop>
            <div class="card-container" :class="{ 'flipped': isFlipped }">
                <!-- Login Side (Front) -->
                <div class="card-face card-front">
                    <div class="login-content">
                        <div class="login-header">
                            <h2>Login</h2>
                        </div>

                        <form @submit.prevent="handleLogin" class="login-form">
                            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

                            <div class="form-group">
                                <label for="username">Username</label>
                                <input type="text" id="username" v-model="username" required
                                    placeholder="Enter your username" :disabled="isLoading">
                            </div>

                            <div class="form-group">
                                <label for="password">Password</label>
                                <input type="password" id="password" v-model="password" required
                                    placeholder="Enter your password" :disabled="isLoading">
                            </div>

                            <button type="submit" class="submit-btn" :disabled="isLoading">
                                {{ isLoading ? 'Logging in...' : 'Login' }}
                            </button>
                            <button type="button" class="register-btn" @click="flipCard" :disabled="isLoading">
                                Register
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Register Side (Back) -->
                <div class="card-face card-back">
                    <div class="login-content">
                        <div class="login-header">
                            <h2>Register</h2>
                        </div>

                        <form @submit.prevent="handleRegister" class="login-form">
                            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

                            <div class="form-group">
                                <label for="reg-username">Username</label>
                                <input type="text" id="reg-username" v-model="regUsername" required
                                    placeholder="Choose a username" :disabled="isLoading">
                            </div>

                            <div class="form-group">
                                <label for="reg-email">Email</label>
                                <input type="email" id="reg-email" v-model="regEmail" required
                                    placeholder="Enter your email" :disabled="isLoading">
                            </div>

                            <div class="form-group">
                                <label for="reg-password">Password</label>
                                <input type="password" id="reg-password" v-model="regPassword" required
                                    placeholder="Choose a password" :disabled="isLoading">
                            </div>

                            <div class="form-group">
                                <label for="reg-confirm-password">Confirm Password</label>
                                <input type="password" id="reg-confirm-password" v-model="regConfirmPassword" required
                                    placeholder="Confirm your password" :disabled="isLoading">
                            </div>

                            <button type="submit" class="submit-btn" :disabled="isLoading">
                                {{ isLoading ? 'Registering...' : 'Register' }}
                            </button>
                            <button type="button" class="login-btn" @click="flipCard" :disabled="isLoading">
                                Back to Login
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isVisible = ref(false)
const isFlipped = ref(false)
const username = ref('')
const password = ref('')
const regUsername = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const show = () => {
    isVisible.value = true
}

const hide = () => {
    isVisible.value = false
    isFlipped.value = false
    username.value = ''
    password.value = ''
    regUsername.value = ''
    regEmail.value = ''
    regPassword.value = ''
    regConfirmPassword.value = ''
    errorMessage.value = ''
}

const flipCard = () => {
    isFlipped.value = !isFlipped.value
    errorMessage.value = ''
}

const emit = defineEmits(['login-success', 'register-success'])

const handleLogin = async () => {
    if (!username.value || !password.value) {
        errorMessage.value = 'Please fill in all fields'
        return
    }

    try {
        isLoading.value = true
        const response = await fetch('https://web-production-6b633.up.railway.app/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username.value,
                password: password.value,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Login failed')
        }
        // 存储token
        localStorage.setItem('token', data.access_token)
        hide()
        window.location.reload()
        router.push('/') // 登录成功后跳转到仪表盘页面
    } catch (error) {
        console.log(error);

        errorMessage.value = error.message
    } finally {
        isLoading.value = false
    }
}

const handleRegister = async () => {
    if (!regUsername.value || !regEmail.value || !regPassword.value || !regConfirmPassword.value) {
        errorMessage.value = 'Please fill in all fields'
        return
    }

    if (regPassword.value !== regConfirmPassword.value) {
        errorMessage.value = 'Passwords do not match'
        return
    }

    try {
        isLoading.value = true
        const response = await fetch('https://web-production-6b633.up.railway.app/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: regUsername.value,
                email: regEmail.value,
                password: regPassword.value,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed')
        }

        emit('register-success')
        // 注册成功后自动切换到登录界面
        flipCard()
        errorMessage.value = 'Registration successful! Please login.'
    } catch (error) {
        errorMessage.value = error.message
    } finally {
        isLoading.value = false
    }
}

defineExpose({
    show,
    hide
})
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
}

.login-dialog {
    position: relative;
    width: 100%;
    max-width: 400px;
    margin: 20px;
}

.card-container {
    position: relative;
    width: 100%;
    height: auto;
    min-height: 500px;
    perspective: 1000px;
}

.card-face {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    transition: transform 0.6s;
}

.card-front {
    transform: rotateY(0deg);
}

.card-back {
    transform: rotateY(180deg);
}

.flipped .card-front {
    transform: rotateY(-180deg);
}

.flipped .card-back {
    transform: rotateY(0deg);
}

.login-content {
    background: rgba(26, 26, 26, 0.95);
    padding: 2rem;
    border-radius: 15px;
    width: 100%;
    height: auto;
    min-height: 500px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    border: 1px solid;
    border-image: linear-gradient(45deg, var(--gradient-start), var(--gradient-end)) 1;
    display: flex;
    flex-direction: column;
}

.login-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.login-header h2 {
    color: var(--primary-color);
    margin: 0;
    font-size: 1.8rem;
}

.close-btn {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.3s;
}

.close-btn:hover {
    color: var(--primary-color);
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    flex: 1;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    color: #fff;
    font-weight: 500;
}

.form-group input {
    padding: 0.8rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.3);
    color: #fff;
    transition: all 0.3s ease;
}

.form-group input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
}

.submit-btn {
    background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
    color: var(--secondary-color);
    border: none;
    padding: 0.8rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 1rem;
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
}

.register-btn,
.login-btn {
    background: transparent;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
    padding: 0.8rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 0.5rem;
}

.register-btn:hover,
.login-btn:hover {
    background: rgba(255, 215, 0, 0.1);
    transform: translateY(-2px);
}

.error-message {
    color: #ff4444;
    background: rgba(255, 68, 68, 0.1);
    padding: 0.8rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    text-align: center;
}

.submit-btn:disabled,
.register-btn:disabled,
.login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}

.submit-btn:disabled:hover,
.register-btn:disabled:hover,
.login-btn:disabled:hover {
    transform: none;
    box-shadow: none;
}
</style>