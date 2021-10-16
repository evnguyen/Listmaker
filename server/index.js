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
    
    type Query {
      list: [Restaurant!]!
      test: String
    }
        
    type Mutation {
      addRestaurant(restaurant: RestaurantInput!): InsertionResult
      deleteRestaurant(id: ID!): ID!
    }
    
    
`);


const resolvers = {
    list: async () => {
        const db = utils.connectDb();
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.all(`SELECT * FROM NewTable`, function(err, rows){
                    if (err) {
                        console.error(err.message);
                        db.close();
                        reject([]);
                    }
                    else {
                        console.log(rows);
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
                db.run(`INSERT INTO NewTable (data) VALUES (?);`, [args.restaurant.data], function(err) {
                    if (err) {
                        console.error(err.message);
                        db.close();
                        reject({});
                    }
                    else {
                        console.log(this);
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
                db.run(`DELETE FROM NewTable WHERE id=?;`, [args.id], function(err) {
                    if (err) {
                        console.error(err.message);
                        db.close();
                        reject(-1);
                    }
                    else {
                        console.log(this);
                        resolve(args.id);
                        db.close();
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
    // TODO: Remove the auth token
    const response = await fetch(`https://api.yelp.com/v3/businesses/search?latitude=${req.query.latitude}&longitude=${req.query.longitude}`, {
        headers: {
            'Authorization': `Bearer ${process.env.AUTHTOKEN}`
        },
    });
    const data = await response.json();
    res.json(data);
});

// app.post("/api/add", async (req, res) => {
//
//     const db = connectDb();
//     console.log(JSON.stringify(req.body));
//
//     db.serialize(() => {
//         db.run(`INSERT INTO NewTable (data) VALUES (?);`, [JSON.stringify(req.body)], function(err) {
//             if (err) {
//                 console.error(err.message);
//                 res.json(req.body);
//             }
//             else {
//                 console.log(this);
//                 res.json(this);
//             }
//             db.close();
//         });
//     });
// });

app.get("/api/graphql", async (req, res) => {

    // const db = connectDb();
    // db.serialize(() => {
    //     db.all(`SELECT * FROM NewTable`, function(err, rows){
    //         if (err) {
    //             console.error(err.message);
    //             res.status(400).json({"error": err.message});
    //         }
    //         else {
    //             console.log(rows);
    //             res.json(rows);
    //         }
    //         db.close();
    //     });
    // });



    // utils.getList((list) => {
    //     console.log(list);
    // });

});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});