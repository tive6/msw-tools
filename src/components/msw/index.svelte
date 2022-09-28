<svelte:options tag="msw-tools" />

<div class="msw-container">
  <div on:click={showModal} class="msw-show">MSW</div>

  {#if show }
    <div transition:fade="{{delay: 200, duration: 200}}"
         on:click|stopPropagation={closeModal}
         class="msw-mask"></div>
    <div transition:slide="{{delay: 250, duration: 300, easing: quintOut }}"
         class="msw-box">
      <h2 class="msw-title">
        MSW-TOOLS控制台
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
            <a on:click={resetHandlers} href={null} class="msw-reset">配 置</a>
          </div>
        </div>
        <div class="msw-tabs-body">
          { #if currentTab === '01' }
            <div class="msw-tabs-wrap">
              <div class="msw-handle-wrap">
                <div class="msw-handle-li">
                  <a href={null} on:click={clearData}
                     class="msw-handle-clear">清除数据库</a>
                  <label class="msw-handle-li-global">
                    <input type="checkbox"
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
                <div class="msw-handle-li">
                  <div class="msw-handle-label">当前状态码
                    <span class="status-code {+statusCode===200?'':'error'}">
                      [ {statusCode} ]
                    </span>
                  </div>
                </div>
                <div class="msw-handle-li">
                  <div class="msw-handle-label">Mock数据导入(json文件)</div>
                  <a on:click={fileTrigger} href={null} class="msw-handle-export">导 入</a>
                  <input bind:this={ fileObj } on:change={fileChange}
                         type="file" class="msw-handle-input"
                         style="display: none;"
                         accept=".json"
                         placeholder="选择文件">
                </div>
                <div class="msw-handle-li">
                  <div class="msw-handle-label">Mock数据导出(json文件)</div>
                  <a on:click={exportHandle} href={null} class="msw-handle-export">导 出</a>
                </div>
                {#if !isProd }
                  <div class="msw-handle-li">
                    <div on:click={getData} class="msw-handle-test">
                      ☞Fetch: [GET /test]☜
                    </div>
                  </div>
                {/if}
                {#if showMsg}
                  <div class="msw-config-tips {msgType==='error'?'error':'success'}">
                    {msgText}
                  </div>
                {/if}
              </div>
            </div>
          {/if}
          { #if currentTab === '02' }
            <div class="msw-tabs-wrap">
              <div class="msw-config">
                <select bind:value={reqMethod} class="msw-method" name="method">
                  {#each rests as { value, label } (value)}
                    <option value={value}>{label}</option>
                  {/each}
                </select>
                <input bind:value={reqUrl} type="text" class="msw-config-input"
                       placeholder="/paths">
                <a href={null} on:click={add} class="msw-config-add">
                  保 存
                </a>
              </div>
              <textarea bind:value={mockData} class="msw-config-data"
                        placeholder="Mock数据内容"
                        cols="100" rows="30"></textarea>
              {#if showMsg}
                <div class="msw-config-tips {msgType==='error'?'error':'success'}">
                  {msgText}
                </div>
              {/if}
            </div>
          {/if}
          { #if currentTab === '03' }
            <div class="msw-tabs-wrap table-list">
              <table border="1" class="msw-list">
                <thead>
                <tr>
                  <th>Index</th>
                  <!--                <th>ID</th>-->
                  <th>Url</th>
                  <th>Method</th>
                  <th>Data</th>
                  <!--                <th>Date</th>-->
                  <th>
                    <label>
                      <input type="checkbox"
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
                    <td>{index + 1}</td>
                    <!--                <td>{item.id}</td>-->
                    <td>{item.url}</td>
                    <td>{item.method}</td>
                    <td>
                      <!--                  <textarea value={JSON.stringify(JSON.parse(item.data), null, 2)}-->
                      <!--                            class="msw-list-data"-->
                      <!--                            placeholder="Mock数据"-->
                      <!--                            rows="8"></textarea>-->
                      <pre class="msw-list-data" contenteditable="true">
                    { JSON.stringify(JSON.parse(item.data), null, 2) }
                  </pre>
                    </td>
                    <!--                <td>{item.date}</td>-->
                    <td>
                      <label>
                        <input type="checkbox"
                               on:change={()=>changeStatus({...item, index})}
                               bind:checked={item.checked}>
                        开启
                      </label>
                    </td>
                    <td>
                      <a on:click={edit.bind(null, {...item, index})} href={null}
                         class="msw-list-btn edit">编辑</a>
                      <!--                  <br>-->
                      <a on:click={del.bind(null, {...item, index})} href={null} class="msw-list-btn del">删除</a>
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
  import { onMount } from "svelte";
  import { slide, fade } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { getList, jsonDownload, fileToJson } from "../../msw/helper";
  import { mocker } from "../../msw/browser.js";
  import { tabs, rests } from "./config.js";
  import {
    MSW_LIST_KEY,
    MSW_ALL_STATUS,
    MSW_GLOBAL_STATUS,
    MSW_REQUEST_TIME,
    MSW_REQUEST_FAIL_RATIO,
    MSW_RESPONSE_STATUS_CODE,
  } from "../../common/keys";

  export let base = "";
  // console.log('baseUrl', base)
  // $: valueChanged(base);
  // function valueChanged(newValue) {
  //   console.log("value changed", newValue);
  // }

  const defaultData = JSON.stringify({ code: 0, msg: "OK", data: 1 }, null, 2);

  let isProd = import.meta.env.PROD;
  console.log("[ENV]", isProd);

  let show = false;
  let currentTab = "01";
  let reqTimes = localStorage.getItem(MSW_REQUEST_TIME) || 1000;
  let failRatio = localStorage.getItem(MSW_REQUEST_FAIL_RATIO) || 0;
  let statusCode = 200;
  let reqMethod = "all";
  let reqUrl = "";
  let mockData = defaultData;
  let mockType = "";
  let mockIndex = 0;
  let showMsg = false;
  let msgText = "";
  let msgType = "error";
  let list = getLocalList();
  let globalStatus = localStorage.getItem(MSW_GLOBAL_STATUS) === "1";
  let allStatus = localStorage.getItem(MSW_ALL_STATUS) === "1";
  let urlPatt = /^[/]\S{1,}/;
  let fileObj = null;

  onMount(async () => {
    console.log("[baseUrl]", base);
    init();

    if (isProd) {
      let basePath = base || '/'
      mocker.start({
        // 对于没有 mock 的接口直接通过，避免异常
        onUnhandledRequest: "bypass",
        serviceWorker: {
          // Points to the custom location of the Service Worker file.
          // url: 'http://localhost:1234/mockServiceWorker.js',
          url: `${basePath}mockServiceWorker.js`,
          options: {
            // Narrow the scope of the Service Worker to intercept requests
            // only from pages under this path.
            scope: basePath
          }
        }
      });
    }

  });

  function init () {
    let status = localStorage.getItem(MSW_GLOBAL_STATUS);
    if (!status) {
      localStorage.setItem(MSW_GLOBAL_STATUS, "1");
      globalStatus = true;
    }
  }

  function getData () {
    fetch("/test").then(res => {
      return res.json();
    }).then(res => {
      console.log(res);
    });
  }

  function showModal () {
    show = true;
  }

  function closeModal () {
    show = false;
    resetHandlers();
  }

  function tabChange (code) {
    if (code === currentTab) return;
    currentTab = code;
    showMsg = false
  }

  function resetHandlers () {
    mocker.resetHandlers(...getList());
    mocker.printHandlers();
    mocker.restoreHandlers();
    mocker.listHandlers();
    statusCode = localStorage.getItem(MSW_RESPONSE_STATUS_CODE);
  }

  function clearData () {
    if (confirm("确认要清空本地数据？")) {
      localStorage.removeItem(MSW_LIST_KEY);
      list = [];
    }
  }

  function changeStatusGlobal () {
    globalStatus = !globalStatus;
    localStorage.setItem(MSW_GLOBAL_STATUS, `${+globalStatus}`);
    resetHandlers();
  }

  function inputChange (type) {
    if (type === "time") {
      localStorage.setItem(MSW_REQUEST_TIME, reqTimes);
    }
    if (type === "fail") {
      localStorage.setItem(MSW_REQUEST_FAIL_RATIO, failRatio);
    }
  }
  
  function fileChange(e) {
    let fileList = fileObj.files
    if (fileList.length>0) {
      let file = fileList[0]
      let { type } = file
      if (type==="application/json") {
        importHandle(file)
      } else {
        message({
          type: "error",
          msg: `【操作失败】 选取的不是json文件`
        });
      }
    } else {
      message({
        type: "error",
        msg: `【操作取消】 未选取文件`
      });
    }
  }
  
  function fileTrigger() {
    fileObj.click()
  }

  async function importHandle(file) {
    // console.log(file)
    try {
      let jsonStr = await fileToJson(file)
      let res = JSON.parse(jsonStr)
      // console.log(res)
      if (Array.isArray(res) && res.length) {
        if (list.length) {
          let urlList = list.map(item=>item.url)
          let lastList = res.filter(item=>!urlList.includes(item.url))
          list = [
            ...lastList,
            ...list,
          ]
        } else {
          list = [
            ...res
          ]
        }
        setLocalList();
        message({
          type: "success",
          msg: `【导入成功】`
        });
      }
    } catch (err) {
      console.log(err)
      message({
        type: "error",
        msg: `【导入失败】 ${err}`
      });
    }
  }

  function exportHandle() {
    jsonDownload(list)
  }

  function getLocalList () {
    let str = localStorage.getItem(MSW_LIST_KEY) || "[]";
    return JSON.parse(str);
  }

  function setLocalList () {
    localStorage.setItem(MSW_LIST_KEY, JSON.stringify(list));
  }

  function add () {
    let url = reqUrl.trim();
    let data = {
      url,
      method: reqMethod,
      data: mockData,
      id: uuid(),
      date: new Date().toLocaleString(),
      checked: true
    };

    if (!urlPatt.test(url)) {
      message({
        type: "error",
        msg: `【url输入不正确】 url必须以"/"开始，不能为空""或"/"`
      });
      return;
    }

    try {
      let json = JSON.parse(mockData);
      console.log(json);
    } catch (err) {
      message({
        type: "error",
        msg: `【Mock数据JSON格式异常】 ${err}`
      });
      return;
    }

    if (mockType === "edit") {
      let local = getLocalList();
      local[mockIndex] = {
        ...data
      };
      list = [
        ...local
      ];

      message({
        type: "success",
        msg: `【编辑成功】`
      });
      mockType = "";
    } else {
      let res = list.find(item => item.url === url);

      if (res) {
        message({
          type: "error",
          msg: `【url已存在】 url本地列表已存在，不能重复添加`
        });
        return;
      }

      list = [
        data,
        ...getLocalList()
      ];

      message({
        type: "success",
        msg: `【添加成功】`
      });
    }
    setLocalList();
    initParams();
  }

  function edit (item) {
    let {
      url,
      method,
      data,
      id,
      date,
      checked,
      index
    } = item;

    reqUrl = url;
    reqMethod = method;
    mockData = JSON.stringify(JSON.parse(data), null, 2);

    mockType = "edit";
    mockIndex = index;
    currentTab = "02";
  }

  function del ({ id, index }) {
    list.splice(index, 1);
    list = [
      ...list
    ];
    setLocalList();
  }

  function changeStatus (item) {
    let { index, checked } = item;
    list[index].checked = !checked;
    setLocalList();
  }

  function changeStatusAll () {
    allStatus = !allStatus;
    localStorage.setItem(MSW_ALL_STATUS, `${+allStatus}`);
    list = list.map(item => {
      return {
        ...item,
        checked: allStatus
      };
    });
    setLocalList();
  }

  function uuid () {
    return Math.random().toString(36).slice(4, 10);
  }

  function message ({ type, msg }) {
    msgType = type;
    msgText = msg;
    showMsg = true;
    let timer = setTimeout(() => {
      showMsg = false;
      clearTimeout(timer);
      timer = null;
    }, 2500);
  }

  function initParams () {
    reqUrl = "";
    mockData = defaultData;
    reqMethod = "all";
  }

</script>

<style lang="scss" type="text/scss">
  @import "index";
</style>