ViRest
======

ViRest creates a simple virtual JSON-REST Interface to test your frontend again a fault-resilient backend for development purpose.

![](https://github.com/StarpTech/ViRest/raw/master/virest.png)

**Example YAML VirtualHosts configuration**:
```
---
#VirtualHost 'books.de'
- description: Represents the virtual REST Endpoint for collections
  host : books.de
  routes:
   books:
   #All GET Requests
    - GET:
       - name: Get all books
         url: /books/All
         ressource: get-all.yaml
       - name: Get one book
         url: /books/Get
         ressource: get-one.yaml
```

+ **host**: This entry must be included in the windows (etc) host file to map this url to the node server.
+ **routes**: This defines the REST-Verbs actions.
+ **name**: The name of the route to recognize it in the console.
+ **url**: The relative url to the host which matchs your route.
+ **ressource**: The returned ressource to this route.

**Important:**

1. Don´t forget to create your virtual hosts in the host file (Windows 'etc')
  + **Example**: 127.0.0.1 test.de
2. After editing your VirtualHosts.yaml the program creates the directory structure automatically.
3. To get data from your virtual host you have to use the port 9001 e.g test.de:9001
4. The ressource files ends with .yaml but you can also use plain JSON in it.
