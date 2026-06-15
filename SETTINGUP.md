
# This documents how to configure Your local environment to work in this project

## Configuring a cluster locally using `Kind`

- Create the cluster with the command `kind create cluster --name=sprint-3-project`
- Note: Locally all these resources are just docker containers running in different levels of abstraction so the "cluster" is a docker image hence when running the prev command You will see logs like  "**Ensuring node image (kindest/node:v1.35.1) 🖼**" and "**Preparing nodes 📦**".This is them just saying we are preparing to run a container which You will use as a "node".This is easy to track if you have a Docker desktop installed locally. Run the command to verify that Your control plane is actually just a docker container `docker ps -a` or `docker ps -a | grep "node"`.This lists all docker contaners in Your computer including the "control-plane-node" of Your cluster.
- Check existence of newly created cluster using `kind get clusters`.This will return the name of your newly created cluster "**sprint-3-project**"

### In this section we try to ensure that we have worker "nodes" and a control plane seperated.

- We need to recreate the cluster from scratch so that the config can actually be applied and worker nodes joined.Since this config is not a runtime config we cannot really apply it to an existing cluster.**Apologies here gents I also did not know**.Run `kind delete cluster --name-sprint-3-project`A wise man once said You we learn by making our teammates suffer💀 
- create cluster with the config applied by running `kind create cluster --name=sprint-3-project --config kind-config.yaml`

- Run the commands to check if all 3 worker nodes are joined in the cluster and everything is ready `kind get clusters` and `kubectl get nodes`.Again what happened is that kind simulated all that technical stuff of joining worker nodes and all by just creating another set of containers which will be used as physical nodes in our local config.Run the docker command to verify this behaviour `docker ps -a | grep "node"`

- Now everything is done locally and thus we can start writing our deployments and yamls to achieve behaviour

## Everything that we have done above is only to config our local environment to simulate kubernetes running on a cloud environment so in real environment,the setup is quite complicated by pays off well.This is to just ensure we are all well setup to start running our environment.