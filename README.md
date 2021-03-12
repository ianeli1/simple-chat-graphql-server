# simple-chat-graphql-server
Backend server for simple-chat-native, written using Apollo GraphQL Server and TypeGraphQL. Its got all the features needed for [SimpleChat](https://github.com/ianeli1/simple-chat-native) to work correctly.
## Technologies used
- Apollo Server
- TypeGraphQL
- GraphQL
- Firebase Auth
## Usage
There's some credentials you'll need to deploy this server, such as:
- Firebase Admin (and a regular Firebase credential to use the debug login function)
- PostgreSQL DB access credentials
- A Discord webhook (optional, for easy error reporting)

Once you got all the required credential, you'll need to link it with the program by editing `src/index.ts`.
After that, `yarn && yarn build && yarn start` and you're set.

## Roadmap
The server needs some heavy optimization, simplification of processes as well as better error handling, and testing.

## Contributing
Contributions are welcome, feel free to suggest ideas and/or features!
