/*
京东极速版签到+赚现金任务
每日9毛左右，满3，10，50可兑换无门槛红包
⚠️⚠️⚠️一个号需要运行40分钟左右

活动时间：长期
活动入口：京东极速版app-现金签到
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东极速版
0 7,19 * * * jd_speed_sign.js, tag=京东极速版, img-url=https://raw.githubusercontent.com/Orz-3/task/master/jd.png, enabled=true

================Loon==============
[Script]
cron "0 7,19 * * *" script-path=jd_speed_sign.js,tag=京东极速版

===============Surge=================
京东极速版 = type=cron,cronexp="0 7,19 * * *",wake-system=1,timeout=33600,script-path=jd_speed_sign.js

============小火箭=========
京东极速版 = type=cron,script-path=jd_speed_sign.js, cronexpr="0 7,19 * * *", timeout=33600, enable=true
*/

const jdCookieNode = require('./jdCookie.js');
const child_process = require('child_process');

!(async () => {

    let cookiesArr = [], cookie = '', message;
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    });

    for (let i = 0; i < cookiesArr.length; i++) {
        process.env.JD_COOKIE = cookiesArr[i]
        const workerProcess = child_process.execFile(process.execPath, ['./chanho0_scripts_jd_speed_sign_c.js'], function (error, stdout, stderr) {
            if (error) {
                throw error;
            }
        });
        workerProcess.stdout.on('data', function (data) {
            console.log(`ck [${i}] [info]: ${data}`);
        });
    }
})();
