# msw-tools

Msw-tools（Mock Service Worker Tools） is an interface data mock tool for local development and testing based on Msw.js and Svelte

## Features

- **无框架限制：** 使用 Svelte 独立封装的 Custom Web Components，像使用 Div 一样无感使用。
- **无侵入性：** 根据开发环境动态加载，与业务功能代码无依赖、无耦合、无关联。
- **配置范围广：** 个性化配置 Mock 接口，Response Data、Status code、Request Pending Time。
- **控制粒度细：** 可以精确控制到每一个数据接口是否使用 Mock。
- **操作友好性：** 一键编辑，数据格式化，一键配置，即刻生效。
- **数据便捷性：** Mock 数据支持以 JSON 文件的形式一键导入，一键导出。

## Getting started

### Method 1: Using npm：(Recommended)

- install `msw-tools` 和 `msw`

```shell
npm install -D msw-tools

npm install -D msw
```

- install `mockServiceWorker.js`。每个脚手架生成的项目，静态文件目录可能不同，具体请参考：[Common public directories](https://mswjs.io/docs/getting-started/integrate/browser#where-is-my-public-directory "Common public directories")

```shell
npx msw init public/ --save
```

### Method 2: Using CDN in HTML:

```html
<body>
  <msw-tools base="/"></msw-tools>

  <script src="https://unpkg.com/msw-tools@latest/dist/msw-tools.min.umd.js"></script>
</body>
```

## Example

以 **Vue3** 为例：

1. 在入口文件 `main.js` 中根据环境来动态加载

```js
// main.js

import { createApp } from "vue";
import router from "./router";
import store from "./store";
import App from "./App.vue";
import "./assets/css/style.scss";

const app = createApp(App);

app.use(router).use(store);
app.mount("#app");

if (process.env.NODE_ENV === "development") {
  const MswTools = require("msw-tools");
  MswTools();
}
```

2. 在根组件 `App.vue` 中使用 `<msw-tools />` 导入

```html
<template>
  <msw-tools v-if="isDev" />

  <router-view />
</template>

<script setup>
  import { ref } from "vue";

  const isDev = ref(process.env.NODE_ENV === "development");
</script>
```

## Tools Demo

![Msw-Tools](https://tiven.cn/assets/img/msw-tools-demos.gif "msw-tools")

## Feedback

- **email：** [tw.email@qq.com](mailto:tw.email@qq.com "天问eMail | msw-tools")
- **Issues：** [msw-tools](https://github.com/tive6/msw-tools/issues "Issues | msw-tools")

## License

The MIT License
