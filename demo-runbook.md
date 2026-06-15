# Check tools
docker --version
kubectl version --client
terraform version
minikube status

# Docker stage
docker build -t team-status-api:v1 ./app
docker run -p 8080:8080 team-status-api:v1
curl http://localhost:8080

# Kubernetes stage
kubectl get nodes
kubectl apply -f k8s/
kubectl get pods
kubectl get deployments
kubectl get svc

# Kubernetes scaling
kubectl scale deployment team-status-api --replicas=3
kubectl get pods

# Kubernetes self-healing
kubectl delete pod
kubectl get pods

# Terraform stage
cd terraform
terraform init
terraform plan
terraform apply
kubectl get al