#*/10 * * * * pull.sh, tag=拉取
ql repo https://github.com/Aaron-lv/sync.git "jdzz|jxnc|bookshop|joy_run" "jddj|collect|exchange|open|activity|backUp" "^jd[^_]|USER|utils" "jd_scripts"
ql repo https://github.com/JDHelloWorld/jd_scripts.git "cron" "" "TS_USER_AGENTS"
#ql repo https://github.com/smiek2121/scripts.git "carnivalcity" "open" "ZooFaker_Necklace.js|JDJRValidator_Pure.js|sign_graphics_validate.js"