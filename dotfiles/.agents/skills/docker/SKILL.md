---
name: docker
description:
  Manage Docker images, containers, networks, and volumes.
  This skill provides expert guidance on common tasks like listing, starting,
  stopping, and removing containers, as well as debugging with logs and
  executing commands inside running containers.
metadata:
  author: CuriosLabs
  version: "1.1.0"
---

# Docker Skill

Use this skill to efficiently manage Docker environments. When interacting with
Docker, always prefer targeted commands and verify state changes.

## Container Operations

- **List active containers**: `docker ps`
- **List all containers (including exited)**: `docker ps -a`
- **Stop a container gracefully**: `docker stop <container_id_or_name>`
- **Force kill a container**: `docker kill <container_id_or_name>`
- **Remove a stopped container**: `docker rm <container_id_or_name>`
- **Start an existing container**: `docker start <container_id_or_name>`
- **Restart a container**: `docker restart <container_id_or_name>`

## Image Operations

- **List local images**: `docker images`
- **Remove an image**: `docker rmi <image_id_or_name>`
- **Prune dangling images**: `docker image prune`
- **Pull latest image**: `docker pull <image_name>:latest`

## Buildx & Multi-platform Operations

- **List buildx builders**: `docker buildx ls`
- **Create and use a new builder**: `docker buildx create --name <name> --use`
- **Inspect a builder**: `docker buildx inspect <name> --bootstrap`
- **Build for multiple platforms and push**:
  `docker buildx build --platform linux/amd64,linux/arm64 -t <tag> . --push`
- **Build and load into local image store**:
  `docker buildx build --platform linux/amd64 -t <tag> . --load`
- **Remove a builder**: `docker buildx rm <name>`
- **Prune build cache**: `docker buildx prune`

## Network Operations

- **List networks**: `docker network ls`
- **Create a bridge network**: `docker network create <network_name>`
- **Inspect network details**: `docker network inspect <network_name>`
- **Connect container to network**:
  `docker network connect <network_name> <container_name>`
- **Disconnect container from network**:
  `docker network disconnect <network_name> <container_name>`
- **Remove a network**: `docker network rm <network_name>`
- **Prune unused networks**: `docker network prune`

## Volume Operations

- **List volumes**: `docker volume ls`
- **Create a volume**: `docker volume create <volume_name>`
- **Inspect volume details**: `docker volume inspect <volume_name>`
- **Remove a volume**: `docker volume rm <volume_name>`
- **Prune unused volumes**: `docker volume prune`

## Docker Compose Operations

*(Note: Use `docker compose` for V2 or `docker-compose` for V1. The preferred
filenames for V2 are `compose.yaml` or `compose.yml`, though
`docker-compose.yaml` is still supported for backward compatibility)*

- **Start all services (detached)**: `docker compose up -d`
- **Stop and remove containers/networks**: `docker compose down`
- **Stop and remove containers/networks/volumes**: `docker compose down -v`
- **List service status**: `docker compose ps`
- **View service logs**: `docker compose logs -f`
- **Execute command in service**: `docker compose exec <service_name> <cmd>`
- **Build or rebuild services**: `docker compose build`
- **Pull service images**: `docker compose pull`
- **Restart services**: `docker compose restart`

## Configuration & Validation

- **Validate compose file (official)**:
  - Check and view resolved config: `docker compose config`
  - Quiet validation (returns exit code): `docker compose config -q`
- **YAML Linting (style/formatting)**:
  - Check with `yamllint`: `yamllint compose.yaml`
- **Programmatic Manipulation (yq)**:
  - Read specific value: `yq '.services.web.image' compose.yaml`
  - Update value in-place: `yq -i '.services.web.ports[0] = "8080:80"' compose.yaml`
  - Convert to JSON: `yq -o=json '.' compose.yaml`

## Monitoring & Debugging

- **Follow container logs**: `docker logs -f <container_id_or_name>`
- **View tail of logs**: `docker logs --tail 100 <container_id_or_name>`
- **Interactive shell access**:
  `docker exec -it <container_id_or_name> /bin/bash`
  *(Note: if `bash` is not available, try `sh`)*
- **Check container resource usage**: `docker stats`
- **Inspect container configuration**:
  - Full output (JSON): `docker inspect <container_id_or_name>`
  - Get IP Address: `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <container_id_or_name>`
  - Get Mounts/Volumes: `docker inspect -f '{{json .Mounts}}' <container_id_or_name> | jq`
  - Get State/Status: `docker inspect -f '{{.State.Status}}' <container_id_or_name>`
  - Get Environment Variables: `docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' <container_id_or_name>`

## Environment Cleanup

- **Complete system prune**: `docker system prune -a --volumes`
  *(Caution: This removes all unused containers, networks, images, and optionally volumes)*
