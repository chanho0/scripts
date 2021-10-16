#*/10 * * * * pull.sh, tag=拉取
ql repo https://github.com/Aaron-lv/sync.git "jdzz|jxnc|bookshop" "jddj|collect|exchange|open|activity|backUp" "^jd[^_]|USER|utils" "jd_scripts"
ql repo https://github.com/JDHelloWorld/jd_scripts.git "stock" "" "TS_USER_AGENTS"
ql repo https://github.com/Tsukasa007/my_script.git "wskey|1600" "" "" "master"