/**
 * 京喜财富岛只提交助力码版
 * 包含雇佣导游，建议每小时1次
 * cron: 0 * * * * jd_cfdtj.ts
 * 此版本暂定默认帮助HelloWorld，帮助助力池
 * export HELP_HW = true    // 帮助HelloWorld
 * export HELP_POOL = true  // 帮助助力池
 *
 * 使用jd_env_copy.js同步js环境变量到ts
 * 使用jd_ts_test.ts测试环境变量
 */

import axios from 'axios';
import {requireConfig, getBeanShareCode, getFarmShareCode, wait, requestAlgo, h5st, getJxToken, getRandomNumberByRange} from './TS_USER_AGENTS';
import {Md5} from 'ts-md5'
import * as dotenv from 'dotenv';

dotenv.config()
let cookie: string = '', res: any = '', shareCodes: string[] = [], shareCodesSelf: string[] = [], shareCodesHW: string[] = [], isCollector: Boolean = false, USER_AGENT = 'jdpingou;android;4.13.0;10;b21fede89fb4bc77;network/wifi;model/M2004J7AC;appBuild/17690;partner/xiaomi;;session/704;aid/b21fede89fb4bc77;oaid/dcb5f3e835497cc3;pap/JA2019_3111789;brand/Xiaomi;eu/8313831616035373;fv/7333732616631643;Mozilla/5.0 (Linux; Android 10; M2004J7AC Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.120 Mobile Safari/537.36', token: any = {};

interface Params {
  strBuildIndex?: string,
  ddwCostCoin?: number,
  taskId?: number,
  dwType?: string,
  configExtra?: string,
  strStoryId?: string,
  triggerType?: number,
  ddwTriggerDay?: number,
  ddwConsumeCoin?: number,
  dwIsFree?: number,
  ddwTaskId?: string,
  strShareId?: string,
  strMarkList?: string,
  dwSceneId?: string,
  strTypeCnt?: string,
  dwUserId?: number,
  ddwCoin?: number,
  ddwMoney?: number,
  dwPrizeLv?: number,
  dwPrizeType?: number,
  strPrizePool?: string,
  dwFirst?: any,
  dwIdentityType?: number,
  strBussKey?: string,
  strMyShareId?: string,
  ddwCount?: number,
  __t?: number,
  strBT?: string,
  dwCurStageEndCnt?: number,
  dwRewardType?: number,
  dwRubbishId?: number,
  strPgtimestamp?: number,
  strPhoneID?: string,
  strPgUUNum?: string,
  showAreaTaskFlag?: number,
  strVersion?: string,
  strIndex?: string
  strToken?: string
  dwGetType?: number,
  ddwSeaonStart?: number,
  size?: number,
  type?: number,
  strLT?: string,
}

let UserName: string, index: number;
!(async () => {
  await requestAlgo();
  let cookiesArr: any = await requireConfig();
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    UserName = decodeURIComponent(cookie.match(/pt_pin=([^;]*)/)![1])
    index = i + 1;
    console.log(`\n开始【京东账号${index}】${UserName}\n`);

    token = getJxToken(cookie)
    try {
      await makeShareCodes();
    } catch (e) {
      console.log(e)
    }





    // 签到 助力奖励
    res = await api('story/GetTakeAggrPage', '_cfd_t,bizCode,dwEnv,ptag,source,strZone')
    let employee: any = res.Data.Employee.EmployeeList.filter((e: any) => {
      return e.dwStatus === 0
    })
    for (let emp of employee) {
      let empRes: any = await api('story/helpdraw', '_cfd_t,bizCode,dwEnv,dwUserId,ptag,source,strZone', {dwUserId: emp.dwId})
      if (empRes.iRet === 0)
        console.log('助力奖励领取成功：', empRes.Data.ddwCoin)
      await wait(1000)
    }
    if (res.Data.Sign.dwTodayStatus === 0) {
      console.log('今日未签到')
      for (let sign of res.Data.Sign.SignList) {
        if (sign.dwDayId === res.Data.Sign.dwTodayId) {
          res = await api('story/RewardSign',
            '_cfd_t,bizCode,ddwCoin,ddwMoney,dwEnv,dwPrizeLv,dwPrizeType,ptag,source,strPgUUNum,strPgtimestamp,strPhoneID,strPrizePool,strZone',
            {
              ddwCoin: sign.ddwCoin,
              ddwMoney: sign.ddwMoney,
              dwPrizeLv: sign.dwBingoLevel,
              dwPrizeType: sign.dwPrizeType,
              strPrizePool: sign.strPrizePool,
              strPgtimestamp: token.strPgtimestamp,
              strPhoneID: token.strPhoneID,
              strPgUUNum: token.strPgUUNum
            })
          if (res.iRet === 0)
            console.log('签到成功：', res.Data.ddwCoin, res.Data.ddwMoney, res.Data.strPrizePool)
          else
            console.log('签到失败：', res)
          break
        }
      }
    } else {
      console.log('今日已经签到')
    }
    await wait(2000)


    // 任务➡️
    let tasks: any
    tasks = await api('story/GetActTask', '_cfd_t,bizCode,dwEnv,ptag,source,strZone')
    await wait(2000)
    for (let t of tasks.Data.TaskList) {
      if ([1, 2].indexOf(t.dwOrderId) > -1 && t.dwCompleteNum < t.dwTargetNum && t.strTaskName != '热气球接待20位游客') {
        console.log('开始任务➡️:', t.strTaskName)
        res = await api('DoTask', '_cfd_t,bizCode,configExtra,dwEnv,ptag,source,strZone,taskId', {taskId: t.ddwTaskId, configExtra: ''}, 'right')
        await wait(t.dwLookTime * 1000)
        if (res.ret === 0) {
          console.log('任务完成')
        } else {
          console.log('任务失败', res)
        }
      }
    }

    tasks = await api('story/GetActTask', '_cfd_t,bizCode,dwEnv,ptag,source,strZone')
    await wait(2000)
    for (let t of tasks.Data.TaskList) {
      if (t.dwCompleteNum === t.dwTargetNum && t.dwAwardStatus === 2) {
        res = await api('Award', '_cfd_t,bizCode,configExtra,dwEnv,ptag,source,strZone,taskId', {taskId: t.ddwTaskId}, 'right')
        await wait(1000)
        if (res.ret === 0) {
          console.log(`领奖成功:`, res)
        } else {
          console.log('领奖失败', res)
        }
      }
    }

    tasks = await api('story/GetActTask', '_cfd_t,bizCode,dwEnv,ptag,source,strZone')
    await wait(2000)
    if (tasks.Data.dwStatus === 3) {
      res = await api('story/ActTaskAward', '_cfd_t,bizCode,dwEnv,ptag,source,strZone')
      if (res.ret === 0) {
        console.log('100财富任务完成')
      }
    }
    await wait(2000)



  }
})()

