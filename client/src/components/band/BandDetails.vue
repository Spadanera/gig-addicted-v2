<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Axios from '@/services/client'
import { UserStore, SnackbarStore } from '@/stores'
import { requiredRule, fileRequiredRule, copy } from '@/services/utils';
import { type Band } from '../../../../models/src'

const props = defineProps(['band_id'])
const emit = defineEmits(['band'])

const userStore = UserStore()
const snackbarStore = SnackbarStore()
const axios: Axios = new Axios()
const band = ref<Band>({} as Band)
const editBand = ref<Band>({} as Band)
const editing = ref<boolean>(false)
const editingLogo = ref<boolean>(false)
const formBand = ref(null)
const formLogo = ref(null)
const fileInput = ref<HTMLInputElement | null>(null)
const files = ref()

async function load() {
    band.value = await axios.GetBandDetails(props.band_id)
    emit('band', band.value)
}

function handleFileChange() {
    files.value = fileInput.value?.files
}

function startEditing() {
    editBand.value = copy(band.value)
    editing.value = true
}

async function saveBand() {
    const { valid } = await formBand.value?.validate()
    if (valid) {
        await axios.UpdateBandDetails(editBand.value)
        band.value = copy(editBand.value)
        emit('band', band.value)
        editing.value = false
        snackbarStore.show("Modifiche salvate", 3000, 'buttom', 'success')
    }
}

function startEditingLogo() {
    editingLogo.value = true
}

async function saveLogo() {
    const { valid } = await formLogo.value?.validate()
    if (valid) {
        try {
            const file = files.value[0]
            const formData = new FormData()
            formData.append('logo', file)
            band.value.logo = await axios.UpdateBandLogo(formData, band.value.id)
            emit('band', band.value)
            editingLogo.value = false
            snackbarStore.show("Logo aggiornato", 3000, 'bottom', 'success')
        } catch (error) {
            console.error(error)
        }
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
                <v-col sm="12" cols="12" lg="6">
                    <v-card v-if="!editing && !editingLogo">
                        <v-img v-if="band.logo" height="200px" :src="band.logo"></v-img>
                        <v-card-title>
                            {{ band.name }}
                        </v-card-title>

                        <v-card-subtitle>
                            {{ band.description }}
                        </v-card-subtitle>
                        <v-card-text>
                            {{ band.biography }}
                        </v-card-text>
                        <v-card-actions>
                            <v-btn @click="startEditing">Modifica</v-btn>
                            <v-btn @click="startEditingLogo">Carica Logo</v-btn>
                        </v-card-actions>
                    </v-card>
                    <v-card v-else-if="editing">
                        <v-card-text>
                            <v-form ref="formBand" fast-fail @submit.prevent>
                                <v-text-field :rules="[requiredRule]" label="Nome Band" :autocomplete="false"
                                    v-model="editBand.name">
                                </v-text-field>
                                <v-textarea rows="2" :clearable="true" :autocomplete="false" label="Descrizione Band"
                                    v-model="editBand.description"></v-textarea>
                                <v-textarea rows="6" :clearable="true" :autocomplete="false" label="Biografia Band"
                                    v-model="editBand.biography"></v-textarea>
                            </v-form>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn @click="saveBand">SALVA</v-btn>
                            <v-btn @click="editing = false">ANNULLA</v-btn>
                        </v-card-actions>
                    </v-card>
                    <v-card v-else-if="editingLogo">
                        <v-card-text>
                            <v-form ref="formLogo" fast-fail @submit.prevent>
                                <v-file-input :rules="[requiredRule, fileRequiredRule]" @change="handleFileChange"
                                    label="Logo" ref="fileInput" accept="image/*" show-size>
                                    <template v-slot:selection="{ fileNames }">
                                        <v-chip class="me-2" color="primary" size="small" label>
                                            {{ fileNames[0] }}
                                        </v-chip>
                                    </template>
                                </v-file-input>
                                <v-row>
                                    <v-spacer></v-spacer>
                                    <v-col>
                                        <v-btn class="mt-2" type="submit" @click="saveLogo()">SALVA</v-btn>
                                    </v-col>
                                    <v-col>
                                        <v-btn class="mt-2" type="submit" @click="editingLogo = false">ANNULLA</v-btn>
                                    </v-col>
                                    <v-spacer></v-spacer>
                                </v-row>
                            </v-form>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </main>
</template>
