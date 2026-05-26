<script setup lang="ts">
import { Navbar, Container, Header } from "effus-ui"
</script>

<template>
  <div class="min-h-screen bg-background">
    <Navbar fixed>
      <Header :level="3" as="div">Life Game</Header>
    </Navbar>

    <main class="pt-16">
      <Container>
        <slot />
      </Container>
    </main>
  </div>
</template>
