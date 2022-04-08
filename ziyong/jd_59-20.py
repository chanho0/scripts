#cron:58 59 9-21/4,23 * * *

from chanho0_scripts_jdapi import JDApi
import json
import time
import os
import requests
from multiprocessing import Process

def run(ck):
    jdapi = JDApi('e1fbcf46b2a66597')
    jdapi.set_location('113.714872', '34.760459')
    ck=ck
    jd_url,data,headers = jdapi.gte_receiveKey(ck)
    requests.packages.urllib3.disable_warnings()
    receiveKey_dic = requests.post(jd_url, data=data, headers=headers, verify=False).json()
    receiveKey = receiveKey_dic['result']['couponList'][0]['receiveKey']
    jd_url,data,headers = jdapi.receive_necklace_coupon(receiveKey,ck)
    for i in range(20):
        time.sleep(0.25)
        requests.packages.urllib3.disable_warnings()
        res=requests.post(jd_url, data=data, headers=headers, verify=False).json()
        #print(ck)
        print(res)
        #print(time.strftime('%H:%M:%S', time.localtime(time.time())))

def main():
    # 下面填ck
    #ck=['']\
    ck=os.environ['JD_COOKIE'].split('&')
    cks=[]
    for i in range(len(ck)):
        cks.append("cs_"+str(i))
    for i in range(len(ck)):
        cks[i] = Process(target=run, args=(ck[i], ))
    for i in range(len(ck)):
        cks[i].start()
    for i in range(len(ck)):
        cks[i].join()


if __name__ == '__main__':
    main()