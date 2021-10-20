import './App.css';
import routes from './routes';
import React from 'react';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
} from "@apollo/client";
import {
    BrowserRouter as Router,
    Switch,
    Route,
} from "react-router-dom";

function App() {

    const client = new ApolloClient({
        uri: '/graphql',
        cache: new InMemoryCache()
    });

    return (
        <ApolloProvider client={client}>
            <Router>
                <div className="App">
                    <Switch>
                        {routes.map((route, i) => (
                            <RouteWithSubRoutes key={i} {...route} />
                        ))}
                    </Switch>
                </div>
            </Router>
        </ApolloProvider>
    );
}

// A special wrapper for <Route> that knows how to
// handle "sub"-routes by passing them in a `routes`
// prop to the component it renders.
function RouteWithSubRoutes(route) {
    return (
        <Route
            path={route.path}
            render={props => (
                // pass the sub-routes down to keep nesting
                <route.component {...props} routes={route.routes} />
            )}
        />
    );
}

export default App;
