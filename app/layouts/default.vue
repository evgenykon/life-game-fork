<script setup lang="ts">
import { Navbar, Header } from "effus-ui"
</script>

<template>
  <div class="min-h-screen bg-background">
    <Navbar fixed>
      <Header :level="3" as="div">Life Game</Header>
    </Navbar>

    <div class="mx-auto grid max-w-7xl grid-cols-[4fr_1fr] gap-4 px-4 pt-16 pb-8">
      <main>
        <slot />
      </main>

      <aside class="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
        sidebar
      </aside>
    </div>

    <footer class="border-t border-border py-4 text-center text-sm text-muted-foreground">
      Life Game
    </footer>
  </div>
</template>
