# todo backend

[![CircleCI](https://circleci.com/gh/fidelisojeah/todo.svg?style=svg)](https://circleci.com/gh/fidelisojeah/todo)


## Getting Started

## Table of Contents

-   [Table of Contents](#table-of-contents)
-   [Built Using](#built-using)
-   [Installation and Configuration](#installation-and-configuration)
-   [Running the Application](#running-the-application)
    > -   [For testing](#for-testing)
    > -   [For Development](#for-development)
    > -   [Running with Docker](#running-with-docker)
    > -   [Production](#for-production)
-   [Configure Environment Variables](#configure-environment-variables)

## Built Using

-   [Node.js](https://nodejs.org/en/)

    > -   [Typescript](https://www.typescriptlang.org/)
    > -   [express](https://expressjs.com/)
    > -   [mongoose](https://mongoosejs.com/)
    > -   [Jest](https://jestjs.io/)

-   [MongoDB](https://www.mongodb.com/)

### Installation and Configuration

Before Installation, ensure you have node.js and PostgreSQL installed on your device.

-   Clone the Repository

```bash
git clone git@github.com:fidelisojeah/todo.git
```

-   Install Dependencies

```bash
npm install
```

-   Configure Environment Variables

    > -   Configure Environment Variables as specified [Here](#configure-environment-variables)

### Running the application

Documentation is available at: [/api-docs](https://todo-backend-task.herokuapp.com/api-docs)

#### For testing

The applications tests are run with jest

```bash
npm run test
```

#### For development

The application uses nodemon to enable quick reload on changes

```bash
npm run start:dev
```

### Running with Docker

it is possible to run the application with docker.

Simply have docker installed on your machine.

```bash
docker-compose up
```

### For production

Application is deployed to heroku and available [here](https://todo-backend-task.herokuapp.com/)

## Configure Environment Variables

The following Environment variables need to be set and exported for application to function properly

```
MONGO_URI= The database credentials
SECRET= the secret used for jwt authentication
LOGGER_LEVEL=debug
```
