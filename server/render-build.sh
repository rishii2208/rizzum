#!/usr/bin/env bash
set -euo pipefail

TEX_VERSION=0.15.0
BUILD_TAG=20251006
ARCHIVE="tectonic-${TEX_VERSION}+${BUILD_TAG}-x86_64-unknown-linux-gnu.tar.gz"
URL="https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic-${TEX_VERSION}/${ARCHIVE}"

mkdir -p bin tmp/tectonic-download
curl -fL "$URL" -o tmp/tectonic-download/${ARCHIVE}
tar -xzf tmp/tectonic-download/${ARCHIVE} -C tmp/tectonic-download
mv tmp/tectonic-download/tectonic*/tectonic bin/tectonic
chmod +x bin/tectonic
rm -rf tmp/tectonic-download