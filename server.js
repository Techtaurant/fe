const https = require('https');
const fs = require('fs');
const path = require('path');
const next = require('next');

// 인증서 파일 경로
const keyPath = path.join(__dirname, 'localhost+1-key.pem');
const certPath = path.join(__dirname, 'localhost+1.pem');

// 인증서 파일 존재 확인
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('❌ 인증서 파일을 찾을 수 없습니다.');
  console.error('   다음 명령어를 실행하세요: mkcert localhost 127.0.0.1');
  process.exit(1);
}

// HTTPS 옵션
const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

// Next.js 앱 설정
const app = next({ dev: true });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    https
      .createServer(httpsOptions, (req, res) => {
        // HTTPS 정보를 헤더에 설정 (Next.js에서 인식하도록)
        req.headers['x-forwarded-proto'] = 'https';
        req.headers['x-forwarded-for'] = req.socket.remoteAddress || '127.0.0.1';
        req.headers['x-forwarded-host'] = req.headers.host || 'localhost:3000';

        // req.secure 직접 설정 (프록시 환경 감지용)
        Object.defineProperty(req, 'secure', {
          value: true,
          writable: false,
          enumerable: true,
        });

        // 디버그 정보
        if (req.url === '/' && req.method === 'GET') {
          console.log(`[HTTPS 검증] ${req.method} ${req.url}`);
          console.log(`  - Secure: ${req.secure}`);
          console.log(
            `  - X-Forwarded-Proto: ${req.headers['x-forwarded-proto']}`
          );
          console.log(`  - X-Forwarded-Host: ${req.headers['x-forwarded-host']}`);
        }

        handle(req, res);
      })
      .listen(3000, '0.0.0.0', (err) => {
        if (err) {
          console.error('❌ 서버 시작 실패:', err);
          process.exit(1);
        }
        console.log('\n═════════════════════════════════════════');
        console.log('✅ HTTPS 서버 시작 완료');
        console.log('═════════════════════════════════════════');
        console.log('🔐 주소: https://localhost:3000');
        console.log('🔐 프로토콜: HTTPS (TLS/SSL)');
        console.log('🔐 인증서: localhost+1.pem / localhost+1-key.pem');
        console.log('═════════════════════════════════════════\n');
      });
  })
  .catch((err) => {
    console.error('❌ Next.js 준비 실패:', err);
    process.exit(1);
  });
