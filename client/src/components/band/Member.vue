<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import Axios from '@/services/client'
import { Roles, type BandMember, type Setlist, type SetlistInput, type SetlistSong, type Song } from '../../../../models/src'
import { requiredRule, positiveIntegerRule, emailRule, copy, canEditMember } from "@/services/utils"
import MemberCard from './MemberCard.vue'

const axios: Axios = new Axios()
const bandMembers = ref<BandMember[]>([])
const dialog = ref<boolean>(false)
const confirmRemove = ref<boolean>(false)
const member = ref<BandMember>({} as BandMember)
const memberform = ref(null)

const props = defineProps(['band_id', 'roles'])

const roles = ref({
    owner: false,
    editor_detail: false,
    editor_setlist: false,
    editor_event: false,
    editor_member: false,
    viewer: false
})

function onOwnerChange(value: boolean) {
    if (value) {
        roles.value.editor_detail = true
        roles.value.editor_setlist = true
        roles.value.editor_event = true
        roles.value.editor_member = true
        roles.value.viewer = true
    }
}

async function inviteMember() {
    const { valid } = await memberform.value?.validate()
    if (valid) {
        Object.entries(roles.value).forEach(([key, value]) => {
            if (value) {
                member.value.role.push(key as Roles)
            }
        });
        await axios.InviteBandMember(member.value)
        dialog.value = false
        await load()
    }
}

async function editMember() {
    const { valid } = await memberform.value?.validate()
    if (valid) {
        member.value.role = []
        Object.entries(roles.value).forEach(([key, value]) => {
            if (value) {
                member.value.role.push(key as Roles)
            }
        });
        await axios.EditBandMember(member.value)
        dialog.value = false
        await load()
    }
}

function removeMemberConfirm(dMember:BandMember) {
    member.value = dMember
    confirmRemove.value = true
}


async function removeMember() {
    await axios.RemoveBandMember(member.value)
    confirmRemove.value = false
    await load()
}

function memberDialogOpen(dMember?: BandMember) {
    roles.value.owner = false
    roles.value.editor_detail = false
    roles.value.editor_event = false
    roles.value.editor_member = false
    roles.value.editor_setlist = false
    roles.value.viewer = false
    if (dMember) {
        member.value = dMember
        console.log(dMember.role, dMember.role.includes(Roles.owner),  dMember.role.includes(Roles.viewer))
        if (dMember.role.includes(Roles.owner)) roles.value.owner = true
        if (dMember.role.includes(Roles.editor_detail)) roles.value.editor_detail = true
        if (dMember.role.includes(Roles.editor_event)) roles.value.editor_event = true
        if (dMember.role.includes(Roles.editor_member)) roles.value.editor_member = true
        if (dMember.role.includes(Roles.editor_setlist)) roles.value.editor_setlist = true
        if (dMember.role.includes(Roles.viewer)) roles.value.viewer = true
    }
    else {
        member.value = {
            band_id: props.band_id,
            role: [],
            instrument: []
        } as BandMember
    }
    dialog.value = true
}

async function load() {
    bandMembers.value = await axios.GetBandMember(props.band_id)
}

onMounted(() => {
    load().catch(console.error)
})

</script>

<template>
    <v-container>
        <v-row justify="center">
            <v-col cols="12" sm="12" md="6" lg="4" v-for="(member, index) in bandMembers" style="text-align: center;">
                <MemberCard @removemember="removeMemberConfirm" @editmember="memberDialogOpen" :key="index" :member="member"
                    :canedit="canEditMember(props.roles)" />
            </v-col>

            <v-col v-if="canEditMember(props.roles)" cols="12" sm="12" md="6" lg="4">
                <v-card class="d-flex align-center justify-center pa-4" height="150" variant="outlined"
                    style="cursor: pointer;" @click="memberDialogOpen()">
                    <v-btn icon="mdi-plus" color="primary" size="x-large" variant="tonal" />
                </v-card>
            </v-col>
        </v-row>

        <!-- Dialog -->
        <v-dialog v-model="dialog" max-width="500">
            <v-card>
                <v-card-title class="text-h6">
                    <span v-if="member.id">Modifica Membro</span>
                    <span v-else>Invita Nuovo Membro</span>
                </v-card-title>
                <v-card-text>
                    <v-form @submit.prevent ref="memberform">
                        <v-text-field :rules="[requiredRule, emailRule]" v-model="member.email" label="Email"
                            type="email" prepend-inner-icon="mdi-email" autocomplete="off" />

                        <!-- Role switches -->
                        <v-divider class="my-3"></v-divider>
                        <div class="text-subtitle-1 mb-2">Ruoli</div>

                        <v-switch v-model="roles.owner" label="Proprietario (tutti i permessi, inclusa cancellazione)"
                            color="deep-purple" @change="onOwnerChange" />

                        <v-switch v-model="roles.editor_detail" label="Editore - Dettagli" color="blue" />
                        <v-switch v-model="roles.editor_setlist" label="Editore - Scalette" color="blue" />
                        <v-switch v-model="roles.editor_event" label="Editore - Eventi" color="blue" />
                        <v-switch v-model="roles.editor_member" label="Editore - Membri" color="blue" />

                        <v-switch v-model="roles.viewer" label="Visualizzatore" color="grey" />

                        <v-divider class="my-3"></v-divider>
                        <v-combobox v-model="member.instrument" label="Strumenti" multiple chips clearable
                            prepend-inner-icon="mdi-guitar-electric" />
                    </v-form>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="plain" v-if="member.id" color="primary" @click="editMember">SALVA</v-btn>
                    <v-btn variant="plain" v-else color="primary" @click="inviteMember">INVIA INVITO</v-btn>
                    <v-btn variant="plain" @click="dialog = false">ANNULLA</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <Confirm v-model="confirmRemove">
            <template v-slot:action>
                <v-btn text="Conferma" variant="plain" @click="removeMember"></v-btn>
            </template>
        </Confirm>
    </v-container>
</template>

<style scoped>
.gap-2 {
    gap: 8px;
}
</style>