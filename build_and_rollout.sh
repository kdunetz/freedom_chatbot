#!/bin/bash

IMAGE=kdunetz/it-chatbot:3.0

docker build -t $IMAGE .
docker push $IMAGE 
#docker run -p 3000:3000 -d $IMAGE
#kubectl delete -f deploy_and_service.yml
#kubectl create -f deploy_and_service.yml
kubectl set image deployment/it-chatbot it-chatbot=$IMAGE

