#!/bin/bash
echo "STEP1: 生成最新代码"
grunt
echo "STEP2: 同步到阿里云服务器"
rsync -av .build/aliyun/ cag:/root/zhenbao
