/**
 * 京喜-88红包-宝箱
 * 做任务、开宝箱
 * 每号可收20次助力，出1次助力
 * cron: 10 0,6,12 * * *
 * TODO CK 20+
 * CK1默认优先助力HW.ts，其余助力CK1
 * HW_Priority: boolean
 * true  HW.ts -> 内部
 * false 内部   -> HW.ts
 */

import axios from 'axios'
import * as path from "path"
import {requireConfig, wait, requestAlgo, h5st, exceptCookie, randomString} from './TS_USER_AGENTS'

let cookie: string = '', res: any = '', UserName: string, index: number
let shareCodeSelf: string[] = [], shareCode: string[] = [], shareCodeHW: string[] = ['bddc0d82c8e6edb37b831ab6a467981b']
let HW_Priority: boolean = true
process.env.HW_Priority === 'false' ? HW_Priority = false : ''

!(async () => {
  await requestAlgo()
  let cookiesArr: any = await requireConfig()
  cookie = cookiesArr[0]
  UserName = decodeURIComponent(cookie.match(/pt_pin=([^;]*)/)![1])
  console.log(`\n开始【京东账号${index}】${UserName}\n`)

  res = await api('query', 'signhb_source,smp,type', {})
  console.log('助力码:', res.smp)
  shareCodeSelf.push(res.smp)

  console.log('内部助力:', shareCodeSelf)
  for (let i = 0; i < cookiesArr.length; i++) {
    if (i === 0 && HW_Priority) {
      shareCode = Array.from(new Set([...shareCodeHW]))
    } else {
      shareCode = Array.from(new Set([...shareCodeHW]))
    }
    cookie = cookiesArr[i]
    UserName = decodeURIComponent(cookie.match(/pt_pin=([^;]*)/)![1])
    for (let code of shareCode) {
      console.log(`${UserName} 去助力 ${code}`)
      res = await api('query', 'signhb_source,smp,type', {signhb_source: 5, smp: code, type: 1})
      await wait(2000)
      if (res.autosign_sendhb !== '0' || res.todaysign === 1)
        break
    }
  }

  let except: string[] = exceptCookie(path.basename(__filename))
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i]
    UserName = decodeURIComponent(cookie.match(/pt_pin=([^;]*)/)![1])
    index = i + 1
    console.log(`\n开始【京东账号${index}】${UserName}\n`)

    if (except.includes(encodeURIComponent(UserName))) {
      console.log('已设置跳过')
      continue
    }catch (e: any) {
      console.log(e)
    }
    //await wait(3000)
  }
})()

interface Params {
  signhb_source?: number,
  type?: number,
  smp?: string,
}

function api(fn: string, stk: string, params: Params = {}) {
  return new Promise(async (resolve, reject) => {
    let url = `https://m.jingxi.com/fanxiantask/signhb/${fn}?_stk=${encodeURIComponent(stk)}&_ste=1&_=${Date.now()}&sceneval=2`
    if (fn.match(/(dotask|bxdraw)/)) {
      url = fn
    }
    url = h5st(url, stk, params, 10038)
    try {
      let {data}: any = await axios.get(url, {
        headers: {
          'Host': 'm.jingxi.com',
          'User-Agent': `jdpingou;iPhone;5.9.0;12.4.1;${randomString(40)};network/wifi;`,
          'Referer': 'https://st.jingxi.com/',
          'Cookie': cookie,
        }
      })
      if (typeof data === 'string') {
        data = data.replace('try{jsonpCBKB(', '').replace('try{Query(', '').replace('try{BxDraw(', '').replace('try{Dotask(', '').split('\n')[0]
        resolve(JSON.parse(data))
      } else {
        resolve(data)
      }
    } catch (e: any) {
      reject(e)
    }
  })
}

async function doubleSign() {
  try {
    let {data} = await axios.get('https://m.jingxi.com/double_sign/IssueReward?sceneval=2', {
      headers: {
        'Host': 'm.jingxi.com',
        'Origin': 'https://st.jingxi.com',
        'Accept': 'application/json',
        'User-Agent': 'jdpingou;',
        'Referer': 'https://st.jingxi.com/pingou/jxapp_double_signin/index.html',
        'Cookie': cookie
      }
    })
    return data
  } catch (e) {
    console.log(e)
    return ''
  }
}
