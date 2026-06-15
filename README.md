
## Presentation Objective

This presentation introduces the core Kubernetes concepts needed to understand how containerized applications are built, deployed, exposed, scaled, secured, and managed in a cloud environment.

**Total duration:** 20 minutes  
**Presenters:** 4  
**Format:** Slides + live terminal demos

### Key Kubernetes Points to Cover

- Kubernetes is a container orchestration platform.
- It manages containerized applications across a cluster of machines.
- Kubernetes helps with:
  - Deployment
  - Scaling
  - Networking
  - Self-healing
  - Rollouts and rollbacks

### Core Architecture

- **Cluster**
  - A group of machines running Kubernetes.

- **Control Plane**
  - Makes decisions about the cluster.
  - Manages scheduling, desired state, and cluster operations.

- **Worker Nodes**
  - Run application workloads.

- **Pods**
  - The smallest deployable unit in Kubernetes.
  - Usually contains one application container.

- **kubectl**
  - Command-line tool used to interact with Kubernetes.

### Suggested Message

Kubernetes works by constantly comparing the desired state of the application with the current state of the cluster and making changes automatically.

---
