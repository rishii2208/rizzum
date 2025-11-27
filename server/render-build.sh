#!/usr/bin/env bash
set -euo pipefail

TEX_VERSION=0.15.0
BUILD_TAG=20251006
RELEASE_TAG=continuous
ARCHIVE_CANDIDATES=(
	"tectonic-${TEX_VERSION}+${BUILD_TAG}-x86_64-unknown-linux-musl.tar.gz"
	"tectonic-${TEX_VERSION}-x86_64-unknown-linux-musl.tar.gz"
)

mkdir -p bin tmp/tectonic-download
ARCHIVE_PATH=""

for ARCHIVE in "${ARCHIVE_CANDIDATES[@]}"; do
	URL="https://github.com/tectonic-typesetting/tectonic/releases/download/${RELEASE_TAG}/${ARCHIVE}"
	if curl -fsSL "$URL" -o tmp/tectonic-download/${ARCHIVE}; then
		ARCHIVE_PATH="tmp/tectonic-download/${ARCHIVE}"
		break
	fi
done

if [[ -z "$ARCHIVE_PATH" ]]; then
	echo "Failed to download Tectonic release archive" >&2
	exit 1
fi

tar -xzf "$ARCHIVE_PATH" -C tmp/tectonic-download
TECTONIC_BIN=$(find tmp/tectonic-download -type f -name tectonic -print -quit)

if [[ -z "$TECTONIC_BIN" ]]; then
	echo "Extracted archive does not contain a tectonic binary" >&2
	exit 1
fi

mv "$TECTONIC_BIN" bin/tectonic
chmod +x bin/tectonic
rm -rf tmp/tectonic-download