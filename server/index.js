const express = require("express");
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const utils = require('./utils');
const { buildSchema } = require('graphql');
const { graphqlHTTP } = require('express-graphql');
require('dotenv').config();


const PORT = process.env.PORT || 3001;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const schema = buildSchema(`
    type Restaurant {
      id: ID!
      data: String!
    }
    
    input RestaurantInput {
      data: String!
    }
    
    type InsertionResult {
      lastID: ID!
      changes: Int!
      data: String!
    }
    
    input User {
      name: String!
      email: String!
    }
    
    type Query {
      list(user: ID!): [Restaurant!]!
      test: String
    }
        
    type Mutation {
      addRestaurant(restaurant: RestaurantInput!, user: ID!): InsertionResult
      deleteRestaurant(id: ID!): ID!
      addUser(user:User!): ID!
    }
    
    
`);


const resolvers = {
    list: async (args) => {
        const db = utils.connectDb();
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.all(`SELECT * FROM ListData WHERE user=?`, [args.user],function(err, rows){
                    if (err) {
                        console.error(err.message);
                        db.close();
                        reject([]);
                    }
                    else {
                        // console.log(rows);
                        db.close();
                        resolve(rows);
                    }
                });
            });
        });
    },
    test: () => 'Hello Test',
    addRestaurant(args) {
        const db = utils.connectDb();
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run(`INSERT INTO ListData (user, data) VALUES (?, ?);`, [args.user, args.restaurant.data], function(err) {
                    if (err) {
                        console.error(err.message);
                        db.close();
                        reject({});
                    }
                    else {
                        // console.log(this);
                        resolve({...this, data: args.restaurant.data});
                        db.close();
                    }
                });
            });
        });
    },
    deleteRestaurant(args) {
        const db = utils.connectDb();
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run(`DELETE FROM ListData WHERE id=?;`, [args.id], function(err) {
                    if (err) {
                        console.error(err.message);
                        db.close();
                        reject(-1);
                    }
                    else {
                        // console.log(this);
                        resolve(args.id);
                        db.close();
                    }
                });
            });
        });
    },
    addUser(args) {
        const db = utils.connectDb();
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.get(`SELECT * FROM Users WHERE name=?;`, [args.user.name], function(err, row) {
                    if (err) {
                        console.error(err.message);
                        db.close();
                        reject(-1);
                    }
                    else if (!row) {
                        console.log('No user found, creating one');
                        db.run(`INSERT INTO Users (name, email) VALUES (?, ?);`, [args.user.name, args.user.email], function(err) {
                            if (err) {
                                console.error(err.message);
                                db.close();
                                reject(-1);
                            }
                            else {
                                // console.log(this);
                                resolve(this.lastID);
                                db.close();
                            }
                        });
                    }
                    else {
                        db.close();
                        // console.log(row.id);
                        resolve(row.id);
                    }
                });
            });
        });
    },
};


app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: resolvers,
    graphiql: true,
}));

app.get("/api/restaurants", async (req, res) => {
    const response = await fetch(`https://api.yelp.com/v3/businesses/search?latitude=${req.query.latitude}&longitude=${req.query.longitude}`, {
        headers: {
            'Authorization': `Bearer ${process.env.AUTHTOKEN}`
        },
    });
    const data = await response.json();
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});