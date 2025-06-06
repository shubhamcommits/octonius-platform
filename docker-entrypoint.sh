#!/bin/sh

if [ "$NODE_ENV" = "prod" ]; then
    exec npm run start:prod
else
    exec npm run start:dev
fi 