### Docker Primer Exercise 3

### Background

The `backend` and `frontend` folders contain a simple flask backend that runs an AI pipeline. The frontend is a react application to use the AI feature. This product performs sentiment analysis which takes in sentences and determines whether they sound positive or negative. For example, "I am eager to finish this primer" has a positive sentiment and "I am tired of learning about docker" has a negative sentiment.

### Exercise

You must complete the `docker-compose.yml` file. It already contains one service. Do not modify this. Underneath, add two additional services. The first should be called `app` which will handle the backend, and the other should be called `frontend`.

There are a few key requirements:

1. I want to use this service on `localhost:3901`.
2. I want the `app` service to run before the `frontend` service.
3. The software should be run entirely through `docker compose up`

Once you have filled out the `docker-compose.yml` file, go to the specified url and verify that the application works. If my above examples output the appropriate sentiment scores, you've completed this exercise!
