<script setup>
import { onMounted, ref } from 'vue'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const apiUrl = `${apiBaseUrl}/items`
const books = ref([])
const colorMap = ref({})
const formName = ref('')
const editingId = ref(null)
const statusMessage = ref('Use this shelf to exercise the API while dreaming about books to read next.')
const loading = ref(false)

const palette = [
  'from-rose-500 via-fuchsia-500 to-orange-400',
  'from-emerald-500 via-teal-500 to-cyan-400',
  'from-indigo-500 via-blue-500 to-sky-400',
  'from-amber-500 via-orange-500 to-rose-400',
  'from-purple-500 via-violet-500 to-pink-400',
  'from-lime-500 via-green-500 to-emerald-400',
]

const pickColor = () => palette[Math.floor(Math.random() * palette.length)]

const assignColors = (items = []) => {
  items.forEach((item) => {
    if (!colorMap.value[item.id]) {
      colorMap.value[item.id] = pickColor()
    }
  })
}

const resetForm = () => {
  formName.value = ''
  editingId.value = null
}

const setMessage = (text) => {
  statusMessage.value = text
}

const fetchBooks = async () => {
  loading.value = true
  setMessage('Fetching your reading list...')
  try {
    const response = await fetch(apiUrl)
    if (!response.ok) throw new Error('Unable to load books')
    const data = await response.json()
    books.value = data
    assignColors(data)
    setMessage('Reading list refreshed. Ready for more stories!')
  } catch (error) {
    setMessage(error.message)
  } finally {
    loading.value = false
  }
}

const saveBook = async () => {
  if (!formName.value.trim()) {
    setMessage('Give the book a title before saving.')
    return
  }

  const payload = { name: formName.value.trim() }
  const isEditing = Boolean(editingId.value)
  const url = isEditing ? `${apiUrl}/${editingId.value}` : apiUrl
  const method = isEditing ? 'PATCH' : 'POST'

  setMessage(isEditing ? 'Updating that book note...' : 'Adding a new book to the shelf...')

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) throw new Error('Request failed. Check the API and try again.')

    const data = await response.json()

    if (!isEditing) {
      books.value.push(data)
      colorMap.value[data.id] = pickColor()
      setMessage(`"${data.name}" added. Keep the reading streak alive!`)
    } else {
      const index = books.value.findIndex((book) => book.id === editingId.value)
      if (index !== -1) books.value[index] = data
      setMessage('Book note updated. Turn the next page!')
    }
    resetForm()
  } catch (error) {
    setMessage(error.message)
  }
}

const startEdit = (book) => {
  editingId.value = book.id
  formName.value = book.name
  setMessage(`Editing "${book.name}". Make your changes and save.`)
}

const removeBook = async (id) => {
  setMessage('Sending this book back to the library...')
  try {
    const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
    if (!response.ok && response.status !== 204) {
      throw new Error('Could not remove the book. Is the API running?')
    }
    books.value = books.value.filter((book) => book.id !== id)
    delete colorMap.value[id]
    setMessage('Book removed. Shelf is a little lighter now.')
    if (editingId.value === id) resetForm()
  } catch (error) {
    setMessage(error.message)
  }
}

onMounted(fetchBooks)

console.log('API URL TEST:', import.meta.env.VITE_API_URL)
</script>

<template>
  <main class="min-h-screen pb-16 text-slate-100">
    <div class="mx-auto flex max-w-5xl flex-col gap-4 px-2 pt-6 sm:px-4 lg:px-8">
      <header
        class="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/60 p-6 shadow-2xl backdrop-blur"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.2em] text-slate-400">Reading room · API practice</p>
            <h1 class="mt-2 text-3xl font-semibold text-white sm:text-4xl">Book Track CRUD Test</h1>
            <p class="mt-3 max-w-2xl text-base text-slate-300">
              Add, edit, and remove titles to exercise your REST endpoints while keeping a cozy virtual shelf.
            </p>
          </div>
          <div class="rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            REST CRUD
          </div>
        </div>
      </header>

      <section class="rounded-2xl border border-white/10 bg-slate-900/50 p-4 shadow-xl backdrop-blur">
        <div class="flex items-center gap-3 text-sm text-slate-200">
          <span class="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
          <p>{{ statusMessage }}</p>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-white">
                {{ editingId ? 'Update a book note' : 'Add a book to the shelf' }}
              </h2>
              <p class="mt-1 text-sm text-slate-300">Add a title, then edit or delete to test your API.</p>
            </div>
            <button
              class="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white/40 hover:text-white"
              type="button"
              :disabled="loading"
              @click="fetchBooks"
            >
              {{ loading ? 'Refreshing...' : 'Refresh list' }}
            </button>
          </div>

          <form class="mt-6 space-y-5" @submit.prevent="saveBook">
            <label class="block space-y-2 text-sm font-medium text-slate-200">
              <span>Book title or note</span>
              <input
                v-model="formName"
                type="text"
                name="title"
                placeholder="E.g. The Night Library — start chapter 3"
                :disabled="loading"
                required
                class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-400 shadow-inner outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-70"
              />
            </label>
            <div class="flex flex-wrap gap-3">
              <button
                class="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50 disabled:opacity-70"
                type="submit"
                :disabled="loading"
              >
                {{ editingId ? 'Save changes' : 'Add book' }}
              </button>
              <button
                class="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/40 hover:text-white disabled:opacity-70"
                type="button"
                :disabled="!editingId || loading"
                @click="resetForm"
              >
                Cancel edit
              </button>
            </div>
          </form>
        </div>

        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-white">Reading list</h2>
              <p class="mt-1 text-sm text-slate-300">Tap edit or delete to exercise PATCH and DELETE requests.</p>
            </div>
            <span class="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-slate-200">
              {{ books.length }} item{{ books.length === 1 ? '' : 's' }}
            </span>
          </div>

          <ul class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" v-if="books.length">
            <li
              v-for="book in books"
              :key="book.id"
              class="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br p-5 text-white shadow-2xl transition hover:-translate-y-0.5 hover:shadow-3xl"
              :class="colorMap[book.id] || 'from-slate-700 via-slate-600 to-slate-700'"
            >
              <div class="space-y-2">
                <p class="text-lg font-semibold leading-tight">{{ book.name }}</p>
                <p class="text-xs uppercase tracking-[0.1em] text-white/80">ID: {{ book.id }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  class="inline-flex items-center justify-center rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/30 disabled:opacity-60"
                  type="button"
                  :disabled="loading"
                  @click="startEdit(book)"
                >
                  Edit
                </button>
                <button
                  class="inline-flex items-center justify-center rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/30 disabled:opacity-60"
                  type="button"
                  :disabled="loading"
                  @click="removeBook(book.id)"
                >
                  Delete
                </button>
              </div>
            </li>
          </ul>
          <p v-else class="mt-6 rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-sm text-slate-200">
            No books yet. Add one to start testing the API.
          </p>
        </div>
      </section>
    </div>
  </main>
</template>
