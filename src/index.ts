import {
  makeRemoteExecutableSchema,
  introspectSchema,
  mergeSchemas,
  makeExecutableSchema
} from "graphql-tools";
import { HttpLink } from "apollo-link-http";
import { ApolloServer } from "apollo-server";
import fetch from "isomorphic-unfetch";
import { createConnection, getConnectionOptions, getRepository } from "typeorm";
import { User } from "./entity/User";

const createTypeormConn = async () => {
  const connectionOptions = await getConnectionOptions();
  return createConnection({ ...connectionOptions, name: "default" });
};

createTypeormConn();

// graphql API metadata
const graphqlApis = [
  {
    uri: "https://countries.trevorblades.com/"
  },
  {
    uri: "https://bahnql.herokuapp.com/graphql"
  }
];

// create executable schemas from remote GraphQL APIs
const createRemoteExecutableSchemas = async () => {
  let schemas = [];
  for (const api of graphqlApis) {
    const link = new HttpLink({
      uri: api.uri,
      fetch
    });
    const remoteSchema = await introspectSchema(link);
    const remoteExecutableSchema = makeRemoteExecutableSchema({
      schema: remoteSchema,
      link
    });
    schemas.push(remoteExecutableSchema);
  }
  return schemas;
};

const typeDefs = `
  type Query {
    user_count: Int
  }

  extend type Query{
    users: [user]
  }

  type user {
    email: String
    password: String
  }
`;

const resolvers = {
  Query: {
    user_count: async () => {
      const { sum } = await getRepository(User)
        .createQueryBuilder("user")
        .select("COUNT(user)", "sum")
        .getRawOne();
      return sum;
    },
    users: async () => {
      const users: User[] = await User.find();
      return users;
    }
  }
};

const createNewSchema = async () => {
  const schemas = await createRemoteExecutableSchemas();

  const countUserSchema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  schemas.push(countUserSchema);

  return mergeSchemas({
    schemas
  });
};

const runServer = async () => {
  // Get newly merged schema
  const schema = await createNewSchema();
  // start server with the new schema
  const server = new ApolloServer({
    schema
  });
  server.listen(4070).then(({ url }) => {
    console.log(`Running at ${url}`);
  });
};

try {
  runServer();
} catch (err) {
  console.error(err);
}
