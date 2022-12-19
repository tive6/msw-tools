<style>
main {
  height: 3000px;
}
.top {
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.svelte:hover {
  filter: drop-shadow(0 0 2em #ff3e00aa);
}
</style>

<script>
import svelteLogo from './assets/svelte.svg'
import Msw from './components/msw/index.svelte'
</script>

<main>
  <div class="top">
    <div>
      <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
        <img src="/vite.svg" class="logo" alt="Vite Logo" />
      </a>
      <a href="https://svelte.dev" target="_blank" rel="noreferrer">
        <img src="{svelteLogo}" class="logo svelte" alt="Svelte Logo" />
      </a>
    </div>

    <h1>Vite + Svelte</h1>
  </div>

  <Msw />
</main>
