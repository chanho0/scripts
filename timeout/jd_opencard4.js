const $ = new Env('奔跑吧 开学季');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
    cookie = '';
let activityCookie = '';
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
    cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
message = ""
!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
            "open-url": "https://bean.m.jd.com/"
        });
        return;
    }
    $.shareUuid='983829a400c243d08750c60ce2fbff49'
    $.activityId = '902082701'
    console.log(`入口:\nhttps://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/activity/?activityId=${$.activityId}&shareUuid=${$.shareUuid}`)
    for (let i = 0; i < cookiesArr.length; i++) {
        cookie = cookiesArr[i];
        if (cookie) {
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
            $.index = i + 1;
            getUA()
            console.log(`\n\n******开始【京东账号${$.index}】${$.UserName}*********\n`);
            await run();
            if(i == 0 && !$.actorUuid) return
        }
    }
})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())

async function run(){
    try{
        $.Token = ''
        $.Pin = ''
        await getCk()
        await token()
        await getToken();
        if($.Token == ''){
            console.log('获取[token]失败！')
            return
        }
        await getSimpleActInfoVo()
        $.nickname = '';
        await getMyPing()
        if ($.Pin ==="" || typeof $.shopId == 'undefined' || typeof $.venderId == 'undefined') {
            $.log("获取活动信息失败！")
            return
        }
        await accessLogWithAD()
        $.attrTouXiang = 'https://img10.360buyimg.com/imgzone/jfs/t1/7020/27/13511/6142/5c5138d8E4df2e764/5a1216a3a5043c5d.png'
        await getUserInfo();

        $.actorUuid = '';
        await getActorUuid();
        if(!$.actorUuid){
            console.log('获取不到[actorUuid]退出执行，请重新执行')
            return
        }
        console.log("助力码：" + $.actorUuid)

        await drawContent();
        await $.wait(1000)
        console.log("加购")
        await saveTask('加购', 'add2cart');
        await $.wait(1000)
        console.log("关注")
        await saveTask('关注', 'followshop');
        await $.wait(1000)
        if ($.shopList && $.openCardStatus == 2) {
            let flag = true
            for (let cardList1Element of $.shopList) {
                console.log(cardList1Element.venderName)
                await join(cardList1Element.venderId)
                await $.wait(1000)
                await drawContent();
            }
            await $.wait(1000)
            await drawContent();
            await $.wait(1000)
        }
        await helpFriends();
        await getActorUuid()
        await $.wait(1000)
        await getShareRecord()
        $.log($.shareUuid)
        if ($.index === 1) {
            if($.actorUuid){
                $.shareUuid = $.actorUuid;
                console.log(`后面的号都会助力:${$.shareUuid}`)
            }else{
                console.log('账号1获取不到[shareUuid]退出执行，请重新执行')
                return
            }
        }
    }catch(e){
        console.log(e)
    }
}
function helpFriends() {
    return new Promise(resolve => {
        let body = `activityId=${$.activityId}&shareUuid=${$.shareUuid}&actorUuid=${$.actorUuid}&pin=${encodeURIComponent($.Pin)}&userUuid=${$.actorUuid}&num=0&sortSuatus=1`
        let options = {
            url: `https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/helpFriend`,
            body: body,
            headers: {
                "Accept": "application/json",
                "Accept-Language": "zh-cn",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Content-Type": "application/x-www-form-urlencoded",
                'Cookie': `${activityCookie} ${$.Pin && "AUTH_C_USER=" + $.Pin + ";" || ""};${$.lz_jdpin_token}`,
                "Host": "lzdz-isv.isvjcloud.com",
                "Origin": "https://lzdz-isv.isvjcloud.com",
                "X-Requested-With": "XMLHttpRequest",
                "Referer": `https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/activity/?activityId=${$.activityId}&shareUuid=${$.shareUuid}`,
                "User-Agent": $.UA ,
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    res = $.toObj(data);
                    console.log(data)
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function getDrawRecordHasCoupon() {
    return new Promise(resolve => {
        let body = `activityId=${$.activityId}&actorUuid=${$.actorUuid}&pin=${encodeURIComponent($.Pin)}&num=0&sortSuatus=1`
        $.post(taskPostUrl('/dingzhi/taskact/common/getDrawRecordHasCoupon', body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    res = $.toObj(data);
                    if(typeof res == 'object'){
                        if(res.result === true && res.data){
                            console.log(`我的奖品：`)
                            let num = 0
                            let value = 0
                            for(let i in res.data){
                                let item = res.data[i]
                                if(item.value == '邀请好友') num++;
                                if(item.value == '邀请好友') value = item.infoName.replace('京豆','');
                                if(item.value != '邀请好友') console.log(`${item.infoType != 10 && item.value +':' || ''}${item.infoName}`)
                            }
                            if(num > 0) console.log(`邀请好友(${num}):${num*parseInt(value, 10) || 20}京豆`)
                        }else if(typeof res == 'object' && res.errorMessage){
                            console.log(`我的奖品 ${res.errorMessage || ''}`)
                        }else{
                            console.log(data)
                        }
                    }else{
                        console.log(data)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function getShareRecord() {
    return new Promise(resolve => {
        let body = `activityId=${$.activityId}&actorUuid=${$.actorUuid}&userUuid=${$.actorUuid}&pin=${encodeURIComponent($.Pin)}&page=1&pageSize=100`
        $.post(taskPostUrl('/dingzhi/union/kxj/myfriend', body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    res = $.toObj(data);
                    if(typeof res == 'object'){
                        if(res.result === true && res.data){
                            $.log(`=========== 你邀请了:${res.data.length}个`)
                        }else if(typeof res == 'object' && res.errorMessage){
                            console.log(`${res.errorMessage || ''}`)
                        }else{
                            console.log(data)
                        }
                    }else{
                        console.log(data)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function writePersonInfo() {
    return new Promise(resolve => {
        let body = `jdActivityId=${$.jdActivityId}&pin=${encodeURIComponent($.Pin)}&actionType=5&venderId=0&activityId=${$.activityId}`
        $.post(taskPostUrl('/interaction/write/writePersonInfo', body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {

                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function insertCrmPageVisit(elementId) {
    return new Promise(resolve => {
        let body = `venderId=${$.venderId}&elementId=${elementId}&pageId=${$.activityId}&pin=${encodeURIComponent($.Pin)}`
        $.post(taskPostUrl('/crm/pageVisit/insertCrmPageVisit', body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {

                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}


function saveTask(title, taskId) {
    return new Promise(resolve => {
        let body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}&actorUuid=${$.actorUuid}&userUuid=${$.actorUuid}&taskId=${taskId}`
        let options = {
            url: `https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/doTask`,
            body: body,
            headers: {
                "Accept": "application/json",
                "Accept-Language": "zh-cn",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Content-Type": "application/x-www-form-urlencoded",
                'Cookie': `${cookie} ${activityCookie} ${$.Pin && "AUTH_C_USER=" + $.Pin + ";" || ""};${$.lz_jdpin_token}`,
                "Host": "lzdz-isv.isvjcloud.com",
                "Origin": "https://lzdz-isv.isvjcloud.com",
                "X-Requested-With": "XMLHttpRequest",
                "Referer": `https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/activity/?activityId=${$.activityId}&shareUuid=${$.shareUuid}`,
                "User-Agent": $.UA ,
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    console.log(data)
                    let res = $.toObj(data);
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function getshopactivityId(venderId) {
    return new Promise(resolve => {
        $.get(shopactivityId(`${venderId}`), async (err, resp, data) => {
            try {
                data = JSON.parse(data);
                if(data.success == true){
                    // console.log($.toStr(data.result))
                    // console.log(`入会:${data.result.shopMemberCardInfo.venderCardName || ''}`)
                    $.shopactivityId = data.result.interestsRuleList && data.result.interestsRuleList[0] && data.result.interestsRuleList[0].interestsInfo && data.result.interestsRuleList[0].interestsInfo.activityId || ''
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function shopactivityId(functionId) {
    return {
        url: `https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=getShopOpenCardInfo&body=%7B%22venderId%22%3A%22${functionId}%22%2C%22channel%22%3A401%7D&client=H5&clientVersion=9.2.0&uuid=88888`,
        headers: {
            'Content-Type': 'text/plain; Charset=UTF-8',
            'Origin': 'https://api.m.jd.com',
            'Host': 'api.m.jd.com',
            'accept': '*/*',
            'User-Agent': $.UA,
            'content-type': 'application/x-www-form-urlencoded',
            'Referer': `https://shopmember.m.jd.com/shopcard/?venderId=${functionId}&shopId=${functionId}&venderType=5&channel=401&returnUrl=https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/activity/?activityId=${$.activityId}&shareUuid=${$.shareUuid}`,
            'Cookie': cookie
        }
    }
}
function join(venderId) {
    return new Promise(async resolve => {
        $.shopactivityId = ''
        await $.wait(1000)
        await getshopactivityId(venderId)
        $.get(ruhui(`${venderId}`), async (err, resp, data) => {
            try {
                // console.log(data)
                let res = $.toObj(data);
                if(typeof res == 'object'){
                    if(res.success === true){
                        console.log(res.message)
                        if(res.result && res.result.giftInfo){
                            for(let i of res.result.giftInfo.giftList){
                                console.log(`入会获得:${i.discountString}${i.prizeName}${i.secondLineDesc}`)
                            }
                        }
                    }else if(typeof res == 'object' && res.message){
                        console.log(`${res.message || ''}`)
                    }else{
                        console.log(data)
                    }
                }else{
                    console.log(data)
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function ruhui(functionId) {
    let activityId = ``
    if($.shopactivityId) activityId = `,"activityId":${$.shopactivityId}`
    return {
        url: `https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=bindWithVender&body={"venderId":"${functionId}","shopId":"${functionId}","bindByVerifyCodeFlag":1,"registerExtend":{},"writeChildFlag":0${activityId},"channel":401}&client=H5&clientVersion=9.2.0&uuid=88888`,
        headers: {
            'Content-Type': 'text/plain; Charset=UTF-8',
            'Origin': 'https://api.m.jd.com',
            'Host': 'api.m.jd.com',
            'accept': '*/*',
            'User-Agent': $.UA,
            'content-type': 'application/x-www-form-urlencoded',
            'Referer': `https://shopmember.m.jd.com/shopcard/?venderId=${functionId}&shopId=${functionId}&venderType=5&channel=401&returnUrl=https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/activity/?activityId=${$.activityId}&shareUuid=${$.shareUuid}`,
            'Cookie': cookie
        }
    }
}

function startDraw(type) {
    return new Promise(resolve => {
        let body = `activityId=${$.activityId}&actorUuid=${$.actorUuid}&pin=${encodeURIComponent($.Pin)}&type=${type}`
        $.post(taskPostUrl('/dingzhi/openCard/summer/startDraw', body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    // $.log($.toStr(data))
                    let res = $.toObj(data);
                    if(typeof res == 'object'){
                        if(res.result === true && res.data){
                            console.log(`抽奖获得：${res.data.drawOk && res.data.name || '空气💨'}`)
                        }else if(typeof res == 'object' && res.errorMessage){
                            console.log(`抽奖 ${res.errorMessage || ''}`)
                        }else{
                            console.log(data)
                        }
                    }else{
                        console.log(data)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function checkOpenCard() {
    return new Promise(resolve => {
        let body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}&actorUuid=${$.actorUuid}&shareUuid=${$.shareUuid}`
        $.post(taskPostUrl('/dingzhi/union/kxj/checkOpenCard', body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    // console.log(data)
                    res = $.toObj(data);
                    if(typeof res !== 'object'){
                        console.log(data)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(res && res.data || '');
            }
        })
    })
}


function drawContent() {
    return new Promise(resolve => {
        let body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}&type=99&actorUuid=${$.actorUuid}&userUuid=${$.actorUuid}`
        $.post(taskPostUrl('/dingzhi/union/kxj/draw',body), async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    let res = $.toObj(data);
                    if(!res.result){
                        console.log("抽奖：",res.errorMessage)
                    }else{
                        if(res.data.prize){
                            for(pri of res.data.prize){
                                console.log(pri.remark + ":" + pri.rewardName)
                            }
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function getActorUuid() {
    return new Promise(resolve => {
        let body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}&pinImg=${encodeURIComponent($.attrTouXiang)}&nick=${encodeURIComponent($.nickname)}&cjyxPin=&cjhyPin=&shareUuid=${$.shareUuid}`
        let options = {
            url: `https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/activityContent`,
            body: body,
            headers: {
                "Accept": "application/json",
                "Accept-Language": "zh-cn",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Content-Type": "application/x-www-form-urlencoded",
                'Cookie': `${activityCookie} ${$.Pin && "AUTH_C_USER=" + $.Pin + ";" || ""};${$.lz_jdpin_token}`,
                "Host": "lzdz-isv.isvjcloud.com",
                "Origin": "https://lzdz-isv.isvjcloud.com",
                "X-Requested-With": "XMLHttpRequest",
                "Referer": `https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/activity/?activityId=${$.activityId}&shareUuid=${$.shareUuid}`,
                "User-Agent": $.UA ,
            }
        }

        $.post(options, async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    // console.log(data)
                    let res = $.toObj(data);
                    if(typeof res == 'object' && res.result === true){
                        if(typeof res.data.shopList != 'undefined') $.shopList = res.data.shopList
                        if(typeof res.data.uid != 'undefined') $.actorUuid = res.data.uid
                        if(typeof res.data.openCardStatus != 'undefined') $.openCardStatus = res.data.openCardStatus
                    }else if(typeof res == 'object' && res.errorMessage){
                        console.log(`activityContent ${res.errorMessage || ''}`)
                    }else{
                        console.log(data)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function getUserInfo() {
    return new Promise(resolve => {
        let body = `pin=${encodeURIComponent($.Pin)}`
        $.post(taskPostUrl('/wxActionCommon/getUserInfo',body), async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} getUserInfo API请求失败，请检查网路重试`)
                } else {
                    let res = $.toObj(data);
                    if(typeof res == 'object' && res.result === true){
                        if(res.data && typeof res.data.yunMidImageUrl != 'undefined') $.attrTouXiang = res.data.yunMidImageUrl || "https://img10.360buyimg.com/imgzone/jfs/t1/7020/27/13511/6142/5c5138d8E4df2e764/5a1216a3a5043c5d.png"
                    }else if(typeof res == 'object' && res.errorMessage){
                        console.log(`getUserInfo ${res.errorMessage || ''}`)
                    }else{
                        console.log(data)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function accessLogWithAD() {
    return new Promise(resolve => {
        let pageurl = `https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/activity/?activityId=${$.activityId}&shareUuid=${$.shareUuid}`
        let body = `venderId=${$.shopId || $.venderId}&code=99&pin=${encodeURIComponent($.Pin)}&activityId=${$.activityId}&pageUrl=${encodeURIComponent(pageurl)}&subType=APP&adSource=null`
        $.post(taskPostUrl('/common/accessLogWithAD',body), async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    let LZ_TOKEN_KEY = ''
                    let LZ_TOKEN_VALUE = ''
                    let setcookies = resp['headers']['set-cookie'] || resp['headers']['Set-Cookie'] || ''
                    let setcookie = ''
                    if(setcookies){
                        if(typeof setcookies != 'object'){
                            setcookie = setcookies.split(',')
                        }else setcookie = setcookies
                        for (let ck of setcookie) {
                            let name = ck.split(";")[0].trim()
                            if(name.split("=")[1]){
                                if(name.indexOf('LZ_TOKEN_KEY=')>-1) LZ_TOKEN_KEY = name.replace(/ /g,'')+';'
                                if(name.indexOf('LZ_TOKEN_VALUE=')>-1) LZ_TOKEN_VALUE = name.replace(/ /g,'')+';'
                            }
                        }
                    }
                    if(LZ_TOKEN_KEY && LZ_TOKEN_VALUE) activityCookie = `${LZ_TOKEN_KEY} ${LZ_TOKEN_VALUE}`
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function getMyPing() {
    return new Promise(resolve => {
        let body = `userId=${$.shopId || $.venderId}&token=${$.Token}&fromType=APP`
        $.post(taskPostUrl('/customer/getMyPing',body), async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} getMyPing API请求失败，请检查网路重试`)
                } else {
                    let res = $.toObj(data)
                    if(typeof res == 'object' && res.result == true){
                        if(res.data && typeof res.data.secretPin != 'undefined') $.Pin = res.data.secretPin
                        if(res.data && typeof res.data.nickname != 'undefined') $.nickname = res.data.nickname
                    }else if(typeof res == 'object' && res.errorMessage){
                        console.log(`getMyPing ${res.errorMessage || ''}`)
                    }else{
                        console.log(data)
                    }

                    let LZ_TOKEN_KEY = ''
                    let LZ_TOKEN_VALUE = ''
                    let setcookies = resp['headers']['set-cookie'] || resp['headers']['Set-Cookie'] || ''
                    let setcookie = ''
                    if(setcookies){
                        if(typeof setcookies != 'object'){
                            setcookie = setcookies.split(',')
                        }else setcookie = setcookies
                        for (let ck of setcookie) {
                            let name = ck.split(";")[0].trim()
                            if(name.split("=")[1]){
                                if(name.indexOf('LZ_TOKEN_KEY=')>-1) LZ_TOKEN_KEY = name.replace(/ /g,'')+';'
                                if(name.indexOf('LZ_TOKEN_VALUE=')>-1) LZ_TOKEN_VALUE = name.replace(/ /g,'')+';'
                                if(name.indexOf('lz_jdpin_token=')>-1) $.lz_jdpin_token = name.replace(/ /g,'')+';'
                            }
                        }
                    }
                    if(LZ_TOKEN_KEY && LZ_TOKEN_VALUE) activityCookie = `${LZ_TOKEN_KEY} ${LZ_TOKEN_VALUE}`
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function getSimpleActInfoVo() {
    return new Promise(resolve => {
        let body = `activityId=${$.activityId}`
        $.post(taskPostUrl('/dz/common/getSimpleActInfoVo',body), async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} getSimpleActInfoVo API请求失败，请检查网路重试`)
                } else {
                    // console.log(data)
                    let res = $.toObj(data);
                    if(typeof res == 'object' && res.result === true){
                        if(typeof res.data.shopId != 'undefined') $.shopId = res.data.shopId
                        if(typeof res.data.venderId != 'undefined') $.venderId = res.data.venderId
                        if(typeof res.data.jdActivityId != 'undefined') $.jdActivityId = res.data.jdActivityId
                    }else if(typeof res == 'object' && res.errorMessage){
                        console.log(`getSimpleActInfoVo ${res.errorMessage || ''}`)
                    }else{
                        console.log(data)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function getToken() {
    return new Promise(resolve => {
        $.post({
            url: `https://api.m.jd.com/client.action?functionId=isvObfuscator`,
            body: 'area=19_1601_50258_50374&body=%7B%22url%22%3A%22https%3A%5C/%5C/lzdz-isv.isvjcloud.com%22%2C%22id%22%3A%22%22%7D&build=167798&client=apple&clientVersion=10.1.2&d_brand=apple&d_model=iPhone13%2C2&eid=eidI2ad5812337s3ghGuVeflROmNL7t9SyzhxIIRr8y39ehVQQzh3oXWc/QdZtuYpoU84EZvJqBkJ%2BWEUsc7iuc80hh3Y5nnWIpS4d3eVHSbXWGspkRV&isBackground=Y&joycious=118&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=753d213009c85f60f8ce9df3a678389ffa3fb1c5&osVersion=14.7.1&partner=TF&rfs=0000&scope=11&screen=1170%2A2532&sign=e2bfbb6130a4b740c97751305f0dedd8&st=1630136320186&sv=112&uemps=0-0&uts=0f31TVRjBSvF0SXIqiTGj86P9Qfjps4WNKILeVy9xqoW/s7IJ9MhXukTg3hn8JucE1YNo%2Bjj/5SGW9X1a0VXQtbkyzQ50uanymWzW7aTGOK8Pfe8sJ4bkkx4doTVMV7k3LNo09hyanV8N0JPjyZjSYqS1WYic1cT3QgZLyk86iBpkyNDnEiC6b8wSmDdyovt4GaDW8zwqedm2QWI64EBoA%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=95eed3a70548f24efc1b711742354b0b',
            headers: {
                'Content-Type':'application/x-www-form-urlencoded',
                'Cookie': cookie,
                'Host':'api.m.jd.com',
                'User-Agent': $.UA,
            }
        }, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} isvObfuscator API请求失败，请检查网路重试`)
                } else {
                    let res = $.toObj(data)
                    if(typeof res == 'object' && res.errcode == 0){
                        if(typeof res.token != 'undefined') $.Token = res.token
                    }else if(typeof res == 'object' && res.message){
                        console.log(`isvObfuscator ${res.message || ''}`)
                    }else{
                        console.log(data)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function token() {
    return new Promise(resolve => {
        let get = {
            url:`https://lzdz-isv.isvjcloud.com/wxCommonInfo/token`,
            headers: {
                "Cookie": `${activityCookie} ${cookie}`,
                "Referer":`https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/activity/?activityId=${$.activityId}&shareUuid=${$.shareUuid}`,
                "User-Agent": $.UA,
            }
        }
        $.get(get, async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} cookie API请求失败，请检查网路重试`)
                } else {
                    let LZ_TOKEN_KEY = ''
                    let LZ_TOKEN_VALUE = ''
                    let setcookies = resp['headers']['set-cookie'] || resp['headers']['Set-Cookie'] || ''
                    let setcookie = ''
                    if(setcookies){
                        if(typeof setcookies != 'object'){
                            setcookie = setcookies.split(',')
                        }else setcookie = setcookies
                        for (let ck of setcookie) {
                            let name = ck.split(";")[0].trim()
                            if(name.split("=")[1]){
                                if(name.indexOf('LZ_TOKEN_KEY=')>-1) LZ_TOKEN_KEY = name.replace(/ /g,'')+';'
                                if(name.indexOf('LZ_TOKEN_VALUE=')>-1) LZ_TOKEN_VALUE = name.replace(/ /g,'')+';'
                            }
                        }
                    }
                    if(LZ_TOKEN_KEY && LZ_TOKEN_VALUE) activityCookie = `${LZ_TOKEN_KEY} ${LZ_TOKEN_VALUE}`
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function getCk() {
    return new Promise(resolve => {
        let get = {
            url:`https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/activity/?activityId=${$.activityId}&shareUuid=${$.shareUuid}`,
            headers: {
                "Cookie": cookie,
                "User-Agent": $.UA,
            }
        }
        $.get(get, async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.toStr(err)}`)
                    console.log(`${$.name} cookie API请求失败，请检查网路重试`)
                } else {
                    let LZ_TOKEN_KEY = ''
                    let LZ_TOKEN_VALUE = ''
                    let setcookies = resp['headers']['set-cookie'] || resp['headers']['Set-Cookie'] || ''
                    let setcookie = ''
                    if(setcookies){
                        if(typeof setcookies != 'object'){
                            setcookie = setcookies.split(',')
                        }else setcookie = setcookies
                        for (let ck of setcookie) {
                            let name = ck.split(";")[0].trim()
                            if(name.split("=")[1]){
                                if(name.indexOf('LZ_TOKEN_KEY=')>-1) LZ_TOKEN_KEY = name.replace(/ /g,'')+';'
                                if(name.indexOf('LZ_TOKEN_VALUE=')>-1) LZ_TOKEN_VALUE = name.replace(/ /g,'')+';'
                            }
                        }
                    }
                    if(LZ_TOKEN_KEY && LZ_TOKEN_VALUE) activityCookie = `${LZ_TOKEN_KEY} ${LZ_TOKEN_VALUE}`
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function taskPostUrl(url, body) {
    return {
        url: `https://lzdz-isv.isvjcloud.com${url}`,
        body: body,
        headers: {
            "Accept": "application/json",
            "Accept-Language": "zh-cn",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
            'Cookie': `${cookie} ${activityCookie} ${$.Pin && "AUTH_C_USER=" + $.Pin + ";" || ""};${$.lz_jdpin_token}`,
            "Host": "lzdz-isv.isvjcloud.com",
            "Origin": "https://lzdz-isv.isvjcloud.com",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": `https://lzdz-isv.isvjcloud.com/dingzhi/union/kxj/activity/?activityId=${$.activityId}&shareUuid=${$.shareUuid}`,
            "User-Agent": $.UA ,
        }
    }
}

function getUA(){
    $.UA = `jdapp;iPhone;10.0.10;14.3;${randomString(40)};network/wifi;model/iPhone12,1;addressid/4199175193;appBuild/167741;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`
}
function randomString(e) {
    e = e || 32;
    let t = "abcdef0123456789", a = t.length, n = "";
    for (i = 0; i < e; i++)
        n += t.charAt(Math.floor(Math.random() * a));
    return n
}

function jsonParse(str) {
    if (typeof str == "string") {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
            return [];
        }
    }
}
// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}


