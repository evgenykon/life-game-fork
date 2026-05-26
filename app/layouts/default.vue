<script setup lang="ts">
import { Navbar, Header } from "effus-ui"
</script>

<template>
  <div class="min-h-screen bg-background">
    <Navbar fixed>
      <Header :level="3" as="div">Life Game</Header>
    </Navbar>

    <div class="mx-auto max-w-7xl px-4 pt-16 pb-8">
      <slot />
    </div>

    <footer class="border-t border-border py-4 text-center text-sm text-muted-foreground">
      Life Game
    </footer>
  </div>
</template>
