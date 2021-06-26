#!/bin/bash
set -e

# this is all quite ridiculous, but whatever. we need to link in all these things
yarn
yarn link

cd node_modules/react;
yarn link
cd ../..

cd node_modules/react-dom
yarn link
cd ../..

cd site
yarn
yarn link use-remote-data react react-dom
cd ..

yarn dev
