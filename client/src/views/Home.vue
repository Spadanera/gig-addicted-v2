<script setup lang="ts">
import { ref, computed, onBeforeMount, onMounted } from 'vue';
import { type User } from '../../../models/src';
import Axios from '@/services/client'
import { Roles } from '@/services/utils';

interface Role {
  title: string
  route: string
  text: string
  role: string
}

const axios = new Axios()

const emit = defineEmits(['login', 'reload'])

const user = defineModel<User>()

onMounted(async () => {
  
})

onBeforeMount(() => {
  emit('reload')
})

</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4" >
        
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>