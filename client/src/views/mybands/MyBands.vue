<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Axios from '@/services/client'
import { UserStore } from '@/stores'
import { type Band } from "../../../../models/src"
import { requiredRule } from "@/services/utils"

const userStore = UserStore()
const axios: Axios = new Axios()

const myBands = ref<Band[]>([])
const createDialog = ref<boolean>(false)
const dialogBand = ref<Band>(null)
const form = ref(null)

async function load() {
    myBands.value = await axios.GetMyBand()
}

function openCreateDialog() {
    dialogBand.value = {} as Band
    createDialog.value = true
}

async function createBand() {
    const { valid } = await form.value?.validate()
    if (valid) {
        await axios.CreateBand(dialogBand.value)
        createDialog.value = false
        load()
    }
}

onMounted(async () => {
    await load()
})

</script>

<template>
    <main>
        <v-container>
            <v-row justify="center">
                <v-col sm="8" cols="12" lg="4" v-for="band in myBands" v-if="myBands.length">
                    <RouterLink :to="`/mybands/${band.id}`">
                        <v-card>
                            <v-img v-if="band.logo" height="200px" :src="band.logo"></v-img>
                            <v-card-title>{{ band.name }}</v-card-title>
                            <v-card-text>{{ band.description }}</v-card-text>
                        </v-card>
                    </RouterLink>
                </v-col>
                <v-card v-else>
                    <v-card-title style="text-align: center;">
                        Non hai ancora nessuna band
                    </v-card-title>
                    <v-card-actions>
                        <v-btn color="primary" @click="openCreateDialog" variant="outlined" block>Crea la tua prima
                            band</v-btn>
                    </v-card-actions>
                </v-card>
            </v-row>
        </v-container>
        <v-dialog v-model="createDialog" width="380px">
            <v-card>
                <v-card-title>
                    Crea Nuovo Evento
                </v-card-title>
                <v-card-text>
                    <v-form @submit.prevent ref="form">
                        <v-text-field v-model="dialogBand.name" label="Nome Band"
                            :rules="[requiredRule]"></v-text-field>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="plain" @click="createDialog = false">ANNULLA</v-btn>
                    <v-btn variant="plain" @click="createBand">CONFERMA</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-fab icon="mdi-plus" app style="position: fixed; right: 10px; bottom: 10px;" location="bottom right"
            @click="openCreateDialog()"></v-fab>
    </main>
</template>
