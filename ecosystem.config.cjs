module.exports = {
  apps: [
    {
      name: "harvey-tools",
      script: "dist/index.js",
      cwd: "/home/deploy/projects/harvey-tools",
      node_args: "--enable-source-maps",
      env: {
        NODE_ENV: "production",
        PORT: 8403,
      },
      max_memory_restart: "512M",
      autorestart: true,
      watch: false,
    },
  ],
};
