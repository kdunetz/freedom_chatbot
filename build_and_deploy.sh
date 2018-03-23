#!/bin/bash

#IMAGE=kdunetz/kevin-new-chatbot:1.0
#NAME=kevin-new-chatbot

if [ -z "$IMAGE" ]
then
   echo "Please set environment variables with . ./setenv.sh"  
   exit
fi

docker build -t $IMAGE .
docker push $IMAGE 
#docker run -p 3000:3000 -d $IMAGE
IMAGE=${IMAGE//[\/]/\\\/}
kubectl delete -f <(cat deploy_and_service.yml | sed "s/IMAGE/$IMAGE/g" | sed "s/NAME/$NAME/g") -n default
kubectl create -f <(cat deploy_and_service.yml | sed "s/IMAGE/$IMAGE/g" | sed "s/NAME/$NAME/g") -n default
