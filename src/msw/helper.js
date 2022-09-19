import { rest } from "msw";
import {
  MSW_LIST_KEY,
  MSW_ALL_STATUS,
  MSW_GLOBAL_STATUS,
  MSW_REQUEST_TIME,
  MSW_REQUEST_FAIL_RATIO,
} from "../common/keys";

function getStatus(failRatio) {
  return Math.random() * 100 > failRatio ? 200 : 500;
}

export function getList(arr) {
  let local = localStorage.getItem(MSW_LIST_KEY);
  let list = (local && JSON.parse(local)) || [];
  arr = arr || list;
  arr = arr.filter((item) => item.checked);

  console.log(arr);

  if (localStorage.getItem(MSW_GLOBAL_STATUS) !== "1" || !arr.length) return [];
  // localStorage.setItem(MSW_LIST_KEY, JSON.stringify(arr));

  let reqTimes = localStorage.getItem(MSW_REQUEST_TIME) || 1000;
  let failRatio = localStorage.getItem(MSW_REQUEST_FAIL_RATIO) || 0;
  let reqStatus = getStatus(failRatio);

  console.log(`[status] ${reqStatus}  [delay] ${reqTimes}`);

  let reqList = arr.map((item) => {
    return rest.all(item.url, (req, res, ctx) => {
      let commonRes = [
        ctx.set("Content-Type", "application/json"),
        ctx.status(reqStatus),
        ctx.delay(+reqTimes),
      ];
      if (reqStatus === 200) {
        return res(...commonRes, ctx.json(JSON.parse(item.data)));
      }
      if (reqStatus === 500) {
        return res(
          ...commonRes,
          ctx.json({
            code: -1,
            msg: "error",
          })
        );
      }
    });
  });

  console.log(reqList);

  return reqList;
}
