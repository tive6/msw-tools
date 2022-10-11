// import "./app.css";
import App from './App.svelte'
import { mocker } from './msw/browser'
console.log(mocker)

const app = new App({
  target: document.getElementById('app'),
})

mocker.start({
  // 对于没有 mock 的接口直接通过，避免异常
  onUnhandledRequest: 'bypass',
  serviceWorker: {
    // Points to the custom location of the Service Worker file.
    // url: 'http://localhost:1234/mockServiceWorker.js',
    options: {
      // Narrow the scope of the Service Worker to intercept requests
      // only from pages under this path.
      scope: '/',
    },
  },
})

mocker.events.on('request:start', (req) => {
  // console.log(req);
})

mocker.events.on('request:end', (req) => {
  // console.log(req);
  console.log('%s %s ended', req.method, req.url.href)
  // mocker.printHandlers();
  // mocker.restoreHandlers();
  // mocker.listHandlers();
})

export default app
