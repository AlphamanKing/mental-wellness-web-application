<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gray-50">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-indigo-600">404</h1>
      <h2 class="text-3xl font-semibold text-gray-800 mt-4 mb-6">Page Not Found</h2>
      <p class="text-gray-600 mb-8 max-w-md mx-auto">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <router-link 
        to="/" 
        class="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
      >
        Go Home
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView'
}
</script>
