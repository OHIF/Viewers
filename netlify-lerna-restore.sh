#!/bin/sh
NODE_MODULES_CACHE="./node_modules"
LERNA_CACHE="$NODE_MODULES_CACHE/lerna-cache"

echo "Running netlify-lerna-restore.sh"
mkdir -p "$NODE_MODULES_CACHE/lerna-cache"
echo "$NODE_MODULES_CACHE/lerna-cache/*"

restore_deps() {
    PACKAGES=$(ls -1 $1)

    for PKG in $PACKAGES
    do
        PKG_CACHE="$LERNA_CACHE/$PKG"
        if [ -d $PKG_CACHE ];
        then
            mv $PKG_CACHE $1/$PKG/node_modules
            echo "Restored node modules for $PKG"
        else
            echo "Unable to restore cache for $PKG"
        fi
    done
}

restore_deps platform
restore_deps extensions
restore_deps modes