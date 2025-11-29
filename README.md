# ChainMaker Webapp

Instructions for deployment:
1. Clone this repository. 
2. Install [Node.js](https://nodejs.org/en/download) on your local machine. Navigate to the repository directory, and run `npm install` from a command line to download the packages needed to run the server.
3. Deploy a MongoDB server, either locally or using a managed service (such as [Atlas](https://www.mongodb.com/products/platform/atlas-database)). Create a database with a collection called "chains".
4. In the root of the ChainMaker repository, paste the following text into a new file called ".env". Change `MONGO_URI` to the connetion string for your MongoDB database. If you wish to use HTTPS, change `USE_HTTPS` to `true` and change `CERT_PATH` to the folder containing your SSL encryption data.

>     # Connection string for MongoDB database containing "chains" collection. #
>     
>     MONGO_URI=mongodb://localhost:27017/backup
>     
>     # Number of bytes of image storage per chain. #
>     
>     IMAGE_LIMIT_BYTES=1000000
>     IMAGE_LIMIT_STRING=1 MB
>          
>     # Set USE_HTTPS to "true" to enable https. #
>     # CERT_PATH should be the path of the folder containing "privkey.pem" and "cert.pem". #
>     
>     USE_HTTPS=false
>     CERT_PATH=false

5. Navigate to the repository folder in a command line and run `npm run build`, which build the javascript files served by the app. You will likely have to repeat this step every time you modify the contents of the `app` folder, where most of the content and logic of the app lives.
6. Finally, to run the server, use the`npm start` command. It is recommended that you create a service on your machine that does this for you, if you want to serve the app persistently.
