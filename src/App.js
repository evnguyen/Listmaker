import './App.css';
import Home from './home';
import React from 'react';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
} from "@apollo/client";

function App() {

    const client = new ApolloClient({
        uri: '/graphql',
        cache: new InMemoryCache()
    });

    return (
        <ApolloProvider client={client}>
            <div className="App">
              <Home />
            </div>
        </ApolloProvider>
    );
}

export default App;
