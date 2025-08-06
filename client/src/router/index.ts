import { createRouter, createWebHistory } from 'vue-router'
import { UserStore, SnackbarStore } from '@/stores'

const publicRoute:String[] = ['Home', 'Login', 'Reset', 'Invitation', 'AskReset']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue'),
      props: true
    },
    {
      path: '/bands',
      name: 'Bands',
      component: () => import('@/views/Bands.vue'),
      props: true
    },
    {
      path: '/events',
      name: 'Events',
      component: () => import('@/views/Events.vue'),
      props: true
    },
    {
      path: '/artists',
      name: 'Artists',
      component: () => import('@/views/Artists.vue'),
      props: true
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      props: true
    },
    {
      path: '/askreset',
      name: 'AskReset',
      component: () => import('@/views/AskReset.vue'),
      props: true
    },
    {
      path: '/reset/:token',
      name: 'Reset',
      component: () => import('@/views/Reset.vue'),
      props: true
    },
    {
      path: '/invitation/:token',
      name: 'Invitation',
      component: () => import('@/views/Invitation.vue'),
      props: true
    },
    {
      path: "/mybands",
      name: 'My Bands',
      component: () => import('@/views/mybands/MyBands.vue'),
      props: true
    },
    {
      path: "/mybands/:band_id",
      name: "Band",
      component: () => import('@/views/mybands/Band.vue'),
      children: [
        {
          path: 'setlist',
          name: 'Setlist',
          component: () => import('@/views/mybands/Setlist.vue')
        },
        {
          path: 'bandmember',
          name: 'Band Member',
          component: () => import('@/views/mybands/BandMember.vue')
        },
        {
          path: 'event',
          name: 'event',
          component: () => import('@/views/mybands/Events.vue')
        }
      ]
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const snackbarStore = SnackbarStore()
  const userStore = UserStore()
  
  const user = userStore.user.id ? userStore.user : await userStore.checkAuthentication()
  if (user.id && to.name === 'Login') {
    next({ name: "My Bands" })
  }
  else if (user.id || publicRoute.includes(to.name?.toString())) {
    next()
  }
  else {
    snackbarStore.show("Sessione scaduta")
    next({ name: 'Home' })
  }
})

export default router
