# msw-tools

**`Msw-Tools`（Mock Service Worker Tools）是一个基于 `Msw.js` 和 `Svelte` 构建的数据 Mock 工具，用于前后端接口数据联调，方便开发者在不同数据、不同场景下进行功能测试。**

Mock Service Worker Tools (MSW-Tools) is a data Mock tool built based on MSW.JS and Svelte. It is used for data linkage between front and back end interfaces, facilitating developers to perform functional tests in different data and scenarios.

## What can do ?

- **`Msw-Tools` 能做什么？**
- **`Msw-Tools` 能做什么？**
- **`Msw-Tools` 能做什么？**

**`Msw-Tools` 以浏览器 `localStorage` 为`数据库`，能让开发者分布式的在浏览器上建立一套独立的接口服务，前端人员在不依赖后端接口完成的情况下走正常的开发调试流程，开发者可以很精确自由的控制哪些接口使用 `Msw-Tools` 提供的本地 `Mock` 数据服务，哪些接口使用后端提供的接口数据服务。** 再也不用担心加班熬夜调接口了，摸鱼什么的统统到碗里来 `^_^`。

## Features

- **无框架限制：** 使用 `Svelte` 独立封装的 `Custom Web Components`，像使用 `div、span` 等原生标签一样无感使用，不管是 **Vue2/Vue3、React、Angular、Svelte、SolidJs** 等流行框架，还是传统的多页面 **HTML、JQuery、JSP、PHP** 都可以轻松集成。
- **无侵入性：** 根据开发环境动态加载，与业务功能代码无依赖、无耦合、无关联。
- **配置范围广：** 个性化配置 Mock 接口，Response Data、Status Code、Request Pending Time。
- **控制粒度细：** 可以精确控制到每一个数据接口是否使用 Mock。
- **操作友好性：** 一键编辑，数据格式化，一键配置，即刻生效。
- **数据便捷性：** Mock 数据支持以 JSON 文件的形式一键导入，一键导出。

## Online demo

- 立即体验：[msw-tools demo](https://tiven.cn/service/demos/msw-tools "msw-tools online demo")
- 工具介绍：[msw-tools blog](https://tiven.cn/p/a0368a1d/ "msw-tools | 天问博客-专注于大前端技术")

![Msw-Tools](https://tiven.cn/assets/img/msw-tools-demos.gif "msw-tools")

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

以 **Vue3** 项目为例：

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
  new MswTools();
}
```

2. 在根组件 `App.vue` 中使用 `<msw-tools />` 导入

```html
<template>
  <msw-tools base="/" v-if="isDev" />

  <router-view />
</template>

<script setup>
  import { ref } from "vue";

  const isDev = ref(process.env.NODE_ENV === "development");
</script>
```

## Options

**base**：开发或生产环境服务的公共基础路径。

- 类型： `string`
- 默认： `/`

使用参照：

1. 访问 URL：`https://tiven.cn`， 对应的 Base：`/`， 使用 `<msw-tools base="/" />`。
2. 访问 URL：`https://tiven.cn/service/` ，对应的 Base：`/service/`，使用 `<msw-tools base="/service/" />`。

需要与打包工具和 **Router** 路由的 **base** 保持一致。请参考：

- **Vite** 的 `base` 配置：[Vite Base](https://cn.vitejs.dev/config/shared-options.html#base "Base | Vite")
- **Vue3** 的 `Router/base` 路由配置：[Vue3 Base](https://router.vuejs.org/zh/api/#createwebhistory "Vue3 | createWebHistory base")

## Reminder

1. `mockServiceWorker.js` 文件只能放在静态文件目录中（`/public`），作为 `Service Worker` 服务的注册文件，不参与打包编译，只能以 **相对路径** 的形式引用，不然 `Service Worker` 服务无法注册，会导致请求拦截不生效。
2. `service Worker` API 使用限制：只能在 **https（已安转证书）、localhost、127.0.0.1** 等服务下使用，否则控制台会出现 `[MSW] Mocking enabled (fallback mode)` 日志，也就是说 **http** 域名服务，包括本地 **IP** 服务，例如：`http://10.168.44.123:3000/` 等服务下不可用。

## TODO

- **Msw-Tools** 功能持续优化
- 开启控制台的按钮可拖拽移动
- 封装 **mswjs** 相关 API，减小打包体积
- 规划中...

## Feedback

- **Email：** [tw.email@qq.com](mailto:tw.email@qq.com "天问eMail | msw-tools")
- **Issues：** [msw-tools](https://github.com/tive6/msw-tools/issues "Issues | msw-tools")

欢迎广大 **Front-ender** 、**Tester** 体验使用，如有疑问或需求建议请到 [Github Issues](https://github.com/tive6/msw-tools/issues "Issues | msw-tools") 提出。
