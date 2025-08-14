<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import Sortable from 'sortablejs'
import type { SortItem } from 'vuetify/lib/components/VDataTable/composables/sort.mjs'
import { formatSecondsToMinutesSeconds } from "@/services/utils"
import type { SetlistSong } from '../../../../models/src'

const songHeaderRepertoire = [
    { title: 'Nome', key: 'name', sortable: true },
    { title: 'Artista', key: 'artist', sortable: true },
    { title: 'Album', key: 'album', sortable: true },
    { title: 'Durata', key: 'duration', sortable: true },
    { title: '', key: 'action', sortable: false },
]

const songHeaderAddMmode = [
    { title: 'Nome', key: 'name', sortable: true },
    { title: 'Artista', key: 'artist', sortable: true },
    { title: 'Album', key: 'album', sortable: true },
    { title: 'Durata', key: 'duration', sortable: true },
]

const songHeaderSetlist = [
    { title: '', key: 'position', sortable: false },
    { title: 'Nome', key: 'name', sortable: false },
    { title: 'Artista', key: 'artist', sortable: false },
    { title: 'Album', key: 'album', sortable: false },
    { title: 'Durata', key: 'duration', sortable: false },
    { title: '', key: 'action', sortable: false },
]

const props = defineProps<{ songs: SetlistSong[], addMode: boolean, repertoire: boolean, canEdit: boolean }>()
const emit = defineEmits(['editsong', 'add', 'cancel', 'togglesong', 'updatesongs'])

const sortBy = ref([{ key: 'position', order: 'asc' } as SortItem, { key: 'name', order: 'asc' } as SortItem])
const songSearch = ref<string | null>(null)
const songHeaders = ref(songHeaderRepertoire)
const tableRef = ref<any>(null)
let sortable: Sortable | null = null
const selectedSongs = ref<SetlistSong[]>([])

// Reactive window width
const windowWidth = ref(window.innerWidth)

function updateWindowWidth() {
    windowWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener('resize', updateWindowWidth)
    nextTick(initSortable)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateWindowWidth)
    destroySortable()
})

watch(() => [props.repertoire, props.addMode, props.songs.length], async () => {
    await nextTick()
    destroySortable()
    initSortable()

    if (props.repertoire) {
        songHeaders.value = songHeaderRepertoire
        sortBy.value = [{ key: 'name', order: 'asc' } as SortItem]
    } else if (props.addMode) {
        songHeaders.value = songHeaderAddMmode
        sortBy.value = [{ key: 'name', order: 'asc' } as SortItem]
    } else {
        songHeaders.value = songHeaderSetlist
        sortBy.value = []
    }
})

function getRowClass(item: SetlistSong) {
    return item.removed ? 'line-through' : ''
}

function initSortable() {
    if (props.repertoire || props.addMode) return

    const tbody = tableRef.value?.$el?.querySelector('tbody') as HTMLElement | null
    if (!tbody) return

    sortable = Sortable.create(tbody, {
        handle: '.drag-handle',
        animation: 150,
        onEnd: (evt) => {
            const from = evt.oldIndex ?? 0
            const to = evt.newIndex ?? 0
            if (from === to) return

            const moved = props.songs.splice(from, 1)[0]
            props.songs.splice(to, 0, moved)

            props.songs.forEach((song, idx) => (song.position = idx + 1))
            emit('updatesongs', props.songs)
        },
    })
}

function destroySortable() {
    sortable?.destroy()
    sortable = null
}

// Computed headers for mobile
const songHeadersFiltered = computed(() => {
    return songHeaders.value.filter(h => !(h.key === 'album' && windowWidth.value < 600))
})
</script>

<template>
    <div>
        <v-text-field v-if="props.repertoire || props.addMode" v-model="songSearch" label="Cerca" :bg-color=" addMode ? 'secondary' : ''"
            prepend-inner-icon="mdi-magnify" variant="filled" hide-details single-line clearable density="compact"
            :rounded="false" autocomplete="off" />

        <v-data-table ref="tableRef" v-model:sort-by="sortBy" :headers="songHeadersFiltered" :items="songs"
            :search="songSearch" :items-per-page="songs.length" :show-select="addMode"
            :class="repertoire || addMode ? 'data-height-search' : 'data-height-no-search'" v-model="selectedSongs"
            density="comfortable" fixed-header hide-default-footer>
            <template v-slot:item.position="{ item }">
                <div class="position-cell">
                    <span v-if="!repertoire && !addMode && canEdit" class="drag-handle mr-2" title="Trascina per riordinare">
                        <v-icon small>mdi-drag</v-icon>
                    </span>
                    <span :class="getRowClass(item)">{{ item.position }}</span>
                </div>
            </template>

            <template v-slot:item.name="{ item }">
                <span :class="getRowClass(item)">{{ item.name }}</span>
            </template>

            <template v-slot:item.artist="{ item }">
                <span :class="getRowClass(item)">{{ item.artist }}</span>
            </template>

            <!-- Fully hide Album column on mobile -->
            <template v-slot:item.album="{ item }">
                <span v-show="windowWidth >= 600" :class="getRowClass(item)">{{ item.album }}</span>
            </template>

            <template v-slot:item.duration="{ item }">
                <span :class="getRowClass(item)">{{ formatSecondsToMinutesSeconds(item.duration) }}</span>
            </template>

            <template v-slot:item.action="{ item }">
                <v-btn v-if="repertoire && canEdit" icon variant="text" @click.stop="emit('editsong', item)">
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn v-else-if="!addMode && canEdit" icon variant="text" @click.stop="emit('togglesong', item)">
                    <v-icon v-if="!item.removed">mdi-delete</v-icon>
                    <v-icon v-else>mdi-undo-variant</v-icon>
                </v-btn>
            </template>

            <template v-slot:bottom v-if="addMode">
                <div v-if="canEdit" class="d-flex justify-end pa-1">
                    <v-btn :disabled="selectedSongs.length === 0" variant="flat" class="mr-2"
                        @click="emit('add', selectedSongs)">
                        AGGIUNGI
                    </v-btn>
                    <v-btn variant="flat" @click="emit('cancel')">ANNULLA</v-btn>
                </div>
            </template>
        </v-data-table>
    </div>
</template>

<style scoped>
.line-through {
    text-decoration: line-through;
}

.drag-handle {
    cursor: grab;
    user-select: none;
}

.drag-handle:active {
    cursor: grabbing;
}

.data-height-search {
    height: calc(100vh - 200px);
}

.data-height-no-search {
    height: calc(100vh - 160px);
}

.position-cell {
    display: flex;
    align-items: center;
}
</style>
