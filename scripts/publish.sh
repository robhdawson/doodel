#!/bin/sh

#
# Let's echo with colors and such
#

RED='\033[0;31m'
GREEN='\033[0;92m'
NC='\033[0m' # No Color

#
# Echoes stuff with color and formatting.
# $1 message
# $2 color variable
#
# e.g., `output "hey" $RED`
#
output() {
    echo "\n$2#### $1${NC}\n"
}

if [[ $(git status --porcelain) ]]; then
    output "Exiting because working directory is not clean!" $RED
    exit 1
fi


REMOTE="origin"
FLAG="--publish"
BUILDPATH="build/prod"

output "Deploying..." $GREEN

output "Doing git business..." $GREEN
git checkout master
git pull origin master

output "Building..." $GREEN
node scripts/build $FLAG

output "Comitting and pushing...." $GREEN
git add $BUILDPATH
git commit -m "Build for publishing."
git subtree push --prefix=$BUILDPATH $REMOTE gh-pages
git push origin master

output "Done! Neat!" $GREEN
