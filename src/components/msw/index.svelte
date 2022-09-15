<svelte:options tag="msw-tool" />

<div class="msw-container">
  <div on:click={showModal} class="msw-show">MSW</div>

  {#if show }
    <div transition:fade="{{delay: 200, duration: 200}}"
         on:click|stopPropagation={()=>show=false}
         class="msw-mask"></div>
    <div transition:slide="{{delay: 250, duration: 300, easing: quintOut }}"
       class="msw-box">
    <h2 on:click={getData} class="msw-title">
      开发者控制台
      <div on:click|stopPropagation={closeModal} class="msw-close">X</div>
    </h2>
    <div class="msw-tabs">
      <div class="msw-tabs-head">
        <div class="msw-tabs-inner">
          { #each tabs as { name, code }, index (code)}
            <div class="msw-tabs-item {code===currentTab ? 'active' : ''}"
                 on:click={tabChange.bind(null, code)}>{name}</div>
          {/each}
        </div>
        <div class="msw-tabs-handle">
          <a on:click={resetHandlers} href="javascript:" class="msw-reset">配 置</a>
        </div>
      </div>
      <div class="msw-tabs-body">
        { #if currentTab === '01' }
          <div class="msw-tabs-wrap">
            <div class="msw-handle-wrap">
              <div class="msw-handle-li">
                <a href="javascript:" on:click={clearData}
                   class="msw-handle-clear">清除数据库</a>
                <label class="msw-handle-li-global">
                  <input type=checkbox
                         on:change={()=>changeStatusGlobal()}
                         bind:checked={globalStatus}>
                  全局开启
                </label>
              </div>
              <div class="msw-handle-li">
                <div class="msw-handle-label">请求最短时间(ms)</div>
                <input bind:value={reqTimes} on:focusout={inputChange.bind(null, 'time')} 
                       type="text" class="msw-handle-input" placeholder="默认 1000 ">
              </div>
              <div class="msw-handle-li">
                <div class="msw-handle-label">请求失败比例(%)</div>
                <input bind:value={failRatio} on:focusout={inputChange.bind(null, 'fail')} 
                       type="text" class="msw-handle-input" placeholder="默认 0 ">
              </div>
            </div>
          </div>
        {/if}
        { #if currentTab === '02' }
          <div class="msw-tabs-wrap">
            <div class="msw-config">
              <select bind:value={reqMethod} class="msw-method" name="method">
                {#each rests as {value, label} (value)}
                  <option value={value}>{label}</option>
                {/each}
              </select>
              <input bind:value={reqUrl} type="text" class="msw-config-input"
                     placeholder="/paths">
              <a href="javascript:" on:click={add} class="msw-config-add">添 加</a>
            </div>
            <textarea bind:value={mockData} class="msw-config-data"
                      placeholder="Mock数据内容"
                      cols="100" rows="30"></textarea>
            {#if mockErr}
              <div class="msw-config-tips">{errMsg}</div>
            {/if}
          </div>
        {/if}
        { #if currentTab === '03' }
          <div class="msw-tabs-wrap table-list">
            <table border="1" class="msw-list">
              <thead>
              <tr>
                <th>Index</th>
                <th>ID</th>
                <th>Url</th>
                <th>Method</th>
                <th>Data</th>
                <th>Date</th>
                <th>
                  <label>
                    <input type=checkbox
                           on:change={()=>changeStatusAll()}
                           bind:checked={allStatus}>
                    Status
                  </label>
                </th>
                <th>Handle</th>
              </tr>
              </thead>
              <tbody>
              {#each list as item, index (item.id) }
              <tr>
                <td>{index+1}</td>
                <td>{item.id}</td>
                <td>{item.url}</td>
                <td>{item.method}</td>
                <td>{item.data}</td>
                <td>{item.date}</td>
                <td>
                  <label>
                    <input type=checkbox
                           on:change={()=>changeStatus({...item, index})}
                           bind:checked={item.checked}>
                    开启
                  </label>
                </td>
                <td>
                  <a on:click={del.bind(null, {...item, index})} href="javascript:" class="msw-list-del">删除</a>
                </td>
              </tr>
              {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  </div>
  {/if}
</div>

<script>
  import { onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { getList } from '../../msw/helper'
  import { mocker } from '../../msw/browser.js'
  import { tabs, rests } from './config.js'
  import {
    MSW_LIST_KEY,
    MSW_ALL_STATUS,
    MSW_GLOBAL_STATUS,
    MSW_REQUEST_TIME,
    MSW_REQUEST_FAIL_RATIO,
  } from '../../common/keys'
  
  export let base = ''
  // console.log('baseUrl', base)
  // $: valueChanged(base);
  // function valueChanged(newValue) {
  //   console.log("value changed", newValue);
  // }

  let isProd = import.meta.env.PROD
  console.log('[ENV]', isProd)

  let show = false
  let currentTab = "01";
  let reqTimes = localStorage.getItem(MSW_REQUEST_TIME) || 1000
  let failRatio = localStorage.getItem(MSW_REQUEST_FAIL_RATIO) || 0
  let reqMethod = 'All'
  let reqUrl = ''
  let mockData = JSON.stringify({
    code: 0,
    msg: "OK",
    data: 1,
  }, null, 2)
  let mockErr = false
  let errMsg = ''
  let list = getLocalList()
  let globalStatus = localStorage.getItem(MSW_GLOBAL_STATUS) === '1'
  let allStatus = localStorage.getItem(MSW_ALL_STATUS) === '1'
  let urlPatt = /^[/]\S{1,}/

  onMount(async ()=>{
    console.log('[baseUrl]', base)
    init()

    if (isProd) {
      mocker.start({
        // 对于没有 mock 的接口直接通过，避免异常
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          // Points to the custom location of the Service Worker file.
          // url: 'http://localhost:1234/mockServiceWorker.js',
          options: {
            // Narrow the scope of the Service Worker to intercept requests
            // only from pages under this path.
            scope: base || '/',
          },
        },
      })
    }

  })

  function init() {
    let status = localStorage.getItem(MSW_GLOBAL_STATUS)
    if (!status) {
      localStorage.setItem(MSW_GLOBAL_STATUS, '1')
      globalStatus = true
    }
  }

  function getData() {
    fetch('/login').then(res=>{
      return res.json()
    }).then(res=>{
      console.log(res)
    })
  }

  function showModal() {
    show = true
  }

  function closeModal() {
    show = false
    resetHandlers()
  }

  function tabChange (code) {
    if (code === currentTab) return;
    currentTab = code;
  }

  function resetHandlers() {
    mocker.resetHandlers(...getList())
    mocker.printHandlers()
    mocker.restoreHandlers()
    mocker.listHandlers()
  }

  function clearData () {
    if (confirm('确认要清空本地数据？')) {
      localStorage.removeItem(MSW_LIST_KEY)
      list = []
    }
  }

  function changeStatusGlobal() {
    globalStatus = !globalStatus
    localStorage.setItem(MSW_GLOBAL_STATUS, `${+globalStatus}`)
    resetHandlers()
  }

  function inputChange(type) {
    if (type==='time') {
      localStorage.setItem(MSW_REQUEST_TIME, reqTimes)
    }
    if (type==='fail') {
      localStorage.setItem(MSW_REQUEST_FAIL_RATIO, failRatio)
    }
  }

  function getLocalList() {
    let str = localStorage.getItem(MSW_LIST_KEY) || '[]'
    return JSON.parse(str)
  }

  function setLocalList() {
    localStorage.setItem(MSW_LIST_KEY, JSON.stringify(list))
  }

  function add() {
    let url = reqUrl.trim()
    let data = {
      url,
      method: reqMethod,
      data: mockData,
      id: uuid(),
      date: new Date().toLocaleString(),
      checked: true,
    }

    if (!urlPatt.test(url)) {
      mockErr = true
      errMsg = `【url输入不正确】 url必须以"/"开始，不能为空""或"/"`
      return
    }
    
    try {
      let json = JSON.parse(mockData)
      console.log(json)
    } catch (err) {
      mockErr = true
      errMsg = `【Mock数据JSON格式异常】 ${err}`
      return
    }

    let res = list.find(item=>item.url===url)

    if (res) {
      mockErr = true
      errMsg = `【url已存在】 url本地列表已存在，不能重复添加`
      return;
    }

    mockErr = false
    list = [
      data,
      ...getLocalList()
    ]
    setLocalList()
  }
  
  function del({ id, index }) {
    list.splice(index, 1)
    list = [
      ...list
    ]
    setLocalList()
  }
  
  function changeStatus(item) {
    let { index, checked } = item
    list[index].checked = !checked
    setLocalList()
  }

  function changeStatusAll() {
    allStatus = !allStatus
    localStorage.setItem(MSW_ALL_STATUS, `${+allStatus}`)
    list = list.map(item=>{
      return {
        ...item,
        checked: allStatus,
      }
    })
    setLocalList()
  }

  function uuid() {
    return Math.random().toString(36).slice(4, 10)
  }

</script>

<style lang="scss">
    * {
        padding: 0;
        margin: 0;
        box-sizing: border-box;
    }

    a {
        font-style: normal;
        text-decoration: none;
        color: #333;
    }

    input,
    textarea {
        outline: none;
        border: 1px solid #999;
        text-indent: 10px;
    }

    input::placeholder,
    textarea::placeholder {
        color: palevioletred;
    }

    label {
        cursor: pointer;
    }

    .msw-container {
        width: 100%;
        //width: 100vw;
        //height: 100vh;
        //background-color: #eee;
        text-align: left;
        //padding: 15px;
    }

    .msw-show {
        position: fixed;
        right: 50px;
        bottom: 50px;
        z-index: 9999;
        padding: 5px 15px;
        background-color: #07c160;
        color: #fff;
        border-radius: 4px;
        font-size: 14px;
        box-shadow: 0 0 10px rgb(0 0 0 / 40%);
        cursor: pointer;
    }

    .msw-mask {
        //width: 100%;
        //height: 100%;
        width: 100vw;
        height: 100vh;
        position: fixed;
        right: 0;
        bottom: 0;
        z-index: 8888;
        background-color: rgba(0, 0, 0, 0.6);
    }

    .msw-box {
        position: fixed;
        left: 0;
        bottom: 0;
        z-index: 9999;
        width: 100%;
        height: 70vh;
        padding: 15px;
        background-color: #fff;
        //background-color: #f7f7f7;
    }

    .msw-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #666;
        font-size: 20px;
        font-weight: 400;
    }

    .msw-close {
        color: #333;
        cursor: pointer;
    }

    .msw-tabs-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 15px 0;
        padding-bottom: 5px;
        border-bottom: 1px solid #eee;
    }

    .msw-tabs-inner {
        display: flex;
        //margin: 15px 0;
    }

/*    .msw-tabs-handle {

    }*/

    .msw-reset {
        display: block;
        width: 80px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        //border: 1px solid #ddd;
        margin-left: 30px;
        background-color: #67c23a;
        color: #fff;
        border-radius: 3px;
    }

    .msw-reset:hover {
        background-color: #85ce61;
    }

    .msw-tabs-item {
        padding: 5px 10px;
        cursor: pointer;
        transition: all linear 200ms;
    }

    .msw-handle-clear {
        width: 100px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        //border: 1px solid #ddd;
        //margin-left: 30px;
        background-color: #e6a23c;
        color: #fff;
        border-radius: 3px;
    }

    .msw-handle-clear:hover {
        background-color: #ebb563;
    }

    .msw-tabs-item.active {
        background-color: pink;
    }

    .msw-handle-li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 15px;
    }

    .msw-handle-input {
        line-height: 30px;
    }

    .msw-config {
        display: flex;
        align-items: center;
    }

    .msw-method {
        width: 100px;
        height: 30px;
    }

    .msw-config-input {
        width: 200px;
        height: 30px;
        border: 1px solid #999;
        border-left: none;
        text-indent: 10px;
    }

    .msw-config-add {
        width: 80px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        //border: 1px solid #ddd;
        margin-left: 30px;
        background-color: #5787FF;
        color: #fff;
        border-radius: 3px;
    }

    .msw-config-add:hover {
        background-color: #5787ffe8;
    }

    .msw-config-data {
        min-width: 80%;
        max-width: 100%;
        max-height: 400px;
        margin-top: 15px;
        padding: 10px;
        text-indent: 0;
    }

    .msw-config-tips {
        color: #f56c6c;
        margin-top: 10px;
    }

    .table-list {
        height: calc(70vh - 130px);
        //min-height: 300px;
        //max-height: 50vh;
        overflow-y: auto;
    }


    .msw-list {
        width: 100%;
        border-color: #ddd;
        border-collapse: collapse;
    }

    .msw-list th {
        background-color: #f0f9eb;
    }

    .msw-list th:nth-child(1) {
        width: 55px;
    }
    .msw-list th:nth-child(2) {
        width: 68px;
    }
    .msw-list th:nth-child(4) {
        width: 72px;
    }
    .msw-list th:nth-child(6) ,
    .msw-list th:nth-child(7) ,
    .msw-list th:nth-child(8) {
        width: 80px;
    }

    .msw-list th,
    .msw-list td {
        padding: 5px;
    }

    .msw-list-del {
        color: #409eff;
    }

    .msw-handle-li-global {
        color: #409eff;
    }
</style>