[![Netlify Status](https://api.netlify.com/api/v1/badges/7f46aff5-243e-4de3-90a6-d3416f789f85/deploy-status)](https://app.netlify.com/sites/thermastore/deploys)
# Thermastore
Thermastore is a cloud storage which utilizes Discord for storing files. Here you can upload and organize your files. This project is powered by NextJS 13 for handling frontend and some of the back end, Supabase for saving information about stored files and protecting the database with RLS.  
  
Discord has CORS setup. So to download files, watch videos and listen to audio you will need to use a proxy server [Streamer](https://github.com/Zeptosec/Streamer).

## How it works?
When uploading a file it is split up into pieces (around 25 MB) then each piece is uploaded to Discord server using webhook and attachment file id and channel id to which it was uploaded is stored into file and uploaded using the same webhook.

## Caveats
Storing files like this is not as safe as storing links to pieces into other database but this way it takes much less space in the database. Sadly uploaded files are accessible to anyone if they know file and channel ids which is very unlikely unless they have access to channel where the files were uploaded or you have shared the file with them.  
  
Deleting files is not possible webhooks can only send messages it can not delete messages. Possible solution to this problem is to create a bot which would delete the data file and other file specified in data file

## Features
A list of features that have been implemented. You can always suggest a feature in the [issues](https://github.com/Zeptosec/Thermastore/issues) tab.
| Description | Status |
| ------------ | :-----------: |
| Creating directories   |  ✔ |
| Moving files  | ✔ |
| Moving directories  | ✔ |
| Uploading multiple files  | ✔  |
| Drag and Drop support  | ✔  |
| Preview audio, video files ([Streamer](https://github.com/Zeptosec/Streamer))  | ✔  |
| Preview PDF <25 MB | ✔ |
| Play audio files from menu  | ✔  |
| Upload pause/resume | ✔ |
| File search | ✔ |
| Directory uploads | ✔ |

## Getting started
To start clone this repository:
```sh
git clone https://github.com/Zeptosec/Thermastore.git
```
Then install required npm packages with:
```sh
npm install
```
Rename **env.local.example** to **env.local** and set the required values. You will need to setup a Supabase database with the required tables specified in [supabase.ddl](supabase.ddl)  
After all of that is done you can finally start the project and hope for the best:
```sh
npm run dev
```

