#!/bin/bash
# 便携包打包脚本：产出「单图标双击即开」的 zip
# 结构：AIHOT.app（Mac，全部资源藏于包内）+ Windows双击这里.bat + 使用说明.txt
# 用法：bash scripts/package.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$PROJECT_DIR/dist"
PKG_NAME="AIHOT-MVP-便携版"
PKG="$DIST/$PKG_NAME"
CACHE="$DIST/cache"
NODE_MIRROR="https://npmmirror.com/mirrors/node"
NPM_REGISTRY="https://registry.npmmirror.com"
PRISMA_MIRROR="https://registry.npmmirror.com/-/binary/prisma"
PORT=3456

APP="$PKG/AIHOT.app"
RES="$APP/Contents/Resources"

mkdir -p "$CACHE"
rm -rf "$PKG"
mkdir -p "$APP/Contents/MacOS" "$RES/runtime" "$RES/server"

# ── 1. 解析 Node v22 最新版本号（失败则用兜底版本）──
echo "==> 解析 Node v22 LTS 版本"
NODE_VERSION=$(curl -fsSL --max-time 15 "$NODE_MIRROR/latest-v22.x/SHASUMS256.txt" 2>/dev/null \
  | grep -o 'node-v22\.[0-9]*\.[0-9]*' | head -1 | sed 's/^node-//') || true
NODE_VERSION=${NODE_VERSION:-v22.14.0}
echo "    使用 Node $NODE_VERSION"

# ── 2. 下载并解压三平台便携 Node（缓存复用）──
fetch() {
  local file="$1"
  if [ ! -f "$CACHE/$file" ]; then
    echo "==> 下载 $file"
    curl -fL --retry 3 -o "$CACHE/$file.tmp" "$NODE_MIRROR/$NODE_VERSION/$file"
    mv "$CACHE/$file.tmp" "$CACHE/$file"
  else
    echo "==> 缓存命中 $file"
  fi
}

fetch "node-$NODE_VERSION-win-x64.zip"
fetch "node-$NODE_VERSION-darwin-arm64.tar.gz"
fetch "node-$NODE_VERSION-darwin-x64.tar.gz"

echo "==> 解压 runtime"
unzip -q "$CACHE/node-$NODE_VERSION-win-x64.zip" -d "$RES/runtime"
mv "$RES/runtime/node-$NODE_VERSION-win-x64" "$RES/runtime/node-win-x64"
tar -xzf "$CACHE/node-$NODE_VERSION-darwin-arm64.tar.gz" -C "$RES/runtime"
mv "$RES/runtime/node-$NODE_VERSION-darwin-arm64" "$RES/runtime/node-darwin-arm64"
tar -xzf "$CACHE/node-$NODE_VERSION-darwin-x64.tar.gz" -C "$RES/runtime"
mv "$RES/runtime/node-$NODE_VERSION-darwin-x64" "$RES/runtime/node-darwin-x64"

# ── 3. 复制项目源码与数据（.env / dev.db 被 .gitignore 排除，显式复制）──
echo "==> 复制源码与数据"
rsync -a "$PROJECT_DIR/" "$RES/server/" \
  --exclude node_modules --exclude .next --exclude .git --exclude dist \
  --exclude "prisma/dev.db-journal"
cp "$PROJECT_DIR/.env" "$RES/server/.env"
cp "$PROJECT_DIR/prisma/dev.db" "$RES/server/prisma/dev.db"
sed -i '' "s|^SITE_URL=.*|SITE_URL=\"http://localhost:$PORT\"|" "$RES/server/.env"
echo "registry=$NPM_REGISTRY" > "$RES/server/.npmrc"

# ── 4. 生成应用图标（橙底白字 AI，纯 stdlib 生成 PNG → icns）──
echo "==> 生成图标"
python3 - "$DIST/icon-master.png" <<'PYEOF'
import struct, zlib, sys

S = 1024
CELL = 64
# 12x9 点阵："AI" 字样
GRID = [
    "............",
    ".###....###.",
    "#...#....#..",
    "#...#....#..",
    "#####....#..",
    "#...#....#..",
    "#...#....#..",
    "#...#...###.",
    "............",
]
BG = (234, 88, 12)   # orange-600
FG = (255, 255, 255)

ox = (S - len(GRID[0]) * CELL) // 2
oy = (S - len(GRID) * CELL) // 2

rows = []
for y in range(S):
    row = bytearray([0])
    for x in range(S):
        gy, gx = (y - oy) // CELL, (x - ox) // CELL
        on = 0 <= gy < len(GRID) and 0 <= gx < len(GRID[0]) and GRID[gy][gx] == "#"
        row += bytes(FG if on else BG)
    rows.append(bytes(row))

raw = zlib.compress(b"".join(rows), 9)
def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

png = (b"\x89PNG\r\n\x1a\n"
       + chunk(b"IHDR", struct.pack(">IIBBBBB", S, S, 8, 2, 0, 0, 0))
       + chunk(b"IDAT", raw)
       + chunk(b"IEND", b""))
open(sys.argv[1], "wb").write(png)
PYEOF

ICONSET="$DIST/AppIcon.iconset"
rm -rf "$ICONSET" && mkdir -p "$ICONSET"
for size in 16 32 128 256 512; do
  sips -z $size $size "$DIST/icon-master.png" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  sips -z $((size*2)) $((size*2)) "$DIST/icon-master.png" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$RES/AppIcon.icns"
rm -rf "$ICONSET" "$DIST/icon-master.png"

# ── 5. Mac .app：Info.plist + 启动器 ──
echo "==> 生成 AIHOT.app"
cat > "$APP/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>AIHOT</string>
  <key>CFBundleDisplayName</key><string>AIHOT</string>
  <key>CFBundleIdentifier</key><string>com.aihot.mvp</string>
  <key>CFBundleVersion</key><string>0.1.0</string>
  <key>CFBundleShortVersionString</key><string>0.1.0</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>AIHOT</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
