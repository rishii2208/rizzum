#!/usr/bin/env bash
set -euo pipefail

TEX_VERSION=0.15.0
ARCHIVE="tectonic-${TEX_VERSION}-x86_64-unknown-linux-gnu.tar.gz"
URL="https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic-${TEX_VERSION}/${ARCHIVE}"

mkdir -p bin tmp/tectonic-download
curl -L "$URL" | tar xz -C tmp/tectonic-download
mv tmp/tectonic-download/tectonic*/tectonic bin/tectonic
chmod +x bin/tectonic
rm -rf tmp/tectonic-download