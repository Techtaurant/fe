#!/bin/bash

echo "🔐 Matchday API - SSL 셋업 (Mac)"
echo "=================================="

# mkcert 설치 확인
if ! command -v mkcert &> /dev/null; then
    echo "📦 mkcert 설치 중..."
    if command -v brew &> /dev/null; then
        brew install mkcert
    else
        echo "Homebrew가 설치되어 있지 않습니다."
        echo "- Homebrew 설치: https://brew.sh"
        echo "- 또는 mkcert 수동 설치: https://github.com/FiloSottile/mkcert#installation"
        exit 1
    fi
else
    echo "mkcert가 이미 설치되어 있습니다."
fi

# ssl 디렉토리 생성
echo "SSL 디렉토리 생성..."
mkdir -p conf/ssl

# 로컬 CA 설치
echo "로컬 CA 설치 시작..."
mkcert -install

# 인증서 생성
echo "SSL 인증서 생성 시작..."
mkcert -key-file conf/ssl/server.key -cert-file conf/ssl/server.crt localhost 127.0.0.1 ::1

echo ""
echo "SSL 셋업 완료!"
