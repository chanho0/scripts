/**
 * 京喜app->领88元红包
 * 先内部，后助力HW.ts
 * cron: 5 0,6,20 * * *
 */

import {requireConfig, wait, h5st, getBeanShareCode, getFarmShareCode} from "./TS_USER_AGENTS";
import axios from "axios";
import * as path from 'path';
import {accessSync, readFileSync} from "fs";
import {Md5} from "ts-md5";

let cookie: string = '', res: any = '', UserName: string, index: number, UA: string = '';
let shareCodesSelf: string[] = [], shareCodes: string[] = [], shareCodesHW: string[] = [];

!(async () => {
  let except: string[];
  try {
    accessSync('./utils/exceptCookie.json')
    except = JSON.parse(readFileSync('./utils/exceptCookie.json').toString())[path.basename(__filename)]
  } catch (e) {
    except = []
  }

  let cookiesArr: any = await requireConfig();
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    UserName = decodeURIComponent(cookie.match(/pt_pin=([^;]*)/)![1])
    index = i + 1;
    console.log(`\n开始【京东账号${index}】${UserName}\n`);

    if (except.includes(encodeURIComponent(UserName))) {
      console.log('已设置跳过')
      continue
    }

    res = await api('GetUserInfo', 'activeId,channel,phoneid,publishFlag,stepreward_jstoken,timestamp,userDraw', {userDraw: 1})
    let strUserPin: string = res.Data.strUserPin
    console.log('助力码：', strUserPin)
    shareCodesSelf.push(strUserPin)
    await makeShareCodes(strUserPin)
    await wait(2000)
    res = await api('JoinActive', 'activeId,channel,phoneid,publishFlag,stepreward_jstoken,timestamp')
    res.iRet === 0 ? console.log('JoinActive: 成功') : console.log('JoinActive:', res.sErrMsg)
    await wait(1000)
  }

  console.log('内部助力码：', shareCodesSelf)




interface Params {
  userDraw?: number,
  grade?: number,
  joinDate?: string,
  strPin?: string,
}

async function api(fn: string, stk: string, params: Params = {}) {
  let url: string = `https://m.jingxi.com/cubeactive/steprewardv3/${fn}?activeId=489177&publishFlag=1&channel=7&_stk=${encodeURIComponent(stk)}&_ste=1&_=${Date.now()}&sceneval=2`
  UA = `jdpingou;iPhone;4.13.0;14.4.2;${randomString(40)};network/wifi;model/iPhone10,2;appBuild/100609;ADID/00000000-0000-0000-0000-000000000000;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;hasOCPay/0;supportBestPay/0;session/${Math.random() * 98 + 1};pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`
  let phoneid = UA.split(';') && UA.split(';')[4] || ''
  url += `&phoneid=${phoneid}`
  url += `&stepreward_jstoken=${
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  }`
  url = h5st(url, stk, params, 10010)
  try {
    let {data}: any = await axios.get(url, {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://st.jingxi.com/pingou/jxmc/index.html',
        'Host': 'm.jingxi.com',
        'Cookie': cookie
      }
    })
    if (typeof data === 'string')
      return JSON.parse(data.replace(/jsonpCBK.?\(/, '').split('\n')[0])
    return data
  } catch (e: any) {
    return {}
  }
}



async function makeShareCodes(code: string) {
  let bean: string = await getBeanShareCode(cookie)
  let farm: string = await getFarmShareCode(cookie)
  let pin: string = cookie.match(/pt_pin=([^;]*)/)![1]
  pin = Md5.hashStr(pin)
  try {
    let {data}: any = await axios.get(`https://api.jdsharecode.xyz/api/autoInsert/hb88?sharecode=${code}&bean=${bean}&farm=${farm}&pin=${pin}`, {timeout: 10000})
    if (data.code === 200)
      console.log('自动提交助力码成功')
    else
      console.log('自动提交助力码失败！已提交farm的cookie才可提交88hb')
  } catch (e: any) {
    console.log('自动提交助力码出错')
  }
}

function randomString(e: number) {
  e = e || 32;
  let t = "0123456789abcdef", a = t.length, n = "";
  for (let i = 0; i < e; i++)
    n += t.charAt(Math.floor(Math.random() * a));
  return n
}