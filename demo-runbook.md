# Demo Runbook — Docker/Kubernetes with Remote LocalStack

This runbook is for running the application locally or in Kubernetes while targeting a **remote LocalStack instance** instead of real AWS.

> Replace placeholders like `<localstack-host-or-ip>` and `<region>` before running the commands.

---

## 0. Assumptions

- LocalStack is already running on a remote machine/server.
- The LocalStack edge/gateway port is reachable from your workstation and from your Kubernetes nodes/pods.
- Default LocalStack endpoint format is:

```bash
http://<localstack-host-or-ip>:4566
```

- Demo AWS credentials are used because LocalStack does not require real AWS credentials for local emulation:

```bash
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=us-east-1
```

---

## 1. Check local tools

```bash
docker --version
kubectl version --client
terraform version
minikube status
aws --version
```

Optional, if you use LocalStack helper CLIs:

```bash
awslocal --version
tflocal --version
```

If missing:

```bash
pip install awscli-local terraform-local
```

---

## 2. Configure connection to remote LocalStack

Set the remote LocalStack endpoint:

```bash
export LOCALSTACK_ENDPOINT="http://<localstack-host-or-ip>:4566"
export AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT"
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_DEFAULT_REGION="us-east-1"
```

For PowerShell:

```powershell
$env:LOCALSTACK_ENDPOINT="http://<localstack-host-or-ip>:4566"
$env:AWS_ENDPOINT_URL=$env:LOCALSTACK_ENDPOINT
$env:AWS_ACCESS_KEY_ID="test"
$env:AWS_SECRET_ACCESS_KEY="test"
$env:AWS_DEFAULT_REGION="us-east-1"
```

Create an optional AWS CLI profile for repeatable commands:

```bash
aws configure set aws_access_key_id test --profile localstack
aws configure set aws_secret_access_key test --profile localstack
aws configure set region us-east-1 --profile localstack
aws configure set output json --profile localstack
aws configure set endpoint_url "$LOCALSTACK_ENDPOINT" --profile localstack
```

---

## 3. Validate remote LocalStack connectivity

Check LocalStack health:

```bash
curl -sS "$LOCALSTACK_ENDPOINT/_localstack/health"
```

Check AWS CLI connectivity:

```bash
aws --endpoint-url="$LOCALSTACK_ENDPOINT" sts get-caller-identity
```

Or, using the profile:

```bash
aws --profile localstack sts get-caller-identity
```

If using `awslocal`, make sure it points to the remote endpoint:

```bash
AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT" awslocal sts get-caller-identity
```

---

## 4. Create demo AWS resources in remote LocalStack

Use these to prove your workstation is provisioning resources into the remote LocalStack environment.

```bash
aws --endpoint-url="$LOCALSTACK_ENDPOINT" s3 mb s3://team-status-demo-bucket
aws --endpoint-url="$LOCALSTACK_ENDPOINT" s3 ls
```

Optional SQS check:

```bash
aws --endpoint-url="$LOCALSTACK_ENDPOINT" sqs create-queue --queue-name team-status-events
aws --endpoint-url="$LOCALSTACK_ENDPOINT" sqs list-queues
```

Optional DynamoDB check:

```bash
aws --endpoint-url="$LOCALSTACK_ENDPOINT" dynamodb create-table   --table-name team-status   --attribute-definitions AttributeName=id,AttributeType=S   --key-schema AttributeName=id,KeyType=HASH   --billing-mode PAY_PER_REQUEST

aws --endpoint-url="$LOCALSTACK_ENDPOINT" dynamodb list-tables
```

---

## 5. Docker stage

Build the application image:

```bash
docker build -t team-status-api:v1 ./app
```

Run the container locally and pass the remote LocalStack endpoint into the application:

```bash
docker run --rm -p 8080:8080   -e APP_VERSION="v1.0.0"   -e ENVIRONMENT="docker-local"   -e AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT"   -e AWS_ACCESS_KEY_ID="test"   -e AWS_SECRET_ACCESS_KEY="test"   -e AWS_DEFAULT_REGION="us-east-1"   team-status-api:v1
```

Test the app:

```bash
curl http://localhost:8080
curl http://localhost:8080/health
curl http://localhost:8080/metadata
```

If the app has an AWS/LocalStack test endpoint, run it here, for example:

```bash
curl http://localhost:8080/aws/status
```

---

## 6. Kubernetes stage

Check the cluster:

```bash
kubectl get nodes
```

If using Minikube and you want Kubernetes to use the locally-built image:

```bash
minikube image load team-status-api:v1
```

Apply Kubernetes manifests:

```bash
kubectl apply -f k8s/
```

Pass the remote LocalStack endpoint into the deployment:

```bash
kubectl set env deployment/team-status-api   APP_VERSION="v1.0.0"   ENVIRONMENT="kubernetes-local"   AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT"   AWS_ACCESS_KEY_ID="test"   AWS_SECRET_ACCESS_KEY="test"   AWS_DEFAULT_REGION="us-east-1"
```

Verify objects:

```bash
kubectl get pods
kubectl get deployments
kubectl get svc
kubectl rollout status deployment/team-status-api
```

Port-forward to test the service locally:

```bash
kubectl port-forward svc/team-status-api 8080:8080
```

