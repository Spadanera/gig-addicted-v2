<script setup lang="ts">
import { ref } from 'vue'
import Axios from '@/services/client'
import Logo from '@/components/Logo.vue';

const axios: Axios = new Axios()
const form = ref(null)

const emit = defineEmits(['login'])

async function googleLogin() {
  location.href = "/auth/google"
}
</script>

<template>
  <main>
    <v-container>
      <v-row justify="center">
        <v-col sm="8" cols="12" lg="6" xl="4">
          <v-card>
            <v-card-text style="text-align: center;">
              <Logo></Logo>
            </v-card-text>
            <v-card-actions>
              <v-btn class="mt-2" @click="googleLogin" block prepend-icon="mdi-google">ACCEDI CON GOOGLE</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </main>
</template>
