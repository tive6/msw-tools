import { rest } from 'msw'
import {
  MSW_LIST_KEY,
  MSW_ALL_STATUS,
  MSW_GLOBAL_STATUS,
  MSW_REQUEST_TIME,
  MSW_REQUEST_FAIL_RATIO,
  MSW_RESPONSE_STATUS_CODE,
} from '../common/keys'

function getStatus(failRatio) {
  return Math.random() * 100 > failRatio ? 200 : 500
}

export function getList(arr) {
  let local = localStorage.getItem(MSW_LIST_KEY)
  let list = (local && JSON.parse(local)) || []
  arr = arr || list
  // arr = arr.filter((item) => item.checked)
  // console.log(arr);

  if (localStorage.getItem(MSW_GLOBAL_STATUS) !== '1' || !arr.length) return []
  // localStorage.setItem(MSW_LIST_KEY, JSON.stringify(arr));

  let reqTimes = localStorage.getItem(MSW_REQUEST_TIME) || 1000
  let failRatio = localStorage.getItem(MSW_REQUEST_FAIL_RATIO) || 0
  failRatio = +failRatio > 100 ? 100 : failRatio
  let reqStatus = getStatus(failRatio)
  console.log('[Status Code]', reqStatus)
  localStorage.setItem(MSW_RESPONSE_STATUS_CODE, reqStatus)

  // console.log(`[status] ${reqStatus}  [delay] ${reqTimes}`);

  let reqList = arr.map((item) => {
    return rest.all(item.url, (req, res, ctx) => {
      let commonRes = [
        ctx.set('Content-Type', 'application/json'),
        ctx.status(reqStatus),
        ctx.delay(+reqTimes),
      ]
      if (reqStatus === 200) {
        return res(...commonRes, ctx.json(JSON.parse(item.data)))
      }
      if (reqStatus === 500) {
        return res(
          ...commonRes,
          ctx.json({
            code: -1,
            msg: 'error',
          })
        )
      }
    })
  })

  // console.log(reqList);
  return reqList
}

export function jsonDownload(json) {
  let data = JSON.stringify(json, null, 4)
  let blob = new Blob([data], { type: 'text/json;charset=utf-8' })
  let link = window.URL.createObjectURL(blob)
  let a = document.createElement('a')
  a.href = link
  a.download = `msw-tools-json-data-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(link)
}

export function fileToJson(file) {
  return new Promise((resolve, reject) => {
    // let blob = new Blob([file], {type:"application/json"})
    // console.log(blob)
    let fileReader = new FileReader()
    fileReader.readAsText(file, 'utf-8')
    fileReader.onload = function (e) {
      // console.log(e)
      let { result } = fileReader
      if (result) {
        resolve(result)
      } else {
        reject()
      }
    }
  })
}
