<template>
  <div>
    <!-- Hero section -->
    <section class="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Mental Wellness Journey Starts Here
            </h1>
            <p class="text-xl text-white/90 mb-8">
              Connect with our AI therapist for support, track your mood, journal your thoughts, and set mental health goals - all in one secure platform.
            </p>
            <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <router-link to="/register" class="btn bg-white text-primary-700 hover:bg-primary-50 focus:ring-white">
                Get Started
              </router-link>
              <router-link to="/login" class="btn bg-transparent border border-white text-white hover:bg-white/10 focus:ring-white">
                Sign In
              </router-link>
            </div>
          </div>
          <div class="hidden md:block">
            <img src="@/assets/images/mental-health.png" alt="Mental wellness illustration" class="w-full max-w-md mx-auto">
          </div>
        </div>
      </div>
    </section>

    <!-- Features section -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-neutral-900">Features Designed for Your Well-being</h2>
          <p class="mt-4 text-lg text-neutral-600 max-w-3xl mx-auto">
            Our platform offers a comprehensive suite of tools to support your mental health journey.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- AI Therapy feature -->
          <div class="bg-neutral-50 rounded-xl p-6 shadow-soft">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">AI Therapy</h3>
            <p class="text-neutral-600">
              Chat with our AI therapist for support, guidance, and coping strategies whenever you need it, day or night.
            </p>
          </div>

          <!-- Mood Tracking feature -->
          <div class="bg-neutral-50 rounded-xl p-6 shadow-soft">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">Mood Tracking</h3>
            <p class="text-neutral-600">
              Track your mood over time to identify patterns and gain insights into your emotional well-being.
            </p>
          </div>

          <!-- Journaling feature -->
          <div class="bg-neutral-50 rounded-xl p-6 shadow-soft">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">Journaling</h3>
            <p class="text-neutral-600">
              Express your thoughts and feelings in a private journal, with the option to share entries with your AI therapist.
            </p>
          </div>

          <!-- Goal Setting feature -->
          <div class="bg-neutral-50 rounded-xl p-6 shadow-soft">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">Goal Setting</h3>
            <p class="text-neutral-600">
              Set and track mental health goals to build positive habits and measure your progress over time.
            </p>
          </div>

          <!-- Resources feature -->
          <div class="bg-neutral-50 rounded-xl p-6 shadow-soft">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">Resources</h3>
            <p class="text-neutral-600">
              Access a curated collection of articles, videos, and exercises to support your mental wellness journey.
            </p>
          </div>

          <!-- Secure & Private feature -->
          <div class="bg-neutral-50 rounded-xl p-6 shadow-soft">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">Secure & Private</h3>
            <p class="text-neutral-600">
              Your data is encrypted and protected, ensuring your personal information and conversations remain private.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works section -->
    <section class="py-16 bg-neutral-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-neutral-900">How It Works</h2>
          <p class="mt-4 text-lg text-neutral-600 max-w-3xl mx-auto">
            Getting started with Mental Wellness is simple and straightforward.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Step 1 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-primary-600">1</span>
            </div>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">Create an Account</h3>
            <p class="text-neutral-600">
              Sign up with your email or Google account to create your secure personal profile.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-primary-600">2</span>
            </div>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">Explore the Platform</h3>
            <p class="text-neutral-600">
              Discover the various tools and resources available to support your mental wellness journey.
            </p>
          </div>

          <!-- Step 3 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-primary-600">3</span>
            </div>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">Start Your Journey</h3>
            <p class="text-neutral-600">
              Begin chatting with the AI therapist, tracking your mood, journaling, and setting goals for your well-being.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials section -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-neutral-900">What Our Users Say</h2>
          <p class="mt-4 text-lg text-neutral-600 max-w-3xl mx-auto">
            Hear from people who have experienced the benefits of our mental wellness platform.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Testimonial 1 -->
          <div class="bg-neutral-50 rounded-xl p-6 shadow-soft">
            <div class="flex items-center mb-4">
              <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                JD
              </div>
              <div class="ml-3">
                <h4 class="text-lg font-semibold text-neutral-900">Jane D.</h4>
                <p class="text-sm text-neutral-500">User for 6 months</p>
              </div>
            </div>
            <p class="text-neutral-600 italic">
              "The AI therapist has been incredibly helpful during my anxiety episodes. Being able to chat at any time of day has made a huge difference in my life."
            </p>
          </div>

          <!-- Testimonial 2 -->
          <div class="bg-neutral-50 rounded-xl p-6 shadow-soft">
            <div class="flex items-center mb-4">
              <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                MS
              </div>
              <div class="ml-3">
                <h4 class="text-lg font-semibold text-neutral-900">Michael S.</h4>
                <p class="text-sm text-neutral-500">User for 3 months</p>
              </div>
            </div>
            <p class="text-neutral-600 italic">
              "The mood tracking feature has helped me identify patterns in my emotions that I never noticed before. Now I can take proactive steps to manage my mental health."
            </p>
          </div>

          <!-- Testimonial 3 -->
          <div class="bg-neutral-50 rounded-xl p-6 shadow-soft">
            <div class="flex items-center mb-4">
              <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                LT
              </div>
              <div class="ml-3">
                <h4 class="text-lg font-semibold text-neutral-900">Lisa T.</h4>
                <p class="text-sm text-neutral-500">User for 1 year</p>
              </div>
            </div>
            <p class="text-neutral-600 italic">
              "The journaling feature has become an essential part of my daily routine. Being able to reflect on my thoughts and see my progress over time is incredibly rewarding."
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA section -->
    <section class="py-16 bg-primary-600 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">Ready to Start Your Mental Wellness Journey?</h2>
        <p class="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
          Join thousands of users who are taking control of their mental health with our comprehensive platform.
        </p>
        <div class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <router-link to="/register" class="btn bg-white text-primary-700 hover:bg-primary-50 focus:ring-white">
            Get Started
          </router-link>
          <router-link to="/login" class="btn bg-transparent border border-white text-white hover:bg-white/10 focus:ring-white">
            Sign In
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// No additional script needed for this component
</script>
