<template>
  <footer class="bg-white">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="mb-4 md:mb-0">
          <div class="flex items-center">
            <span class="text-primary-600 text-lg font-bold">Mental Wellness</span>
          </div>
          <p class="text-sm text-neutral-500 mt-1">
            Supporting your mental health journey
          </p>
        </div>
        
        <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
          <div>
            <h3 class="text-sm font-semibold text-neutral-700 tracking-wider uppercase mb-2">
              Resources
            </h3>
            <ul class="space-y-2">
              <li>
                <a href="https://www.nimh.nih.gov/" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-500 hover:text-primary-600">
                  National Institute of Mental Health
                </a>
              </li>
              <li>
                <a href="https://www.samhsa.gov/" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-500 hover:text-primary-600">
                  SAMHSA
                </a>
              </li>
              <li>
                <a href="https://www.nami.org/" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-500 hover:text-primary-600">
                  National Alliance on Mental Illness
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 class="text-sm font-semibold text-neutral-700 tracking-wider uppercase mb-2">
              Crisis Support
            </h3>
            <ul class="space-y-2">
              <li>
                <a href="tel:988" class="text-sm text-neutral-500 hover:text-primary-600">
                  988 Suicide & Crisis Lifeline
                </a>
              </li>
              <li>
                <a href="https://www.crisistextline.org/" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-500 hover:text-primary-600">
                  Crisis Text Line: Text HOME to 741741
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 class="text-sm font-semibold text-neutral-700 tracking-wider uppercase mb-2">
              Legal
            </h3>
            <ul class="space-y-2">
              <li>
                <a href="#" class="text-sm text-neutral-500 hover:text-primary-600">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" class="text-sm text-neutral-500 hover:text-primary-600">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="mt-8 border-t border-neutral-200 pt-6">
        <p class="text-sm text-neutral-500 text-center">
          &copy; {{ currentYear }} Mental Wellness. All rights reserved.
        </p>
        <p class="text-xs text-neutral-400 text-center mt-2">
          This application is not a substitute for professional mental health care. If you're in crisis, please contact emergency services or a mental health professional.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

// Computed properties
const currentYear = computed(() => new Date().getFullYear())
</script>