function api(fn: string, stk: string, params: Params = {}, taskPosition = '') {
  return new Promise((resolve, reject) => {
    let url: string = '';
    if (['GetUserTaskStatusList', 'Award', 'DoTask'].includes(fn)) {
      let bizCode: string = taskPosition === 'right' ? 'jxbfddch' : 'jxbfd'
      url = `https://m.jingxi.com/newtasksys/newtasksys_front/${fn}?strZone=jxbfd&bizCode=${bizCode}&source=jxbfd&dwEnv=7&_cfd_t=${Date.now()}&ptag=&showAreaTaskFlag=0&_stk=${encodeURIComponent(stk)}&_ste=1&_=${Date.now()}&sceneval=2`
    } else {
      url = `https://m.jingxi.com/jxbfd/${fn}?strZone=jxbfd&bizCode=jxbfd&source=jxbfd&dwEnv=7&_cfd_t=${Date.now()}&ptag=&_ste=1&_=${Date.now()}&sceneval=2&_stk=${encodeURIComponent(stk)}`
    }
    url = h5st(url, stk, params, 10032)
    axios.get(url, {
      headers: {
        'Host': 'm.jingxi.com',
        'Referer': 'https://st.jingxi.com/',
        'User-Agent': USER_AGENT,
        'Cookie': cookie
      }
    }).then((res: any) => {
      resolve(res.data)
    }).catch(e => {
      reject(e)
    })
  })
}

async function task() {
  console.log('刷新任务列表')
  res = await api('GetUserTaskStatusList', '_cfd_t,bizCode,dwEnv,ptag,showAreaTaskFlag,source,strZone,taskId', {taskId: 0, showAreaTaskFlag: 0});
  await wait(2000)
  for (let t of res.data.userTaskStatusList) {
    if (t.awardStatus === 2 && t.completedTimes === t.targetTimes) {
      console.log('可领奖:', t.taskName)
      res = await api('Award', '_cfd_t,bizCode,dwEnv,ptag,source,strZone,taskId', {taskId: t.taskId})
      await wait(2000)
      if (res.ret === 0) {
        res = JSON.parse(res.data.prizeInfo)
        console.log(`领奖成功:`, res.ddwCoin, res.ddwMoney)
        await wait(1000)
        return 1
      } else {
        console.log('领奖失败:', res)
        return 0
      }
    }
    if (t.dateType === 2 && t.awardStatus === 2 && t.completedTimes < t.targetTimes && t.taskCaller === 1) {
      console.log('做任务:', t.taskId, t.taskName, t.completedTimes, t.targetTimes)
      res = await api('DoTask', '_cfd_t,bizCode,configExtra,dwEnv,ptag,source,strZone,taskId', {taskId: t.taskId, configExtra: ''})
      await wait(5000)
      if (res.ret === 0) {
        console.log('任务完成')
        return 1
      } else {
        console.log('任务失败')
        return 0
      }
    }
  }
  return 0
}

function makeShareCodes() {
  return new Promise<void>(async (resolve, reject) => {
    let bean: string = await getBeanShareCode(cookie)
    let farm: string = await getFarmShareCode(cookie)
    res = await api('user/QueryUserInfo', '_cfd_t,bizCode,ddwTaskId,dwEnv,ptag,source,strPgUUNum,strPgtimestamp,strPhoneID,strShareId,strVersion,strZone', {
      ddwTaskId: '',
      strShareId: '',
      strMarkList: 'undefined',
      strPgUUNum: token.strPgUUNum,
      strPgtimestamp: token.strPgtimestamp,
      strPhoneID: token.strPhoneID,
      strVersion: '1.0.1'
    })
    console.log('助力码:', res.strMyShareId)
    shareCodesSelf.push(res.strMyShareId)
    let pin: string = cookie.match(/pt_pin=([^;]*)/)![1]
    pin = Md5.hashStr(pin)
    axios.get(`https://api.jdsharecode.xyz/api/autoInsert/jxcfd?sharecode=${res.strMyShareId}&bean=${bean}&farm=${farm}&pin=${pin}`, {timeout: 10000})
      .then((res: any) => {
        if (res.data.code === 200)
          console.log('已自动提交助力码')
        else
          console.log('提交失败！已提交farm和bean的cookie才可提交cfd')
        resolve()
      })
      .catch((e) => {
        reject('访问助力池出错')
      })
  })
}
