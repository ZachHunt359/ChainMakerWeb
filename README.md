# ChainMaker Webapp

Web-based tool for managing JumpChain adventures. Built with Remix, Node.js, and MongoDB.

## Quick Start

### Local Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Create `.env` file (see `.env.example` for template)
4. Build the application: `npm run build`
5. Start the server: `npm start`
6. Visit http://localhost:3000

### Deployment

**For detailed deployment instructions with credentials, see `docs/DEPLOYMENT.md`** (private, not in repository).

The `docs/` folder contains private documentation with sensitive information like:
- VPS deployment procedures
- Database credentials
- Server configurations
- Security setup guides

This folder is gitignored and not tracked in the repository.

## Basic Setup

## Basic Setup

Instructions for deployment:
1. Clone this repository. 
2. Install [Node.js](https://nodejs.org/en/download) on your local machine. Navigate to the repository directory, and run `npm install` from a command line to download the packages needed to run the server.
3. Deploy a MongoDB server, either locally or using a managed service (such as [Atlas](https://www.mongodb.com/products/platform/atlas-database)). Create a database with a collection called "chains".
4. In the root of the ChainMaker repository, copy `.env.example` to `.env` and configure:
   - `MONGO_URI` - Connection string for your MongoDB database
   - `PORT` - Server port (default: 3000)
   - `IMAGE_LIMIT_BYTES` - Max image size per chain
   - `LEGACY_MYSQL_*` - Credentials for legacy MySQL sync (if needed)
   - For HTTPS with custom certificates, set `USE_HTTPS=true` and configure `CERT_PATH`

5. Navigate to the repository folder in a command line and run `npm run build`, which builds the javascript files served by the app. You will likely have to repeat this step every time you modify the contents of the `app` folder, where most of the content and logic of the app lives.
6. Finally, to run the server, use the`npm start` command. It is recommended that you create a service on your machine that does this for you, if you want to serve the app persistently.

## Environment Variables

See `.env.example` for a complete list of configuration options.

Key variables:
- `MONGO_URI` - MongoDB connection string
- `PORT` - Server port
- `IMAGE_LIMIT_BYTES` - Maximum image size
- `LEGACY_MYSQL_HOST`, `LEGACY_MYSQL_USER`, `LEGACY_MYSQL_PASSWORD`, `LEGACY_MYSQL_DATABASE` - Legacy sync credentials