In another terminal:

```bash
curl http://localhost:8080
curl http://localhost:8080/health
curl http://localhost:8080/metadata
```

---

## 7. Validate pod-to-remote-LocalStack connectivity

This step confirms that the Kubernetes network can reach the remote LocalStack endpoint.

```bash
kubectl run localstack-connectivity-test   --rm -it   --restart=Never   --image=curlimages/curl   -- curl -sS "$LOCALSTACK_ENDPOINT/_localstack/health"
```

If this fails, check:

- The remote server firewall/security group allows inbound TCP `4566` from your Kubernetes node/pod network.
- The LocalStack container is bound to `0.0.0.0:4566`, not only `127.0.0.1:4566`.
- Your `LOCALSTACK_ENDPOINT` uses a hostname/IP reachable from inside Kubernetes, not just from your laptop.
- DNS resolution works inside the cluster.

---

## 8. Kubernetes scaling demo

Manual scaling:

```bash
kubectl scale deployment team-status-api --replicas=3
kubectl get pods -w
```

If the app exposes a CPU stress endpoint:

```bash
curl "http://localhost:8080/stress?duration=10"
```

If HPA is configured in your manifests:

```bash
kubectl get hpa
kubectl get pods -w
```

---

## 9. Kubernetes self-healing demo

Get pods:

```bash
kubectl get pods
```

Delete one pod and watch Kubernetes recreate it:

```bash
kubectl delete pod <pod-name>
kubectl get pods -w
```

If the app exposes a crash endpoint:

```bash
curl http://localhost:8080/crash
kubectl get pods -w
```

---

## 10. Rolling update demo

Build a new app image:

```bash
docker build -t team-status-api:v2 ./app
```

For Minikube:

```bash
minikube image load team-status-api:v2
```

Update the deployment image:

```bash
kubectl set image deployment/team-status-api team-status-api=team-status-api:v2
kubectl set env deployment/team-status-api APP_VERSION="v2.0.0"
kubectl rollout status deployment/team-status-api
```

Verify:

```bash
curl http://localhost:8080/version
kubectl get pods
```

---

## 11. Rollback demo

Show rollout history:

```bash
kubectl rollout history deployment/team-status-api
```

Rollback to the previous revision:

```bash
kubectl rollout undo deployment/team-status-api
kubectl rollout status deployment/team-status-api
```

Verify the previous version:

```bash
curl http://localhost:8080/version
```

---

## 12. Terraform stage with remote LocalStack

Move into the Terraform directory:

```bash
cd terraform
```

Use the remote LocalStack endpoint:

```bash
export AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT"
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_DEFAULT_REGION="us-east-1"
```

Recommended LocalStack wrapper approach:

```bash
tflocal init
tflocal plan
tflocal apply
```

Alternative standard Terraform approach if your provider is configured for custom endpoints:

```bash
terraform init
terraform plan
terraform apply
```

Validate created resources:

```bash
aws --endpoint-url="$LOCALSTACK_ENDPOINT" s3 ls
aws --endpoint-url="$LOCALSTACK_ENDPOINT" sqs list-queues
aws --endpoint-url="$LOCALSTACK_ENDPOINT" dynamodb list-tables
```

Return to project root:

```bash
cd ..
```

---

## 13. Troubleshooting remote LocalStack

### Cannot connect to LocalStack

```bash
curl -v "$LOCALSTACK_ENDPOINT/_localstack/health"
```

Check remote LocalStack host:

```bash
docker ps | grep localstack
docker logs localstack-main --tail=100
```

### Port is not reachable

From your workstation:

```bash
nc -vz <localstack-host-or-ip> 4566
```

From Kubernetes:

```bash
kubectl run localstack-port-test   --rm -it   --restart=Never   --image=busybox   -- sh -c "nc -vz <localstack-host-or-ip> 4566"
```

### AWS CLI is trying to reach real AWS

Confirm the endpoint is set:

```bash
echo "$AWS_ENDPOINT_URL"
aws configure get endpoint_url --profile localstack
```

Then run with explicit endpoint:

```bash
aws --endpoint-url="$LOCALSTACK_ENDPOINT" s3 ls
```

### Pods can reach the app but not LocalStack

Check that the endpoint passed to Kubernetes is not `localhost` unless LocalStack is running inside the same pod.

Bad for remote LocalStack:

```bash
AWS_ENDPOINT_URL=http://localhost:4566
```

Good for remote LocalStack:

```bash
AWS_ENDPOINT_URL=http://<localstack-host-or-ip>:4566
```

---

## 14. Cleanup

Delete Kubernetes resources:

```bash
kubectl delete -f k8s/
```

Delete demo resources from remote LocalStack:

```bash
aws --endpoint-url="$LOCALSTACK_ENDPOINT" s3 rb s3://team-status-demo-bucket --force
aws --endpoint-url="$LOCALSTACK_ENDPOINT" sqs delete-queue --queue-url "$(aws --endpoint-url="$LOCALSTACK_ENDPOINT" sqs get-queue-url --queue-name team-status-events --query QueueUrl --output text)"
aws --endpoint-url="$LOCALSTACK_ENDPOINT" dynamodb delete-table --table-name team-status
```

If using Terraform:

```bash
cd terraform
tflocal destroy
cd ..
```
