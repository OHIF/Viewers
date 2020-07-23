#!/bin/sh
NODE_MODULES_CACHE="./node_modules"
LERNA_CACHE="$NODE_MODULES_CACHE/lerna-cache"

echo "Running netlify-lerna-cache.sh"
mkdir -p "$NODE_MODULES_CACHE/lerna-cache"

cache_deps() {
    PACKAGES=$(ls -1 $1)

    for PKG in $PACKAGES
    do
        PKG_NODE_MODULES="$1/$PKG/node_modules"
        if [ -d $PKG_NODE_MODULES ];
        then
            mv $PKG_NODE_MODULES $LERNA_CACHE/$PKG
            echo "Cached node modules for $PKG"
        else
            echo "Unable to cache node modules for $PKG"
        fi
    done
}

cache_deps platform
cache_deps extensions
cache_deps modes