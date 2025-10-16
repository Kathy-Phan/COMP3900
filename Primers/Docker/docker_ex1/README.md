## Docker Primer Exercise 1

Build the image. The image contains all the required packages required to run the application (as specified in the Dockerfile)
```
docker build -t 3900_primer_ex1 .
```

We want to take the image and run it (which we call a container).
```
docker run -t -i -p 3000:3000 3900_primer_ex1
```

You can view the application on your browser at `localhost:3000`
