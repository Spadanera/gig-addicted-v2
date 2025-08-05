<script setup lang="ts">
import { ThemeStore } from '@/stores'
const themeStore = ThemeStore()
</script>

<template>
    <img alt="Gig Addicted" v-if="themeStore.theme === 'light'" class="logo" src="@/assets/chicomanda.png" style="" width="240" height="240" />
    <img alt="Gig Addicted" v-else class="logo" src="@/assets/chicomanda-invert.png" style="" width="240" height="240" />
</template>