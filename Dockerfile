# Official Node.js image based on Alpine to reduce image size.
FROM node:22-alpine

# Working directory inside the container.
WORKDIR /app

# Enable pnpm inside the image through Corepack.
RUN corepack enable

# Copy manifests first so Docker can reuse its build cache.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install exactly the versions recorded in the lockfile.
RUN pnpm install --frozen-lockfile

# Copy the source code and project configuration.
COPY . .

# Compile TypeScript into dist/.
RUN pnpm build

# Internal Express port.
EXPOSE 3000

# Default command for the API container.
CMD ["pnpm", "start"]
