## Docker Primer Exercise 2

### Fill out /backend Dockerfile

We want to run this backend container using Docker. You will need to add the following to the `Dockerfile` in the `backend` directory.

1. We need to use the base image for `python:3.8-slim`. This is a small version of Python
2. Our working directory can simply be `/usr/src/app`
3. Next let's copy all files from `.` (current directory) into `.` (in the docker container)
4. In Python we have a `requirements.txt` file which specifies all the required packages. We have provided that to you. You need to run `pip install --no-cache-dir -r requirements.txt` inside your container. This command uses `pip` which is Python's package manager to install all packages from `requirements.txt`
5. Let the container know that we will be listening to port 5000
6. Specify the command to run the backend which is `python app.py` (make sure to double check the command you use to do this and its syntax)

### Fill out /frontend Dockerfile

This will be very similar to the one for the backend. The key changes are

1. Since this isn't Python, our base image will be `node:14`
2. `pip` is for Python and we will be using `yarn` here so change the `pip install ...` command to `yarn install`
3. Your final command to run the application should be `CMD ["yarn", "start"]` as the frontend runs when we use `yarn start`

### Docker Compose

We have provided you a docker compose file `docker-compose.yml` for this exercise. You will not need to modify it in any way for this exercise.

Since we have multiple containers, in order to manage them, we use docker compose. We use it to unify the process of running both containers at the same time. It specifies all the containers we need, any additional information we want to provide and then manages them.

You can run both containers at the same time (to run the entire application) using

```
docker compose up
```

Note that on older versions where the above command does not work, use `docker-compose up` instead.

### Verifying that you have completed this exercise

If you go to `localhost:3333` on any browser it should say "Test: PASSED"
Note: we go to `localhost:3333` as that is what we specified as the host port in our `docker-compose.yml` for the frontend. This is specified by `3333:3000` which takes port 3000 from the container and specifies that we can listen to it on our computer on port 3333.


If you do not see "Test: PASSED" there is an error in one of your Dockerfiles. Try building and running each of them separately to see if any errors are caught.
