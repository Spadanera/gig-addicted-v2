<script setup lang="ts">
import { ref } from 'vue'
import type { SortItem } from 'vuetify/lib/components/VDataTable/composables/sort.mjs'
import { formatSecondsToMinutesSeconds } from "@/services/utils"
import { type SetlistSong, type Song } from '../../../../models/src'

const props = defineProps<{ songs: Song[], addMode: boolean, repertoire: boolean }>()
const emit = defineEmits(['editsong', 'add', 'cancel', 'togglesong'])

const sortBy = ref([{ key: 'name', order: 'asc' } as SortItem])
const songSearch = ref(null)
const songHeaders = ref([
    { title: 'Nome', key: 'name' },
    { title: 'Artista', key: 'artist' },
    { title: 'Album', key: 'album' },
    { title: 'Durata', key: 'duration' },
])

if (!props.addMode) {
    songHeaders.value.push({ title: '', key: 'action' })
}

function getRowClass(item: Song) {
    return item.removed ? 'line-through' : ''
}

const selectedSongs = ref([])
</script>

<template>
    <div>
        <v-text-field v-model="songSearch" label="Cerca" prepend-inner-icon="mdi-magnify" variant="filled" hide-details
            single-line clearable density="compact" :rounded="false" autocomplete="off"></v-text-field>
        <v-data-table v-model:sort-by="sortBy" density="comfortable" fixed-header
            hide-default-footer :items-per-page="songs.length" style="height: calc(100vh - 176px);"
            :headers="songHeaders" :items="songs" :search="songSearch" :show-select="addMode" v-model="selectedSongs"
            :disable-sort="!repertoire">
            <template v-slot:item.action="{ item }">
                <v-btn v-if="repertoire" icon variant="text" @click.stop="emit('editsong', item)">
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn v-else-if="!addMode" icon variant="text" @click.stop="emit('togglesong', item)">
                    <v-icon v-if="!item.removed">mdi-delete</v-icon>
                    <v-icon v-else>mdi-undo-variant</v-icon>
                </v-btn>
            </template>
            <template v-slot:item.name="{ item }">
                <span :class="getRowClass(item)">{{ item.name }}</span>
            </template>
            <template v-slot:item.artist="{ item }">
                <span :class="getRowClass(item)">{{ item.artist }}</span>
            </template>
            <template v-slot:item.album="{ item }">
                <span :class="getRowClass(item)">{{ item.album }}</span>
            </template>
            <template v-slot:item.duration="{ item }">
                <span :class="getRowClass(item)">{{ formatSecondsToMinutesSeconds(item.duration) }}</span>
            </template>
            <template v-slot:bottom v-if="addMode">
                <div class="d-flex justify-end pa-1">
                    <v-btn :disabled="selectedSongs.length === 0" variant="flat" class="mr-2"
                        @click="emit('add', selectedSongs)">
                        AGGIUNGI
                    </v-btn>
                    <v-btn variant="flat" @click="emit('cancel')">
                        ANNULLA
                    </v-btn>
                </div>
            </template>
        </v-data-table>
    </div>
</template>

<style scoped>
.line-through {
    text-decoration: line-through;
}
</style>