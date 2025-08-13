<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import Axios from '@/services/client'
import { ref, onBeforeMount } from 'vue'
import router from '@/router'
import { UserStore, SnackbarStore, ProgressStore, ThemeStore } from '@/stores'
import { type User } from '../../models/src'
import Avatar from './components/Avatar.vue'
import logo from '@/assets/logo.png'
import logoInvert from '@/assets/logo-invert.png'

const axios: Axios = new Axios()
const userStore = UserStore()
const snackbarStore = SnackbarStore()
const progressStore = ProgressStore()
const themeStore = ThemeStore()
const user = ref<User>({} as User)
const theme = ref('light')
const route = useRoute()
const drawer = ref(false)

function login() {
  user.value = userStore.user
  router.push("/")
}

function reload() {
  user.value = userStore.user
}

function reloadPage() {
  window.location.reload()
}

onBeforeMount(async () => {
  await userStore.checkAuthentication()
  user.value = userStore.user
})
</script>

<template>
  <v-responsive>
    <v-app :theme="themeStore.theme">
      <v-app-bar>
        <template v-slot:prepend>
          <RouterLink to="/">
            <img alt="Gig Addicted" :src="themeStore.theme === 'light' ? logo : logoInvert" class="logo" width="40"
              height="40" style="margin-left: 8px; margin-top: 7px;" />
          </RouterLink>
        </template>

        <v-app-bar-nav-icon @click="drawer = !drawer" class="d-sm-none"></v-app-bar-nav-icon>

        <v-app-bar-title>
          <RouterLink to="/">GIG ADDICTED</RouterLink>
        </v-app-bar-title>

        <div class="d-none d-sm-flex">
          <RouterLink to="/mybands" v-if="userStore.isLoggedIn">
            <v-btn variant="text" :class="{ 'text-decoration-underline': route.path.includes('/mybands') }">LE MIE
              BAND</v-btn>
          </RouterLink>
          <RouterLink to="/events">
            <v-btn variant="plain" :class="{ 'text-decoration-underline': route.path === '/events' }">EVENTI</v-btn>
          </RouterLink>
          <RouterLink to="/bands">
            <v-btn variant="plain" :class="{ 'text-decoration-underline': route.path === '/bands' }">BAND</v-btn>
          </RouterLink>
          <RouterLink to="/artists">
            <v-btn variant="plain" :class="{ 'text-decoration-underline': route.path === '/artists' }">ARTISTI</v-btn>
          </RouterLink>
        </div>

        <v-menu v-if="userStore.isLoggedIn" class="d-none d-sm-flex">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
              <Avatar :user="userStore.user" alt />
            </v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-list-item-title>
                <v-btn @click="themeStore.toggle" variant="text">
                  INVERTI TEMA
                  <template v-slot:prepend>
                    <v-icon>{{ theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
                  </template>
                </v-btn>
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>
                <v-btn @click="axios.Logout()" variant="text">
                  ESCI
                  <template v-slot:prepend>
                    <v-icon>mdi-logout</v-icon>
                  </template>
                </v-btn>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <RouterLink to="/login" v-else class="d-none d-sm-flex">
          <v-btn style="margin-right: 5px;" text="Accedi" color="primary" variant="outlined" rounded="xl"></v-btn>
        </RouterLink>
      </v-app-bar>

      <v-navigation-drawer v-model="drawer" temporary class="d-sm-none">
        <v-list>
          <RouterLink to="/mybands" v-if="userStore.isLoggedIn">
            <v-list-item>
              <v-list-item-title>LE MIE BAND</v-list-item-title>
            </v-list-item>
          </RouterLink>
          <RouterLink to="/events">
            <v-list-item>
              <v-list-item-title>EVENTI</v-list-item-title>
            </v-list-item>
          </RouterLink>
          <RouterLink to="/bands">
            <v-list-item>
              <v-list-item-title>BAND</v-list-item-title>
            </v-list-item>
          </RouterLink>
          <RouterLink to="/artists">
            <v-list-item>
              <v-list-item-title>ARTISTI</v-list-item-title>
            </v-list-item>
          </RouterLink>
          <v-divider v-if="userStore.isLoggedIn"></v-divider>
          <v-list-item v-if="userStore.isLoggedIn">
            <v-btn @click="themeStore.toggle" variant="text" class="w-full">
              <v-icon left>{{ theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
              INVERTI TEMA
            </v-btn>
          </v-list-item>
          <v-list-item v-if="userStore.isLoggedIn">
            <v-btn @click="axios.Logout()" variant="text" class="w-full">
              <v-icon left>mdi-logout</v-icon>
              ESCI
            </v-btn>
          </v-list-item>
          <RouterLink to="/login" v-else>
            <v-list-item>
              <v-list-item-title>
                <v-btn style="width: 100%" color="primary" variant="outlined" rounded="xl">ACCEDI</v-btn>
              </v-list-item-title>
            </v-list-item>
          </RouterLink>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <RouterView v-model="user" @login="login" @reload="reload" />
      </v-main>
      <v-snackbar v-model="snackbarStore.enable" :timeout="snackbarStore.timeout" :location="snackbarStore.location"
        :color="snackbarStore.color">
        {{ snackbarStore.text }}
        <template v-slot:actions>
          <v-btn variant="text" @click="reloadPage" v-if="snackbarStore.reload">
            Ricarica Pagina
          </v-btn>
          <v-btn variant="text" @click="snackbarStore.enable = false">
            Chiudi
          </v-btn>
        </template>
      </v-snackbar>
      <v-overlay v-model="progressStore.loading" persistent scroll-strategy="block" class="align-center justify-center">
        <v-progress-circular :size="80" color="primary" indeterminate></v-progress-circular>
      </v-overlay>
    </v-app>
  </v-responsive>
</template>

<style scoped></style>
