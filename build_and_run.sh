#!/bin/bash

#IMAGE=kdunetz/it-chatbot:4.0
#NAME=it-chatbot

if [ -z "$IMAGE" ]
then
   echo "Please set environment variables with . ./setenv.sh"  
   exit
fi

docker build -t $IMAGE .
docker push $IMAGE 
docker run -p 3000:3000 -d $IMAGE
