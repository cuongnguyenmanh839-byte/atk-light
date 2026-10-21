@echo off
cd /d "%~dp0"
node -e "require('ts-node').register({transpileOnly:true,compilerOptions:{module:'commonjs'}}); require('./prisma/seed.ts');"