</dict>
</plist>
EOF

cat > "$APP/Contents/MacOS/AIHOT" <<'LAUNCHEOF'
#!/bin/bash
# AIHOT 启动器：双击即开。服务已在跑则直接打开网页；否则（首次自动安装后）启动服务。
RES="$(cd "$(dirname "$0")/../Resources" && pwd)"
LOG="$HOME/Library/Logs/AIHOT.log"
URL="http://localhost:__PORT__"
exec >>"$LOG" 2>&1
echo "── $(date) 启动 ──"

# 已在运行：直接开网页
if curl -s --noproxy '*' -o /dev/null --max-time 2 "$URL/api/public/version"; then
  open "$URL"; exit 0
fi

# 防并发（重复双击）
LOCK="$RES/.launch.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  osascript -e 'display notification "正在启动中，请稍候…" with title "AIHOT"'
  exit 0
fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

if [ "$(uname -m)" = "arm64" ]; then RT="node-darwin-arm64"; else RT="node-darwin-x64"; fi
export PATH="$RES/runtime/$RT/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export PRISMA_ENGINES_MIRROR="__PRISMA_MIRROR__"
cd "$RES/server"

if [ ! -d node_modules ] || [ ! -d .next ]; then
  osascript -e 'display notification "首次启动：正在安装组件，约需 3-5 分钟，请保持联网" with title "AIHOT"' || true
  if ! npm ci; then
    osascript -e 'display dialog "AIHOT 安装失败：请检查网络连接后，再次双击 AIHOT 重试。" buttons {"好"} default button 1 with icon stop with title "AIHOT"'
    exit 1
  fi
  npx prisma generate || { osascript -e 'display dialog "AIHOT 初始化失败（数据库组件），请重试。" buttons {"好"} default button 1 with icon stop with title "AIHOT"'; exit 1; }
  if ! npx next build; then
    osascript -e 'display dialog "AIHOT 构建失败，请再次双击重试；仍失败请截图 ~/Library/Logs/AIHOT.log 反馈。" buttons {"好"} default button 1 with icon stop with title "AIHOT"'
    exit 1
  fi
fi

nohup npx next start -p __PORT__ >>"$LOG" 2>&1 &
disown

for i in $(seq 1 90); do
  curl -s --noproxy '*' -o /dev/null --max-time 2 "$URL/api/public/version" && break
  sleep 1
done
open "$URL"
osascript -e 'display notification "已启动，网页已在浏览器打开" with title "AIHOT"' || true
LAUNCHEOF

# ── 6. Windows 入口 ──
cat > "$PKG/Windows双击这里.bat" <<'BATEOF'
@echo off
chcp 65001 >nul
set "URL=http://localhost:__PORT__"
curl -s -o NUL --max-time 2 %URL%/api/public/version >nul 2>&1
if not errorlevel 1 ( start "" %URL% & exit /b 0 )
set "RES=%~dp0AIHOT.app\Contents\Resources"
set "PATH=%RES%\runtime\node-win-x64;%PATH%"
set "PRISMA_ENGINES_MIRROR=__PRISMA_MIRROR__"
cd /d "%RES%\server"
if not exist node_modules (
  echo ════════════════════════════════════════════
  echo  首次启动：正在安装组件，约需 3-5 分钟
  echo  请保持联网，不要关闭本窗口
  echo ════════════════════════════════════════════
  call npm ci
  if errorlevel 1 ( echo. & echo 安装失败，请检查网络后重新双击 & pause & exit /b 1 )
  call npx prisma generate
  if errorlevel 1 ( echo 初始化失败，请重新双击重试 & pause & exit /b 1 )
  call npx next build
  if errorlevel 1 ( echo 构建失败，请重新双击重试 & pause & exit /b 1 )
)
echo.
echo 服务启动中，浏览器稍后自动打开 %URL%
echo 请最小化本窗口（关闭窗口 = 停止服务）。
start "" cmd /c "timeout /t 6 /nobreak >nul & start "" %URL%"
call npx next start -p __PORT__
pause
BATEOF

# ── 7. 使用说明（极简）──
cat > "$PKG/使用说明.txt" <<EOF
【AIHOT 使用说明】

Mac：    第一次：右键点 AIHOT 图标 → 打开 → 再点「打开」（系统安全确认，仅此一次）
         之后：双击 AIHOT 图标即可
Windows：双击「Windows双击这里.bat」
         （如提示"Windows 已保护你的电脑"：点「更多信息」→「仍要运行」）

第一次启动需联网安装组件（约 3-5 分钟，图标会一直在程序坞/窗口里，耐心等），
完成后浏览器自动打开网页；之后每次双击都是秒开。

想抓取最新 AI 资讯：点网页右上角「↻ 更新数据」按钮即可。
有任何报错：截图发回来。
EOF

# ── 8. 替换占位符、CRLF、可执行位 ──
sed -i '' "s|__PORT__|$PORT|g; s|__PRISMA_MIRROR__|$PRISMA_MIRROR|g" \
  "$APP/Contents/MacOS/AIHOT" "$PKG/Windows双击这里.bat"
sed -i '' $'s/$/\r/' "$PKG/Windows双击这里.bat"
chmod +x "$APP/Contents/MacOS/AIHOT"

# ── 9. 打 zip（-y 保留符号链接）──
echo "==> 压缩"
cd "$DIST"
rm -f "$PKG_NAME.zip"
zip -qry "$PKG_NAME.zip" "$PKG_NAME"
echo
echo "✅ 打包完成：$DIST/$PKG_NAME.zip"
du -sh "$PKG_NAME.zip"
