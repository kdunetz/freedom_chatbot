#!/bin/bash

#IMAGE=kdunetz/it-chatbot:2.0

if [ -z "$IMAGE" ]
then
   echo "Please set environment variables with . ./setenv.sh"  
   exit
fi

docker build -t $IMAGE .
docker push $IMAGE 

#docker run -p 3000:3000 -d $IMAGE
#kubectl delete -f deploy_and_service.yml
#kubectl create -f deploy_and_service.yml

kubectl set image deployment/$NAME $NAME=$IMAGE -n default

