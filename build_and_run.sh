#!/bin/bash

IMAGE=kdunetz/it-chatbot:4.0
NAME=it-chatbot

docker build -t $IMAGE .
docker push $IMAGE 
docker run -p 3000:3000 -d $IMAGE
