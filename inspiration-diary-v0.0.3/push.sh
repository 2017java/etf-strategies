#!/bin/bash

# 灵感日记应用推送脚本
# 版本：0.0.1

echo "=== 灵感日记应用推送脚本 ==="
echo "目标仓库：https://github.com/2017java/AICoding"
echo "目标分支：VS-Projects"
echo "版本标签：v0.0.1"
echo ""

# 检查git是否安装
if ! command -v git &> /dev/null; then
    echo "错误：git 未安装，请先安装git"
    exit 1
fi

# 检查当前目录
if [ ! -d ".git" ]; then
    echo "错误：当前目录不是git仓库"
    echo "请先进入 inspiration-diary 目录"
    exit 1
fi

# 检查远程仓库
if ! git remote | grep -q origin; then
    echo "添加远程仓库..."
    git remote add origin https://github.com/2017java/AICoding.git
else
    echo "更新远程仓库URL..."
    git remote set-url origin https://github.com/2017java/AICoding.git
fi

echo "检查分支状态..."
git status

echo ""
echo "推送代码到 VS-Projects 分支..."
git push -u origin main:VS-Projects --tags

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "请访问以下链接查看代码："
    echo "https://github.com/2017java/AICoding/tree/VS-Projects"
    echo ""
    echo "下一步："
    echo "1. 在GitHub上创建 v0.0.1 版本标签"
    echo "2. 部署到Vercel"
else
    echo ""
    echo "❌ 推送失败"
    echo "请检查："
    echo "1. GitHub账号是否有权限"
    echo "2. 网络连接是否正常"
    echo "3. 身份验证是否正确"
    echo ""
    echo "如果仍然失败，请使用以下步骤手动上传："
    echo "1. 访问 https://github.com/2017java/AICoding/tree/VS-Projects"
    echo "2. 点击 'Add file' → 'Upload files'"
    echo "3. 上传项目文件"
fi
