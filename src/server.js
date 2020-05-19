import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import { models } from "./db";

const PORT = 4001;

const typeDefs = gql`
  type Ticket {
    id: ID!
    title: String!
    isCompleted: Boolean!
    children: [Ticket]!
  }

  type Query {
    # return a list of all root level (parentless) tickets.
    tickets: [Ticket]!

    # return the ticket with the given id
    ticket(id: ID!): Ticket!
  }

  type Mutation {
    # create a ticket with the given params
    createTicket(title: String!, isCompleted: Boolean): Ticket!

    # update the title of the ticket with the given id
    updateTicket(id: ID!, title: String!): Ticket!

    # update ticket.isCompleted as given
    toggleTicket(id: ID!, isCompleted: Boolean!): Ticket!

    # delete this ticket
    removeTicket(id: ID!): Boolean!

    # every children in childrenIds gets their parent set as parentId
    addChildrenToTicket(parentId: ID!, childrenIds: [ID!]!): Ticket!

    # the ticket with id: childId gets the ticket with id: parentId as its new parent
    setParentOfTicket(parentId: ID!, childId: ID!): Ticket!

    # the ticket with the given id becomes a root level ticket
    removeParentFromTicket(id: ID!): Ticket!
  }
`;

/**
 * TODO: Your task is implementing the resolvers. Go through the README first.
 * TODO: Your resolvers below will need to implement the typedefs given above.
 */

const resolvers = {
  Query: {
    /**
     * We have implemented this first query for you to set up an initial pattern.
     */
    tickets: async (root, args, context) => {
      return models.Ticket.findAll({
        where: {
          parentId: null
        }
      });
    },
    ticket: async (_, { id }) => {
      return models.Ticket.findOne({
        where: {
          id
        }
      });
    }
  },
  Ticket: {
    children: async ({ id }) => {
      return models.Ticket.findAll({
        where: {
          parentId: id
        }
      });
    }
  },
  Mutation: {
    createTicket: async (_, { title, isCompleted }) => {
      return models.Ticket.create({ title, isCompleted });
    },
    updateTicket: async (_, { id, title }) => {
      await models.Ticket.update({ title }, {
        where: {
          id
        }
      });
      return models.Ticket.findOne({
        where: {
          id
        }
      });
    },
    toggleTicket: async (_, { id, isCompleted }) => {
      await models.Ticket.update({ isCompleted }, {
        where: {
          id
        }
      });
      return models.Ticket.findOne({
        where: {
          id
        }
      });
    },
    removeTicket: async (_, { id }) => {
      await models.Ticket.destroy({
        where: {
          id
        }
      });
      return true;
    },
    addChildrenToTicket: async (_, { parentId, childrenIds }) => {
      await Promise.all(childrenIds.map(async child => {
        await models.Ticket.update({ parentId }, {
          where: {
            id: child
          }
        })
      }));
      return models.Ticket.findOne({
        where: {
          id: parentId
        }
      });
    },
    setParentOfTicket: async (_, { parentId, childId }) => {
      await models.Ticket.update({ parentId }, {
        where: {
          id: childId
        }
      });
      return models.Ticket.findOne({
        where: {
          id: childId
        }
      });
    },
    removeParentFromTicket: async (_, { id }) => {
      await models.Ticket.update({ parentId: null }, {
        where: {
          id
        }
      });
      return models.Ticket.findOne({
        where: {
          id
        }
      });
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

const app = express();
server.applyMiddleware({ app });

app.listen({ port: PORT }, () => {
  console.log(`Server ready at: http://localhost:${PORT}${server.graphqlPath}`);
});
